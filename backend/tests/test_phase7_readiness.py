from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import AccountStatus, AuditEvent, Session as UserSession, User, UserRole
from app.db.session import SessionLocal
from app.main import app
from app.schemas.readiness import ReadinessReport
from app.services.admin_operations import build_operations_dashboard
from app.services.readiness import evaluate_static_readiness_checks

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN}
PASSWORD = "secret123"
SAFE_DATABASE_URL = "postgresql+psycopg://pilot:secret@db.example.com:5432/peerlight"


def _cleanup_readiness_users() -> None:
    with SessionLocal() as db:
        user_ids = list(
            db.scalars(select(User.id).where(User.email.like("%@readiness.test"))).all()
        )
        if user_ids:
            db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(user_ids)))
            db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
            db.execute(delete(User).where(User.id.in_(user_ids)))
        db.commit()


def _user(db: OrmSession, *, role: str) -> User:
    user = User(
        email=f"{role}-{uuid.uuid4()}@readiness.test",
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Readiness",
        school="THPT Readiness" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=True,
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


def test_public_health_endpoints_are_non_sensitive() -> None:
    with TestClient(app) as client:
        live_response = client.get("/health/live")
        ready_response = client.get("/health/ready")

    assert live_response.status_code == 200
    assert live_response.json() == {"status": "ok"}
    assert ready_response.status_code in {200, 503}
    body = ready_response.json()
    assert set(body) == {"status", "generated_at"}
    assert body["status"] in {"ready", "degraded", "not_ready"}
    assert "checks" not in body
    assert "beyou_dev_password" not in ready_response.text
    assert "DATABASE_URL" not in ready_response.text


def test_admin_readiness_requires_admin_and_masks_details() -> None:
    _cleanup_readiness_users()
    db = SessionLocal()
    try:
        student = _user(db, role=UserRole.STUDENT.value)
        admin = _user(db, role=UserRole.ADMIN.value)
        student_email = student.email
        admin_email = admin.email
    finally:
        db.close()

    try:
        with TestClient(app) as client:
            anonymous_response = client.get("/api/admin/operations/readiness")
            assert anonymous_response.status_code == 401

            _login(client, student_email)
            student_response = client.get("/api/admin/operations/readiness")
            assert student_response.status_code == 403

            client.cookies.clear()
            _login(client, admin_email)
            admin_response = client.get("/api/admin/operations/readiness")

        assert admin_response.status_code == 200
        body = admin_response.json()
        assert body["status"] in {"ready", "degraded", "not_ready"}
        check_keys = {check["key"] for check in body["checks"]}
        assert {
            "config_environment",
            "origin_security",
            "cookie_security",
            "database_connectivity",
            "alembic_migration",
        }.issubset(check_keys)
        assert "beyou_dev_password" not in admin_response.text
        assert "DATABASE_URL" not in admin_response.text
        assert "FREEMODEL_API_KEY" not in admin_response.text
    finally:
        _cleanup_readiness_users()


def test_static_readiness_flags_unsafe_production_config_without_secret_values() -> None:
    settings = Settings(
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=False,
        FRONTEND_ORIGIN="http://localhost:3000",
        ALLOW_DEMO_SEED=True,
        CHAT_PROVIDER="freemodel",
        FREEMODEL_API_KEY="",
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}

    assert by_key["runtime_environment_compatibility"].status == "fail"
    assert by_key["demo_seed_policy"].status == "fail"
    assert by_key["config_database_url"].status == "fail"
    assert by_key["origin_security"].status == "fail"
    assert by_key["cookie_security"].status == "fail"
    assert by_key["provider_secrets"].status == "fail"

    rendered = "\n".join(check.model_dump_json() for check in checks)
    assert "beyou_dev_password" not in rendered
    assert "DATABASE_URL" not in rendered
    assert "FREEMODEL_API_KEY" not in rendered


def test_static_readiness_flags_https_localhost_in_production() -> None:
    settings = Settings(
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=True,
        FRONTEND_ORIGIN="https://localhost:3000",
        FRONTEND_ORIGINS="https://127.0.0.1:3000",
        ALLOW_DEMO_SEED=False,
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}

    assert by_key["origin_security"].status == "fail"


def test_settings_runtime_mode_defaults_to_local_demo() -> None:
    settings = Settings()

    assert settings.runtime_mode == "local_demo"
    assert settings.is_local_demo is True
    assert settings.is_demo_runtime is True
    assert settings.is_public_demo is False
    assert settings.is_production_pilot is False


def test_settings_rejects_unknown_runtime_mode() -> None:
    try:
        Settings(RUNTIME_MODE="prod")
    except ValidationError:
        return

    raise AssertionError("Invalid runtime mode was accepted")


def test_production_pilot_readiness_flags_demo_seed_and_demo_login() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        ALLOW_DEMO_SEED=True,
        ALLOW_DEMO_LOGIN=True,
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="disabled",
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}

    assert by_key["runtime_mode"].status == "pass"
    assert by_key["runtime_environment_compatibility"].status == "pass"
    assert by_key["demo_seed_policy"].status == "fail"
    assert by_key["demo_login_policy"].status == "fail"
    assert by_key["identity_configuration"].status == "fail"


def test_production_pilot_readiness_flags_cookie_and_origin_drift() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        SESSION_COOKIE_SECURE=False,
        FRONTEND_ORIGIN="http://localhost:3000",
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="disabled",
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}

    assert by_key["origin_security"].status == "fail"
    assert by_key["cookie_security"].status == "fail"
    assert by_key["config_database_url"].status == "fail"


def test_production_pilot_static_readiness_can_pass_safe_config() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        FRONTEND_ORIGINS="",
        DATABASE_URL=SAFE_DATABASE_URL,
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="disabled",
        AUTH_PROVIDER_ENABLED=True,
        AUTH_PROVIDER_KEY="pilot_sso",
        AUTH_PROVIDER_LABEL="Dang nhap truong pilot",
        AUTH_PROVIDER_MODE="pilot",
        AUTH_PROVIDER_LAST_CHECK_STATUS="san sang",
    )

    checks = evaluate_static_readiness_checks(settings)

    assert {check.status for check in checks} == {"pass"}


def test_auth_provider_settings_accept_safe_metadata_only() -> None:
    settings = Settings(
        AUTH_PROVIDER_ENABLED=True,
        AUTH_PROVIDER_KEY="pilot_sso",
        AUTH_PROVIDER_LABEL="Dang nhap truong pilot",
        AUTH_PROVIDER_MODE="pilot",
        AUTH_PROVIDER_LAST_CHECK_STATUS="san sang",
    )

    assert settings.auth_provider_enabled is True
    assert settings.auth_provider_key == "pilot_sso"
    assert settings.auth_provider_label == "Dang nhap truong pilot"
    assert settings.auth_provider_mode == "pilot"
    assert settings.auth_provider_last_check_status == "san sang"


def test_auth_provider_settings_reject_raw_domains_and_secret_like_values() -> None:
    cases = [
        ("AUTH_PROVIDER_KEY", "school.example"),
        ("AUTH_PROVIDER_KEY", "login.school.edu"),
        ("AUTH_PROVIDER_KEY", "client_secret"),
        ("AUTH_PROVIDER_KEY", "issuer_url"),
        ("AUTH_PROVIDER_KEY", "access_token"),
        ("AUTH_PROVIDER_MODE", "school.example"),
        ("AUTH_PROVIDER_MODE", "login.school.edu"),
        ("AUTH_PROVIDER_MODE", "callback_url"),
        ("AUTH_PROVIDER_MODE", "refresh_token"),
        ("AUTH_PROVIDER_MODE", "id_token"),
        ("AUTH_PROVIDER_LABEL", "school.example"),
        ("AUTH_PROVIDER_LABEL", "login.school.edu"),
        ("AUTH_PROVIDER_LABEL", "student@example.edu"),
        ("AUTH_PROVIDER_LABEL", "client_id abc"),
        ("AUTH_PROVIDER_LABEL", "issuer_url https://login.school.edu"),
        ("AUTH_PROVIDER_LAST_CHECK_STATUS", "school.example"),
        ("AUTH_PROVIDER_LAST_CHECK_STATUS", "login.school.edu"),
        ("AUTH_PROVIDER_LAST_CHECK_STATUS", "callback_url https://pilot.example/callback"),
        ("AUTH_PROVIDER_LAST_CHECK_STATUS", "access_token present"),
        ("AUTH_PROVIDER_LAST_CHECK_STATUS", "$argon2id$v=19$m=65536"),
    ]

    for field_name, raw_value in cases:
        try:
            Settings(**{field_name: raw_value})
        except ValidationError:
            continue

        raise AssertionError(f"{field_name} accepted unsafe provider metadata: {raw_value}")


def test_identity_configuration_reflects_safe_auth_provider_metadata() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        DATABASE_URL=SAFE_DATABASE_URL,
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="disabled",
        AUTH_PROVIDER_ENABLED=True,
        AUTH_PROVIDER_KEY="pilot_sso",
        AUTH_PROVIDER_LABEL="Dang nhap truong pilot",
        AUTH_PROVIDER_MODE="pilot",
        AUTH_PROVIDER_LAST_CHECK_STATUS="san sang",
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}
    rendered = "\n".join(check.model_dump_json() for check in checks)

    assert by_key["identity_configuration"].status == "pass"
    assert "auth_provider_enabled" not in rendered
    assert "client_secret" not in rendered
    assert "issuer_url" not in rendered
    assert "callback_url" not in rendered
    assert "access_token" not in rendered
    assert "refresh_token" not in rendered
    assert "id_token" not in rendered
    assert "school.example" not in rendered
    assert "login.school.edu" not in rendered


def test_production_pilot_readiness_flags_smtp_placeholder_credentials() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        FRONTEND_ORIGINS="",
        DATABASE_URL=SAFE_DATABASE_URL,
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="smtp",
        SMTP_HOST="smtp.example.com",
        SMTP_FROM="alerts@example.com",
        SMTP_USERNAME="",
        SMTP_PASSWORD="",
    )

    checks = evaluate_static_readiness_checks(settings)
    by_key = {check.key: check for check in checks}

    assert by_key["sos_email_readiness"].status == "fail"


def test_public_ready_response_remains_minimal_with_runtime_mode() -> None:
    with TestClient(app) as client:
        ready_response = client.get("/health/ready")

    assert ready_response.status_code in {200, 503}
    body = ready_response.json()
    assert set(body) == {"status", "generated_at"}
    assert "runtime_mode" not in body
    assert "runtime" not in body
    assert "checks" not in body


def test_admin_operations_exposes_runtime_mode_without_sensitive_values() -> None:
    settings = Settings(
        RUNTIME_MODE="production_pilot",
        ENVIRONMENT="production",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="none",
        FRONTEND_ORIGIN="https://pilot.example",
        FRONTEND_ORIGINS="",
        DATABASE_URL=SAFE_DATABASE_URL,
        ALLOW_DEMO_SEED=False,
        ALLOW_DEMO_LOGIN=False,
        CHAT_PROVIDER="fallback",
        SOS_EMAIL_PROVIDER="disabled",
    )
    checks = evaluate_static_readiness_checks(settings)
    report = ReadinessReport(status="ready", generated_at=datetime.now(timezone.utc), checks=checks)

    with SessionLocal() as db:
        dashboard = build_operations_dashboard(db, readiness_report=report, settings=settings)

    assert dashboard.runtime.mode == "production_pilot"
    assert dashboard.runtime.production_pilot is True
    assert dashboard.runtime.demo_seed_allowed is False
    assert dashboard.runtime.demo_login_allowed is False
    assert dashboard.connectivity.frontend_origin_kind == "https"
    assert dashboard.connectivity.allowed_origin_count == 1
    assert dashboard.connectivity.session_cookie_secure is True
    assert dashboard.connectivity.session_cookie_samesite == "none"

    rendered = dashboard.model_dump_json()
    for forbidden in (
        "beyou_dev_password",
        "DATABASE_URL",
        "postgresql://",
        "postgresql+psycopg://",
        "FREEMODEL_API_KEY",
        "SMTP_PASSWORD",
        "BeYouDemo!2026",
        "beyou_session",
        "__Secure-beyou_session",
        "student.demo@",
        "teacher.demo@",
        "parent.demo@",
        "admin.demo@",
    ):
        assert forbidden not in rendered
