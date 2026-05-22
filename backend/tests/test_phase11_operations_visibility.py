from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    LinkStatus,
    SosAlert,
    SosNotificationDelivery,
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
from app.services.sos import create_sos_alert

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_NOTE = "RAW_PRIVATE_SOS_NOTE_FOR_OPERATIONS"


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


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = True) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Operations",
        school="THPT Operations" if role == UserRole.STUDENT.value else None,
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


def _link(db: OrmSession, *, student: User, adult: User) -> None:
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=adult.id,
            relationship_type=UserRole.TEACHER.value,
            status=LinkStatus.ACTIVE.value,
            created_by=adult.id,
            is_demo=True,
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


def _seed_delivery_and_audit(db: OrmSession) -> tuple[User, User, User]:
    admin = _user(db, email="admin-ops@example.test", role=UserRole.ADMIN.value)
    student = _user(db, email="student-ops@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-ops@example.test", role=UserRole.TEACHER.value)
    _link(db, student=student, adult=teacher)

    create_sos_alert(
        db,
        student,
        SosAlertCreate(
            severity=SosSeverity.URGENT.value,
            source="student_dashboard",
            note=PRIVATE_NOTE,
        ),
        settings=Settings(SOS_EMAIL_PROVIDER="local_outbox"),
    )
    db.add(
        AuditEvent(
            actor_id=admin.id,
            actor_role=UserRole.ADMIN.value,
            action="account_status_changed",
            resource_type="account_profile",
            resource_id=str(student.id),
            status="success",
            reason="admin_operations_test",
            metadata_summary={
                "safe_count": 1,
                "email": student.email,
                "note": PRIVATE_NOTE,
                "recipient_id": str(teacher.id),
            },
            notes=PRIVATE_NOTE,
            is_demo=True,
        )
    )
    db.commit()
    return admin, student, teacher


def test_operations_dashboard_requires_admin_filters_audit_and_excludes_sensitive_content(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin, student, teacher = _seed_delivery_and_audit(db)

    _login(client, student.email)
    denied = client.get("/api/admin/operations/dashboard")
    assert denied.status_code == 403

    client.cookies.clear()
    _login(client, admin.email)
    response = client.get(
        "/api/admin/operations/dashboard",
        params={
            "actor_role": "admin",
            "action_type": "account_status_changed",
            "target_type": "account_profile",
            "status": "success",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["readiness"]["status"] in {"ready", "degraded", "not_ready"}
    assert payload["sos_email"]["total"] == 1
    assert payload["sos_email"]["recent"][0]["recipient_role"] == "teacher"
    assert payload["sos_email"]["recent"][0]["status"] == "queued"
    assert payload["audit"]["filters"]["actor_role"] == "admin"
    assert payload["audit"]["filters"]["action_type"] == "account_status_changed"
    assert payload["audit"]["filters"]["target_type"] == "account_profile"
    assert payload["audit"]["filters"]["status"] == "success"
    assert payload["audit"]["total_matching"] == 1
    assert payload["audit"]["recent"][0]["metadata_summary"] == {"safe_count": 1}

    rendered = response.text
    assert PRIVATE_NOTE not in rendered
    assert student.email not in rendered
    assert teacher.email not in rendered
    assert "recipient_id" not in rendered
    assert "raw_answers" not in rendered.lower()
    assert "chatbot transcript" not in rendered.lower()


def test_readiness_endpoint_records_minimal_operations_audit(db: OrmSession, client: TestClient) -> None:
    admin = _user(db, email="admin-readiness-ops@example.test", role=UserRole.ADMIN.value)
    _login(client, admin.email)

    before = db.scalar(
        select(func.count()).select_from(AuditEvent).where(AuditEvent.action == "admin_readiness_checked")
    )
    response = client.get("/api/admin/operations/readiness")

    assert response.status_code == 200
    after = db.scalar(
        select(func.count()).select_from(AuditEvent).where(AuditEvent.action == "admin_readiness_checked")
    )
    assert after == (before or 0) + 1
    event = db.scalar(select(AuditEvent).where(AuditEvent.action == "admin_readiness_checked"))
    assert event is not None
    assert event.resource_type == "operations_readiness"
    assert set(event.metadata_summary) == {"overall_status", "check_count", "fail_count", "warn_count", "is_demo"}
    assert "DATABASE_URL" not in str(event.metadata_summary)
    assert "secret" not in str(event.metadata_summary).lower()

