from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    AuthSessionMethod,
    ChatMessage,
    ChatSafetySignal,
    ChatThread,
    ChatbotSafetyConfig,
    ExternalIdentity,
    InAppNotification,
    LinkStatus,
    MoodCheckIn,
    MoodCheckInConfig,
    MoodCheckinReminderState,
    MoodNoteShare,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SchoolPrivacyPolicyDefault,
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
    StudentNotificationPreference,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.schemas.readiness import ReadinessCheck, ReadinessReport
from app.seeds.demo_seed import seed_demo_data
from app.services.admin_operations import build_operations_dashboard
from app.services.readiness import evaluate_static_readiness_checks

PHASE32_BACKEND_REQUIREMENT_IDS = ("QA-01", "QA-03", "QA-04", "QA-05")
PHASE32_FORBIDDEN_BACKEND_MARKERS = (
    "DATABASE_URL",
    "beyou_dev_password",
    "FREEMODEL_API_KEY",
    "SMTP_PASSWORD",
    "SESSION_COOKIE_NAME",
    "client_secret",
    "access_token",
    "refresh_token",
    "id_token",
    "provider_subject",
    "raw_claims",
    "student.demo@beyou.local",
    "private_note",
    "sos_note",
    "transcript",
    "self_check_answer",
    "scenario_answer",
    "reason_text",
    "student_id",
    "recipient_id",
    "export_url",
    "risk_leaderboard",
    "xếp hạng nguy cơ",
)
SAFE_DATABASE_URL = "postgresql+psycopg://pilot:secret@db.example.com:5432/peerlight"
PASSWORD = "secret123"


def _clean_phase32_database() -> None:
    with SessionLocal() as db:
        for model in (
            ChatSafetySignal,
            ChatMessage,
            ChatThread,
            ChatbotSafetyConfig,
            MoodNoteShare,
            MoodCheckIn,
            MoodCheckinReminderState,
            StudentNotificationPreference,
            SchoolPrivacyPolicyDefault,
            MoodCheckInConfig,
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
            ExternalIdentity,
            User,
        ):
            db.execute(delete(model))
        db.commit()


@pytest.fixture()
def db() -> OrmSession:
    _clean_phase32_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_phase32_database()


def _pilot_settings(**updates: object) -> Settings:
    values = {
        "RUNTIME_MODE": "production_pilot",
        "ENVIRONMENT": "production",
        "SESSION_COOKIE_SECURE": True,
        "SESSION_COOKIE_SAMESITE": "none",
        "FRONTEND_ORIGIN": "https://pilot.example",
        "FRONTEND_ORIGINS": "",
        "DATABASE_URL": SAFE_DATABASE_URL,
        "ALLOW_DEMO_SEED": False,
        "ALLOW_DEMO_LOGIN": False,
        "CHAT_PROVIDER": "fallback",
        "SOS_EMAIL_PROVIDER": "disabled",
        "AUTH_PROVIDER_ENABLED": True,
        "AUTH_PROVIDER_KEY": "pilot_sso",
        "AUTH_PROVIDER_LABEL": "Pilot SSO",
        "AUTH_PROVIDER_MODE": "pilot",
        "AUTH_PROVIDER_LAST_CHECK_STATUS": "ready",
    }
    values.update(updates)
    return Settings(**values)


def _readiness(status: str = "ready", migration_status: str = "pass") -> ReadinessReport:
    return ReadinessReport(
        status=status,
        generated_at=datetime.now(timezone.utc),
        checks=[
            ReadinessCheck(
                key="alembic_migration",
                category="database",
                status=migration_status,
                summary="Migration metadata safe.",
            )
        ],
    )


def _assert_forbidden_markers_absent(rendered: str) -> None:
    for marker in PHASE32_FORBIDDEN_BACKEND_MARKERS:
        assert marker not in rendered


def _user(
    db: OrmSession, *, email: str, role: str, status: str = AccountStatus.ACTIVE.value
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=status,
        full_name=f"{role.title()} Phase32",
        school="THPT Phase32" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_phase32_backend_requirement_ids_are_documented() -> None:
    assert PHASE32_BACKEND_REQUIREMENT_IDS == ("QA-01", "QA-03", "QA-04", "QA-05")


def test_qa01_runtime_readiness_and_secret_masking_gate() -> None:
    unsafe_settings = _pilot_settings(ALLOW_DEMO_SEED=True, ALLOW_DEMO_LOGIN=True)
    unsafe_checks = {
        check.key: check for check in evaluate_static_readiness_checks(unsafe_settings)
    }

    assert unsafe_checks["demo_seed_policy"].status == "fail"
    assert unsafe_checks["demo_login_policy"].status == "fail"

    safe_checks = evaluate_static_readiness_checks(_pilot_settings())
    assert {check.status for check in safe_checks} == {"pass"}

    rendered = "\n".join(check.model_dump_json() for check in unsafe_checks.values())
    _assert_forbidden_markers_absent(rendered)


def test_qa01_seed_demo_data_noops_in_production_pilot(db: OrmSession) -> None:
    settings = _pilot_settings(ALLOW_DEMO_SEED=True)

    assert seed_demo_data(db, settings) is False
    for model in (User, StudentAdultLink, SelfCheckTest, Scenario, MoodCheckInConfig):
        assert db.scalars(select(model)).all() == []


def test_qa03_identity_contract_source_has_no_oauth_callback_or_browser_token_contract() -> None:
    auth_source = Path("app/api/auth.py").read_text(encoding="utf-8")
    authorization_source = Path("app/core/authorization.py").read_text(encoding="utf-8")

    for marker in (
        "oauth",
        "oidc",
        "authorize_redirect",
        "callback_url",
        "access_token",
        "refresh_token",
        "id_token",
    ):
        assert marker not in auth_source.lower()
    for marker in ("ExternalIdentity", "provider_subject", "raw_claims", "groups"):
        assert marker not in authorization_source
    assert "privacy_acknowledgement_required" in Path("app/api/auth.py").read_text(encoding="utf-8")


def test_qa03_auth_capabilities_and_session_metadata_are_safe(db: OrmSession) -> None:
    student = _user(db, email="student-phase32-session@example.test", role=UserRole.STUDENT.value)
    session = UserSession(
        token_hash="phase32_safe_hash",
        user_id=student.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        is_demo=False,
        auth_method=AuthSessionMethod.SSO.value,
        auth_provider_key="pilot_sso",
    )
    db.add(session)
    db.commit()

    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(),
    )
    method_buckets = {bucket.key: bucket.count for bucket in dashboard.session_auth.by_auth_method}
    provider_buckets = {bucket.key: bucket.count for bucket in dashboard.session_auth.by_provider}
    rendered = dashboard.model_dump_json()

    assert method_buckets[AuthSessionMethod.SSO.value] == 1
    assert provider_buckets["pilot_sso"] == 1
    assert dashboard.auth_provider.enabled is True
    assert dashboard.auth_provider.status == "pass"
    _assert_forbidden_markers_absent(rendered)


def test_qa04_identity_claims_do_not_bypass_adult_visibility(db: OrmSession) -> None:
    student = _user(db, email="student-phase32-claims@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-phase32-claims@example.test", role=UserRole.TEACHER.value)
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type=UserRole.TEACHER.value,
            status=LinkStatus.ACTIVE.value,
            created_by=teacher.id,
            is_demo=True,
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as denied_without_sos:
        require_permission(
            db,
            teacher,
            resource_type="adult_support_summary",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )
    assert denied_without_sos.value.status_code == 403

    db.add(
        SosAlert(
            student_id=student.id,
            student_full_name_snapshot=student.full_name,
            student_school_snapshot=student.school,
            student_class_name_snapshot=student.class_name,
            severity="support",
            source="test",
            current_status="sent",
            is_demo=True,
        )
    )
    db.commit()

    require_permission(
        db,
        teacher,
        resource_type="adult_support_summary",
        action="read",
        purpose="support_not_surveillance",
        student_id=student.id,
    )


def test_qa05_operations_dashboard_serialization_rejects_raw_sensitive_markers(
    db: OrmSession,
) -> None:
    admin = _user(db, email="admin-phase32-operations@example.test", role=UserRole.ADMIN.value)
    db.add(
        AuditEvent(
            actor_id=admin.id,
            actor_role=UserRole.ADMIN.value,
            action="phase32_release_gate_checked",
            resource_type="operations_readiness",
            resource_id="phase32",
            reason="admin_operations",
            status="ok",
            metadata_summary={
                "safe_status": "pass",
                "student_email": "student.demo@beyou.local",
                "student_id": "student-id-raw",
                "provider_subject": "provider-subject-raw",
                "raw_claims": {"groups": ["teacher"], "school": "THPT"},
                "private_note": "private_note",
                "sos_note": "sos_note",
                "transcript": "transcript",
                "self_check_answer": "self_check_answer",
                "scenario_answer": "scenario_answer",
                "reason_text": "reason_text",
                "export_url": "https://unsafe.example/export",
                "risk_leaderboard": "xếp hạng nguy cơ",
            },
            is_demo=True,
        )
    )
    db.commit()

    dashboard = build_operations_dashboard(
        db, readiness_report=_readiness(), settings=_pilot_settings()
    )
    rendered = dashboard.model_dump_json()

    assert "phase32_release_gate_checked" in rendered
    assert "safe_status" in rendered
    _assert_forbidden_markers_absent(rendered)
    for safe_command in (
        "npm --prefix frontend run guard:deploy",
        "npm --prefix frontend run smoke:demo",
        "npm --prefix frontend run smoke:pilot",
        "python -m pytest tests/test_phase31_school_pilot_operations.py -q",
    ):
        assert safe_command in rendered


def test_qa05_operations_forbidden_metadata_keys_cover_phase32_redlines() -> None:
    operations_source = Path("app/services/admin_operations.py").read_text(encoding="utf-8")

    for marker in (
        "student_email",
        "student_id",
        "recipient_id",
        "private_note",
        "sos_note",
        "transcript",
        "reason_text",
        "provider_subject",
        "raw_claims",
        "access_token",
        "refresh_token",
        "id_token",
    ):
        assert marker in operations_source
