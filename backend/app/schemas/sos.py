from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models import SosAlertStatus, SosSeverity, SosSource


def _validate_enum(value: str, allowed: set[str], field_name: str) -> str:
    if value not in allowed:
        raise ValueError(f"{field_name} không hợp lệ.")
    return value


class SosStudentContext(BaseModel):
    id: uuid.UUID
    full_name: str
    school: str | None = None
    class_name: str | None = None


class SosAlertCreate(BaseModel):
    severity: str = SosSeverity.SUPPORT.value
    source: str = SosSource.STUDENT_DASHBOARD.value
    note: str | None = Field(default=None, max_length=500)

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        return _validate_enum(value, {item.value for item in SosSeverity}, "severity")

    @field_validator("source")
    @classmethod
    def validate_source(cls, value: str) -> str:
        return _validate_enum(value, {item.value for item in SosSource}, "source")

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class SosStatusUpdate(BaseModel):
    status: str
    note: str | None = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {
            SosAlertStatus.RECEIVED.value,
            SosAlertStatus.SUPPORTING.value,
            SosAlertStatus.COMPLETED.value,
        }
        return _validate_enum(value, allowed, "status")

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class SosStatusEventResponse(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID
    actor_role: str
    previous_status: str | None = None
    new_status: str
    note: str | None = None
    created_at: datetime
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class SosAlertResponse(BaseModel):
    id: uuid.UUID
    student: SosStudentContext
    severity: str
    source: str
    note: str | None = None
    current_status: str
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    status_events: list[SosStatusEventResponse] = []
    is_demo: bool


class InAppNotificationResponse(BaseModel):
    id: uuid.UUID
    resource_type: str
    resource_id: str
    title: str
    body: str
    href: str | None = None
    read_at: datetime | None = None
    created_at: datetime
    is_demo: bool

    model_config = ConfigDict(from_attributes=True)


class AdultLatestSummary(BaseModel):
    completed_at: datetime
    test_type: str
    state_label: str
    advice_summary: str | None = None
    support_suggestion: str | None = None
    is_demo: bool


class AdultSupportOverviewItem(BaseModel):
    student: SosStudentContext
    warning_group: str
    warning_group_label: str
    latest_self_check_summary: AdultLatestSummary | None = None
    latest_sos_alert: SosAlertResponse | None = None
    open_sos_count: int
    is_demo: bool
