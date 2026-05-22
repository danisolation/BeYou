from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.readiness import ReadinessCheckStatus, ReadinessOverallStatus


class OperationCountBucket(BaseModel):
    key: str
    label: str
    count: int


class OperationReadinessAttentionCheck(BaseModel):
    key: str
    category: str
    status: ReadinessCheckStatus
    summary: str
    remediation: str | None = None


class OperationReadinessSummary(BaseModel):
    status: ReadinessOverallStatus
    generated_at: datetime
    checks_by_status: list[OperationCountBucket]
    attention_checks: list[OperationReadinessAttentionCheck]


class SosEmailDeliveryItem(BaseModel):
    id: str
    alert_id: str
    channel: str
    provider: str
    recipient_role: str
    status: str
    attempt_count: int
    error_code: str | None = None
    last_attempt_at: datetime | None = None
    delivered_at: datetime | None = None
    created_at: datetime
    is_demo: bool


class SosEmailDeliverySummary(BaseModel):
    total: int
    by_status: list[OperationCountBucket]
    by_provider: list[OperationCountBucket]
    by_error_code: list[OperationCountBucket]
    recent: list[SosEmailDeliveryItem]


class AuditFilterSummary(BaseModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    actor_role: str | None = None
    action_type: str | None = None
    target_type: str | None = None
    status: str | None = None


class AuditEventItem(BaseModel):
    id: str
    actor_role: str
    action: str
    resource_type: str
    resource_id: str
    status: str
    timestamp: datetime
    reason: str | None = None
    metadata_summary: dict[str, Any]
    is_demo: bool


class AuditEventSummary(BaseModel):
    total_matching: int
    filters: AuditFilterSummary
    recent: list[AuditEventItem]


class AdminOperationsDashboardResponse(BaseModel):
    generated_at: datetime
    privacy_notes: list[str]
    readiness: OperationReadinessSummary
    sos_email: SosEmailDeliverySummary
    v1_2_audit: list[OperationCountBucket] = Field(default_factory=list)
    audit: AuditEventSummary

