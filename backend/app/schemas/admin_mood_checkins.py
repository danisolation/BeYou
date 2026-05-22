from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models import ContentStatus
from app.schemas.mood_checkins import CONTEXT_TAGS, MOOD_LABELS, ContextTagOption, MoodOption


def _strip_text(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("Không được để trống.")
    return stripped


class AdminMoodOptionConfig(BaseModel):
    key: str
    label: str = Field(max_length=80)
    helper: str = Field(max_length=200)

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if value not in MOOD_LABELS:
            raise ValueError("Mood option key không hợp lệ.")
        return value

    @field_validator("label", "helper")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return _strip_text(value)


class AdminContextTagConfig(BaseModel):
    key: str
    label: str = Field(max_length=80)

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if value not in CONTEXT_TAGS:
            raise ValueError("Context tag key không hợp lệ.")
        return value

    @field_validator("label")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return _strip_text(value)


class AdminMoodCheckInConfigUpsert(BaseModel):
    name: str = Field(max_length=96)
    status: str = ContentStatus.DRAFT.value
    student_prompt: str = Field(max_length=600)
    adult_guidance: str = Field(max_length=600)
    mood_options: list[AdminMoodOptionConfig] = Field(min_length=1)
    context_tags: list[AdminContextTagConfig] = Field(min_length=1)
    sort_order: int = 0

    @field_validator("name", "student_prompt", "adult_guidance")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return _strip_text(value)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {ContentStatus.DRAFT.value, ContentStatus.PUBLISHED.value, ContentStatus.ARCHIVED.value}
        if value not in allowed:
            raise ValueError("Trạng thái cấu hình không hợp lệ.")
        return value


class AdminMoodCheckInConfigResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    student_prompt: str
    adult_guidance: str
    mood_options: list[MoodOption]
    context_tags: list[ContextTagOption]
    sort_order: int
    updated_by_id: uuid.UUID | None = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminMoodCheckInPreviewResponse(BaseModel):
    student_prompt: str
    adult_guidance: str
    mood_options: list[MoodOption]
    context_tags: list[ContextTagOption]
    privacy_notes: list[str]
