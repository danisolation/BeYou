from __future__ import annotations

import uuid
from email.message import EmailMessage

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    LinkStatus,
    SosAlert,
    SosAlertStatus,
    SosNotificationDelivery,
    SosNotificationDeliveryStatus,
    SosSeverity,
    SosStatusEvent,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.schemas.sos import SosAlertCreate
from app.services import sos_email as sos_email_service
from app.services.sos import create_sos_alert

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_NOTE = "RAW_PRIVATE_SOS_NOTE_NEVER_EMAIL"


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            SosNotificationDelivery,
            InAppNotification,
            SosStatusEvent,
            SosAlert,
            AuditEvent,
            StudentAdultLink,
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
        full_name=f"{role.title()} Email",
        school="THPT Email" if role == UserRole.STUDENT.value else None,
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


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _payload() -> SosAlertCreate:
    return SosAlertCreate(
        severity=SosSeverity.URGENT.value,
        source="student_dashboard",
        note=PRIVATE_NOTE,
    )


def test_disabled_email_provider_preserves_existing_sos_behavior(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-disabled-email@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-disabled-email@example.test", role=UserRole.TEACHER.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)

    _login(client, student.email)
    response = client.post(
        "/api/student/sos-alerts",
        json=_payload().model_dump(),
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 201
    alert_id = uuid.UUID(response.json()["id"])
    assert db.get(SosAlert, alert_id) is not None
    assert db.scalar(select(InAppNotification).where(InAppNotification.resource_id == str(alert_id))) is not None
    assert db.scalar(select(SosNotificationDelivery).where(SosNotificationDelivery.alert_id == alert_id)) is None


def test_local_outbox_records_metadata_without_sending_or_raw_content(db: OrmSession) -> None:
    student = _user(db, email="student-outbox@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-outbox@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-outbox@example.test", role=UserRole.PARENT.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)

    response = create_sos_alert(
        db,
        student,
        _payload(),
        settings=Settings(SOS_EMAIL_PROVIDER="local_outbox"),
    )

    deliveries = list(
        db.scalars(
            select(SosNotificationDelivery)
            .where(SosNotificationDelivery.alert_id == response.id)
            .order_by(SosNotificationDelivery.recipient_role_snapshot)
        )
    )
    assert len(deliveries) == 2
    assert {delivery.recipient_id for delivery in deliveries} == {teacher.id, parent.id}
    assert {delivery.recipient_role_snapshot for delivery in deliveries} == {
        UserRole.TEACHER.value,
        UserRole.PARENT.value,
    }
    assert all(delivery.channel == "email" for delivery in deliveries)
    assert all(delivery.provider == "local_outbox" for delivery in deliveries)
    assert all(delivery.status == SosNotificationDeliveryStatus.QUEUED.value for delivery in deliveries)
    assert all(delivery.attempt_count == 0 for delivery in deliveries)

    audit_events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action == "sos_email_delivery_queued"))
    )
    assert len(audit_events) == 2
    rendered_metadata = "\n".join(str(event.metadata_summary) for event in audit_events)
    assert PRIVATE_NOTE not in rendered_metadata
    assert teacher.email not in rendered_metadata
    assert parent.email not in rendered_metadata
    assert "raw" not in rendered_metadata.lower()


def test_smtp_failure_records_failed_delivery_without_rolling_back_sos(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    student = _user(db, email="student-smtp-failure@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-smtp-failure@example.test", role=UserRole.TEACHER.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)

    def fail_send(settings: Settings, message: EmailMessage) -> None:
        raise OSError("simulated provider outage")

    monkeypatch.setattr(sos_email_service, "_send_smtp_message", fail_send)

    response = create_sos_alert(
        db,
        student,
        _payload(),
        settings=Settings(
            SOS_EMAIL_PROVIDER="smtp",
            SMTP_HOST="smtp.example.test",
            SMTP_FROM="noreply@example.test",
        ),
    )

    alert = db.get(SosAlert, response.id)
    assert alert is not None
    assert alert.current_status == SosAlertStatus.SENT.value
    assert db.scalar(select(InAppNotification).where(InAppNotification.resource_id == str(alert.id))) is not None

    delivery = db.scalar(select(SosNotificationDelivery).where(SosNotificationDelivery.alert_id == alert.id))
    assert delivery is not None
    assert delivery.status == SosNotificationDeliveryStatus.FAILED.value
    assert delivery.attempt_count == 1
    assert delivery.error_code == "smtp_error"
    assert delivery.delivered_at is None

    failed_audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "sos_email_delivery_failed"))
    assert failed_audit is not None
    assert failed_audit.metadata_summary["status"] == "failed"
    assert PRIVATE_NOTE not in str(failed_audit.metadata_summary)
    assert teacher.email not in str(failed_audit.metadata_summary)

