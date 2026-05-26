from __future__ import annotations

import uuid

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserSessionResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    full_name: str
    is_demo: bool
    privacy_acknowledgement_required: bool
    dashboard_route: str
    notice_version: str


class LoginResponse(UserSessionResponse):
    pass


class AuthCapabilitiesResponse(BaseModel):
    demo_login_enabled: bool
    public_demo_entry_enabled: bool
    email_password_enabled: bool = True
    provider_login_enabled: bool
    provider_label: str | None = None
    provider_mode: str | None = None
    production_pilot: bool
