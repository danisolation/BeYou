from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import SchoolPrivacyPolicyDefault, StudentNotificationPreference, User, UserRole
from app.schemas.privacy_controls import (
    ALLOWED_REASON_CODES,
    DEFERRED_CHANNELS,
    IN_APP_CHANNEL,
    ChannelBoundary,
    SchoolPrivacyPolicyDefaultsResponse,
    StudentNotificationPreferenceResponse,
    normalize_channels,
    normalize_reason_codes,
)
from app.services.audit import record_audit_event

CHANNEL_LABELS = {
    "in_app": "Trong ứng dụng",
    "email": "Email",
    "sms": "SMS",
    "zalo": "Zalo",
    "push": "Thông báo thiết bị",
}


def channel_boundaries(allowed_channels: list[str]) -> list[ChannelBoundary]:
    active_channels = set(normalize_channels(allowed_channels))
    boundaries = [
        ChannelBoundary(
            key=IN_APP_CHANNEL,
            label=CHANNEL_LABELS[IN_APP_CHANNEL],
            enabled=IN_APP_CHANNEL in active_channels,
            available=True,
            status="active",
        )
    ]
    boundaries.extend(
        ChannelBoundary(
            key=channel,
            label=CHANNEL_LABELS[channel],
            enabled=False,
            available=False,
            status="deferred",
        )
        for channel in sorted(DEFERRED_CHANNELS)
    )
    return boundaries


def validate_v14_channels(allowed_channels: list[str], *, external_channels_enabled: bool = False) -> list[str]:
    if external_channels_enabled:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Kênh nhắc nhở ngoài ứng dụng chưa nằm trong phạm vi v1.4.",
        )
    try:
        return normalize_channels(allowed_channels)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc


def validate_access_reason_code(reason_code: str) -> str:
    normalized = reason_code.strip().lower()
    if normalized not in ALLOWED_REASON_CODES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Lý do truy cập không hợp lệ.")
    return normalized


def get_or_create_school_privacy_policy(
    db: OrmSession,
    *,
    actor: User | None = None,
    school_scope: str = "default",
    is_demo: bool = False,
) -> SchoolPrivacyPolicyDefault:
    policy = db.scalar(
        select(SchoolPrivacyPolicyDefault).where(SchoolPrivacyPolicyDefault.school_scope == school_scope)
    )
    if policy is not None:
        return policy

    policy = SchoolPrivacyPolicyDefault(
        school_scope=school_scope,
        default_in_app_reminders_enabled=False,
        default_quiet_hours_start="21:30",
        default_quiet_hours_end="06:30",
        default_timezone="Asia/Ho_Chi_Minh",
        allowed_channels=[IN_APP_CHANNEL],
        external_channels_enabled=False,
        note_sharing_enabled=True,
        reason_required_for_adult_summaries=True,
        reason_required_for_shared_mood_notes=True,
        allowed_reason_codes=sorted(ALLOWED_REASON_CODES),
        updated_by_id=actor.id if actor is not None else None,
        is_demo=is_demo,
    )
    db.add(policy)
    db.flush()
    return policy


def get_or_create_student_notification_preference(
    db: OrmSession,
    *,
    student: User,
) -> StudentNotificationPreference:
    require_permission(
        db,
        student,
        resource_type="notification_preferences",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = db.scalar(
        select(StudentNotificationPreference).where(StudentNotificationPreference.student_id == student.id)
    )
    if preference is not None:
        return preference

    preference = StudentNotificationPreference(
        student_id=student.id,
        in_app_reminders_enabled=False,
        mood_checkin_reminders_enabled=False,
        reminder_cadence="weekly",
        allowed_channels=[IN_APP_CHANNEL],
        timezone="Asia/Ho_Chi_Minh",
        is_demo=student.is_demo,
    )
    db.add(preference)
    db.flush()
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="notification_preferences_initialized",
        resource_type="notification_preferences",
        resource_id=str(preference.id),
        status_value="success",
        reason="student_consent_control",
        metadata_summary={
            "enabled": False,
            "allowed_channel_count": 1,
            "external_channels_enabled": False,
            "decision": "student_consent_default_off",
        },
        is_demo=student.is_demo,
    )
    return preference


def school_policy_response(policy: SchoolPrivacyPolicyDefault) -> SchoolPrivacyPolicyDefaultsResponse:
    return SchoolPrivacyPolicyDefaultsResponse(
        id=str(policy.id),
        school_scope=policy.school_scope,
        default_in_app_reminders_enabled=policy.default_in_app_reminders_enabled,
        default_quiet_hours_start=policy.default_quiet_hours_start,
        default_quiet_hours_end=policy.default_quiet_hours_end,
        default_timezone=policy.default_timezone,
        allowed_channels=validate_v14_channels(
            policy.allowed_channels,
            external_channels_enabled=policy.external_channels_enabled,
        ),
        external_channels_enabled=policy.external_channels_enabled,
        note_sharing_enabled=policy.note_sharing_enabled,
        reason_required_for_adult_summaries=policy.reason_required_for_adult_summaries,
        reason_required_for_shared_mood_notes=policy.reason_required_for_shared_mood_notes,
        allowed_reason_codes=normalize_reason_codes(policy.allowed_reason_codes),
        channel_boundaries=channel_boundaries(policy.allowed_channels),
        updated_at=policy.updated_at,
        is_demo=policy.is_demo,
    )


def preference_response(preference: StudentNotificationPreference) -> StudentNotificationPreferenceResponse:
    return StudentNotificationPreferenceResponse(
        id=str(preference.id),
        student_id=str(preference.student_id),
        in_app_reminders_enabled=preference.in_app_reminders_enabled,
        mood_checkin_reminders_enabled=preference.mood_checkin_reminders_enabled,
        reminder_cadence=preference.reminder_cadence,
        allowed_channels=validate_v14_channels(preference.allowed_channels),
        consent_version=preference.consent_version,
        consented_at=preference.consented_at,
        quiet_hours_start=preference.quiet_hours_start,
        quiet_hours_end=preference.quiet_hours_end,
        timezone=preference.timezone,
        paused_until=preference.paused_until,
        pause_reason_code=preference.pause_reason_code,
        channel_boundaries=channel_boundaries(preference.allowed_channels),
        updated_at=preference.updated_at,
        is_demo=preference.is_demo,
    )


def assert_admin_can_manage_privacy_policy(db: OrmSession, actor: User) -> None:
    require_permission(
        db,
        actor,
        resource_type="privacy_policy",
        action="manage",
        purpose="admin_operations",
    )
    if actor.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")
