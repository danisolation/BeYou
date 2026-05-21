from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import AccountStatus, Session as UserSession, User, UserRole
from app.db.session import SessionLocal
from app.main import app
from app.services.readiness import evaluate_static_readiness_checks

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN}
PASSWORD = "secret123"


def _cleanup_readiness_users() -> None:
    with SessionLocal() as db:
        user_ids = list(
            db.scalars(select(User.id).where(User.email.like("%@readiness.test"))).all()
        )
        if user_ids:
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

    assert by_key["config_demo_seed"].status == "fail"
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
