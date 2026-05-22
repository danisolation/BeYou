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


class SchoolPrivacyPolicyDefaultsUpdate(BaseModel):
    default_in_app_reminders_enabled: bool = False
    default_quiet_hours_start: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    default_quiet_hours_end: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
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
