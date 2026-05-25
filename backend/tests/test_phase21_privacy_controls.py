import uuid

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    LinkStatus,
    MoodCheckinReminderState,
    MoodNoteShare,
    RelationshipType,
    SchoolPrivacyPolicyDefault,
    Session as UserSession,
    SosAlert,
    StudentAdultLink,
    StudentNotificationPreference,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.schemas.privacy_controls import StudentNotificationPreferenceContract
from app.services.audit import record_audit_event
from app.services.privacy_controls import (
    channel_boundaries,
    get_or_create_school_privacy_policy,
    get_or_create_student_notification_preference,
    preference_response,
    school_policy_response,
    validate_access_reason_code,
    validate_v14_channels,
)


def _clean_database() -> None:
    with SessionLocal() as db:
        db.execute(delete(MoodNoteShare))
        db.execute(delete(SosAlert))
        db.execute(delete(MoodCheckinReminderState))
        db.execute(delete(StudentNotificationPreference))
        db.execute(delete(SchoolPrivacyPolicyDefault))
        db.execute(delete(AuditEvent).where(AuditEvent.actor_role.in_([UserRole.STUDENT.value, UserRole.ADMIN.value])))
        db.execute(delete(StudentAdultLink))
        db.execute(delete(UserSession))
        db.execute(delete(User).where(User.email.like("%phase21%@example.test")))
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


def _user(db: OrmSession, *, email: str, role: str) -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Phase21",
        school="THPT Phase21" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _sos_signal(db: OrmSession, student: User) -> None:
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


def test_v14_policy_and_preference_contracts_default_to_in_app_only(db: OrmSession) -> None:
    student = _user(db, email=f"student-phase21-{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)

    policy = get_or_create_school_privacy_policy(db, school_scope="phase21", is_demo=True)
    preference = get_or_create_student_notification_preference(db, student=student)
    db.commit()
    db.refresh(policy)
    db.refresh(preference)

    policy_payload = school_policy_response(policy)
    preference_payload = preference_response(preference)

    assert policy_payload.default_in_app_reminders_enabled is False
    assert policy_payload.external_channels_enabled is False
    assert policy_payload.allowed_channels == ["in_app"]
    assert preference_payload.in_app_reminders_enabled is False
    assert preference_payload.mood_checkin_reminders_enabled is False
    assert preference_payload.allowed_channels == ["in_app"]
    assert {boundary.key: boundary.status for boundary in channel_boundaries(["in_app"])} == {
        "in_app": "active",
        "email": "deferred",
        "push": "deferred",
        "sms": "deferred",
        "zalo": "deferred",
    }

    with pytest.raises(HTTPException):
        validate_v14_channels(["in_app", "sms"])
    with pytest.raises(ValidationError):
        StudentNotificationPreferenceContract(allowed_channels=["zalo"])


def test_v14_authorization_resources_are_explicit_and_relationship_bound(db: OrmSession) -> None:
    student = _user(db, email=f"student-phase21-auth-{uuid.uuid4()}@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email=f"teacher-phase21-auth-{uuid.uuid4()}@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email=f"parent-phase21-auth-{uuid.uuid4()}@example.test", role=UserRole.PARENT.value)
    admin = _user(db, email=f"admin-phase21-auth-{uuid.uuid4()}@example.test", role=UserRole.ADMIN.value)
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type=RelationshipType.TEACHER.value,
            status=LinkStatus.ACTIVE.value,
            created_by=admin.id,
            is_demo=True,
        )
    )
    db.commit()
    _sos_signal(db, student)

    require_permission(
        db,
        student,
        resource_type="notification_preferences",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    require_permission(
        db,
        student,
        resource_type="mood_checkin_reminder",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    require_permission(
        db,
        teacher,
        resource_type="shared_mood_note",
        action="read",
        purpose="support_not_surveillance",
        student_id=student.id,
    )
    require_permission(
        db,
        admin,
        resource_type="privacy_policy",
        action="manage",
        purpose="admin_operations",
    )

    with pytest.raises(HTTPException):
        require_permission(
            db,
            parent,
            resource_type="shared_mood_note",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )
    with pytest.raises(HTTPException):
        require_permission(
            db,
            student,
            resource_type="privacy_policy",
            action="manage",
            purpose="admin_operations",
        )


def test_v14_audit_rejects_new_sensitive_metadata_keys(db: OrmSession) -> None:
    actor = _user(db, email=f"admin-phase21-audit-{uuid.uuid4()}@example.test", role=UserRole.ADMIN.value)

    for forbidden_key in ("shared_note_text", "student_summary", "reason_detail", "notification_body"):
        with pytest.raises(HTTPException):
            record_audit_event(
                db,
                actor=actor,
                actor_role=actor.role,
                action="v1_4_privacy_contract_checked",
                resource_type="privacy_policy",
                resource_id="phase21",
                status_value="denied",
                metadata_summary={"nested": {forbidden_key: "RAW_PRIVATE_CONTENT"}},
                is_demo=True,
            )

    event = record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="v1_4_privacy_contract_checked",
        resource_type="privacy_policy",
        resource_id="phase21",
        status_value="success",
        reason=validate_access_reason_code("routine_care_conversation"),
        metadata_summary={
            "allowed_channel_count": 1,
            "external_channels_enabled": False,
            "reason_code_count": 5,
        },
        is_demo=True,
    )
    db.commit()

    saved = db.scalar(select(AuditEvent).where(AuditEvent.id == event.id))
    assert saved is not None
    assert saved.reason == "routine_care_conversation"
    assert "RAW_PRIVATE_CONTENT" not in str(saved.metadata_summary)
