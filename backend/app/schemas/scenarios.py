from __future__ import annotations

import enum
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.db.models import ScenarioSignal


class ScenarioSignalValue(str, enum.Enum):
    CONSTRUCTIVE = ScenarioSignal.CONSTRUCTIVE.value
    RISKY = ScenarioSignal.RISKY.value


def _validate_signal(value: str) -> str:
    allowed = {signal.value for signal in ScenarioSignalValue}
    if value not in allowed:
        raise ValueError("signal must be constructive or risky")
    return value


class ScenarioChoiceResponse(BaseModel):
    id: uuid.UUID
    text: str
    signal: str
    feedback: str
    sort_order: int
    is_demo: bool = False

    @field_validator("signal")
    @classmethod
    def validate_signal(cls, value: str) -> str:
        return _validate_signal(value)

    model_config = ConfigDict(from_attributes=True)


class ScenarioListItem(BaseModel):
    id: uuid.UUID
    title: str
    situation: str
    skill_tag: str
    status: str
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class ScenarioDetailResponse(ScenarioListItem):
    recommended_response: str
    lesson: str
    choices: list[ScenarioChoiceResponse]


class ScenarioAttemptRequest(BaseModel):
    selected_choice_id: uuid.UUID


class ScenarioFeedbackResponse(BaseModel):
    attempt_id: uuid.UUID
    scenario_id: uuid.UUID
    selected_choice_id: uuid.UUID | None = None
    selected_choice: str | None = None
    signal: str | None = None
    feedback: str | None = None
    recommended_response: str
    lesson: str
    skill_tag: str
    completed_at: datetime
    is_demo: bool = False

    @field_validator("signal")
    @classmethod
    def validate_optional_signal(cls, value: str | None) -> str | None:
        return _validate_signal(value) if value is not None else None

    model_config = ConfigDict(from_attributes=True)


class ScenarioHistoryItem(BaseModel):
    attempt_id: uuid.UUID
    scenario_id: uuid.UUID
    scenario_title: str
    selected_choice: str | None = None
    signal: str | None = None
    feedback: str | None = None
    skill_tag: str
    completed_at: datetime
    is_demo: bool = False

    @field_validator("signal")
    @classmethod
    def validate_optional_signal(cls, value: str | None) -> str | None:
        return _validate_signal(value) if value is not None else None

    model_config = ConfigDict(from_attributes=True)
