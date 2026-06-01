from __future__ import annotations

from datetime import timedelta
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    LinkStatus,
    PrivacyAcknowledgement,
    ScenarioAttempt,
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
    ScenarioChoice,
    Scenario,
    Session as UserSession,
    SosAlert,
    SosAlertStatus,
    SosSeverity,
    SosStatusEvent,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
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


def _link(db: OrmSession, *, student: User, adult: User, relationship_type: str) -> None:
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=adult.id,
            relationship_type=relationship_type,
            status=LinkStatus.ACTIVE.value,
            created_by=adult.id,
            is_demo=student.is_demo and adult.is_demo,
        )
    )
    db.commit()


def _attempt(
    db: OrmSession,
    *,
    student: User,
    label: str,
    raw_answer_text: str = "RAW_PHASE4_PRIVATE_ANSWER",
) -> SelfCheckAttempt:
    test = SelfCheckTest(title=f"Bài {label}", status="published", is_active=True, is_demo=True)
    db.add(test)
    db.flush()
    question = SelfCheckQuestion(
        test_id=test.id, text=f"Câu hỏi {label}", sort_order=1, is_demo=True
    )
    db.add(question)
    db.flush()
    choice = SelfCheckChoice(
        question_id=question.id,
        text=raw_answer_text,
        score_value=4,
        sort_order=1,
        is_demo=True,
    )
    db.add(choice)
    db.flush()
    attempt = SelfCheckAttempt(
        student_id=student.id,
        test_id=test.id,
        score=4,
        state_label="Can ho tro som",
        supportive_headline="Điều em đang trải qua đáng được hỗ trợ sớm.",
        short_comment="Em xứng đáng được lắng nghe.",
        advice_summary="Ưu tiên ở gần nơi an toàn và nói với người lớn tin cậy.",
        support_suggestion="Hỏi em cần hỗ trợ gì ngay lúc này.",
        positive_content="Tìm kiếm hỗ trợ là một bước chăm sóc bản thân.",
        suggested_next_action="Gửi SOS nếu em cần người lớn biết ngay.",
        test_title_snapshot=f"Sức khỏe cảm xúc {label}",
        test_snapshot={"title": f"Sức khỏe cảm xúc {label}"},
        is_demo=True,
        completed_at=utc_now() - timedelta(minutes=5),
    )
    db.add(attempt)
    db.flush()
    db.add(
        SelfCheckAttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            choice_id=choice.id,
            question_text_snapshot=f"Câu hỏi riêng tư {label}",
            choice_text_snapshot=raw_answer_text,
            score_value_snapshot=4,
            sort_order=1,
            is_demo=True,
        )
    )
    db.commit()
    db.refresh(attempt)
    return attempt


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _create_alert_via_api(client: TestClient, student_email: str) -> dict:
    _login(client, student_email)
    response = client.post(
        "/api/student/sos-alerts",
        json={
            "severity": SosSeverity.URGENT.value,
            "source": "student_dashboard",
            "note": "Em đang cần người lớn biết em không ổn.",
        },
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 201
    return response.json()


def test_student_creates_sos_alert_notifications_status_event_and_audit(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-sos-create@example.test", role=UserRole.STUDENT.value)
    teacher = _user(
        db,
        email="teacher-sos-create@example.test",
        role=UserRole.TEACHER.value,
        is_demo=False,
    )
    parent = _user(db, email="parent-sos-create@example.test", role=UserRole.PARENT.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)

    payload = _create_alert_via_api(client, student.email)

    assert payload["student"]["id"] == str(student.id)
    assert payload["student"]["full_name"] == student.full_name
    assert payload["student"]["school"] == "THPT Demo"
    assert payload["student"]["class_name"] == "10A1"
    assert payload["severity"] == "urgent"
    assert payload["source"] == "student_dashboard"
    assert payload["note"] == "Em đang cần người lớn biết em không ổn."
    assert payload["current_status"] == SosAlertStatus.SENT.value
    assert payload["is_demo"] is True

    alert_id = uuid.UUID(payload["id"])
    notifications = list(
        db.scalars(select(InAppNotification).where(InAppNotification.resource_id == str(alert_id)))
    )
    assert {notification.recipient_id for notification in notifications} == {teacher.id, parent.id}
    assert all(notification.resource_type == "sos_alert" for notification in notifications)
    assert all(notification.read_at is None for notification in notifications)
    assert all(notification.is_demo is True for notification in notifications)

    status_event = db.scalar(select(SosStatusEvent).where(SosStatusEvent.alert_id == alert_id))
    assert status_event is not None
    assert status_event.previous_status is None
    assert status_event.new_status == SosAlertStatus.SENT.value
    assert status_event.actor_id == student.id

    created_audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "sos_alert_created"))
    assert created_audit is not None
    assert created_audit.resource_type == "sos_alert"
    assert created_audit.metadata_summary["severity"] == "urgent"
    assert created_audit.metadata_summary["recipient_count"] == 2
    assert "RAW" not in str(created_audit.metadata_summary)

    _login(client, teacher.email)
    notifications_response = client.get("/api/notifications")
    assert notifications_response.status_code == 200
    assert notifications_response.json()[0]["resource_id"] == str(alert_id)


def test_teacher_updates_status_forward_and_parent_is_read_only(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-sos-status@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-sos-status@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-sos-status@example.test", role=UserRole.PARENT.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    payload = _create_alert_via_api(client, student.email)
    alert_id = payload["id"]

    _login(client, parent.email)
    parent_patch = client.patch(
        f"/api/teacher/sos-alerts/{alert_id}/status",
        json={"status": "received", "note": "Phụ huynh thử cập nhật"},
        headers=ORIGIN_HEADERS,
    )
    assert parent_patch.status_code == 403

    _login(client, teacher.email)
    received = client.patch(
        f"/api/teacher/sos-alerts/{alert_id}/status",
        json={"status": "received", "note": "Cô đã nhận tín hiệu."},
        headers=ORIGIN_HEADERS,
    )
    supporting = client.patch(
        f"/api/teacher/sos-alerts/{alert_id}/status",
        json={"status": "supporting", "note": "Cô đang liên hệ hỗ trợ."},
        headers=ORIGIN_HEADERS,
    )
    completed = client.patch(
        f"/api/teacher/sos-alerts/{alert_id}/status",
        json={"status": "completed", "note": "Đã có bước hỗ trợ phù hợp."},
        headers=ORIGIN_HEADERS,
    )
    backwards = client.patch(
        f"/api/teacher/sos-alerts/{alert_id}/status",
        json={"status": "received"},
        headers=ORIGIN_HEADERS,
    )

    assert received.status_code == 200
    assert supporting.status_code == 200
    assert completed.status_code == 200
    assert completed.json()["current_status"] == "completed"
    assert backwards.status_code == 400

    events = list(
        db.scalars(
            select(SosStatusEvent)
            .where(SosStatusEvent.alert_id == uuid.UUID(alert_id))
            .order_by(SosStatusEvent.created_at)
        )
    )
    assert [(event.previous_status, event.new_status) for event in events] == [
        (None, "sent"),
        ("sent", "received"),
        ("received", "supporting"),
        ("supporting", "completed"),
    ]
    assert events[-1].actor_id == teacher.id
    assert events[-1].note == "Đã có bước hỗ trợ phù hợp."
    assert (
        db.scalar(
            select(func.count())
            .select_from(AuditEvent)
            .where(AuditEvent.action == "sos_status_changed")
        )
        == 4
    )

    _login(client, student.email)
    student_list = client.get("/api/student/sos-alerts")
    assert student_list.status_code == 200
    assert student_list.json()[0]["current_status"] == "completed"


def test_sos_routes_enforce_relationship_and_audit_sensitive_reads(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-sos-link@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-sos-link@example.test", role=UserRole.TEACHER.value)
    unlinked_teacher = _user(
        db, email="teacher-sos-unlinked@example.test", role=UserRole.TEACHER.value
    )
    parent = _user(db, email="parent-sos-link@example.test", role=UserRole.PARENT.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    payload = _create_alert_via_api(client, student.email)

    _login(client, teacher.email)
    teacher_response = client.get(f"/api/teacher/students/{student.id}/sos-alerts")
    assert teacher_response.status_code == 200
    assert teacher_response.json()[0]["id"] == payload["id"]

    _login(client, parent.email)
    parent_response = client.get(f"/api/parent/students/{student.id}/sos-alerts")
    assert parent_response.status_code == 200
    assert parent_response.json()[0]["current_status"] == "sent"

    _login(client, unlinked_teacher.email)
    unlinked_response = client.get(f"/api/teacher/students/{student.id}/sos-alerts")
    assert unlinked_response.status_code == 403

    read_events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action == "sensitive_resource_read"))
    )
    assert any(event.resource_type == "sos_alert" for event in read_events)
    assert "Em đang cần người lớn" not in str([event.metadata_summary for event in read_events])


def test_support_overview_groups_warning_summaries_without_raw_answers(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-overview@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-overview@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-overview@example.test", role=UserRole.PARENT.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    _attempt(db, student=student, label="overview")
    _create_alert_via_api(client, student.email)
    _create_alert_via_api(client, student.email)

    _login(client, teacher.email)
    teacher_overview = client.get("/api/teacher/support-overview")
    assert teacher_overview.status_code == 200
    teacher_text = teacher_overview.text
    teacher_payload = teacher_overview.json()
    assert teacher_payload[0]["warning_group"] == "nguy_co_cao"
    assert teacher_payload[0]["warning_group_label"] == "Nguy cơ cao"
    assert (
        teacher_payload[0]["latest_self_check_summary"]["support_suggestion"]
        == "Hỏi em cần hỗ trợ gì ngay lúc này."
    )
    assert teacher_payload[0]["open_sos_count"] == 2
    assert "RAW_PHASE4_PRIVATE_ANSWER" not in teacher_text
    assert "choice_text_snapshot" not in teacher_text
    assert "answers" not in teacher_text

    _login(client, parent.email)
    parent_overview = client.get("/api/parent/support-overview")
    assert parent_overview.status_code == 200
    assert parent_overview.json()[0]["student"]["id"] == str(student.id)
    assert "RAW_PHASE4_PRIVATE_ANSWER" not in parent_overview.text
