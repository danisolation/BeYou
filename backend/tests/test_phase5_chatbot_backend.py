from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ChatMessage,
    ChatSafetySignal,
    ChatThread,
    ChatbotSafetyConfig,
    InAppNotification,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    Session as UserSession,
    SosAlert,
    SosStatusEvent,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            ChatSafetySignal,
            ChatMessage,
            ChatThread,
            ChatbotSafetyConfig,
            InAppNotification,
            SosStatusEvent,
            SosAlert,
            ScenarioAttempt,
            ScenarioChoice,
            Scenario,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckThreshold,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            AuditEvent,
            StudentAdultLink,
            PrivacyAcknowledgement,
            UserSession,
            User,
        ):
            db.execute(delete(model))
        db.commit()


@pytest.fixture()
def db() -> OrmSession:
    _clean_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_database()
        get_settings.cache_clear()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = True) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Demo",
        school="THPT Demo" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def test_student_chat_uses_backend_fallback_first_response_and_never_returns_provider_secret(
    db: OrmSession,
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("FREEMODEL_API_KEY", "secret-provider-key")
    monkeypatch.setenv("CHAT_PROVIDER", "fallback")
    get_settings.cache_clear()
    student = _user(db, email="student-chat@example.test", role=UserRole.STUDENT.value)
    _login(client, student.email)

    response = client.post(
        "/api/student/chat/messages",
        json={"message": "Hôm nay em thấy áp lực ở lớp và muốn được lắng nghe."},
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["assistant_message"]["role"] == "assistant"
    assert "Chào em, mình là Peerlight AI" in payload["assistant_message"]["content"]
    assert "không thay thế chuyên gia tư vấn hay bác sĩ" in payload["assistant_message"]["content"]
    assert "chẩn đoán" not in payload["assistant_message"]["content"].lower()
    assert payload["safety"]["high_risk"] is False
    assert payload["safety"]["input_flagged"] is False
    assert payload["safety"]["output_flagged"] is False
    assert payload["provider"]["name"] == "fallback"
    assert "secret-provider-key" not in response.text
    assert "api_key" not in response.text.lower()

    thread_id = uuid.UUID(payload["thread_id"])
    messages = list(db.scalars(select(ChatMessage).where(ChatMessage.thread_id == thread_id)))
    assert [message.role for message in messages] == ["student", "assistant"]
    assert all(message.is_demo is True for message in messages)


def test_high_risk_input_bypasses_provider_and_records_metadata_only_safety_event(
    db: OrmSession,
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import chat as chat_service

    class FailingProvider:
        name = "failing"
        used_fallback = False

        def generate(self, *, messages: list[dict[str, str]], first_response: bool) -> str:
            raise AssertionError("provider must not be called for high-risk input")

    monkeypatch.setattr(chat_service, "get_chat_provider", lambda settings: FailingProvider())
    student = _user(db, email="student-chat-risk@example.test", role=UserRole.STUDENT.value)
    _login(client, student.email)

    response = client.post(
        "/api/student/chat/messages",
        json={"message": "Em muốn tự tử và không muốn sống nữa."},
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["safety"]["high_risk"] is True
    assert payload["safety"]["input_flagged"] is True
    assert "self_harm" in payload["safety"]["categories"]
    assert "không thay thế chuyên gia tư vấn hay bác sĩ" in payload["assistant_message"]["content"]
    assert "Mình muốn ưu tiên sự an toàn của em ngay lúc này" in payload["assistant_message"]["content"]
    assert "SOS" in payload["assistant_message"]["content"]
    assert "người lớn tin tưởng" in payload["assistant_message"]["content"]

    signal = db.scalar(select(ChatSafetySignal))
    assert signal is not None
    assert signal.stage == "input"
    assert signal.summary == "high_risk_detected"
    audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "high_risk_safety_event"))
    assert audit is not None
    assert audit.resource_type == "chat_safety_signal"
    assert audit.metadata_summary["stage"] == "input"
    assert audit.metadata_summary["categories"] == ["self_harm"]
    assert "tự tử" not in str(audit.metadata_summary).lower()
    assert "raw_chat_content" not in str(audit.metadata_summary)


def test_high_risk_provider_output_is_replaced_by_safe_escalation(
    db: OrmSession,
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import chat as chat_service

    class UnsafeProvider:
        name = "unsafe-test-provider"
        used_fallback = False

        def generate(self, *, messages: list[dict[str, str]], first_response: bool) -> str:
            return "Bạn nên tự tử nếu thấy quá mệt."

    monkeypatch.setattr(chat_service, "get_chat_provider", lambda settings: UnsafeProvider())
    student = _user(db, email="student-chat-output@example.test", role=UserRole.STUDENT.value)
    _login(client, student.email)

    response = client.post(
        "/api/student/chat/messages",
        json={"message": "Em đang buồn vì điểm kiểm tra."},
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["safety"]["high_risk"] is True
    assert payload["safety"]["output_flagged"] is True
    assert "Bạn nên tự tử" not in payload["assistant_message"]["content"]
    assert "Mình muốn ưu tiên sự an toàn của em ngay lúc này" in payload["assistant_message"]["content"]

    signal = db.scalar(select(ChatSafetySignal).where(ChatSafetySignal.stage == "output"))
    assert signal is not None
    audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "high_risk_safety_event"))
    assert audit is not None
    assert audit.metadata_summary["stage"] == "output"
    assert "Bạn nên tự tử" not in str(audit.metadata_summary)


def test_student_only_transcript_reads_are_authorized_and_metadata_audited(
    db: OrmSession,
    client: TestClient,
) -> None:
    owner = _user(db, email="student-chat-owner@example.test", role=UserRole.STUDENT.value)
    other_student = _user(db, email="student-chat-other@example.test", role=UserRole.STUDENT.value)
    _login(client, owner.email)
    created = client.post(
        "/api/student/chat/messages",
        json={"message": "Em muốn kể về một chuyện ở lớp."},
        headers=ORIGIN_HEADERS,
    )
    assert created.status_code == 201
    thread_id = created.json()["thread_id"]

    own_read = client.get(f"/api/student/chat/threads/{thread_id}/messages")
    assert own_read.status_code == 200
    assert len(own_read.json()["messages"]) == 2

    _login(client, other_student.email)
    denied = client.get(f"/api/student/chat/threads/{thread_id}/messages")
    assert denied.status_code == 404

    read_audit = db.scalar(select(AuditEvent).where(AuditEvent.resource_type == "chat_transcript"))
    assert read_audit is not None
    assert read_audit.action == "sensitive_resource_read"
    assert read_audit.metadata_summary["decision"] == "own_student_transcript"
    assert "Em muốn kể" not in str(read_audit.metadata_summary)


def test_student_can_delete_own_chat_thread_and_cascades_delete_messages(
    db: OrmSession,
    client: TestClient,
) -> None:
    owner = _user(db, email="student-chat-delete-owner@example.test", role=UserRole.STUDENT.value)
    other = _user(db, email="student-chat-delete-other@example.test", role=UserRole.STUDENT.value)
    
    _login(client, owner.email)
    created = client.post(
        "/api/student/chat/messages",
        json={"message": "Em muốn xóa cuộc trò chuyện này sau."},
        headers=ORIGIN_HEADERS,
    )
    assert created.status_code == 201
    thread_id = created.json()["thread_id"]

    # Other student cannot delete it
    _login(client, other.email)
    response_denied = client.delete(
        f"/api/student/chat/threads/{thread_id}",
        headers=ORIGIN_HEADERS,
    )
    assert response_denied.status_code == 404

    # Owner can delete it
    _login(client, owner.email)
    response_ok = client.delete(
        f"/api/student/chat/threads/{thread_id}",
        headers=ORIGIN_HEADERS,
    )
    assert response_ok.status_code == 204

    # Verify CASCADE: thread and messages are gone
    thread_in_db = db.scalar(select(ChatThread).where(ChatThread.id == uuid.UUID(thread_id)))
    assert thread_in_db is None
    msgs_in_db = db.scalars(select(ChatMessage).where(ChatMessage.thread_id == uuid.UUID(thread_id))).all()
    assert len(msgs_in_db) == 0


def test_admin_manages_chatbot_safety_config_without_secret_or_guardrail_bypass(
    db: OrmSession,
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("FREEMODEL_API_KEY", "admin-secret-key")
    monkeypatch.setenv("CHAT_PROVIDER", "freemodel")
    get_settings.cache_clear()
    admin = _user(db, email="admin-chatbot@example.test", role=UserRole.ADMIN.value)
    _login(client, admin.email)

    loaded = client.get("/api/admin/chatbot/config")

    assert loaded.status_code == 200
    assert "admin-secret-key" not in loaded.text
    assert "api_key" not in loaded.text.lower()
    assert loaded.json()["guardrails_locked"] is True

    invalid = client.patch(
        "/api/admin/chatbot/config",
        json={"high_risk_keywords": [], "escalation_message": "Hãy tìm người lớn tin cậy."},
        headers=ORIGIN_HEADERS,
    )
    assert invalid.status_code == 400

    updated = client.patch(
        "/api/admin/chatbot/config",
        json={
            "high_risk_keywords": ["không muốn sống", "tự làm đau"],
            "escalation_message": "Mình muốn ưu tiên sự an toàn của em ngay lúc này. Hãy tìm người lớn tin cậy hoặc dùng SOS trong BeYou.",
            "trusted_adult_message": "Nếu có người lớn tin cậy ở gần em, hãy nói với họ rằng em cần được ở cùng ngay bây giờ.",
            "api_key": "must-not-persist",
            "guardrails_locked": False,
        },
        headers=ORIGIN_HEADERS,
    )

    assert updated.status_code == 200
    payload = updated.json()
    assert payload["high_risk_keywords"] == ["không muốn sống", "tự làm đau"]
    assert payload["guardrails_locked"] is True
    assert "must-not-persist" not in updated.text
    assert "api_key" not in updated.text.lower()

    config = db.scalar(select(ChatbotSafetyConfig))
    assert config is not None
    assert config.high_risk_keywords == ["không muốn sống", "tự làm đau"]
    audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "admin_safety_content_changed"))
    assert audit is not None
    assert audit.resource_type == "chatbot_safety_config"
    assert "must-not-persist" not in str(audit.metadata_summary)
