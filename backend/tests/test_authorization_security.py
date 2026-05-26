import uuid

import pytest
from fastapi import HTTPException, Response
from sqlalchemy import delete
from sqlalchemy.orm import Session as OrmSession
from starlette.requests import Request

from app.core.authorization import require_permission
from app.core.config import get_settings
from app.core.security import (
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    check_login_rate_limit,
    hash_password,
    record_login_failure,
    reset_login_failures,
    verify_password,
)
from app.core.sessions import require_same_site_mutation, set_session_cookie
from app.db.models import (
    AccountStatus,
    AuditEvent,
    SosAlert,
    SosStatusEvent,
    InAppNotification,
    LinkStatus,
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
    ChatSafetySignal,
    ChatMessage,
    ChatThread,
    ChatbotSafetyConfig,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.services.audit import record_audit_event


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


def _user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str = "Demo User",
    status: str = AccountStatus.ACTIVE.value,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=role,
        status=status,
        full_name=full_name,
        school="THPT Demo",
        class_name="10A1",
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_hash_password_uses_argon2id_and_verifies() -> None:
    password_hash = hash_password("secret123")

    assert password_hash != "secret123"
    assert password_hash.startswith("$argon2")
    assert verify_password("secret123", password_hash) is True
    assert verify_password("wrong", password_hash) is False


def test_login_rate_limiter_blocks_after_five_failures() -> None:
    email = f"{uuid.uuid4()}@example.test"
    client_ip = "203.0.113.10"
    reset_login_failures(email, client_ip)

    for _ in range(LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        record_login_failure(email, client_ip)

    with pytest.raises(HTTPException) as exc_info:
        check_login_rate_limit(email, client_ip)

    assert exc_info.value.status_code == 429
    reset_login_failures(email, client_ip)


def test_host_prefix_cookie_requires_secure_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "__Host-beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")

    with pytest.raises(ValueError):
        get_settings()

    get_settings.cache_clear()


def test_host_prefix_cookie_response_has_required_attributes(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "__Host-beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "true")
    settings = get_settings()
    response = Response()

    set_session_cookie(response, "opaque-token", settings)

    cookie = response.headers["set-cookie"].lower()
    assert "__host-beyou_session=" in cookie
    assert "secure" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "path=/" in cookie
    assert "domain=" not in cookie
    get_settings.cache_clear()


def test_cross_site_cookie_configuration_requires_secure_none(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "__Secure-beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("SESSION_COOKIE_SAMESITE", "none")
    settings = get_settings()
    response = Response()

    set_session_cookie(response, "opaque-token", settings)

    cookie = response.headers["set-cookie"].lower()
    assert "__secure-beyou_session=" in cookie
    assert "secure" in cookie
    assert "httponly" in cookie
    assert "samesite=none" in cookie

    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    with pytest.raises(ValueError):
        get_settings()
    get_settings.cache_clear()


def test_render_postgres_url_uses_psycopg_driver(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host:5432/db")

    settings = get_settings()

    assert settings.database_url == "postgresql+psycopg://user:pass@host:5432/db"
    get_settings.cache_clear()


def test_csrf_helper_rejects_invalid_origin() -> None:
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/privacy/acknowledgements",
            "headers": [(b"origin", b"http://evil.example")],
        }
    )

    with pytest.raises(HTTPException) as exc_info:
        require_same_site_mutation(request, get_settings())

    assert exc_info.value.status_code == 403


def test_csrf_helper_accepts_configured_extra_frontend_origin(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("FRONTEND_ORIGIN", "http://localhost:3003")
    monkeypatch.setenv("FRONTEND_ORIGINS", "http://127.0.0.1:3003")
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/auth/login",
            "headers": [(b"origin", b"http://127.0.0.1:3003")],
        }
    )

    require_same_site_mutation(request, get_settings())
    get_settings.cache_clear()


def test_csrf_helper_accepts_allowed_cross_site_frontend_origin(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://beyou.vercel.app")
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/auth/login",
            "headers": [
                (b"origin", b"https://beyou.vercel.app"),
                (b"sec-fetch-site", b"cross-site"),
            ],
        }
    )

    require_same_site_mutation(request, get_settings())
    get_settings.cache_clear()


def test_authorization_denies_unlinked_adult_and_allows_active_teacher_link(db: OrmSession) -> None:
    student = _user(db, email="student-authz@example.test", role=UserRole.STUDENT.value)
    linked_teacher = _user(db, email="teacher-authz@example.test", role=UserRole.TEACHER.value)
    unlinked_teacher = _user(db, email="teacher-unlinked@example.test", role=UserRole.TEACHER.value)
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=linked_teacher.id,
            relationship_type=UserRole.TEACHER.value,
            status=LinkStatus.ACTIVE.value,
            created_by=linked_teacher.id,
            is_demo=True,
        )
    )
    db.commit()
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
        linked_teacher,
        resource_type="student_profile",
        action="read",
        purpose="support_not_surveillance",
        student_id=student.id,
    )
    with pytest.raises(HTTPException) as exc_info:
        require_permission(
            db,
            unlinked_teacher,
            resource_type="student_profile",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )

    assert exc_info.value.status_code == 403


def test_external_identity_claims_do_not_grant_adult_visibility(db: OrmSession) -> None:
    student = _user(db, email="student-claims-boundary@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-claims-boundary@example.test", role=UserRole.TEACHER.value)
    fake_claims = {
        "groups": ["teacher", "admin"],
        "school": "THPT Demo",
        "class_name": "10A1",
        "email_domain": "school.example",
    }

    assert fake_claims["groups"] == ["teacher", "admin"]
    assert fake_claims["school"] == "THPT Demo"
    assert fake_claims["class_name"] == "10A1"
    assert fake_claims["email_domain"] == "school.example"
    assert {"groups", "school", "class_name", "email_domain"}.isdisjoint(
        require_permission.__code__.co_varnames
    )
    with pytest.raises(HTTPException) as exc_info:
        require_permission(
            db,
            teacher,
            resource_type="adult_support_summary",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )

    assert exc_info.value.status_code == 403


def test_active_adult_link_still_requires_student_sos_for_support_summary(db: OrmSession) -> None:
    student = _user(db, email="student-sos-boundary@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-sos-boundary@example.test", role=UserRole.TEACHER.value)
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

    with pytest.raises(HTTPException) as exc_info:
        require_permission(
            db,
            teacher,
            resource_type="adult_support_summary",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )

    assert exc_info.value.status_code == 403
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


def test_audit_metadata_rejects_forbidden_sensitive_keys(db: OrmSession) -> None:
    actor = _user(db, email="admin-audit@example.test", role=UserRole.ADMIN.value)

    with pytest.raises(HTTPException) as exc_info:
        record_audit_event(
            db,
            actor=actor,
            actor_role=actor.role,
            action="sensitive_resource_read",
            resource_type="student_profile",
            resource_id=str(actor.id),
            status_value="denied",
            metadata_summary={"nested": {"token": "secret"}},
            is_demo=True,
        )

    assert exc_info.value.status_code == 400
