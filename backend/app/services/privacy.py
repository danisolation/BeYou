from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import PrivacyAcknowledgement, User
from app.services.audit import record_audit_event

NOTICE_VERSION = "2026-05-20"


def get_current_privacy_acknowledgement(
    db: OrmSession,
    user: User,
) -> PrivacyAcknowledgement | None:
    return db.scalar(
        select(PrivacyAcknowledgement).where(
            PrivacyAcknowledgement.user_id == user.id,
            PrivacyAcknowledgement.notice_version == NOTICE_VERSION,
        )
    )


def privacy_acknowledgement_required(db: OrmSession, user: User) -> bool:
    return user.role == "student" and get_current_privacy_acknowledgement(db, user) is None


def acknowledge_privacy_notice(db: OrmSession, user: User) -> PrivacyAcknowledgement:
    acknowledgement = get_current_privacy_acknowledgement(db, user)
    if acknowledgement is None:
        acknowledgement = PrivacyAcknowledgement(
            user_id=user.id,
            notice_version=NOTICE_VERSION,
            is_demo=user.is_demo,
        )
        db.add(acknowledgement)
        db.flush()

    record_audit_event(
        db,
        actor=user,
        actor_role=user.role,
        action="privacy_acknowledged",
        resource_type="privacy_notice",
        resource_id=NOTICE_VERSION,
        status_value="success",
        metadata_summary={
            "notice_version": NOTICE_VERSION,
            "user_id": str(user.id),
            "is_demo": user.is_demo,
        },
        is_demo=user.is_demo,
    )
    db.commit()
    db.refresh(acknowledgement)
    return acknowledgement
