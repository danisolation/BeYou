import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.core.security import LOGIN_RATE_LIMIT_MAX_ATTEMPTS, hash_password, reset_login_failures
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
from app.main import app, create_app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN}


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
    cookie = response.headers["set-cookie"].lower()
    assert "beyou_session=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "secure" not in cookie


def test_invalid_and_disabled_login_responses_are_generic_or_safe(
    db: OrmSession,
    client: TestClient,
) -> None:
    active = _user(db, email="active-login@example.test", role=UserRole.STUDENT.value, full_name="Active")
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
    assert invalid_response.json()["detail"] == "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập."
    assert disabled_response.status_code == 403
    assert "tạm khóa" in disabled_response.json()["detail"]


def test_production_pilot_blocks_demo_user_login_without_session(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RUNTIME_MODE", "production_pilot")
    monkeypatch.setenv("ALLOW_DEMO_LOGIN", "false")
    get_settings.cache_clear()
    demo_user = _user(db, email="pilot-demo-login@example.test", role=UserRole.ADMIN.value, full_name="Pilot Demo")
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
    demo_user = _user(db, email="disabled-demo-login@example.test", role=UserRole.STUDENT.value, full_name="Demo Disabled")
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
        response = _login(pilot_client, pilot_user.email, headers={"Origin": "https://pilot.example"})

    assert response.status_code == 200
    assert "set-cookie" in response.headers
    sessions = db.scalars(select(UserSession).where(UserSession.user_id == pilot_user.id)).all()
    assert len(sessions) == 1
    assert sessions[0].is_demo is False
    get_settings.cache_clear()


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
    user = _user(db, email="limited-login@example.test", role=UserRole.STUDENT.value, full_name="Limited")
    reset_login_failures(user.email, "testclient")

    for _ in range(LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        response = _login(client, user.email, password="wrong")
        assert response.status_code == 401

    limited_response = _login(client, user.email, password="wrong")

    assert limited_response.status_code == 429
    assert limited_response.json()["detail"] == "Quá nhiều lần đăng nhập chưa thành công. Hãy thử lại sau ít phút."


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
    assert db.scalar(select(AuditEvent).where(AuditEvent.action == "privacy_acknowledged")) is not None


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
    teacher = _user(db, email="teacher-portal@example.test", role=UserRole.TEACHER.value, full_name="Teacher")
    parent = _user(db, email="parent-portal@example.test", role=UserRole.PARENT.value, full_name="Parent")
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
