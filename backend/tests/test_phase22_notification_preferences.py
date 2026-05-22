from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    MoodCheckIn,
    MoodCheckinReminderState,
    MoodNoteShare,
    PrivacyAcknowledgement,
    Session as UserSession,
    SosAlert,
    StudentNotificationPreference,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).where(User.email.like("%phase22%@example.test"))))
        if not user_ids:
            return
        db.execute(delete(MoodNoteShare).where(MoodNoteShare.student_id.in_(user_ids)))
        db.execute(delete(MoodCheckinReminderState).where(MoodCheckinReminderState.student_id.in_(user_ids)))
        db.execute(delete(StudentNotificationPreference).where(StudentNotificationPreference.student_id.in_(user_ids)))
        db.execute(delete(MoodCheckIn).where(MoodCheckIn.student_id.in_(user_ids)))
        db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(user_ids)))
        db.execute(delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id.in_(user_ids)))
        db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
        db.execute(delete(User).where(User.id.in_(user_ids)))
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


def _student(db: OrmSession, *, email: str) -> User:
    student = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=UserRole.STUDENT.value,
        status=AccountStatus.ACTIVE.value,
        full_name="Student Phase22",
        school="THPT Phase22",
        class_name="10A1",
        is_demo=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def _ack(db: OrmSession, student: User) -> None:
    db.add(PrivacyAcknowledgement(user_id=student.id, notice_version=NOTICE_VERSION, is_demo=True))
    db.commit()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _preference_payload(**overrides: object) -> dict:
    payload = {
        "in_app_reminders_enabled": True,
        "mood_checkin_reminders_enabled": True,
        "reminder_cadence": "daily",
        "allowed_channels": ["in_app"],
        "quiet_hours_start": None,
        "quiet_hours_end": None,
        "timezone": "Asia/Ho_Chi_Minh",
        "paused_until": None,
        "pause_reason_code": None,
    }
    payload.update(overrides)
    return payload


def _quiet_window_covering_now() -> tuple[str, str]:
    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    start = (now - timedelta(minutes=5)).strftime("%H:%M")
    end = (now + timedelta(minutes=5)).strftime("%H:%M")
    return start, end


def test_student_controls_in_app_reminders_and_reminder_actions_create_no_sos(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _student(db, email="student-phase22-reminder@example.test")
    _ack(db, student)
    _login(client, student.email)

    default_response = client.get("/api/student/notification-preferences")
    assert default_response.status_code == 200
    default_payload = default_response.json()
    assert default_payload["in_app_reminders_enabled"] is False
    assert default_payload["mood_checkin_reminders_enabled"] is False
    assert {channel["key"]: channel["status"] for channel in default_payload["channel_boundaries"]}["sms"] == "deferred"

    update_response = client.put(
        "/api/student/notification-preferences",
        json=_preference_payload(),
        headers=ORIGIN_HEADERS,
    )
    assert update_response.status_code == 200
    assert update_response.json()["allowed_channels"] == ["in_app"]

    before_sos = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    before_notifications = db.scalar(select(func.count()).select_from(InAppNotification)) or 0

    reminder_response = client.get("/api/student/reminders/mood-check-in")
    assert reminder_response.status_code == 200
    reminder = reminder_response.json()
    assert reminder["due"] is True
    assert reminder["href"] == "/student/mood-check-ins"
    assert "không tự tạo SOS" in reminder["body"]

    dismiss_response = client.post(
        "/api/student/reminders/mood-check-in/dismiss",
        headers=ORIGIN_HEADERS,
    )
    assert dismiss_response.status_code == 200
    assert dismiss_response.json()["status"] == "dismissed"

    snooze_response = client.post(
        "/api/student/reminders/mood-check-in/snooze",
        json={"minutes": 60},
        headers=ORIGIN_HEADERS,
    )
    assert snooze_response.status_code == 200
    assert snooze_response.json()["status"] == "snoozed"

    open_response = client.post(
        "/api/student/reminders/mood-check-in/open",
        headers=ORIGIN_HEADERS,
    )
    assert open_response.status_code == 200
    assert open_response.json()["status"] == "opened"

    after_sos = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    after_notifications = db.scalar(select(func.count()).select_from(InAppNotification)) or 0
    assert after_sos == before_sos
    assert after_notifications == before_notifications

    audit_text = "\n".join(
        str(event.metadata_summary)
        for event in db.scalars(select(AuditEvent).where(AuditEvent.resource_type == "mood_checkin_reminder"))
    )
    assert "no_auto_sos_no_adult_alert" in audit_text
    assert "private_note" not in audit_text


def test_quiet_hours_and_pause_suppress_in_app_reminder(db: OrmSession, client: TestClient) -> None:
    student = _student(db, email="student-phase22-quiet@example.test")
    _ack(db, student)
    _login(client, student.email)

    quiet_start, quiet_end = _quiet_window_covering_now()
    response = client.put(
        "/api/student/notification-preferences",
        json=_preference_payload(quiet_hours_start=quiet_start, quiet_hours_end=quiet_end),
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200

    reminder_response = client.get("/api/student/reminders/mood-check-in")
    assert reminder_response.status_code == 200
    assert reminder_response.json()["due"] is False
    assert reminder_response.json()["status_reason"] == "quiet_hours"

    pause_until = (datetime.now(ZoneInfo("UTC")) + timedelta(days=1)).isoformat()
    response = client.put(
        "/api/student/notification-preferences",
        json=_preference_payload(quiet_hours_start=None, quiet_hours_end=None, paused_until=pause_until),
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200

    reminder_response = client.get("/api/student/reminders/mood-check-in")
    assert reminder_response.status_code == 200
    assert reminder_response.json()["due"] is False
    assert reminder_response.json()["status_reason"] == "paused"


def test_external_channels_are_rejected_for_v1_4(db: OrmSession, client: TestClient) -> None:
    student = _student(db, email="student-phase22-channels@example.test")
    _ack(db, student)
    _login(client, student.email)

    response = client.put(
        "/api/student/notification-preferences",
        json=_preference_payload(allowed_channels=["in_app", "zalo"]),
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 422
    assert "v1.4" in response.text


def test_invalid_quiet_hour_returns_user_friendly_validation_error(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _student(db, email="student-phase22-invalid-quiet@example.test")
    _ack(db, student)
    _login(client, student.email)

    response = client.put(
        "/api/student/notification-preferences",
        json=_preference_payload(quiet_hours_start="12:XX"),
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 422
    assert "Khung giờ yên lặng phải có định dạng HH:MM hợp lệ." in response.text
