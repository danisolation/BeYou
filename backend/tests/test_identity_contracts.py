import re
import uuid

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import AccountStatus, ExternalIdentity, ExternalIdentityStatus, Session as UserSession, User, UserRole
from app.db.session import SessionLocal
from app.services.external_identity import hash_external_subject, resolve_external_identity


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            UserSession,
            ExternalIdentity,
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
    role: str = UserRole.STUDENT.value,
    status: str = AccountStatus.ACTIVE.value,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=role,
        status=status,
        full_name="Identity Contract User",
        school="THPT Demo",
        class_name="10A1",
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _identity(
    db: OrmSession,
    *,
    provider_key: str = "pilot_sso",
    subject: str,
    status: str,
    linked_user: User | None = None,
) -> ExternalIdentity:
    identity = ExternalIdentity(
        provider_key=provider_key.strip().lower(),
        provider_subject_hash=hash_external_subject(provider_key, subject),
        status=status,
        linked_user_id=linked_user.id if linked_user else None,
        provider_label="Pilot SSO",
        display_label="safe-review-label",
        is_demo=True,
    )
    db.add(identity)
    db.commit()
    db.refresh(identity)
    return identity


def _user_count(db: OrmSession) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


def test_hash_external_subject_returns_sha256_hex_without_raw_subject() -> None:
    digest = hash_external_subject("pilot_sso", "Subject-123")

    assert digest != "Subject-123"
    assert re.fullmatch(r"[0-9a-f]{64}", digest)
    assert digest == hash_external_subject(" PILOT_SSO ", "Subject-123")


def test_unknown_identity_returns_unknown_identity_without_creating_user(db: OrmSession) -> None:
    before_count = _user_count(db)

    resolution = resolve_external_identity(db, "pilot_sso", "unknown-subject")

    assert resolution.status == "unknown_identity"
    assert resolution.identity is None
    assert resolution.user is None
    assert _user_count(db) == before_count


def test_pending_review_identity_returns_pending_review_without_creating_user(db: OrmSession) -> None:
    before_count = _user_count(db)
    identity = _identity(
        db,
        subject="pending-subject",
        status=ExternalIdentityStatus.PENDING_REVIEW.value,
    )

    resolution = resolve_external_identity(db, "pilot_sso", "pending-subject")

    assert resolution.status == "pending_review"
    assert resolution.identity == identity
    assert resolution.user is None
    assert _user_count(db) == before_count


@pytest.mark.parametrize(
    ("identity_status", "expected_status"),
    [
        (ExternalIdentityStatus.DISABLED.value, "disabled_identity"),
        (ExternalIdentityStatus.DEPROVISIONED.value, "deprovisioned_identity"),
    ],
)
def test_disabled_and_deprovisioned_identities_return_safe_status(
    db: OrmSession,
    identity_status: str,
    expected_status: str,
) -> None:
    user = _user(db, email=f"{uuid.uuid4()}@example.test")
    identity = _identity(db, subject=f"{identity_status}-subject", status=identity_status, linked_user=user)

    resolution = resolve_external_identity(db, "pilot_sso", f"{identity_status}-subject")

    assert resolution.status == expected_status
    assert resolution.identity == identity
    assert resolution.user is None


def test_linked_inactive_user_returns_linked_user_inactive(db: OrmSession) -> None:
    user = _user(db, email="inactive-linked@example.test", status=AccountStatus.DISABLED.value)
    identity = _identity(
        db,
        subject="inactive-linked-subject",
        status=ExternalIdentityStatus.LINKED.value,
        linked_user=user,
    )

    resolution = resolve_external_identity(db, "pilot_sso", "inactive-linked-subject")

    assert resolution.status == "linked_user_inactive"
    assert resolution.identity == identity
    assert resolution.user == user


def test_linked_active_user_returns_linked_active_user(db: OrmSession) -> None:
    user = _user(db, email="active-linked@example.test", status=AccountStatus.ACTIVE.value)
    identity = _identity(
        db,
        subject="active-linked-subject",
        status=ExternalIdentityStatus.LINKED.value,
        linked_user=user,
    )

    resolution = resolve_external_identity(db, " PILOT_SSO ", "active-linked-subject")

    assert resolution.status == "linked_active_user"
    assert resolution.identity == identity
    assert resolution.user == user
