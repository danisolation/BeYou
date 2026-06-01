from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatMessageCreate(BaseModel):
    thread_id: uuid.UUID | None = None
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Tin nhắn không được để trống.")
        return stripped


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    role: str
    content: str
    safety_flagged: bool
    created_at: datetime
    is_demo: bool


class ChatThreadResponse(BaseModel):
    id: uuid.UUID
    title: str
    safety_state: str
    last_message_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class ChatSafetyResponse(BaseModel):
    high_risk: bool
    input_flagged: bool
    output_flagged: bool
    categories: list[str]
    suggested_action: str
    sos_suggested: bool
    escalation_message: str | None = None


class ChatProviderResponse(BaseModel):
    name: str
    used_fallback: bool


class ChatSendResponse(BaseModel):
    thread_id: uuid.UUID
    student_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    safety: ChatSafetyResponse
    provider: ChatProviderResponse


class ChatTranscriptResponse(BaseModel):
    thread: ChatThreadResponse
    messages: list[ChatMessageResponse]


class ChatbotSafetyConfigUpdate(BaseModel):
    high_risk_keywords: list[str] | None = None
    escalation_message: str | None = Field(default=None, max_length=1200)
    trusted_adult_message: str | None = Field(default=None, max_length=800)


class ChatbotProviderStatus(BaseModel):
    name: str
    configured: bool
    using_fallback: bool


class ChatbotSafetyConfigResponse(BaseModel):
    id: uuid.UUID
    high_risk_keywords: list[str]
    escalation_message: str
    trusted_adult_message: str
    first_response_disclaimer: str
    guardrails_locked: bool = True
    provider: ChatbotProviderStatus
    updated_at: datetime
    is_demo: bool
