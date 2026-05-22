from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models import SupportPlanStatus


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class SupportPlanLinkedAdult(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str | None = None
    relationship_type: str
    is_demo: bool


class SupportPlanSelectedAdult(BaseModel):
    id: uuid.UUID
    full_name: str
    relationship_type: str
    is_demo: bool


class SupportPlanUpsertRequest(BaseModel):
    adult_ids: list[uuid.UUID] = Field(default_factory=list)
    status: str = SupportPlanStatus.ACTIVE.value
    what_helps: str | None = Field(default=None, max_length=1500)
    what_does_not_help: str | None = Field(default=None, max_length=1500)
    preferred_contact_method: str | None = Field(default=None, max_length=1500)
    safe_contact_times: str | None = Field(default=None, max_length=1500)
    shareable_note: str | None = Field(default=None, max_length=1500)

    @field_validator("adult_ids")
    @classmethod
    def dedupe_adult_ids(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        return list(dict.fromkeys(value))

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {item.value for item in SupportPlanStatus}
        if value not in allowed:
            raise ValueError("Trạng thái kế hoạch hỗ trợ không hợp lệ.")
        return value

    @field_validator(
        "what_helps",
        "what_does_not_help",
        "preferred_contact_method",
        "safe_contact_times",
        "shareable_note",
    )
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class SupportPlanDetail(BaseModel):
    id: uuid.UUID
    status: str
    what_helps: str | None = None
    what_does_not_help: str | None = None
    preferred_contact_method: str | None = None
    safe_contact_times: str | None = None
    shareable_note: str | None = None
    selected_adults: list[SupportPlanSelectedAdult]
    created_at: datetime
    updated_at: datetime
    paused_at: datetime | None = None
    deactivated_at: datetime | None = None
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class StudentSupportPlanResponse(BaseModel):
    plan: SupportPlanDetail | None = None
    available_adults: list[SupportPlanLinkedAdult]
    privacy_notes: list[str]
    is_demo: bool
