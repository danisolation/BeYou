from __future__ import annotations

import pytest
from sqlalchemy import delete
from sqlalchemy.orm import Session as OrmSession

from app.db.models import Session as UserSession
from app.db.models import StudentAdultLink, User, UserRole
from app.db.session import SessionLocal

from phase36_hot_path_utils import (
    assert_aggregate_only_text,
    login_client,
    make_user,
    measure_queries,
    seed_student_link,
)


def _clean_database() -> None:
    with SessionLocal() as db:
        db.execute(delete(UserSession))
        db.execute(delete(StudentAdultLink))
        db.execute(delete(User))
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


def test_admin_users_are_bounded_by_default_and_max_limit(db: OrmSession) -> None:
    admin = make_user(db, "phase36-admin-users@example.test", UserRole.ADMIN, "Phase 36 Admin")
    for index in range(230):
        make_user(
            db,
            f"phase36-student-{index:03d}@example.test",
            UserRole.STUDENT,
            f"Phase 36 Student {index:03d}",
            school="THPT Phase 36",
            class_name="10A1",
        )
    db.commit()

    admin_client = login_client(admin.email)

    default_response = admin_client.get("/api/admin/users")
    max_response = admin_client.get("/api/admin/users?limit=200")
    over_limit_response = admin_client.get("/api/admin/users?limit=201")

    assert default_response.status_code == 200
    assert len(default_response.json()) == 100
    assert max_response.status_code == 200
    assert len(max_response.json()) == 200
    assert over_limit_response.status_code == 422


def test_admin_links_are_bounded_and_join_hydrated(db: OrmSession) -> None:
    admin = make_user(db, "phase36-admin-links@example.test", UserRole.ADMIN, "Phase 36 Admin")
    for index in range(35):
        student = make_user(
            db,
            f"phase36-link-student-{index:03d}@example.test",
            UserRole.STUDENT,
            f"Phase 36 Link Student {index:03d}",
            school="THPT Phase 36",
            class_name="10A1",
        )
        teacher = make_user(
            db,
            f"phase36-link-teacher-{index:03d}@example.test",
            UserRole.TEACHER,
            f"Phase 36 Link Teacher {index:03d}",
        )
        seed_student_link(db, student, teacher, created_by=admin)
    db.commit()

    admin_client = login_client(admin.email)

    response, query_count = measure_queries(lambda: admin_client.get("/api/admin/links?limit=35"))

    assert response.status_code == 200
    assert len(response.json()) == 35
    response_text = response.text
    assert "password" not in response_text
    assert "password_hash" not in response_text
    assert "private_note" not in response_text
    assert "access_token" not in response_text
    assert_aggregate_only_text(response_text)
    assert query_count <= 8


def test_admin_list_authorization_and_redlines_remain_intact(db: OrmSession) -> None:
    admin = make_user(db, "phase36-admin-auth@example.test", UserRole.ADMIN, "Phase 36 Admin")
    student = make_user(
        db,
        "phase36-student-auth@example.test",
        UserRole.STUDENT,
        "Phase 36 Student",
        school="THPT Phase 36",
        class_name="10A1",
    )
    db.commit()

    admin_client = login_client(admin.email)
    student_client = login_client(student.email)

    users_response = admin_client.get("/api/admin/users")
    links_response = admin_client.get("/api/admin/links")
    assert users_response.status_code == 200
    assert links_response.status_code == 200
    assert "password_hash" not in users_response.text
    assert "access_token" not in links_response.text

    assert student_client.get("/api/admin/users").status_code == 403
    assert student_client.get("/api/admin/links").status_code == 403
