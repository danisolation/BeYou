import uuid

import pytest
from fastapi import Response
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.core.sessions import set_session_cookie
from app.db.models import (
    AccountStatus,
    AuditEvent,
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
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.seeds.demo_seed import DEMO_STUDENT_EMAIL, seed_demo_data
from app.services.audit import record_audit_event

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN}


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
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
    full_name: str = "Demo User",
    is_demo: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=full_name,
        school="THPT Demo" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str, password: str = "secret123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
        headers=ORIGIN_HEADERS,
    )


def test_invalid_login_is_generic(db: OrmSession, client: TestClient) -> None:
    existing_user = _user(db, email=f"{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)

    existing_response = _login(client, existing_user.email, password="wrong")
    missing_response = _login(client, f"{uuid.uuid4()}@example.test", password="wrong")

    assert existing_response.status_code == 401
    assert missing_response.status_code == 401
    assert existing_response.json() == missing_response.json()


def test_no_session_cookie_value_in_json(db: OrmSession, client: TestClient) -> None:
    user = _user(db, email=f"{uuid.uuid4()}@example.test", role=UserRole.TEACHER.value)

    response = _login(client, user.email)

    assert response.status_code == 200
    body = response.json()
    assert "token" not in body
    assert "session" not in body
    assert "cookie" not in body
    assert "beyou_session" in response.headers["set-cookie"]


def test_session_cookie_prefix_rules(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    dev_settings = get_settings()
    dev_response = Response()
    set_session_cookie(dev_response, "dev-token", dev_settings)
    dev_cookie = dev_response.headers["set-cookie"].lower()
    assert "beyou_session=" in dev_cookie
    assert "httponly" in dev_cookie
    assert "samesite=lax" in dev_cookie
    assert "path=/" in dev_cookie
    assert "secure" not in dev_cookie

    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "__Host-beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    with pytest.raises(ValueError):
        get_settings()

    get_settings.cache_clear()
    monkeypatch.setenv("SESSION_COOKIE_NAME", "__Host-beyou_session")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "true")
    prod_settings = get_settings()
    prod_response = Response()
    set_session_cookie(prod_response, "prod-token", prod_settings)
    prod_cookie = prod_response.headers["set-cookie"].lower()
    assert "__host-beyou_session=" in prod_cookie
    assert "secure" in prod_cookie
    assert "httponly" in prod_cookie
    assert "samesite=lax" in prod_cookie
    assert "path=/" in prod_cookie
    assert "domain=" not in prod_cookie
    get_settings.cache_clear()


def test_cross_site_mutation_rejected(db: OrmSession, client: TestClient) -> None:
    admin = _user(db, email=f"admin-{uuid.uuid4()}@example.test", role=UserRole.ADMIN.value)
    student = _user(db, email=f"student-{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)
    admin_client = TestClient(app)
    student_client = TestClient(app)
    assert _login(admin_client, admin.email).status_code == 200
    assert _login(student_client, student.email).status_code == 200

    cross_site_response = admin_client.post(
        "/api/admin/users",
        json={
            "email": f"csrf-{uuid.uuid4()}@example.test",
            "password": "Secret123!",
            "role": "teacher",
            "full_name": "CSRF User",
        },
        headers={"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "cross-site"},
    )
    non_admin_response = student_client.post(
        "/api/admin/users",
        json={
            "email": f"non-admin-{uuid.uuid4()}@example.test",
            "password": "Secret123!",
            "role": "teacher",
            "full_name": "Non Admin",
        },
        headers=ORIGIN_HEADERS,
    )

    assert cross_site_response.status_code == 403
    assert non_admin_response.status_code == 403


def test_unlinked_adult_student_access_denied(db: OrmSession) -> None:
    linked_student = _user(db, email=f"linked-{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)
    unlinked_student = _user(db, email=f"unlinked-{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email=f"teacher-{uuid.uuid4()}@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email=f"parent-{uuid.uuid4()}@example.test", role=UserRole.PARENT.value)
    db.add_all(
        [
            StudentAdultLink(
                student_id=linked_student.id,
                adult_id=teacher.id,
                relationship_type=UserRole.TEACHER.value,
                status=LinkStatus.ACTIVE.value,
                created_by=teacher.id,
                is_demo=True,
            ),
            StudentAdultLink(
                student_id=linked_student.id,
                adult_id=parent.id,
                relationship_type=UserRole.PARENT.value,
                status=LinkStatus.ACTIVE.value,
                created_by=parent.id,
                is_demo=True,
            ),
        ]
    )
    db.commit()

    teacher_client = TestClient(app)
    parent_client = TestClient(app)
    assert _login(teacher_client, teacher.email).status_code == 200
    assert _login(parent_client, parent.email).status_code == 200

    teacher_body = teacher_client.get("/api/teacher/students").json()
    parent_body = parent_client.get("/api/parent/students").json()
    assert linked_student.email in str(teacher_body)
    assert linked_student.email in str(parent_body)
    assert unlinked_student.email not in str(teacher_body)
    assert unlinked_student.email not in str(parent_body)


def test_audit_rejects_forbidden_keys(db: OrmSession) -> None:
    actor = _user(db, email=f"admin-audit-{uuid.uuid4()}@example.test", role=UserRole.ADMIN.value)
    forbidden_keys = [
        "password",
        "token",
        "session_cookie",
        "api_key",
        "raw_chat_content",
        "raw_self_check_answers",
        "self_check_raw_answers",
    ]

    for forbidden_key in forbidden_keys:
        with pytest.raises(Exception):
            record_audit_event(
                db,
                actor=actor,
                actor_role=actor.role,
                action="sensitive_resource_read",
                resource_type="student_profile",
                resource_id=str(actor.id),
                status_value="denied",
                metadata_summary={forbidden_key: "secret"},
                is_demo=True,
            )


def test_demo_flags_preserved(
    db: OrmSession,
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "true")
    get_settings.cache_clear()
    assert seed_demo_data(db, get_settings()) is True

    student = db.scalar(select(User).where(User.email == DEMO_STUDENT_EMAIL))
    assert student is not None
    assert student.is_demo is True
    assert db.scalar(select(StudentAdultLink).where(StudentAdultLink.is_demo.is_(True))) is not None

    response = client.post(
        "/api/auth/login",
        json={"email": DEMO_STUDENT_EMAIL, "password": "BeYouDemo!2026"},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200
    assert response.json()["is_demo"] is True
    assert db.scalar(select(UserSession).where(UserSession.user_id == student.id)).is_demo is True
    get_settings.cache_clear()
