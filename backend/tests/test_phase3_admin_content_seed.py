from __future__ import annotations

import uuid
from datetime import timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    SosAlert,
    SosStatusEvent,
    InAppNotification,
    ContentStatus,
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
    ChatSafetySignal,
    ChatMessage,
    ChatThread,
    ChatbotSafetyConfig,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.seeds.demo_seed import seed_demo_data

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


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = False) -> User:
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


def _self_check_payload(title: str = "Sức khỏe cảm xúc") -> dict:
    return {
        "title": title,
        "description": "Bài tự kiểm tra ngắn, kết quả không phải chẩn đoán.",
        "is_active": True,
        "is_demo": True,
        "questions": [
            {
                "text": "Tuần này em ngủ có ổn không?",
                "sort_order": 1,
                "choices": [
                    {"text": "Khá ổn", "score_value": 0, "sort_order": 1},
                    {"text": "Cần để ý thêm", "score_value": 1, "sort_order": 2},
                ],
            },
            {
                "text": "Em có thấy được lắng nghe không?",
                "sort_order": 2,
                "choices": [
                    {"text": "Có", "score_value": 0, "sort_order": 1},
                    {"text": "Chưa nhiều", "score_value": 1, "sort_order": 2},
                ],
            },
        ],
        "thresholds": [
            {
                "state_label": "On dinh",
                "min_score": 0,
                "max_score": 0,
                "comment": "Em đang có nhiều dấu hiệu ổn định.",
                "advice": "Tiếp tục giữ thói quen giúp em thấy an toàn.",
                "positive_content": "Em đã dành thời gian lắng nghe bản thân.",
                "suggested_next_action": "Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
            },
            {
                "state_label": "Can chu y",
                "min_score": 1,
                "max_score": 1,
                "comment": "Có một vài dấu hiệu em nên để ý thêm.",
                "advice": "Thử chọn một bước nhỏ để nghỉ ngơi.",
                "positive_content": "Nhận ra cảm xúc là một bước tốt.",
                "suggested_next_action": "Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.",
            },
            {
                "state_label": "Nen tim ho tro",
                "min_score": 2,
                "max_score": 2,
                "comment": "Em không cần tự xử lý mọi thứ một mình.",
                "advice": "Cân nhắc nói với người lớn tin cậy.",
                "positive_content": "Tìm hỗ trợ là cách chăm sóc bản thân.",
                "suggested_next_action": "Hãy cân nhắc nói chuyện với giáo viên, phụ huynh hoặc một người lớn tin cậy.",
            },
        ],
    }


def _scenario_payload(title: str = "Rủ rê sau giờ học") -> dict:
    return {
        "title": title,
        "situation": "Một nhóm bạn rủ em bỏ tiết phụ đạo để đi chơi.",
        "skill_tag": "Từ chối an toàn",
        "recommended_response": "Em có thể nói: 'Mình không đi được, mình cần vào lớp.'",
        "lesson": "Từ chối rõ ràng giúp em giữ ranh giới và vẫn tôn trọng bạn bè.",
        "is_demo": True,
        "choices": [
            {
                "text": "Nói rõ là em không tham gia và hẹn gặp lại sau.",
                "signal": "constructive",
                "feedback": "Lựa chọn này có điểm tích cực vì em giữ ranh giới rõ ràng.",
                "sort_order": 1,
            },
            {
                "text": "Đi theo nhóm dù trong lòng không muốn.",
                "signal": "risky",
                "feedback": "Lựa chọn này có thể khiến tình huống khó hơn vì em bỏ qua cảm giác của mình.",
                "sort_order": 2,
            },
        ],
    }


def test_admin_content_service_validates_lifecycle_audits_and_draft_delete(db: OrmSession) -> None:
    from app.schemas.admin_content import AdminSelfCheckTestUpsert
    from app.services.admin_content import (
        archive_self_check_test,
        create_self_check_test,
        delete_unused_draft_self_check_test,
        publish_self_check_test,
        validate_self_check_publishable,
    )

    admin = _user(db, email="admin-content@example.test", role=UserRole.ADMIN.value, is_demo=True)
    invalid = create_self_check_test(
        db,
        actor=admin,
        payload=AdminSelfCheckTestUpsert(
            title="Bản nháp thiếu ngưỡng",
            questions=[],
            thresholds=[],
            is_demo=True,
        ),
    )

    with pytest.raises(HTTPException) as publish_exc:
        validate_self_check_publishable(invalid)
    assert publish_exc.value.status_code == 400

    valid = create_self_check_test(db, actor=admin, payload=AdminSelfCheckTestUpsert(**_self_check_payload()))
    published = publish_self_check_test(db, actor=admin, test_id=valid.id)
    assert published.status == ContentStatus.PUBLISHED.value
    assert archive_self_check_test(db, actor=admin, test_id=valid.id).status == ContentStatus.ARCHIVED.value

    draft = create_self_check_test(
        db,
        actor=admin,
        payload=AdminSelfCheckTestUpsert(title="Nháp có thể xoá", is_demo=True),
    )
    deleted = delete_unused_draft_self_check_test(db, actor=admin, test_id=draft.id)
    assert deleted.id == draft.id
    assert db.get(SelfCheckTest, draft.id) is None

    events = db.scalars(select(AuditEvent).order_by(AuditEvent.timestamp.asc())).all()
    assert [event.action for event in events] == [
        "admin_safety_content_changed",
        "admin_safety_content_changed",
        "admin_safety_content_changed",
        "admin_safety_content_changed",
        "admin_safety_content_changed",
        "admin_safety_content_changed",
    ]
    assert {event.resource_type for event in events} == {"self_check_content"}
    assert {event.metadata_summary["content_type"] for event in events} == {"self_check_content"}
    assert "raw_self_check_answers" not in str([event.metadata_summary for event in events])


def test_admin_content_api_requires_admin_same_site_and_returns_publish_validation_copy(
    db: OrmSession, client: TestClient
) -> None:
    admin = _user(db, email="admin-api@example.test", role=UserRole.ADMIN.value)
    student = _user(db, email="student-api@example.test", role=UserRole.STUDENT.value)

    _login(client, student.email)
    denied = client.get("/api/admin/content/self-checks")
    assert denied.status_code == 403

    client.cookies.clear()
    _login(client, admin.email)
    blocked = client.post("/api/admin/content/self-checks", json={"title": "Nháp"})
    assert blocked.status_code == 403

    created = client.post(
        "/api/admin/content/self-checks",
        json={"title": "Nháp thiếu dữ liệu", "questions": [], "thresholds": []},
        headers=ORIGIN_HEADERS,
    )
    assert created.status_code == 201
    test_id = created.json()["id"]

    publish = client.post(
        f"/api/admin/content/self-checks/{test_id}/publish",
        headers=ORIGIN_HEADERS,
    )
    assert publish.status_code == 400
    assert publish.json()["detail"] == "Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm."

    patched = client.patch(
        f"/api/admin/content/self-checks/{test_id}",
        json=_self_check_payload("Sức khỏe cảm xúc"),
        headers=ORIGIN_HEADERS,
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Sức khỏe cảm xúc"

    published = client.post(
        f"/api/admin/content/self-checks/{test_id}/publish",
        headers=ORIGIN_HEADERS,
    )
    assert published.status_code == 200
    assert published.json()["status"] == ContentStatus.PUBLISHED.value


def test_admin_content_api_manages_scenarios_with_validation_and_archive(
    db: OrmSession, client: TestClient
) -> None:
    admin = _user(db, email="admin-scenario@example.test", role=UserRole.ADMIN.value)
    _login(client, admin.email)

    created = client.post(
        "/api/admin/content/scenarios",
        json={"title": "Tình huống nháp", "choices": []},
        headers=ORIGIN_HEADERS,
    )
    assert created.status_code == 201
    scenario_id = created.json()["id"]

    publish_invalid = client.post(
        f"/api/admin/content/scenarios/{scenario_id}/publish",
        headers=ORIGIN_HEADERS,
    )
    assert publish_invalid.status_code == 400
    assert publish_invalid.json()["detail"] == "Chưa thể xuất bản vì nội dung tình huống còn thiếu lựa chọn, phản hồi hoặc bài học."

    patched = client.patch(
        f"/api/admin/content/scenarios/{scenario_id}",
        json=_scenario_payload("Bạn bè trêu chọc online"),
        headers=ORIGIN_HEADERS,
    )
    assert patched.status_code == 200
    assert patched.json()["choices"][0]["signal"] == "constructive"

    assert client.post(f"/api/admin/content/scenarios/{scenario_id}/publish", headers=ORIGIN_HEADERS).status_code == 200
    archived = client.post(f"/api/admin/content/scenarios/{scenario_id}/archive", headers=ORIGIN_HEADERS)
    assert archived.status_code == 200
    assert archived.json()["status"] == ContentStatus.ARCHIVED.value


def test_demo_seed_creates_locked_phase3_content_and_recent_attempts(db: OrmSession) -> None:
    disabled_settings = Settings(ALLOW_DEMO_SEED=False)
    assert seed_demo_data(db, disabled_settings) is False
    assert db.scalar(select(func.count()).select_from(SelfCheckTest)) == 0
    assert db.scalar(select(func.count()).select_from(Scenario)) == 0

    enabled_settings = Settings(ALLOW_DEMO_SEED=True)
    assert seed_demo_data(db, enabled_settings) is True
    assert seed_demo_data(db, enabled_settings) is True

    tests = db.scalars(select(SelfCheckTest).order_by(SelfCheckTest.title.asc())).all()
    assert {test.title for test in tests} == {"Sức khỏe cảm xúc", "Áp lực bạn bè"}
    assert all(test.status == ContentStatus.PUBLISHED.value and test.is_demo for test in tests)

    scenarios = db.scalars(select(Scenario).order_by(Scenario.title.asc())).all()
    assert len(scenarios) == 4
    scenario_text = " ".join(f"{item.title} {item.situation}" for item in scenarios).lower()
    assert "rủ rê" in scenario_text
    assert "online" in scenario_text
    assert "mâu thuẫn" in scenario_text or "bạn thân" in scenario_text
    assert "học" in scenario_text or "điểm" in scenario_text
    assert all(item.status == ContentStatus.PUBLISHED.value and item.is_demo for item in scenarios)

    attempts = db.scalars(select(SelfCheckAttempt).order_by(SelfCheckAttempt.completed_at.desc())).all()
    assert len(attempts) == 6
    assert all(attempt.is_demo for attempt in attempts)
    assert attempts[0].completed_at - attempts[-1].completed_at <= timedelta(days=30)
    assert {attempt.state_label for attempt in attempts} <= {
        "On dinh",
        "Can chu y",
        "Nen tim ho tro",
        "Can ho tro som",
    }
