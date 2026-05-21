from __future__ import annotations

import enum
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models import ContentStatus


class AdminContentStatus(str, enum.Enum):
    DRAFT = ContentStatus.DRAFT.value
    PUBLISHED = ContentStatus.PUBLISHED.value
    ARCHIVED = ContentStatus.ARCHIVED.value


class AdminRiskStateLabel(str, enum.Enum):
    ON_DINH = "On dinh"
    CAN_CHU_Y = "Can chu y"
    NEN_TIM_HO_TRO = "Nen tim ho tro"
    CAN_HO_TRO_SOM = "Can ho tro som"


class AdminScenarioSignal(str, enum.Enum):
    CONSTRUCTIVE = "constructive"
    RISKY = "risky"


VALID_STATUSES = {status.value for status in AdminContentStatus}
VALID_RISK_LABELS = {label.value for label in AdminRiskStateLabel}
VALID_SIGNALS = {signal.value for signal in AdminScenarioSignal}


def _validate_status(value: str) -> str:
    if value not in VALID_STATUSES:
        raise ValueError("status must be draft, published, or archived")
    return value


def _validate_state_label(value: str) -> str:
    if value not in VALID_RISK_LABELS:
        raise ValueError("state_label must be one of the locked Phase 3 labels")
    return value


def _validate_signal(value: str) -> str:
    if value not in VALID_SIGNALS:
        raise ValueError("signal must be constructive or risky")
    return value


class AdminSelfCheckChoiceUpsert(BaseModel):
    text: str = ""
    score_value: int = 0
    sort_order: int = 0
    is_demo: bool | None = None


class AdminSelfCheckQuestionUpsert(BaseModel):
    text: str = ""
    sort_order: int = 0
    choices: list[AdminSelfCheckChoiceUpsert] = Field(default_factory=list)
    is_demo: bool | None = None


class AdminSelfCheckThresholdUpsert(BaseModel):
    state_label: str
    min_score: int
    max_score: int
    comment: str | None = None
    advice: str | None = None
    positive_content: str | None = None
    suggested_next_action: str | None = None
    is_demo: bool | None = None

    @field_validator("state_label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        return _validate_state_label(value)


class AdminSelfCheckTestUpsert(BaseModel):
    title: str
    description: str | None = None
    status: str | None = None
    is_active: bool | None = True
    is_demo: bool | None = False
    questions: list[AdminSelfCheckQuestionUpsert] | None = None
    thresholds: list[AdminSelfCheckThresholdUpsert] | None = None

    @field_validator("status")
    @classmethod
    def validate_optional_status(cls, value: str | None) -> str | None:
        return _validate_status(value) if value is not None else None


class AdminSelfCheckChoiceResponse(BaseModel):
    id: uuid.UUID
    text: str
    score_value: int
    sort_order: int
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class AdminSelfCheckQuestionResponse(BaseModel):
    id: uuid.UUID
    text: str
    sort_order: int
    choices: list[AdminSelfCheckChoiceResponse]
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class AdminSelfCheckThresholdResponse(BaseModel):
    id: uuid.UUID
    state_label: str
    min_score: int
    max_score: int
    comment: str | None = None
    advice: str | None = None
    positive_content: str | None = None
    suggested_next_action: str | None = None
    is_demo: bool = False

    @field_validator("state_label")
    @classmethod
    def validate_response_label(cls, value: str) -> str:
        return _validate_state_label(value)

    model_config = ConfigDict(from_attributes=True)


class AdminSelfCheckTestResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    status: str
    is_active: bool
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime
    questions: list[AdminSelfCheckQuestionResponse] = Field(default_factory=list)
    thresholds: list[AdminSelfCheckThresholdResponse] = Field(default_factory=list)

    @field_validator("status")
    @classmethod
    def validate_response_status(cls, value: str) -> str:
        return _validate_status(value)

    model_config = ConfigDict(from_attributes=True)


class AdminScenarioChoiceUpsert(BaseModel):
    text: str = ""
    signal: str = "risky"
    feedback: str = ""
    sort_order: int = 0
    is_demo: bool | None = None

    @field_validator("signal")
    @classmethod
    def validate_choice_signal(cls, value: str) -> str:
        return _validate_signal(value)


class AdminScenarioUpsert(BaseModel):
    title: str
    situation: str = ""
    skill_tag: str = ""
    status: str | None = None
    recommended_response: str = ""
    lesson: str = ""
    is_demo: bool | None = False
    choices: list[AdminScenarioChoiceUpsert] | None = None

    @field_validator("status")
    @classmethod
    def validate_optional_status(cls, value: str | None) -> str | None:
        return _validate_status(value) if value is not None else None


class AdminScenarioChoiceResponse(BaseModel):
    id: uuid.UUID
    text: str
    signal: str
    feedback: str
    sort_order: int
    is_demo: bool = False

    @field_validator("signal")
    @classmethod
    def validate_response_signal(cls, value: str) -> str:
        return _validate_signal(value)

    model_config = ConfigDict(from_attributes=True)


class AdminScenarioResponse(BaseModel):
    id: uuid.UUID
    title: str
    situation: str
    skill_tag: str
    status: str
    recommended_response: str
    lesson: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime
    choices: list[AdminScenarioChoiceResponse] = Field(default_factory=list)

    @field_validator("status")
    @classmethod
    def validate_response_status(cls, value: str) -> str:
        return _validate_status(value)

    model_config = ConfigDict(from_attributes=True)
