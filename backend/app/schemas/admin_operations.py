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


class DemoSeedRoleStatus(BaseModel):
    role: str
    account_key: str
    present: bool
    active: bool
    is_demo: bool


class DemoSeedSummary(BaseModel):
    status: ReadinessCheckStatus
    summary: str
    remediation: str | None = None
    allow_demo_seed: bool
    roles: list[DemoSeedRoleStatus]
    active_link_count: int
    published_self_check_count: int
    published_scenario_count: int
    published_mood_config_count: int
    v1_4_policy_count: int = 0
    v1_4_preference_count: int = 0
    v1_4_reminder_state_count: int = 0
    v1_4_share_count: int = 0


class RuntimeModeSummary(BaseModel):
    mode: str
    is_demo_runtime: bool
    production_pilot: bool
    demo_seed_allowed: bool
    demo_login_allowed: bool


class ConnectivitySummary(BaseModel):
    frontend_origin_kind: str
    allowed_origin_count: int
    has_local_origin: bool
    all_origins_https: bool
    health_live_path: str
    health_ready_path: str
    session_cookie_secure: bool
    session_cookie_samesite: str
    credentialed_cors_methods: list[str]


class ProductionSmokeChecklistItem(BaseModel):
    key: str
    label: str
    status: str
    command: str | None = None
    evidence: str
    remediation: str | None = None


class DeploymentGuardrailItem(BaseModel):
    key: str
    category: str
    status: ReadinessCheckStatus
    evidence: str
    remediation: str | None = None
    command: str | None = None


class SmokeProfileItem(BaseModel):
    key: str
    label: str
    status: ReadinessCheckStatus
    command: str
    uses_demo_accounts: bool
    requires_readiness_ready: bool
    evidence: str
    remediation: str | None = None


class SosEmailDeliveryItem(BaseModel):
    delivery_key: str
    alert_key: str
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
    runtime: RuntimeModeSummary
    demo_seed: DemoSeedSummary
    connectivity: ConnectivitySummary
    production_smoke: list[ProductionSmokeChecklistItem]
    deployment_guardrails: list[DeploymentGuardrailItem]
    smoke_profiles: list[SmokeProfileItem]
    sos_email: SosEmailDeliverySummary
    v1_2_audit: list[OperationCountBucket] = Field(default_factory=list)
    v1_4_audit: list[OperationCountBucket] = Field(default_factory=list)
    audit: AuditEventSummary

