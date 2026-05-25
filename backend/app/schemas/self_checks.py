from __future__ import annotations

import enum
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models import RiskStateLabel


class SelfCheckStateLabel(str, enum.Enum):
    ON_DINH = RiskStateLabel.STABLE.value
    CAN_CHU_Y = RiskStateLabel.ATTENTION.value
    NEN_TIM_HO_TRO = RiskStateLabel.SUPPORT.value
    CAN_HO_TRO_SOM = RiskStateLabel.EARLY_SUPPORT.value


def _validate_state_label(value: str) -> str:
    allowed = {label.value for label in SelfCheckStateLabel}
    if value not in allowed:
        raise ValueError("state_label must be one of the locked Phase 3 risk labels")
    return value


def display_state_label(value: str) -> str:
    if value == RiskStateLabel.STABLE.value:
        return "Bình thường"
    if value in {RiskStateLabel.ATTENTION.value, RiskStateLabel.SUPPORT.value}:
        return "Cần quan tâm"
    if value == RiskStateLabel.EARLY_SUPPORT.value:
        return "Nguy cơ cao"
    return value


class SelfCheckChoiceResponse(BaseModel):
    id: uuid.UUID
    text: str
    sort_order: int
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class SelfCheckQuestionResponse(BaseModel):
    id: uuid.UUID
    text: str
    sort_order: int
    choices: list[SelfCheckChoiceResponse]
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class SelfCheckTestListItem(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    status: str
    is_active: bool
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class SelfCheckTestDetailResponse(SelfCheckTestListItem):
    questions: list[SelfCheckQuestionResponse]


class SelfCheckAnswerSubmit(BaseModel):
    question_id: uuid.UUID
    choice_id: uuid.UUID


class SelfCheckAttemptSubmitRequest(BaseModel):
    answers: list[SelfCheckAnswerSubmit] = Field(min_length=1)


class SelfCheckResultResponse(BaseModel):
    attempt_id: uuid.UUID
    test_id: uuid.UUID
    test_title: str
    state_label: str
    supportive_headline: str
    short_comment: str | None = None
    advice_summary: str | None = None
    support_suggestion: str | None = None
    positive_content: str | None = None
    suggested_next_action: str | None = None
    score: int
    completed_at: datetime
    is_demo: bool = False

    @field_validator("state_label")
    @classmethod
    def validate_state_label(cls, value: str) -> str:
        return _validate_state_label(value)

    model_config = ConfigDict(from_attributes=True)


class SelfCheckHistoryItem(BaseModel):
    attempt_id: uuid.UUID
    test_id: uuid.UUID
    test_title: str
    state_label: str
    supportive_headline: str | None = None
    suggested_next_action: str | None = None
    completed_at: datetime
    is_demo: bool = False

    @field_validator("state_label")
    @classmethod
    def validate_state_label(cls, value: str) -> str:
        return _validate_state_label(value)

    model_config = ConfigDict(from_attributes=True)


class SelfCheckHistoryListResponse(BaseModel):
    items: list[SelfCheckHistoryItem]


class SelfCheckAttemptAnswerResponse(BaseModel):
    question_id: uuid.UUID | None = None
    choice_id: uuid.UUID | None = None
    question_text_snapshot: str
    choice_text_snapshot: str
    score_value_snapshot: int
    sort_order: int
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class SelfCheckAttemptDetailResponse(SelfCheckResultResponse):
    answers: list[SelfCheckAttemptAnswerResponse]
