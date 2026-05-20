from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.db.models import AccountStatus, RelationshipType, UserRole


def _normalize_email(value: str) -> str:
    return value.strip().lower()


class AdminUserCreateRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=256)
    role: str
    full_name: str = Field(min_length=1, max_length=255)
    school: str | None = Field(default=None, max_length=255)
    class_name: str | None = Field(default=None, max_length=64)
    status: str = AccountStatus.ACTIVE.value
    is_demo: bool = False

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {role.value for role in UserRole}:
            raise ValueError("role must be student, teacher, parent, or admin")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in {status.value for status in AccountStatus}:
            raise ValueError("status must be active, disabled, or deleted")
        return value


class AdminUserUpdateRequest(BaseModel):
    email: str | None = Field(default=None, min_length=3, max_length=320)
    role: str | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    school: str | None = Field(default=None, max_length=255)
    class_name: str | None = Field(default=None, max_length=64)
    status: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return _normalize_email(value) if value is not None else None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is not None and value not in {role.value for role in UserRole}:
            raise ValueError("role must be student, teacher, parent, or admin")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None and value not in {status.value for status in AccountStatus}:
            raise ValueError("status must be active, disabled, or deleted")
        return value


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    full_name: str
    school: str | None
    class_name: str | None
    is_demo: bool
    created_at: datetime
    updated_at: datetime


class AdminLinkCreateRequest(BaseModel):
    student_id: uuid.UUID
    adult_id: uuid.UUID
    relationship_type: str

    @field_validator("relationship_type")
    @classmethod
    def validate_relationship_type(cls, value: str) -> str:
        if value not in {relationship.value for relationship in RelationshipType}:
            raise ValueError("relationship_type must be teacher or parent")
        return value


class AdminLinkUpdateRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value != "revoked":
            raise ValueError("Only revoked status is supported")
        return value


class AdminLinkResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_full_name: str
    student_email: str
    student_school: str | None
    student_class_name: str | None
    adult_id: uuid.UUID
    adult_full_name: str
    adult_email: str
    adult_role: str
    relationship_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    revoked_at: datetime | None
    is_demo: bool
