import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
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
from app.main import app

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


def _user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str,
    status: str = AccountStatus.ACTIVE.value,
    is_demo: bool = False,
    school: str | None = "THPT Demo",
    class_name: str | None = "10A1",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
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


def _login(email: str) -> TestClient:
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200
    return client


def test_admin_user_management(db: OrmSession) -> None:
    admin = _user(
        db,
        email="admin-users@example.test",
        role=UserRole.ADMIN.value,
        full_name="Admin",
        school=None,
        class_name=None,
    )
    student = _user(
        db,
        email="student-users@example.test",
        role=UserRole.STUDENT.value,
        full_name="Student",
    )
    admin_client = _login(admin.email)
    student_client = _login(student.email)

    assert student_client.get("/api/admin/users").status_code == 403

    create_response = admin_client.post(
        "/api/admin/users",
        json={
            "email": "created-student@example.test",
            "password": "Secret123!",
            "role": "student",
            "full_name": "Created Student",
            "school": "THPT Demo",
            "class_name": "11A2",
            "status": "active",
            "is_demo": False,
        },
        headers=ORIGIN_HEADERS,
    )
    assert create_response.status_code == 201
    assert "password" not in create_response.text
    created_user_id = create_response.json()["id"]

    role_change_response = admin_client.patch(
        f"/api/admin/users/{created_user_id}",
        json={"role": "teacher", "school": None, "class_name": None},
        headers=ORIGIN_HEADERS,
    )
    disable_response = admin_client.patch(
        f"/api/admin/users/{created_user_id}",
        json={"status": "disabled"},
        headers=ORIGIN_HEADERS,
    )
    delete_real_response = admin_client.delete(
        f"/api/admin/users/{created_user_id}",
        headers=ORIGIN_HEADERS,
    )

    db.expire_all()
    deleted_real_user = db.get(User, created_user_id)
    assert role_change_response.status_code == 200
    assert disable_response.status_code == 200
    assert delete_real_response.status_code == 200
    assert deleted_real_user is not None
    assert deleted_real_user.status == AccountStatus.DELETED.value

    demo_response = admin_client.post(
        "/api/admin/users",
        json={
            "email": "demo-delete@example.test",
            "password": "Secret123!",
            "role": "parent",
            "full_name": "Demo Delete",
            "status": "active",
            "is_demo": True,
        },
        headers=ORIGIN_HEADERS,
    )
    demo_user_id = demo_response.json()["id"]
    demo_delete_response = admin_client.delete(
        f"/api/admin/users/{demo_user_id}",
        headers=ORIGIN_HEADERS,
    )
    db.expire_all()

    assert demo_delete_response.status_code == 204
    assert db.get(User, demo_user_id) is None
    assert db.scalar(select(AuditEvent).where(AuditEvent.action == "role_changed")) is not None
    assert (
        db.scalar(
            select(func.count())
            .select_from(AuditEvent)
            .where(AuditEvent.action == "account_status_changed")
        )
        >= 3
    )

    before_count = db.scalar(select(func.count()).select_from(User))
    cross_site_response = admin_client.post(
        "/api/admin/users",
        json={
            "email": "csrf-admin-user@example.test",
            "password": "Secret123!",
            "role": "teacher",
            "full_name": "CSRF User",
        },
        headers={"Origin": "http://evil.example", "Sec-Fetch-Site": "cross-site"},
    )
    after_count = db.scalar(select(func.count()).select_from(User))
    assert cross_site_response.status_code == 403
    assert after_count == before_count


def test_admin_link_management(db: OrmSession) -> None:
    admin = _user(
        db,
        email="admin-links@example.test",
        role=UserRole.ADMIN.value,
        full_name="Admin",
        school=None,
        class_name=None,
    )
    student = _user(
        db,
        email="student-links@example.test",
        role=UserRole.STUDENT.value,
        full_name="Student",
    )
    teacher = _user(
        db,
        email="teacher-links@example.test",
        role=UserRole.TEACHER.value,
        full_name="Teacher",
        school=None,
        class_name=None,
    )
    parent = _user(
        db,
        email="parent-links@example.test",
        role=UserRole.PARENT.value,
        full_name="Parent",
        school=None,
        class_name=None,
    )
    admin_client = _login(admin.email)

    create_response = admin_client.post(
        "/api/admin/links",
        json={
            "student_id": str(student.id),
            "adult_id": str(teacher.id),
            "relationship_type": "teacher",
        },
        headers=ORIGIN_HEADERS,
    )
    invalid_pair_response = admin_client.post(
        "/api/admin/links",
        json={
            "student_id": str(student.id),
            "adult_id": str(parent.id),
            "relationship_type": "teacher",
        },
        headers=ORIGIN_HEADERS,
    )
    invalid_relationship_response = admin_client.post(
        "/api/admin/links",
        json={
            "student_id": str(student.id),
            "adult_id": str(parent.id),
            "relationship_type": "mentor",
        },
        headers=ORIGIN_HEADERS,
    )

    assert create_response.status_code == 201
    assert invalid_pair_response.status_code == 400
    assert invalid_relationship_response.status_code == 422

    link_id = create_response.json()["id"]
    revoke_response = admin_client.patch(
        f"/api/admin/links/{link_id}",
        json={"status": "revoked"},
        headers=ORIGIN_HEADERS,
    )

    db.expire_all()
    revoked_link = db.get(StudentAdultLink, link_id)
    assert revoke_response.status_code == 200
    assert revoked_link is not None
    assert revoked_link.status == LinkStatus.REVOKED.value
    assert revoked_link.revoked_by == admin.id
    assert db.scalar(select(AuditEvent).where(AuditEvent.action == "student_adult_link_created")) is not None
    assert db.scalar(select(AuditEvent).where(AuditEvent.action == "student_adult_link_revoked")) is not None

    before_count = db.scalar(select(func.count()).select_from(StudentAdultLink))
    cross_site_response = admin_client.post(
        "/api/admin/links",
        json={
            "student_id": str(student.id),
            "adult_id": str(parent.id),
            "relationship_type": "parent",
        },
        headers={"Origin": "http://evil.example", "Sec-Fetch-Site": "cross-site"},
    )
    after_count = db.scalar(select(func.count()).select_from(StudentAdultLink))
    assert cross_site_response.status_code == 403
    assert after_count == before_count
