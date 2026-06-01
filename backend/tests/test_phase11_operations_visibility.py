from __future__ import annotations

from datetime import datetime, timezone

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
from app.schemas.readiness import ReadinessReport
from app.services.admin_operations import build_operations_dashboard
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
    assert "deployment_guardrails" in payload
    assert "smoke_profiles" in payload
    assert {item["key"] for item in payload["smoke_profiles"]} == {"demo_smoke", "pilot_smoke"}
    smoke_profiles = {item["key"]: item for item in payload["smoke_profiles"]}
    assert smoke_profiles["demo_smoke"]["command"] == "npm --prefix frontend run smoke:demo"
    assert smoke_profiles["demo_smoke"]["uses_demo_accounts"] is True
    assert smoke_profiles["demo_smoke"]["requires_readiness_ready"] is False
    assert smoke_profiles["pilot_smoke"]["command"] == "npm --prefix frontend run smoke:pilot"
    assert smoke_profiles["pilot_smoke"]["uses_demo_accounts"] is False
    assert smoke_profiles["pilot_smoke"]["requires_readiness_ready"] is True

    rendered = response.text
    assert PRIVATE_NOTE not in rendered
    assert student.email not in rendered
    assert teacher.email not in rendered
    assert "recipient_id" not in rendered
    assert "resource_id" not in rendered
    assert "DATABASE_URL" not in rendered
    assert "SESSION_COOKIE_NAME" not in rendered
    assert "SMTP_PASSWORD" not in rendered
    assert "FREEMODEL_API_KEY" not in rendered
    assert "student.demo@beyou.local" not in rendered
    assert "beyou_session" not in rendered
    assert "raw_answers" not in rendered.lower()
    assert "chatbot transcript" not in rendered.lower()


def test_readiness_endpoint_records_minimal_operations_audit(
    db: OrmSession, client: TestClient
) -> None:
    admin = _user(db, email="admin-readiness-ops@example.test", role=UserRole.ADMIN.value)
    _login(client, admin.email)

    before = db.scalar(
        select(func.count())
        .select_from(AuditEvent)
        .where(AuditEvent.action == "admin_readiness_checked")
    )
    response = client.get("/api/admin/operations/readiness")

    assert response.status_code == 200
    after = db.scalar(
        select(func.count())
        .select_from(AuditEvent)
        .where(AuditEvent.action == "admin_readiness_checked")
    )
    assert after == (before or 0) + 1
    event = db.scalar(select(AuditEvent).where(AuditEvent.action == "admin_readiness_checked"))
    assert event is not None
    assert event.resource_type == "operations_readiness"
    assert set(event.metadata_summary) == {
        "overall_status",
        "check_count",
        "fail_count",
        "warn_count",
        "is_demo",
    }
    assert "DATABASE_URL" not in str(event.metadata_summary)
    assert "secret" not in str(event.metadata_summary).lower()


def _readiness(status: str = "ready") -> ReadinessReport:
    return ReadinessReport(status=status, generated_at=datetime.now(timezone.utc), checks=[])


def _production_pilot_settings(**updates: object) -> Settings:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        FRONTEND_ORIGINS="",
    )
    return settings.model_copy(update=updates) if updates else settings


def _guardrail_by_key(db: OrmSession, settings: Settings, key: str):
    dashboard = build_operations_dashboard(db, readiness_report=_readiness(), settings=settings)
    return {item.key: item for item in dashboard.deployment_guardrails}[key]


def test_deployment_guardrails_use_safe_exact_cors_cookie_metadata(db: OrmSession) -> None:
    item = _guardrail_by_key(db, _production_pilot_settings(), "cors_cookie_contract")

    assert item.status == "pass"
    assert "exact_allowed_origin_match=yes" in item.evidence
    assert "allowed_origin_count=1" in item.evidence
    assert "all_origins_https=yes" in item.evidence
    assert "credentialed_cors=yes" in item.evidence
    assert "https://pilot.example" not in item.evidence


@pytest.mark.parametrize(
    ("updates", "expected_evidence"),
    [
        ({"frontend_origins": "https://other.example"}, "exact_allowed_origin_match=no"),
        ({"frontend_origins": "*"}, "has_wildcard_origin=yes"),
        ({"frontend_origins": "http://localhost:3000"}, "has_local_origin=yes"),
        ({"frontend_origins": "http://pilot.example"}, "all_origins_https=no"),
    ],
)
def test_production_pilot_cors_cookie_contract_fails_for_unsafe_origin_metadata(
    db: OrmSession,
    updates: dict[str, object],
    expected_evidence: str,
) -> None:
    item = _guardrail_by_key(db, _production_pilot_settings(**updates), "cors_cookie_contract")

    assert item.status == "fail"
    assert expected_evidence in item.evidence
    assert "https://pilot.example" not in item.evidence
    assert "http://localhost:3000" not in item.evidence
    assert "wildcard" in item.evidence


def test_operations_dashboard_json_excludes_forbidden_deployment_metadata(db: OrmSession) -> None:
    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_production_pilot_settings(),
    )
    rendered = dashboard.model_dump_json()

    assert "deployment_guardrails" in rendered
    assert "smoke_profiles" in rendered
    for forbidden in (
        "DATABASE_URL",
        "SESSION_COOKIE_NAME",
        "SMTP_PASSWORD",
        "FREEMODEL_API_KEY",
        "student.demo@beyou.local",
        "resource_id",
        "beyou_session",
        PRIVATE_NOTE,
    ):
        assert forbidden not in rendered
