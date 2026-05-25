from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.mood_note_shares import MoodNoteActiveShare

MOOD_LABELS = {"steady", "okay", "tired", "sad", "anxious", "overwhelmed"}
CONTEXT_TAGS = {"school", "family", "friends", "body", "sleep", "future", "other"}


class MoodOption(BaseModel):
    key: str
    label: str
    helper: str


class ContextTagOption(BaseModel):
    key: str
    label: str


class MoodCheckInOptionsResponse(BaseModel):
    student_prompt: str | None = None
    adult_guidance: str | None = None
    mood_options: list[MoodOption]
    context_tags: list[ContextTagOption]
    privacy_notes: list[str]
    energy_scale_label: str
    stress_scale_label: str


class MoodCheckInCreate(BaseModel):
    mood_label: str
    energy_level: int = Field(ge=1, le=5)
    stress_level: int = Field(ge=1, le=5)
    context_tags: list[str] = Field(default_factory=list, max_length=5)
    private_note: str | None = Field(default=None, max_length=1000)

    @field_validator("mood_label")
    @classmethod
    def validate_mood_label(cls, value: str) -> str:
        if value not in MOOD_LABELS:
            raise ValueError("Nhãn cảm xúc không hợp lệ.")
        return value

    @field_validator("context_tags")
    @classmethod
    def validate_context_tags(cls, value: list[str]) -> list[str]:
        deduped = list(dict.fromkeys(value))
        invalid = [tag for tag in deduped if tag not in CONTEXT_TAGS]
        if invalid:
            raise ValueError("Ngữ cảnh check-in không hợp lệ.")
        return deduped

    @field_validator("private_note")
    @classmethod
    def normalize_private_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class MoodCheckInResponse(BaseModel):
    id: uuid.UUID
    mood_label: str
    energy_level: int
    stress_level: int
    context_tags: list[str]
    private_note: str | None = None
    trend_label: str
    supportive_message: str
    suggested_next_action: str
    suggest_support_plan: bool
    suggest_sos: bool
    created_at: datetime
    is_demo: bool
    shareable: bool = False
    can_share_private_note: bool = False
    active_shares: list[MoodNoteActiveShare] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MoodCheckInHistoryResponse(BaseModel):
    items: list[MoodCheckInResponse]
