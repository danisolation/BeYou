from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    MoodCheckIn,
    PrivacyAcknowledgement,
    Session as UserSession,
    SosAlert,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PRIVATE_MOOD_NOTE"


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).where(User.email.like("%mood-checkin%@example.test"))))
        if not user_ids:
            return
        checkin_ids = list(db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(user_ids))))
        if checkin_ids:
            db.execute(
                delete(AuditEvent).where(
                    AuditEvent.resource_type == "mood_check_in",
                    AuditEvent.resource_id.in_([str(checkin_id) for checkin_id in checkin_ids]),
                )
            )
            db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(checkin_ids)))
        db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(user_ids)))
        db.execute(delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id.in_(user_ids)))
        db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
        db.execute(
            delete(User).where(
                or_(
                    User.id.in_(user_ids),
                    User.email.like("%mood-checkin%@example.test"),
                )
            )
        )
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
        full_name=f"{role.title()} Mood Checkin",
        school="THPT Mood" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _ack(db: OrmSession, student: User) -> None:
    db.add(
        PrivacyAcknowledgement(
            user_id=student.id,
            notice_version=NOTICE_VERSION,
            is_demo=student.is_demo,
        )
    )
    db.commit()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def test_student_submits_repeat_mood_checkins_with_private_note_and_no_auto_sos(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-mood-checkin@example.test", role=UserRole.STUDENT.value)
    _ack(db, student)
    _login(client, student.email)

    options_response = client.get("/api/student/mood-check-ins/options")
    assert options_response.status_code == 200
    assert "không tự động gửi SOS" in " ".join(options_response.json()["privacy_notes"])

    before_sos_count = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    before_notification_count = db.scalar(select(func.count()).select_from(InAppNotification)) or 0

    first_response = client.post(
        "/api/student/mood-check-ins",
        json={
            "mood_label": "overwhelmed",
            "energy_level": 2,
            "stress_level": 5,
            "context_tags": ["school", "sleep", "school"],
            "private_note": f"Em thấy nhiều việc quá. {PRIVATE_MARKER}",
        },
        headers=ORIGIN_HEADERS,
    )
    assert first_response.status_code == 201
    first_payload = first_response.json()
    assert first_payload["trend_label"] == "Cần hỗ trợ sớm"
    assert first_payload["suggest_support_plan"] is True
    assert first_payload["suggest_sos"] is True
    assert first_payload["context_tags"] == ["school", "sleep"]
    assert first_payload["private_note"].endswith(PRIVATE_MARKER)

    second_response = client.post(
        "/api/student/mood-check-ins",
        json={
            "mood_label": "steady",
            "energy_level": 4,
            "stress_level": 1,
            "context_tags": ["friends"],
            "private_note": None,
        },
        headers=ORIGIN_HEADERS,
    )
    assert second_response.status_code == 201

    history_response = client.get("/api/student/mood-check-ins/history")
    assert history_response.status_code == 200
    history = history_response.json()["items"]
    assert len(history) == 2
    assert history[0]["id"] == second_response.json()["id"]
    assert history[1]["id"] == first_payload["id"]
    assert history[1]["private_note"].endswith(PRIVATE_MARKER)
    assert history[0]["created_at"] != history[1]["created_at"]

    after_sos_count = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    after_notification_count = db.scalar(select(func.count()).select_from(InAppNotification)) or 0
    assert after_sos_count == before_sos_count
    assert after_notification_count == before_notification_count

    audit_event = db.scalar(
        select(AuditEvent).where(
            AuditEvent.action == "mood_check_in_created",
            AuditEvent.resource_id == first_payload["id"],
        )
    )
    assert audit_event is not None
    assert audit_event.metadata_summary["has_private_note"] is True
    assert audit_event.metadata_summary["decision"] == "no_auto_sos_no_adult_alert"
    assert PRIVATE_MARKER not in str(audit_event.metadata_summary)
    assert "private_note" not in audit_event.metadata_summary


def test_mood_checkin_rejects_invalid_options(db: OrmSession, client: TestClient) -> None:
    student = _user(db, email="student-mood-checkin-invalid@example.test", role=UserRole.STUDENT.value)
    _ack(db, student)
    _login(client, student.email)

    response = client.post(
        "/api/student/mood-check-ins",
        json={
            "mood_label": "diagnosis",
            "energy_level": 6,
            "stress_level": 1,
            "context_tags": ["school", "raw_private_context"],
        },
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 422
    assert (
        db.scalar(
            select(func.count()).select_from(MoodCheckIn).where(MoodCheckIn.student_id == student.id)
        )
        == 0
    )


def test_mood_checkins_are_student_only_and_privacy_ack_gated(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-mood-checkin-privacy@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-mood-checkin-denied@example.test", role=UserRole.TEACHER.value)

    anonymous_response = client.get("/api/student/mood-check-ins/history")
    assert anonymous_response.status_code == 401

    _login(client, student.email)
    privacy_response = client.get("/api/student/mood-check-ins/history")
    assert privacy_response.status_code == 409
    assert privacy_response.json()["detail"]["code"] == "privacy_ack_required"

    client.cookies.clear()
    _login(client, teacher.email)
    denied_response = client.get("/api/student/mood-check-ins/history")
    assert denied_response.status_code == 403
