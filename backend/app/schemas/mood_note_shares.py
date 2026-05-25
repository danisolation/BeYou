from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MoodNoteShareScopeValue = Literal["private_note", "student_summary"]


class MoodNoteShareLinkedAdultOption(BaseModel):
    id: uuid.UUID
    full_name: str
    relationship_type: str
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class MoodNoteActiveShare(BaseModel):
    id: uuid.UUID
    mood_checkin_id: uuid.UUID
    adult_id: uuid.UUID
    adult_full_name: str
    relationship_type: str
    share_scope: MoodNoteShareScopeValue
    has_private_note: bool
    has_student_summary: bool
    created_at: datetime
    is_demo: bool = False


class MoodNoteShareOptionsResponse(BaseModel):
    available_adults: list[MoodNoteShareLinkedAdultOption]
    privacy_notes: list[str]


class MoodNoteShareRequest(BaseModel):
    adult_ids: list[uuid.UUID] = Field(min_length=1)
    share_scope: MoodNoteShareScopeValue = "private_note"
    student_summary: str | None = Field(default=None, max_length=1000)

    @field_validator("adult_ids")
    @classmethod
    def dedupe_adult_ids(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        return list(dict.fromkeys(value))

    @field_validator("student_summary")
    @classmethod
    def normalize_student_summary(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class MoodNoteShareResponse(BaseModel):
    mood_checkin_id: uuid.UUID
    active_shares: list[MoodNoteActiveShare]
    shareable: bool
    can_share_private_note: bool = False
    message: str


class MoodNoteRevokeResponse(BaseModel):
    mood_checkin_id: uuid.UUID
    revoked_count: int
    active_shares: list[MoodNoteActiveShare]
    message: str


class AdultSharedMoodNote(BaseModel):
    id: uuid.UUID
    mood_checkin_id: uuid.UUID
    shared_at: datetime
    mood_created_at: datetime
    share_scope: MoodNoteShareScopeValue
    content: str
    relationship_type: str
    is_demo: bool = False
