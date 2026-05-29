from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.mood_note_shares import AdultSharedMoodNote
from app.schemas.privacy_controls import AccessReasonOption
from app.schemas.self_checks import _validate_state_label


class AdultStudentContext(BaseModel):
    id: uuid.UUID
    full_name: str
    school: str | None = None
    class_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AdultSelfCheckSummaryItem(BaseModel):
    completed_at: datetime
    test_type: str
    state_label: str
    advice_summary: str | None = None
    support_suggestion: str | None = None
    cover_image_url: str | None = None
    is_demo: bool = False

    @field_validator("state_label")
    @classmethod
    def validate_state_label(cls, value: str) -> str:
        return _validate_state_label(value)

    model_config = ConfigDict(from_attributes=True)


class AdultSelfCheckSummaryResponse(BaseModel):
    student: AdultStudentContext
    latest_summary: AdultSelfCheckSummaryItem | None = None
    recent_summaries: list[AdultSelfCheckSummaryItem]
    is_demo: bool = False


class AdultSupportPlanSummary(BaseModel):
    status: str | None = None
    shared_with_viewer: bool
    selected_adult_count: int
    what_helps: str | None = None
    what_does_not_help: str | None = None
    preferred_contact_method: str | None = None
    safe_contact_times: str | None = None
    shareable_note: str | None = None
    updated_at: datetime | None = None


class AdultMoodTrendSummary(BaseModel):
    latest_checkin_at: datetime | None = None
    latest_trend_label: str | None = None
    recent_checkin_count: int
    high_concern_count: int
    recent_trend_labels: list[str]
    suggested_supportive_action: str


class AdultAccessReasonStatus(BaseModel):
    required: bool
    reason_code: str | None = None
    reason_label: str | None = None
    allowed_reasons: list[AccessReasonOption] = Field(default_factory=list)


class AdultSupportSummaryResponse(BaseModel):
    student: AdultStudentContext
    support_plan: AdultSupportPlanSummary
    mood_summary: AdultMoodTrendSummary
    shared_mood_notes: list[AdultSharedMoodNote] = Field(default_factory=list)
    access_reason: AdultAccessReasonStatus
    privacy_notes: list[str]
    is_demo: bool = False
