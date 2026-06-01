import pytest
from datetime import timedelta
from fastapi import Response
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.core.security import LOGIN_RATE_LIMIT_MAX_ATTEMPTS, hash_password, reset_login_failures
from app.core.sessions import create_session, hash_session_token, utc_now
from app.db.models import (
    AccountStatus,
    AuditEvent,
    AuthSessionMethod,
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
from app.main import app, create_app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN}
AUTH_CAPABILITY_FORBIDDEN_MARKERS = {
    "provider_key",
    "client_id",
    "client_secret",
    "issuer",
    "issuer_url",
    "callback",
    "callback_url",
    "school.example",
    "login.school.edu",
    "raw_email",
    "raw_subject",
    "raw_claim",
    "access_token",
    "refresh_token",
    "id_token",
    "cookie",
    "beyou_session",
    "password_hash",
    "$argon2id$",
}


def _assert_public_safe_auth_capabilities(payload: dict[str, object]) -> None:
    assert set(payload) == {
        "demo_login_enabled",
        "public_demo_entry_enabled",
        "email_password_enabled",
        "provider_login_enabled",
        "provider_label",
        "provider_mode",
        "production_pilot",
    }
    serialized = str(payload).lower()
    for marker in AUTH_CAPABILITY_FORBIDDEN_MARKERS:
        assert marker not in serialized


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


def _user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str,
    password: str = "secret123",
    status: str = AccountStatus.ACTIVE.value,
    school: str | None = "THPT Demo",
    class_name: str | None = "10A1",
    is_demo: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        status=status,
        full_name=full_name,
        school=school,
        class_name=class_name,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _link(db: OrmSession, student: User, adult: User, relationship_type: str) -> None:
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=adult.id,
            relationship_type=relationship_type,
            status=LinkStatus.ACTIVE.value,
            created_by=adult.id,
            is_demo=True,
        )
    )
    db.commit()


def _login(
    client: TestClient,
    email: str,
    password: str = "secret123",
    headers: dict[str, str] | None = None,
):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
        headers=headers or ORIGIN_HEADERS,
    )


def test_auth_capabilities_demo_runtime_returns_safe_public_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "public_demo")
    monkeypatch.setenv("ALLOW_DEMO_LOGIN", "true")
    monkeypatch.setenv("AUTH_PROVIDER_ENABLED", "false")
    get_settings.cache_clear()

    with TestClient(create_app()) as demo_client:
        response = demo_client.get("/api/auth/capabilities")

    assert response.status_code == 200
    payload = response.json()
    assert payload == {
        "demo_login_enabled": True,
        "public_demo_entry_enabled": True,
        "email_password_enabled": True,
        "provider_login_enabled": False,
        "provider_label": None,
        "provider_mode": None,
        "production_pilot": False,
    }
    _assert_public_safe_auth_capabilities(payload)
    get_settings.cache_clear()


def test_auth_capabilities_production_pilot_demo_disabled_hides_public_entry(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "production_pilot")
    monkeypatch.setenv("ALLOW_DEMO_LOGIN", "false")
    monkeypatch.setenv("SESSION_COOKIE_NAME", "beyou_session")
    monkeypatch.setenv("AUTH_PROVIDER_ENABLED", "false")
    get_settings.cache_clear()

    with TestClient(create_app()) as pilot_client:
        response = pilot_client.get("/api/auth/capabilities")

    assert response.status_code == 200
    payload = response.json()
    assert payload["demo_login_enabled"] is False
    assert payload["public_demo_entry_enabled"] is False
    assert payload["email_password_enabled"] is True
    assert payload["provider_login_enabled"] is False
    assert payload["provider_label"] is None
    assert payload["provider_mode"] is None
    assert payload["production_pilot"] is True
    _assert_public_safe_auth_capabilities(payload)
    get_settings.cache_clear()


def test_auth_capabilities_provider_enabled_returns_label_and_mode_only(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER_ENABLED", "true")
    monkeypatch.setenv("AUTH_PROVIDER_KEY", "pilot_sso")
    monkeypatch.setenv("AUTH_PROVIDER_LABEL", "Pilot SSO")
    monkeypatch.setenv("AUTH_PROVIDER_MODE", "pilot")
    get_settings.cache_clear()

    with TestClient(create_app()) as provider_client:
        response = provider_client.get("/api/auth/capabilities")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider_login_enabled"] is True
    assert payload["provider_label"] == "Pilot SSO"
    assert payload["provider_mode"] == "pilot"
    assert "provider_key" not in payload
    _assert_public_safe_auth_capabilities(payload)
    get_settings.cache_clear()


def test_auth_capabilities_provider_disabled_suppresses_provider_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER_ENABLED", "false")
    monkeypatch.setenv("AUTH_PROVIDER_KEY", "pilot_sso")
    monkeypatch.setenv("AUTH_PROVIDER_LABEL", "Pilot SSO")
    monkeypatch.setenv("AUTH_PROVIDER_MODE", "pilot")
    get_settings.cache_clear()

    with TestClient(create_app()) as disabled_provider_client:
        response = disabled_provider_client.get("/api/auth/capabilities")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider_login_enabled"] is False
    assert payload["provider_label"] is None
    assert payload["provider_mode"] is None
    assert "provider_key" not in payload
    _assert_public_safe_auth_capabilities(payload)
    get_settings.cache_clear()


def _session_cookie_for(
    db: OrmSession,
    user: User,
    *,
    token: str,
    auth_method: str,
    auth_provider_key: str = "local",
    revoked: bool = False,
) -> UserSession:
    now = utc_now()
    session = UserSession(
        token_hash=hash_session_token(token),
        user_id=user.id,
        created_at=now,
        expires_at=now + timedelta(hours=1),
        revoked_at=now if revoked else None,
        is_demo=user.is_demo,
        auth_method=auth_method,
        auth_provider_key=auth_provider_key,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@pytest.mark.parametrize(
    ("role", "route"),
    [
        (UserRole.STUDENT.value, "/student"),
        (UserRole.TEACHER.value, "/teacher"),
        (UserRole.PARENT.value, "/parent"),
        (UserRole.ADMIN.value, "/admin"),
    ],
)
def test_login_sets_dev_cookie_and_returns_role_dashboard(
    db: OrmSession,
    client: TestClient,
    role: str,
    route: str,
) -> None:
    user = _user(db, email=f"{role}@example.test", role=role, full_name=f"Demo {role}")

    response = _login(client, user.email)

    assert response.status_code == 200
    assert response.json()["dashboard_route"] == route
    assert response.json()["privacy_acknowledgement_required"] == (role == UserRole.STUDENT.value)
    assert response.json()["notice_version"] == NOTICE_VERSION
    cookie = response.headers["set-cookie"].lower()
    assert "beyou_session=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "secure" not in cookie
    sessions = db.scalars(select(UserSession).where(UserSession.user_id == user.id)).all()
    assert len(sessions) == 1
    assert sessions[0].auth_method == AuthSessionMethod.DEMO_PASSWORD.value
    assert sessions[0].auth_provider_key == "local"


def test_invalid_and_disabled_login_responses_are_generic_or_safe(
    db: OrmSession,
    client: TestClient,
) -> None:
    active = _user(
        db, email="active-login@example.test", role=UserRole.STUDENT.value, full_name="Active"
    )
    disabled = _user(
        db,
        email="disabled-login@example.test",
        role=UserRole.STUDENT.value,
        full_name="Disabled",
        status=AccountStatus.DISABLED.value,
    )
    reset_login_failures(active.email, "testclient")
    reset_login_failures(disabled.email, "testclient")

    invalid_response = _login(client, active.email, password="wrong")
    disabled_response = _login(client, disabled.email)

    assert invalid_response.status_code == 401
    assert (
        invalid_response.json()["detail"]
        == "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập."
    )
    assert disabled_response.status_code == 403
    assert "tạm khóa" in disabled_response.json()["detail"]


def test_production_pilot_blocks_demo_user_login_without_session(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "production_pilot")
    monkeypatch.setenv("ALLOW_DEMO_LOGIN", "false")
    get_settings.cache_clear()
    demo_user = _user(
        db, email="pilot-demo-login@example.test", role=UserRole.ADMIN.value, full_name="Pilot Demo"
    )
    reset_login_failures(demo_user.email, "testclient")

    with TestClient(create_app()) as pilot_client:
        response = _login(pilot_client, demo_user.email)

    assert response.status_code == 403
    assert response.json()["detail"] == "Demo accounts are disabled in production pilot mode."
    assert "set-cookie" not in response.headers
    assert db.scalar(select(UserSession).where(UserSession.user_id == demo_user.id)) is None
    get_settings.cache_clear()


def test_allow_demo_login_false_denies_demo_login_before_session(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_LOGIN", "false")
    get_settings.cache_clear()
    demo_user = _user(
        db,
        email="disabled-demo-login@example.test",
        role=UserRole.STUDENT.value,
        full_name="Demo Disabled",
    )
    reset_login_failures(demo_user.email, "testclient")

    with TestClient(create_app()) as guarded_client:
        response = _login(guarded_client, demo_user.email)

    assert response.status_code == 403
    assert response.json()["detail"] == "Demo accounts are disabled in production pilot mode."
    assert "set-cookie" not in response.headers
    assert db.scalars(select(UserSession).where(UserSession.user_id == demo_user.id)).all() == []
    get_settings.cache_clear()


def test_production_pilot_allows_non_demo_login_session(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "production_pilot")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("SESSION_COOKIE_SAMESITE", "none")
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://pilot.example")
    monkeypatch.setenv("FRONTEND_ORIGINS", "")
    get_settings.cache_clear()
    pilot_user = _user(
        db,
        email="pilot-non-demo-login@example.test",
        role=UserRole.ADMIN.value,
        full_name="Pilot User",
        is_demo=False,
    )

    with TestClient(create_app()) as pilot_client:
        response = _login(
            pilot_client, pilot_user.email, headers={"Origin": "https://pilot.example"}
        )

    assert response.status_code == 200
    assert "set-cookie" in response.headers
    sessions = db.scalars(select(UserSession).where(UserSession.user_id == pilot_user.id)).all()
    assert len(sessions) == 1
    assert sessions[0].is_demo is False
    assert sessions[0].auth_method == AuthSessionMethod.PASSWORD.value
    assert sessions[0].auth_provider_key == "local"
    get_settings.cache_clear()


def test_create_session_accepts_future_sso_metadata_without_changing_cookie_contract(
    db: OrmSession,
) -> None:
    settings = get_settings()
    student = _user(
        db,
        email="sso-metadata@example.test",
        role=UserRole.STUDENT.value,
        full_name="SSO Metadata",
        is_demo=False,
    )
    response = Response()

    session = create_session(
        db,
        student,
        response,
        settings,
        auth_method=AuthSessionMethod.SSO.value,
        auth_provider_key="pilot_sso",
    )

    assert session.auth_method == AuthSessionMethod.SSO.value
    assert session.auth_provider_key == "pilot_sso"
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "access_token" not in response.headers["set-cookie"]
    assert "refresh_token" not in response.headers["set-cookie"]


@pytest.mark.parametrize(
    ("auth_method", "auth_provider_key", "is_demo"),
    [
        (AuthSessionMethod.PASSWORD.value, "local", False),
        (AuthSessionMethod.DEMO_PASSWORD.value, "local", True),
        (AuthSessionMethod.SSO.value, "pilot_sso", False),
    ],
)
def test_me_response_contract_is_shared_for_password_demo_and_sso_marked_sessions(
    db: OrmSession,
    auth_method: str,
    auth_provider_key: str,
    is_demo: bool,
) -> None:
    student = _user(
        db,
        email=f"{auth_method}-shared-contract@example.test",
        role=UserRole.STUDENT.value,
        full_name=f"{auth_method} Student",
        is_demo=is_demo,
    )
    token = f"{auth_method}-session-token"
    _session_cookie_for(
        db,
        student,
        token=token,
        auth_method=auth_method,
        auth_provider_key=auth_provider_key,
    )

    with TestClient(app) as method_client:
        method_client.cookies.set(get_settings().session_cookie_name, token)
        response = method_client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["privacy_acknowledgement_required"] is True
    assert response.json()["dashboard_route"] == "/student"
    assert response.json()["notice_version"] == NOTICE_VERSION


def test_revoked_session_is_denied_for_safe_auth_metadata(db: OrmSession) -> None:
    student = _user(
        db,
        email="revoked-sso@example.test",
        role=UserRole.STUDENT.value,
        full_name="Revoked SSO",
        is_demo=False,
    )
    token = "revoked-sso-token"
    _session_cookie_for(
        db,
        student,
        token=token,
        auth_method=AuthSessionMethod.SSO.value,
        auth_provider_key="pilot_sso",
        revoked=True,
    )

    with TestClient(app) as revoked_client:
        revoked_client.cookies.set(get_settings().session_cookie_name, token)
        response = revoked_client.get("/api/auth/me")

    assert response.status_code == 401


@pytest.mark.parametrize(
    "status_value", [AccountStatus.DISABLED.value, AccountStatus.DELETED.value]
)
def test_inactive_or_deleted_users_cannot_keep_password_demo_or_sso_marked_sessions(
    db: OrmSession,
    status_value: str,
) -> None:
    student = _user(
        db,
        email=f"{status_value}-session@example.test",
        role=UserRole.STUDENT.value,
        full_name=f"{status_value} Student",
        status=status_value,
        is_demo=False,
    )
    token = f"{status_value}-sso-token"
    session = _session_cookie_for(
        db,
        student,
        token=token,
        auth_method=AuthSessionMethod.SSO.value,
        auth_provider_key="pilot_sso",
    )

    with TestClient(app) as inactive_client:
        inactive_client.cookies.set(get_settings().session_cookie_name, token)
        response = inactive_client.get("/api/auth/me")

    assert response.status_code == 401
    db.refresh(session)
    assert session.revoked_at is not None


def test_production_pilot_blocks_login_when_cookie_config_is_unsafe(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "production_pilot")
    get_settings.cache_clear()
    pilot_user = _user(
        db,
        email="pilot-unsafe-login@example.test",
        role=UserRole.ADMIN.value,
        full_name="Unsafe Pilot",
        is_demo=False,
    )

    with TestClient(create_app()) as pilot_client:
        response = _login(pilot_client, pilot_user.email)

    assert response.status_code == 503
    assert response.json()["detail"] == "Production pilot authentication is not safely configured."
    assert "set-cookie" not in response.headers
    assert db.scalar(select(UserSession).where(UserSession.user_id == pilot_user.id)) is None
    get_settings.cache_clear()


def test_repeated_invalid_login_attempts_return_429(db: OrmSession, client: TestClient) -> None:
    user = _user(
        db, email="limited-login@example.test", role=UserRole.STUDENT.value, full_name="Limited"
    )
    reset_login_failures(user.email, "testclient")

    for _ in range(LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        response = _login(client, user.email, password="wrong")
        assert response.status_code == 401

    limited_response = _login(client, user.email, password="wrong")

    assert limited_response.status_code == 429
    assert (
        limited_response.json()["detail"]
        == "Quá nhiều lần đăng nhập chưa thành công. Hãy thử lại sau ít phút."
    )


def test_me_privacy_acknowledgement_and_student_profile_flow(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(
        db,
        email="student-flow@example.test",
        role=UserRole.STUDENT.value,
        full_name="Nguyễn An",
    )
    teacher = _user(
        db,
        email="teacher-flow@example.test",
        role=UserRole.TEACHER.value,
        full_name="Cô Bình",
        class_name=None,
    )
    parent = _user(
        db,
        email="parent-flow@example.test",
        role=UserRole.PARENT.value,
        full_name="Phụ huynh Chi",
        class_name=None,
    )
    _link(db, student, teacher, UserRole.TEACHER.value)
    _link(db, student, parent, UserRole.PARENT.value)

    assert _login(client, student.email).status_code == 200
    me_response = client.get("/api/auth/me")
    blocked_profile = client.get("/api/student/profile")
    acknowledgement_response = client.post(
        "/api/privacy/acknowledgements",
        headers=ORIGIN_HEADERS,
    )
    profile_response = client.get("/api/student/profile")
    updated_me_response = client.get("/api/auth/me")

    assert me_response.status_code == 200
    assert me_response.json()["privacy_acknowledgement_required"] is True
    assert blocked_profile.status_code == 409
    assert blocked_profile.json()["detail"]["code"] == "privacy_ack_required"
    assert acknowledgement_response.status_code == 200
    assert acknowledgement_response.json()["notice_version"] == NOTICE_VERSION
    assert updated_me_response.json()["privacy_acknowledgement_required"] is False
    assert profile_response.status_code == 200
    linked_adults = profile_response.json()["linked_adults"]
    assert {adult["relationship_type"] for adult in linked_adults} == {"teacher", "parent"}
    assert (
        db.scalar(select(AuditEvent).where(AuditEvent.action == "privacy_acknowledged")) is not None
    )


def test_teacher_and_parent_portals_return_only_active_linked_students(
    db: OrmSession,
    client: TestClient,
) -> None:
    linked_student = _user(
        db,
        email="linked-student@example.test",
        role=UserRole.STUDENT.value,
        full_name="Linked Student",
    )
    unlinked_student = _user(
        db,
        email="unlinked-student@example.test",
        role=UserRole.STUDENT.value,
        full_name="Unlinked Student",
    )
    teacher = _user(
        db, email="teacher-portal@example.test", role=UserRole.TEACHER.value, full_name="Teacher"
    )
    parent = _user(
        db, email="parent-portal@example.test", role=UserRole.PARENT.value, full_name="Parent"
    )
    _link(db, linked_student, teacher, UserRole.TEACHER.value)
    _link(db, linked_student, parent, UserRole.PARENT.value)
    db.add(
        SosAlert(
            student_id=linked_student.id,
            student_full_name_snapshot=linked_student.full_name,
            student_school_snapshot=linked_student.school,
            student_class_name_snapshot=linked_student.class_name,
            severity="support",
            source="test",
            current_status="sent",
            is_demo=True,
        )
    )
    db.commit()

    teacher_client = TestClient(app)
    parent_client = TestClient(app)
    assert _login(teacher_client, teacher.email).status_code == 200
    assert _login(parent_client, parent.email).status_code == 200

    teacher_response = teacher_client.get("/api/teacher/students")
    parent_response = parent_client.get("/api/parent/students")

    assert teacher_response.status_code == 200
    assert parent_response.status_code == 200
    assert [student["email"] for student in teacher_response.json()] == [linked_student.email]
    assert [student["email"] for student in parent_response.json()] == [linked_student.email]
    assert unlinked_student.email not in str(teacher_response.json())
    assert unlinked_student.email not in str(parent_response.json())


def test_cors_allows_configured_origin_and_rejects_unlisted_origin(client: TestClient) -> None:
    allowed_response = client.options(
        "/api/auth/me",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    denied_response = client.options(
        "/api/auth/me",
        headers={
            "Origin": "http://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert allowed_response.status_code == 200
    assert allowed_response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    assert allowed_response.headers["access-control-allow-credentials"] == "true"
    assert denied_response.status_code == 400
    assert "access-control-allow-origin" not in denied_response.headers


def test_cors_allows_extra_configured_frontend_origins(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("FRONTEND_ORIGIN", "http://localhost:3003")
    monkeypatch.setenv("FRONTEND_ORIGINS", "http://127.0.0.1:3003")
    with TestClient(create_app()) as test_client:
        allowed_response = test_client.options(
            "/api/auth/me",
            headers={
                "Origin": "http://127.0.0.1:3003",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert allowed_response.status_code == 200
    assert allowed_response.headers["access-control-allow-origin"] == "http://127.0.0.1:3003"
    get_settings.cache_clear()


def test_mutating_cookie_auth_endpoint_rejects_bad_origin(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(
        db,
        email="csrf-student@example.test",
        role=UserRole.STUDENT.value,
        full_name="CSRF Student",
    )
    assert _login(client, student.email).status_code == 200

    response = client.post(
        "/api/privacy/acknowledgements",
        headers={"Origin": "http://evil.example"},
    )

    assert response.status_code == 403
