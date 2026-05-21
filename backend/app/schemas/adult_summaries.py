from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

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
