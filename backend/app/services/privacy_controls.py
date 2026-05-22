from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import (
    MoodCheckIn,
    MoodCheckinReminderState,
    SchoolPrivacyPolicyDefault,
    StudentNotificationPreference,
    User,
    UserRole,
    utc_now,
)
from app.schemas.privacy_controls import (
    ALLOWED_REASON_CODES,
    DEFERRED_CHANNELS,
    IN_APP_CHANNEL,
    ChannelBoundary,
    MoodCheckInReminderResponse,
    MoodReminderActionResponse,
    MoodReminderSnoozeRequest,
    SchoolPrivacyPolicyDefaultsResponse,
    StudentNotificationPreferenceUpdate,
    StudentNotificationPreferenceResponse,
    normalize_channels,
    normalize_reason_codes,
)
from app.services.audit import record_audit_event

REMINDER_HREF = "/student/mood-check-ins"
REMINDER_TITLE = "Nhắc nhẹ: em muốn check-in cảm xúc không?"
REMINDER_BODY = (
    "Nếu em muốn, hãy dành một phút lắng nghe bản thân. Nhắc nhở này chỉ hiện trong BeYou, "
    "không gửi cho người lớn và không tự tạo SOS."
)
CONSENT_VERSION = "v1.4-in-app-mood-reminders"

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


def update_student_notification_preference(
    db: OrmSession,
    *,
    student: User,
    payload: StudentNotificationPreferenceUpdate,
) -> StudentNotificationPreferenceResponse:
    require_permission(
        db,
        student,
        resource_type="notification_preferences",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = get_or_create_student_notification_preference(db, student=student)
    allowed_channels = validate_v14_channels(payload.allowed_channels)
    enabled = payload.in_app_reminders_enabled and payload.mood_checkin_reminders_enabled
    if enabled and preference.consented_at is None:
        preference.consented_at = utc_now()
        preference.consent_version = CONSENT_VERSION
    if not enabled:
        preference.paused_until = None
        preference.pause_reason_code = None
    else:
        preference.paused_until = payload.paused_until
        preference.pause_reason_code = payload.pause_reason_code

    preference.in_app_reminders_enabled = payload.in_app_reminders_enabled
    preference.mood_checkin_reminders_enabled = payload.mood_checkin_reminders_enabled
    preference.reminder_cadence = payload.reminder_cadence
    preference.allowed_channels = allowed_channels
    preference.quiet_hours_start = payload.quiet_hours_start
    preference.quiet_hours_end = payload.quiet_hours_end
    preference.timezone = payload.timezone
    preference.updated_at = utc_now()

    db.flush()
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="notification_preferences_updated",
        resource_type="notification_preferences",
        resource_id=str(preference.id),
        status_value="success",
        reason="student_consent_control",
        metadata_summary={
            "enabled": enabled,
            "reminder_cadence": preference.reminder_cadence,
            "has_quiet_hours": bool(preference.quiet_hours_start and preference.quiet_hours_end),
            "paused": preference.paused_until is not None,
            "allowed_channel_count": len(allowed_channels),
            "external_channels_enabled": False,
        },
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(preference)
    return preference_response(preference)


def read_student_notification_preference(
    db: OrmSession,
    *,
    student: User,
) -> StudentNotificationPreferenceResponse:
    preference = get_or_create_student_notification_preference(db, student=student)
    db.commit()
    db.refresh(preference)
    return preference_response(preference)


def _reminder_state(db: OrmSession, *, student: User) -> MoodCheckinReminderState:
    state = db.scalar(
        select(MoodCheckinReminderState).where(
            MoodCheckinReminderState.student_id == student.id,
            MoodCheckinReminderState.reminder_type == "mood_check_in",
        )
    )
    if state is not None:
        return state
    state = MoodCheckinReminderState(
        student_id=student.id,
        reminder_type="mood_check_in",
        is_demo=student.is_demo,
    )
    db.add(state)
    db.flush()
    return state


def _latest_checkin_at(db: OrmSession, *, student: User) -> datetime | None:
    return db.scalar(
        select(MoodCheckIn.created_at)
        .where(MoodCheckIn.student_id == student.id)
        .order_by(MoodCheckIn.created_at.desc(), MoodCheckIn.id.desc())
        .limit(1)
    )


def _cadence_delta(cadence: str) -> timedelta | None:
    if cadence == "daily":
        return timedelta(days=1)
    if cadence == "weekly":
        return timedelta(days=7)
    return None


def _parse_quiet_time(value: str) -> time:
    hour, minute = value.split(":")
    return time(hour=int(hour), minute=int(minute))


def _inside_quiet_hours(preference: StudentNotificationPreference, *, now: datetime) -> bool:
    if not preference.quiet_hours_start or not preference.quiet_hours_end:
        return False
    local_now = now.astimezone(ZoneInfo(preference.timezone))
    start = _parse_quiet_time(preference.quiet_hours_start)
    end = _parse_quiet_time(preference.quiet_hours_end)
    current = local_now.time()
    if start <= end:
        return start <= current < end
    return current >= start or current < end


def _build_reminder_response(
    *,
    preference: StudentNotificationPreference,
    state: MoodCheckinReminderState,
    due: bool,
    status_reason: str,
    generated_at: datetime,
    last_checkin_at: datetime | None,
) -> MoodCheckInReminderResponse:
    return MoodCheckInReminderResponse(
        due=due,
        status_reason=status_reason,
        title=REMINDER_TITLE,
        body=REMINDER_BODY,
        href=REMINDER_HREF,
        generated_at=generated_at,
        last_checkin_at=last_checkin_at,
        next_due_at=state.next_due_at,
        snoozed_until=state.snoozed_until,
        preference=preference_response(preference),
    )


def get_mood_checkin_reminder(
    db: OrmSession,
    *,
    student: User,
) -> MoodCheckInReminderResponse:
    require_permission(
        db,
        student,
        resource_type="mood_checkin_reminder",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = get_or_create_student_notification_preference(db, student=student)
    state = _reminder_state(db, student=student)
    now = utc_now()
    latest_checkin_at = _latest_checkin_at(db, student=student)
    due = True
    status_reason = "due"
    cadence_delta = _cadence_delta(preference.reminder_cadence)

    if not preference.in_app_reminders_enabled or not preference.mood_checkin_reminders_enabled:
        due = False
        status_reason = "disabled"
    elif IN_APP_CHANNEL not in preference.allowed_channels:
        due = False
        status_reason = "channel_unavailable"
    elif cadence_delta is None:
        due = False
        status_reason = "cadence_none"
    elif preference.paused_until is not None and preference.paused_until > now:
        due = False
        status_reason = "paused"
    elif state.snoozed_until is not None and state.snoozed_until > now:
        due = False
        status_reason = "snoozed"
    elif _inside_quiet_hours(preference, now=now):
        due = False
        status_reason = "quiet_hours"
    elif latest_checkin_at is not None and latest_checkin_at + cadence_delta > now:
        due = False
        status_reason = "recent_checkin"

    if due:
        state.last_shown_at = now
        state.next_due_at = now + cadence_delta
        state.updated_at = now
        record_audit_event(
            db,
            actor=student,
            actor_role=student.role,
            action="mood_checkin_reminder_shown",
            resource_type="mood_checkin_reminder",
            resource_id=str(state.id),
            status_value="shown",
            reason="student_in_app_reminder",
            metadata_summary={
                "status_reason": status_reason,
                "reminder_cadence": preference.reminder_cadence,
                "has_recent_checkin": latest_checkin_at is not None,
                "decision": "no_auto_sos_no_adult_alert",
            },
            is_demo=student.is_demo,
        )
    db.commit()
    db.refresh(preference)
    db.refresh(state)
    return _build_reminder_response(
        preference=preference,
        state=state,
        due=due,
        status_reason=status_reason,
        generated_at=now,
        last_checkin_at=latest_checkin_at,
    )


def dismiss_mood_checkin_reminder(
    db: OrmSession,
    *,
    student: User,
) -> MoodReminderActionResponse:
    require_permission(
        db,
        student,
        resource_type="mood_checkin_reminder",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = get_or_create_student_notification_preference(db, student=student)
    state = _reminder_state(db, student=student)
    now = utc_now()
    cadence_delta = _cadence_delta(preference.reminder_cadence) or timedelta(days=1)
    state.last_dismissed_at = now
    state.next_due_at = now + cadence_delta
    state.updated_at = now
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="mood_checkin_reminder_dismissed",
        resource_type="mood_checkin_reminder",
        resource_id=str(state.id),
        status_value="dismissed",
        reason="student_in_app_reminder",
        metadata_summary={"decision": "no_auto_sos_no_adult_alert"},
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(preference)
    db.refresh(state)
    reminder = _build_reminder_response(
        preference=preference,
        state=state,
        due=False,
        status_reason="dismissed",
        generated_at=now,
        last_checkin_at=_latest_checkin_at(db, student=student),
    )
    return MoodReminderActionResponse(status="dismissed", reminder=reminder)


def snooze_mood_checkin_reminder(
    db: OrmSession,
    *,
    student: User,
    payload: MoodReminderSnoozeRequest,
) -> MoodReminderActionResponse:
    require_permission(
        db,
        student,
        resource_type="mood_checkin_reminder",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = get_or_create_student_notification_preference(db, student=student)
    state = _reminder_state(db, student=student)
    now = utc_now()
    state.snoozed_until = now + timedelta(minutes=payload.minutes)
    state.next_due_at = state.snoozed_until
    state.updated_at = now
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="mood_checkin_reminder_snoozed",
        resource_type="mood_checkin_reminder",
        resource_id=str(state.id),
        status_value="snoozed",
        reason="student_in_app_reminder",
        metadata_summary={
            "snooze_minutes": payload.minutes,
            "decision": "no_auto_sos_no_adult_alert",
        },
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(preference)
    db.refresh(state)
    reminder = _build_reminder_response(
        preference=preference,
        state=state,
        due=False,
        status_reason="snoozed",
        generated_at=now,
        last_checkin_at=_latest_checkin_at(db, student=student),
    )
    return MoodReminderActionResponse(status="snoozed", reminder=reminder)


def open_mood_checkin_reminder(
    db: OrmSession,
    *,
    student: User,
) -> MoodReminderActionResponse:
    require_permission(
        db,
        student,
        resource_type="mood_checkin_reminder",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    preference = get_or_create_student_notification_preference(db, student=student)
    state = _reminder_state(db, student=student)
    now = utc_now()
    state.last_opened_at = now
    state.updated_at = now
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="mood_checkin_reminder_opened",
        resource_type="mood_checkin_reminder",
        resource_id=str(state.id),
        status_value="opened",
        reason="student_in_app_reminder",
        metadata_summary={"decision": "no_auto_sos_no_adult_alert"},
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(preference)
    db.refresh(state)
    reminder = _build_reminder_response(
        preference=preference,
        state=state,
        due=False,
        status_reason="opened",
        generated_at=now,
        last_checkin_at=_latest_checkin_at(db, student=student),
    )
    return MoodReminderActionResponse(status="opened", reminder=reminder)


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
