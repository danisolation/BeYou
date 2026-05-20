import pytest
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.db.models import (
    AuditEvent,
    LinkStatus,
    PrivacyAcknowledgement,
    Session as UserSession,
    StudentAdultLink,
    User,
)
from app.db.session import SessionLocal
from app.seeds.demo_seed import (
    DEMO_ADMIN_EMAIL,
    DEMO_PARENT_EMAIL,
    DEMO_STUDENT_EMAIL,
    DEMO_TEACHER_EMAIL,
    seed_demo_data,
)


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (AuditEvent, StudentAdultLink, PrivacyAcknowledgement, UserSession, User):
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


def test_demo_seed_refuses_when_disabled(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "false")
    get_settings.cache_clear()

    assert seed_demo_data(db, get_settings()) is False
    assert db.scalars(select(User)).all() == []
    get_settings.cache_clear()


def test_demo_seed_creates_idempotent_demo_users_and_links(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "true")
    get_settings.cache_clear()
    settings = get_settings()

    assert seed_demo_data(db, settings) is True
    assert seed_demo_data(db, settings) is True

    users = {user.email: user for user in db.scalars(select(User)).all()}
    assert set(users) == {
        DEMO_STUDENT_EMAIL,
        DEMO_TEACHER_EMAIL,
        DEMO_PARENT_EMAIL,
        DEMO_ADMIN_EMAIL,
    }
    assert all(user.is_demo is True for user in users.values())
    assert users[DEMO_STUDENT_EMAIL].school == "Trường THPT BeYou Demo"
    assert users[DEMO_STUDENT_EMAIL].class_name == "10A1"

    links = db.scalars(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == users[DEMO_STUDENT_EMAIL].id,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    ).all()
    assert len(links) == 2
    assert {link.relationship_type for link in links} == {"teacher", "parent"}
    assert all(link.is_demo is True for link in links)
    get_settings.cache_clear()
