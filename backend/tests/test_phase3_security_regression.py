import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.db.models import (
    AuditEvent,
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
    StudentAdultLink,
    User,
)
from app.db.session import SessionLocal
from app.main import app
from app.seeds.demo_seed import DEMO_ADMIN_EMAIL, DEMO_PARENT_EMAIL, DEMO_STUDENT_EMAIL, DEMO_TEACHER_EMAIL, seed_demo_data
from app.services.audit import record_audit_event

ORIGIN_HEADERS = {"Origin": "http://localhost:3000"}


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
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


def _seed_phase3_demo(db: OrmSession, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "true")
    get_settings.cache_clear()
    assert seed_demo_data(db, get_settings()) is True
    get_settings.cache_clear()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "BeYouDemo!2026"},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def test_adults_and_admins_never_receive_raw_answers_and_summary_reads_are_audited(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _seed_phase3_demo(db, monkeypatch)
    student = db.scalar(select(User).where(User.email == DEMO_STUDENT_EMAIL))
    attempt = db.scalar(select(SelfCheckAttempt).where(SelfCheckAttempt.student_id == student.id))
    raw_answer = db.scalar(select(SelfCheckAttemptAnswer).where(SelfCheckAttemptAnswer.attempt_id == attempt.id))
    raw_answer.choice_text_snapshot = "RAW ANSWER SHOULD STAY PRIVATE"
    db.commit()

    teacher_client = TestClient(app)
    parent_client = TestClient(app)
    admin_client = TestClient(app)
    _login(teacher_client, DEMO_TEACHER_EMAIL)
    _login(parent_client, DEMO_PARENT_EMAIL)
    _login(admin_client, DEMO_ADMIN_EMAIL)

    teacher_raw_response = teacher_client.get(f"/api/student/self-checks/history/{attempt.id}")
    admin_raw_response = admin_client.get(f"/api/student/self-checks/history/{attempt.id}")
    teacher_summary_response = teacher_client.get(f"/api/teacher/students/{student.id}/self-check-summaries")
    parent_summary_response = parent_client.get(f"/api/parent/students/{student.id}/self-check-summaries")

    assert teacher_raw_response.status_code == 403
    assert admin_raw_response.status_code == 403
    assert teacher_summary_response.status_code == 200
    assert parent_summary_response.status_code == 200
    assert "RAW ANSWER SHOULD STAY PRIVATE" not in teacher_summary_response.text
    assert "RAW ANSWER SHOULD STAY PRIVATE" not in parent_summary_response.text
    assert "raw answer" not in teacher_summary_response.text.lower()
    assert "raw_answers" not in teacher_summary_response.text

    audit_events = list(db.scalars(select(AuditEvent).where(AuditEvent.action == "sensitive_resource_read")))
    assert audit_events
    assert any(event.metadata_summary.get("decision") == "summary_only" for event in audit_events)
    assert "RAW ANSWER SHOULD STAY PRIVATE" not in str([event.metadata_summary for event in audit_events])


def test_admin_content_mutations_require_csrf_and_write_sanitized_audit(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _seed_phase3_demo(db, monkeypatch)
    admin_client = TestClient(app)
    _login(admin_client, DEMO_ADMIN_EMAIL)

    payload = {
        "title": f"Tình huống kiểm thử {uuid.uuid4()}",
        "situation": "Một tình huống kiểm thử an toàn.",
        "skill_tag": "Giao tiếp",
        "status": "draft",
        "recommended_response": "Em có thể nói rõ ranh giới và tìm người hỗ trợ.",
        "lesson": "Tạm dừng giúp em chọn phản hồi an toàn hơn.",
        "is_demo": True,
        "choices": [
            {
                "text": "Em nói rõ điều em cần.",
                "signal": "constructive",
                "feedback": "Lựa chọn này có điểm tích cực vì em giữ ranh giới.",
                "sort_order": 1,
                "is_demo": True,
            },
            {
                "text": "Em im lặng dù không thoải mái.",
                "signal": "risky",
                "feedback": "Lựa chọn này có thể khiến tình huống khó hơn.",
                "sort_order": 2,
                "is_demo": True,
            },
        ],
    }

    csrf_response = admin_client.post(
        "/api/admin/content/scenarios",
        json=payload,
        headers={"Origin": "http://localhost:3000", "Sec-Fetch-Site": "cross-site"},
    )
    create_response = admin_client.post("/api/admin/content/scenarios", json=payload, headers=ORIGIN_HEADERS)

    assert csrf_response.status_code == 403
    assert create_response.status_code == 201
    event = db.scalar(
        select(AuditEvent)
        .where(AuditEvent.action == "admin_safety_content_changed")
        .where(AuditEvent.resource_type == "scenario_content")
        .order_by(AuditEvent.timestamp.desc())
    )
    assert event is not None
    assert event.metadata_summary["change_type"] == "create"
    assert "password" not in str(event.metadata_summary).lower()
    assert "raw_answers" not in str(event.metadata_summary).lower()


def test_demo_flags_and_self_check_snapshot_immutability(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _seed_phase3_demo(db, monkeypatch)
    attempt = db.scalar(select(SelfCheckAttempt))
    test = db.get(SelfCheckTest, attempt.test_id)
    original_snapshot_title = attempt.test_title_snapshot

    test.title = "Tên đã chỉnh sửa sau khi hoàn thành"
    db.commit()
    db.refresh(attempt)

    assert attempt.is_demo is True
    assert test.is_demo is True
    assert db.scalar(select(Scenario).where(Scenario.is_demo.is_(True))) is not None
    assert attempt.test_title_snapshot == original_snapshot_title
    assert attempt.test_title_snapshot != test.title


def test_audit_rejects_forbidden_nested_raw_answers_metadata(db: OrmSession, monkeypatch: pytest.MonkeyPatch) -> None:
    _seed_phase3_demo(db, monkeypatch)
    admin = db.scalar(select(User).where(User.email == DEMO_ADMIN_EMAIL))

    with pytest.raises(Exception):
        record_audit_event(
            db,
            actor=admin,
            actor_role=admin.role,
            action="admin_safety_content_changed",
            resource_type="self_check_content",
            resource_id=str(admin.id),
            status_value="denied",
            metadata_summary={"nested": [{"raw_answers": ["private answer text"]}]},
            is_demo=True,
        )
