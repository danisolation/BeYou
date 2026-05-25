from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

IN_APP_CHANNEL = "in_app"
DEFERRED_CHANNELS = {"email", "sms", "zalo", "push"}
ALLOWED_CHANNELS = {IN_APP_CHANNEL}
ALLOWED_REASON_CODES = {
    "student_requested_support",
    "follow_up_after_checkin",
    "support_plan_context",
    "sos_follow_up",
    "routine_care_conversation",
}
ACCESS_REASON_LABELS = {
    "student_requested_support": "Học sinh đã nhờ hỗ trợ",
    "follow_up_after_checkin": "Theo dõi sau một check-in gần đây",
    "support_plan_context": "Xem bối cảnh kế hoạch hỗ trợ",
    "sos_follow_up": "Theo dõi sau một tình huống SOS",
    "routine_care_conversation": "Chuẩn bị cho cuộc trò chuyện chăm sóc định kỳ",
}


def normalize_channels(value: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(channel.strip().lower() for channel in value if channel.strip()))
    invalid = [channel for channel in normalized if channel not in ALLOWED_CHANNELS]
    if invalid:
        raise ValueError("v1.4 chỉ hỗ trợ nhắc nhở trong ứng dụng; kênh ngoài đang được hoãn.")
    return normalized or [IN_APP_CHANNEL]


def normalize_reason_codes(value: list[str]) -> list[str]:
    normalized = list(dict.fromkeys(reason.strip().lower() for reason in value if reason.strip()))
    invalid = [reason for reason in normalized if reason not in ALLOWED_REASON_CODES]
    if invalid:
        raise ValueError("Lý do truy cập không hợp lệ.")
    return normalized or sorted(ALLOWED_REASON_CODES)


class AccessReasonOption(BaseModel):
    code: str
    label: str


def access_reason_options(reason_codes: list[str]) -> list[AccessReasonOption]:
    return [
        AccessReasonOption(code=reason_code, label=ACCESS_REASON_LABELS[reason_code])
        for reason_code in normalize_reason_codes(reason_codes)
    ]


def normalize_quiet_hour(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        hour, minute = value.split(":")
        hour_int = int(hour)
        minute_int = int(minute)
    except ValueError as exc:
        raise ValueError("Khung giờ yên lặng phải có định dạng HH:MM hợp lệ.") from exc
    if not 0 <= hour_int <= 23 or not 0 <= minute_int <= 59:
        raise ValueError("Khung giờ yên lặng phải có định dạng HH:MM hợp lệ.")
    return f"{hour_int:02d}:{minute_int:02d}"


class ChannelBoundary(BaseModel):
    key: str
    label: str
    enabled: bool
    available: bool
    status: Literal["active", "deferred"]


class SchoolPrivacyPolicyDefaultsResponse(BaseModel):
    id: str
    school_scope: str
    default_in_app_reminders_enabled: bool
    default_quiet_hours_start: str | None = None
    default_quiet_hours_end: str | None = None
    default_timezone: str
    allowed_channels: list[str]
    external_channels_enabled: bool
    note_sharing_enabled: bool
    reason_required_for_adult_summaries: bool
    reason_required_for_shared_mood_notes: bool
    allowed_reason_codes: list[str]
    channel_boundaries: list[ChannelBoundary]
    updated_at: datetime
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class StudentNotificationPreferenceResponse(BaseModel):
    id: str
    student_id: str
    in_app_reminders_enabled: bool
    mood_checkin_reminders_enabled: bool
    reminder_cadence: str
    allowed_channels: list[str]
    consent_version: str | None = None
    consented_at: datetime | None = None
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    timezone: str
    paused_until: datetime | None = None
    pause_reason_code: str | None = None
    channel_boundaries: list[ChannelBoundary]
    updated_at: datetime
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class StudentNotificationPreferenceUpdate(BaseModel):
    in_app_reminders_enabled: bool
    mood_checkin_reminders_enabled: bool
    reminder_cadence: Literal["none", "daily", "weekly"] = "weekly"
    allowed_channels: list[str] = Field(default_factory=lambda: [IN_APP_CHANNEL])
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"
    paused_until: datetime | None = None
    pause_reason_code: str | None = Field(default=None, max_length=64)

    @field_validator("allowed_channels")
    @classmethod
    def validate_allowed_channels(cls, value: list[str]) -> list[str]:
        return normalize_channels(value)

    @field_validator("quiet_hours_start", "quiet_hours_end")
    @classmethod
    def validate_quiet_hour(cls, value: str | None) -> str | None:
        return normalize_quiet_hour(value)


class MoodCheckInReminderResponse(BaseModel):
    due: bool
    status_reason: str
    title: str
    body: str
    href: str
    generated_at: datetime
    last_checkin_at: datetime | None = None
    next_due_at: datetime | None = None
    snoozed_until: datetime | None = None
    preference: StudentNotificationPreferenceResponse


class MoodReminderSnoozeRequest(BaseModel):
    minutes: int = Field(default=240, ge=15, le=1440)


class MoodReminderActionResponse(BaseModel):
    status: str
    reminder: MoodCheckInReminderResponse


class SchoolPrivacyPolicyDefaultsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    default_in_app_reminders_enabled: bool = False
    default_quiet_hours_start: str | None = None
    default_quiet_hours_end: str | None = None
    default_timezone: str = "Asia/Ho_Chi_Minh"
    allowed_channels: list[str] = Field(default_factory=lambda: [IN_APP_CHANNEL])
    external_channels_enabled: bool = False
    note_sharing_enabled: bool = True
    reason_required_for_adult_summaries: bool = True
    reason_required_for_shared_mood_notes: bool = True
    allowed_reason_codes: list[str] = Field(default_factory=lambda: sorted(ALLOWED_REASON_CODES))

    @field_validator("allowed_channels")
    @classmethod
    def validate_allowed_channels(cls, value: list[str]) -> list[str]:
        return normalize_channels(value)

    @field_validator("default_quiet_hours_start", "default_quiet_hours_end")
    @classmethod
    def validate_quiet_hour(cls, value: str | None) -> str | None:
        return normalize_quiet_hour(value)

    @field_validator("allowed_reason_codes")
    @classmethod
    def validate_reason_codes(cls, value: list[str]) -> list[str]:
        return normalize_reason_codes(value)

    @field_validator("external_channels_enabled")
    @classmethod
    def reject_external_channels(cls, value: bool) -> bool:
        if value:
            raise ValueError("Kênh nhắc nhở ngoài ứng dụng chưa nằm trong phạm vi v1.4.")
        return value


class StudentNotificationPreferenceContract(BaseModel):
    allowed_channels: list[str] = Field(default_factory=lambda: [IN_APP_CHANNEL])
    external_channels_enabled: bool = False

    @field_validator("allowed_channels")
    @classmethod
    def validate_allowed_channels(cls, value: list[str]) -> list[str]:
        return normalize_channels(value)

    @field_validator("external_channels_enabled")
    @classmethod
    def reject_external_channels(cls, value: bool) -> bool:
        if value:
            raise ValueError("Kênh nhắc nhở ngoài ứng dụng chưa nằm trong phạm vi v1.4.")
        return value
