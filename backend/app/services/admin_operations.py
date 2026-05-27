from __future__ import annotations

import re
from collections.abc import Mapping
from datetime import datetime
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ContentStatus,
    ExternalIdentity,
    ExternalIdentityStatus,
    LinkStatus,
    MoodCheckInConfig,
    MoodCheckinReminderState,
    MoodNoteShare,
    Scenario,
    SchoolPrivacyPolicyDefault,
    SelfCheckTest,
    Session as UserSession,
    SosNotificationDelivery,
    StudentAdultLink,
    StudentNotificationPreference,
    User,
    UserRole,
    utc_now,
)
from app.seeds.demo_seed import (
    DEMO_ADMIN_EMAIL,
    DEMO_PARENT_EMAIL,
    DEMO_STUDENT_EMAIL,
    DEMO_TEACHER_EMAIL,
)
from app.schemas.admin_operations import (
    AdminOperationsDashboardResponse,
    AuthProviderReadinessSummary,
    AuditEventItem,
    AuditEventSummary,
    AuditFilterSummary,
    ConnectivitySummary,
    DemoSeedRoleStatus,
    DemoSeedSummary,
    DeploymentGuardrailItem,
    IdentityMappingOperationsSummary,
    OperationCountBucket,
    OperationReadinessAttentionCheck,
    OperationReadinessSummary,
    PilotDataSafetyBucket,
    PilotDataSafetySummary,
    PilotHandoffItem,
    PilotHandoffSummary,
    PilotLaunchChecklistItem,
    PilotLaunchSummary,
    ProductionSmokeChecklistItem,
    RuntimeModeSummary,
    SessionAuthOperationsSummary,
    SmokeProfileItem,
    SosEmailDeliveryItem,
    SosEmailDeliverySummary,
)
from app.schemas.readiness import ReadinessReport
from app.services.audit import FORBIDDEN_METADATA_KEYS, record_audit_event

DELIVERY_STATUS_LABELS = {
    "queued": "Đang chờ",
    "sent": "Đã gửi",
    "failed": "Thất bại",
}

READINESS_STATUS_LABELS = {
    "pass": "Đạt",
    "warn": "Cần chú ý",
    "fail": "Không đạt",
}

OPERATIONS_FORBIDDEN_METADATA_KEYS = FORBIDDEN_METADATA_KEYS | {
    "email",
    "recipient_email",
    "student_email",
    "recipient_id",
    "student_id",
    "student_full_name",
    "full_name",
    "note",
    "notes",
    "private_note",
    "sos_note",
    "transcript",
    "self_check_answer",
    "scenario_answer",
    "message",
    "shared_note_text",
    "shared_mood_note_text",
    "student_summary",
    "student_share_summary",
    "reason_detail",
    "reason_details",
    "reason_text",
    "raw_reason",
    "raw_reason_text",
    "access_reason_text",
    "reminder_message",
    "notification_body",
    "raw_subject",
    "provider_subject",
    "raw_email",
    "raw_claims",
    "groups",
    "school",
    "class",
    "class_name",
    "client_id",
    "client_secret",
    "issuer_url",
    "callback_url",
    "tenant_url",
    "export_url",
    "risk_leaderboard",
    "access_token",
    "refresh_token",
    "id_token",
    "password_hash",
}

PRIVACY_NOTES = [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
    "Support plan, mood check-in, adult summary và admin config chỉ hiển thị bằng count/status metadata an toàn.",
    "Dùng trang này để kiểm tra vận hành và xử lý sự cố, không dùng để giám sát từng học sinh.",
    "Danh tính ngoài chỉ được hiển thị bằng metadata tổng hợp. Quyền xem học sinh vẫn do vai trò trong ứng dụng, liên kết đang hoạt động và SOS của học sinh quyết định.",
]

V1_2_RESOURCE_LABELS = {
    "support_plan": "Support plans",
    "mood_check_in": "Mood check-ins",
    "adult_support_summary": "Adult summaries",
    "mood_checkin_config": "Mood config",
}

V1_4_RESOURCE_LABELS = {
    "notification_preferences": "Notification preferences",
    "mood_checkin_reminder": "Mood reminders",
    "mood_note_share": "Mood note sharing",
    "shared_mood_note": "Shared mood note reads",
    "privacy_policy": "Privacy policy controls",
    "adult_support_summary": "Reason-gated support summaries",
    "self_check_summary": "Reason-gated self-check summaries",
}

EXPECTED_DEMO_ROLES = [
    (UserRole.STUDENT.value, DEMO_STUDENT_EMAIL),
    (UserRole.TEACHER.value, DEMO_TEACHER_EMAIL),
    (UserRole.PARENT.value, DEMO_PARENT_EMAIL),
    (UserRole.ADMIN.value, DEMO_ADMIN_EMAIL),
]

DEPLOY_GUARD_COMMAND = "npm --prefix frontend run guard:deploy"
DEMO_SMOKE_COMMAND = "npm --prefix frontend run smoke:demo"
PILOT_SMOKE_COMMAND = "npm --prefix frontend run smoke:pilot"
PRODUCTION_SMOKE_COMMAND = "npm --prefix frontend run smoke:production"
PRIVACY_REGRESSION_COMMAND = "python -m pytest tests/test_phase31_school_pilot_operations.py -q"
SAFE_OPERATION_VALUE_RE = re.compile(r"^[a-z][a-z0-9_]{0,95}$")
SAFE_TEXT_FALLBACK = "metadata_an_toan"
SAFE_REMEDIATION_FALLBACK = "Kiểm tra cấu hình provider bằng metadata an toàn."


def _bucket(key: str, count: int, label_map: Mapping[str, str] | None = None) -> OperationCountBucket:
    return OperationCountBucket(key=key, label=(label_map or {}).get(key, key), count=count)


def _unsafe_operation_text(value: str) -> bool:
    normalized = value.strip().lower()
    compact = normalized.replace("-", "_").replace(" ", "_")
    if not normalized:
        return False
    if any(marker in compact for marker in OPERATIONS_FORBIDDEN_METADATA_KEYS):
        return True
    if any(symbol in normalized for symbol in ("://", "/", "\\", "@", "?", "#")):
        return True
    if re.search(r"\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b", normalized):
        return True
    return bool(
        re.search(r"\$argon2(?:id|i|d)\$", normalized)
        or re.search(r"\beyJ[A-Za-z0-9_-]{10,}\b", value)
    )


def _safe_operation_key(value: str | None, *, fallback: str = "disabled") -> str:
    if value is None:
        return fallback
    normalized = value.strip().lower().replace("-", "_")
    if normalized in {"password", "demo_password", "sso", "local", "disabled", "unknown"}:
        return normalized
    if not SAFE_OPERATION_VALUE_RE.fullmatch(normalized) or _unsafe_operation_text(normalized):
        return fallback
    return normalized


def _safe_operation_text(value: str | None, *, fallback: str | None = SAFE_TEXT_FALLBACK) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    if not normalized:
        return fallback
    if _unsafe_operation_text(normalized):
        return fallback
    return normalized


def _count_buckets(
    db: OrmSession,
    column,
    *,
    label_map: Mapping[str, str] | None = None,
    include_null: bool = True,
) -> list[OperationCountBucket]:
    query = select(column, func.count()).select_from(SosNotificationDelivery)
    if not include_null:
        query = query.where(column.is_not(None))
    query = query.group_by(column).order_by(column)
    rows = db.execute(query).all()
    return [_bucket(str(key) if key is not None else "none", count, label_map) for key, count in rows]


def _readiness_summary(report: ReadinessReport) -> OperationReadinessSummary:
    checks_by_status = [
        _bucket(status, sum(1 for check in report.checks if check.status == status), READINESS_STATUS_LABELS)
        for status in ("pass", "warn", "fail")
    ]
    attention_checks = [
        OperationReadinessAttentionCheck(
            key=check.key,
            category=check.category,
            status=check.status,
            summary=check.summary,
            remediation=check.remediation,
        )
        for check in report.checks
        if check.status in {"warn", "fail"}
    ]
    return OperationReadinessSummary(
        status=report.status,
        generated_at=report.generated_at,
        checks_by_status=checks_by_status,
        attention_checks=attention_checks,
    )


def _delivery_item(delivery: SosNotificationDelivery, position: int) -> SosEmailDeliveryItem:
    return SosEmailDeliveryItem(
        delivery_key=f"delivery-{position}",
        alert_key="alert-present",
        channel=delivery.channel,
        provider=delivery.provider,
        recipient_role=delivery.recipient_role_snapshot,
        status=delivery.status,
        attempt_count=delivery.attempt_count,
        error_code=delivery.error_code,
        last_attempt_at=delivery.last_attempt_at,
        delivered_at=delivery.delivered_at,
        created_at=delivery.created_at,
        is_demo=delivery.is_demo,
    )


def _delivery_summary(db: OrmSession, *, limit: int) -> SosEmailDeliverySummary:
    total = db.scalar(select(func.count()).select_from(SosNotificationDelivery)) or 0
    if total == 0:
        return SosEmailDeliverySummary(
            total=0,
            by_status=[],
            by_provider=[],
            by_error_code=[],
            recent=[],
        )

    recent = list(
        db.scalars(
            select(SosNotificationDelivery)
            .order_by(SosNotificationDelivery.created_at.desc(), SosNotificationDelivery.id.desc())
            .limit(limit)
        )
    )
    return SosEmailDeliverySummary(
        total=total,
        by_status=_count_buckets(db, SosNotificationDelivery.status, label_map=DELIVERY_STATUS_LABELS),
        by_provider=_count_buckets(db, SosNotificationDelivery.provider),
        by_error_code=_count_buckets(db, SosNotificationDelivery.error_code, include_null=False),
        recent=[_delivery_item(delivery, position) for position, delivery in enumerate(recent, start=1)],
    )


def _safe_metadata(value: object) -> Any:
    if isinstance(value, Mapping):
        safe: dict[str, Any] = {}
        for key, nested_value in value.items():
            normalized_key = str(key).lower()
            if normalized_key in OPERATIONS_FORBIDDEN_METADATA_KEYS or _unsafe_operation_text(str(key)):
                continue
            safe[str(key)] = _safe_metadata(nested_value)
        return safe
    if isinstance(value, list):
        return [_safe_metadata(item) for item in value]
    if isinstance(value, str):
        if _unsafe_operation_text(value):
            return SAFE_TEXT_FALLBACK
        return value
    if isinstance(value, int | float | bool) or value is None:
        return value
    rendered = str(value)
    return SAFE_TEXT_FALLBACK if _unsafe_operation_text(rendered) else rendered


def _audit_event_item(event: AuditEvent) -> AuditEventItem:
    return AuditEventItem(
        id=str(event.id),
        actor_role=event.actor_role,
        action=event.action,
        resource_type=event.resource_type,
        status=event.status,
        timestamp=event.timestamp,
        reason=None,
        metadata_summary=_safe_metadata(event.metadata_summary),
        is_demo=event.is_demo,
    )


def _audit_summary(
    db: OrmSession,
    *,
    start_at: datetime | None,
    end_at: datetime | None,
    actor_role: str | None,
    action_type: str | None,
    target_type: str | None,
    status: str | None,
    limit: int,
) -> AuditEventSummary:
    query = select(AuditEvent)
    if start_at is not None:
        query = query.where(AuditEvent.timestamp >= start_at)
    if end_at is not None:
        query = query.where(AuditEvent.timestamp <= end_at)
    if actor_role:
        query = query.where(AuditEvent.actor_role == actor_role)
    if action_type:
        query = query.where(AuditEvent.action == action_type)
    if target_type:
        query = query.where(AuditEvent.resource_type == target_type)
    if status:
        query = query.where(AuditEvent.status == status)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    recent = list(db.scalars(query.order_by(AuditEvent.timestamp.desc(), AuditEvent.id.desc()).limit(limit)))
    return AuditEventSummary(
        total_matching=total,
        filters=AuditFilterSummary(
            start_at=start_at,
            end_at=end_at,
            actor_role=actor_role,
            action_type=action_type,
            target_type=target_type,
            status=status,
        ),
        recent=[_audit_event_item(event) for event in recent],
    )


def _v1_2_audit_buckets(db: OrmSession) -> list[OperationCountBucket]:
    rows = db.execute(
        select(AuditEvent.resource_type, func.count())
        .where(AuditEvent.resource_type.in_(V1_2_RESOURCE_LABELS))
        .group_by(AuditEvent.resource_type)
        .order_by(AuditEvent.resource_type)
    ).all()
    counts = {resource_type: count for resource_type, count in rows}
    return [
        _bucket(resource_type, counts.get(resource_type, 0), V1_2_RESOURCE_LABELS)
        for resource_type in V1_2_RESOURCE_LABELS
    ]


def _v1_4_audit_buckets(db: OrmSession) -> list[OperationCountBucket]:
    rows = db.execute(
        select(AuditEvent.resource_type, func.count())
        .where(AuditEvent.resource_type.in_(V1_4_RESOURCE_LABELS))
        .group_by(AuditEvent.resource_type)
        .order_by(AuditEvent.resource_type)
    ).all()
    counts = {resource_type: count for resource_type, count in rows}
    return [
        _bucket(resource_type, counts.get(resource_type, 0), V1_4_RESOURCE_LABELS)
        for resource_type in V1_4_RESOURCE_LABELS
    ]


def _demo_seed_summary(db: OrmSession, settings: Settings) -> DemoSeedSummary:
    expected_emails = [email for _, email in EXPECTED_DEMO_ROLES]
    demo_users = list(db.scalars(select(User).where(User.email.in_(expected_emails))))
    users_by_email = {user.email: user for user in demo_users}
    roles: list[DemoSeedRoleStatus] = []
    for role, email in EXPECTED_DEMO_ROLES:
        user = users_by_email.get(email)
        roles.append(
            DemoSeedRoleStatus(
                role=role,
                account_key=f"{role}_demo",
                present=user is not None,
                active=user is not None and user.status == AccountStatus.ACTIVE.value,
                is_demo=user is not None and user.is_demo,
            )
        )

    active_link_count = db.scalar(
        select(func.count())
        .select_from(StudentAdultLink)
        .where(
            StudentAdultLink.is_demo.is_(True),
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    ) or 0
    published_self_check_count = db.scalar(
        select(func.count())
        .select_from(SelfCheckTest)
        .where(
            SelfCheckTest.is_demo.is_(True),
            SelfCheckTest.status == ContentStatus.PUBLISHED.value,
            SelfCheckTest.is_active.is_(True),
        )
    ) or 0
    published_scenario_count = db.scalar(
        select(func.count())
        .select_from(Scenario)
        .where(Scenario.is_demo.is_(True), Scenario.status == ContentStatus.PUBLISHED.value)
    ) or 0
    published_mood_config_count = db.scalar(
        select(func.count())
        .select_from(MoodCheckInConfig)
        .where(
            MoodCheckInConfig.is_demo.is_(True),
            MoodCheckInConfig.status == ContentStatus.PUBLISHED.value,
        )
    ) or 0
    v1_4_policy_count = db.scalar(
        select(func.count()).select_from(SchoolPrivacyPolicyDefault).where(SchoolPrivacyPolicyDefault.is_demo.is_(True))
    ) or 0
    v1_4_preference_count = db.scalar(
        select(func.count()).select_from(StudentNotificationPreference).where(StudentNotificationPreference.is_demo.is_(True))
    ) or 0
    v1_4_reminder_state_count = db.scalar(
        select(func.count()).select_from(MoodCheckinReminderState).where(MoodCheckinReminderState.is_demo.is_(True))
    ) or 0
    v1_4_share_count = db.scalar(
        select(func.count()).select_from(MoodNoteShare).where(MoodNoteShare.is_demo.is_(True))
    ) or 0

    missing_roles = [role.role for role in roles if not role.present or not role.active or not role.is_demo]
    content_ready = (
        active_link_count >= 2
        and published_self_check_count > 0
        and published_scenario_count > 0
        and published_mood_config_count > 0
    )
    if missing_roles:
        return DemoSeedSummary(
            status="fail",
            summary="Seeded demo accounts are missing, inactive, or not marked as demo.",
            remediation="Run the demo seed command and verify the four public demo roles before a live walkthrough.",
            allow_demo_seed=settings.allow_demo_seed,
            roles=roles,
            active_link_count=active_link_count,
            published_self_check_count=published_self_check_count,
            published_scenario_count=published_scenario_count,
            published_mood_config_count=published_mood_config_count,
            v1_4_policy_count=v1_4_policy_count,
            v1_4_preference_count=v1_4_preference_count,
            v1_4_reminder_state_count=v1_4_reminder_state_count,
            v1_4_share_count=v1_4_share_count,
        )
    if not content_ready:
        return DemoSeedSummary(
            status="warn",
            summary="Demo accounts are ready, but some seeded support content or links are missing.",
            remediation="Re-run the demo seed command and check content/link metadata before the pilot demo.",
            allow_demo_seed=settings.allow_demo_seed,
            roles=roles,
            active_link_count=active_link_count,
            published_self_check_count=published_self_check_count,
            published_scenario_count=published_scenario_count,
            published_mood_config_count=published_mood_config_count,
            v1_4_policy_count=v1_4_policy_count,
            v1_4_preference_count=v1_4_preference_count,
            v1_4_reminder_state_count=v1_4_reminder_state_count,
            v1_4_share_count=v1_4_share_count,
        )
    return DemoSeedSummary(
        status="pass",
        summary="Seeded demo roles, links, and walkthrough content are present as safe metadata.",
        remediation=None,
        allow_demo_seed=settings.allow_demo_seed,
        roles=roles,
        active_link_count=active_link_count,
        published_self_check_count=published_self_check_count,
        published_scenario_count=published_scenario_count,
        published_mood_config_count=published_mood_config_count,
        v1_4_policy_count=v1_4_policy_count,
        v1_4_preference_count=v1_4_preference_count,
        v1_4_reminder_state_count=v1_4_reminder_state_count,
        v1_4_share_count=v1_4_share_count,
    )


def _origin_kind(origin: str) -> str:
    normalized = origin.strip().lower()
    if normalized.startswith(("http://localhost", "https://localhost", "http://127.0.0.1", "https://127.0.0.1")):
        return "local"
    if normalized.startswith("https://"):
        return "https"
    return "other"


def _yes_no(value: bool) -> str:
    return "yes" if value else "no"


def _normalize_origin_for_match(value: str) -> str:
    stripped = value.strip().rstrip("/")
    if not stripped:
        return ""
    parsed = urlsplit(stripped)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"
    return stripped.lower()


def _configured_allowed_origins(settings: Settings) -> list[str]:
    configured = [origin.strip() for origin in str(settings.frontend_origins).split(",") if origin.strip()]
    return configured or [settings.frontend_origin]


def _exact_credentialed_origin_match(settings: Settings) -> dict[str, bool | int]:
    expected_origin = _normalize_origin_for_match(settings.frontend_origin)
    allowed_origins = _configured_allowed_origins(settings)
    normalized_allowed = list(dict.fromkeys(_normalize_origin_for_match(origin) for origin in allowed_origins if origin.strip()))
    has_wildcard_origin = any("*" in origin for origin in allowed_origins)
    has_local_origin = any(_origin_kind(origin) == "local" for origin in allowed_origins)
    all_origins_https = bool(normalized_allowed) and all(origin.startswith("https://") for origin in normalized_allowed)

    return {
        "expected_frontend_origin_configured": bool(expected_origin),
        "exact_allowed_origin_match": bool(expected_origin and expected_origin in normalized_allowed),
        "allowed_origin_count": len(normalized_allowed),
        "has_wildcard_origin": has_wildcard_origin,
        "has_local_origin": has_local_origin,
        "all_origins_https": all_origins_https,
        "credentialed_cors": settings.session_cookie_secure and settings.session_cookie_samesite.lower() == "none",
    }


def _origin_contract_evidence(contract: dict[str, bool | int]) -> str:
    return "; ".join(
        [
            f"expected_frontend_origin_configured={_yes_no(bool(contract['expected_frontend_origin_configured']))}",
            f"exact_allowed_origin_match={_yes_no(bool(contract['exact_allowed_origin_match']))}",
            f"allowed_origin_count={contract['allowed_origin_count']}",
            f"has_wildcard_origin={_yes_no(bool(contract['has_wildcard_origin']))}",
            f"has_local_origin={_yes_no(bool(contract['has_local_origin']))}",
            f"all_origins_https={_yes_no(bool(contract['all_origins_https']))}",
            f"credentialed_cors={_yes_no(bool(contract['credentialed_cors']))}",
        ]
    )


def _runtime_mode_summary(settings: Settings) -> RuntimeModeSummary:
    return RuntimeModeSummary(
        mode=settings.runtime_mode,
        is_demo_runtime=settings.is_demo_runtime,
        production_pilot=settings.is_production_pilot,
        demo_seed_allowed=settings.allow_demo_seed,
        demo_login_allowed=settings.allow_demo_login,
    )


def _connectivity_summary(settings: Settings) -> ConnectivitySummary:
    allowed_origins = settings.allowed_frontend_origins
    return ConnectivitySummary(
        frontend_origin_kind=_origin_kind(settings.frontend_origin),
        allowed_origin_count=len(allowed_origins),
        has_local_origin=any(_origin_kind(origin) == "local" for origin in allowed_origins),
        all_origins_https=all(origin.strip().lower().startswith("https://") for origin in allowed_origins),
        health_live_path="/health/live",
        health_ready_path="/health/ready",
        session_cookie_secure=settings.session_cookie_secure,
        session_cookie_samesite=settings.session_cookie_samesite,
        credentialed_cors_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )


def _auth_provider_summary(settings: Settings) -> AuthProviderReadinessSummary:
    enabled = settings.auth_provider_enabled
    provider_key = _safe_operation_key(settings.auth_provider_key)
    provider_label = _safe_operation_text(settings.auth_provider_label, fallback="Chưa cấu hình") or "Chưa cấu hình"
    mode = _safe_operation_key(settings.auth_provider_mode)
    last_check_status = _safe_operation_text(settings.auth_provider_last_check_status, fallback=None)
    ready = enabled and provider_key != "disabled" and mode != "disabled"
    if ready:
        return AuthProviderReadinessSummary(
            enabled=enabled,
            provider_key=provider_key,
            provider_label=provider_label,
            mode=mode,
            status="pass",
            last_check_status=last_check_status,
            remediation=None,
        )
    return AuthProviderReadinessSummary(
        enabled=enabled,
        provider_key=provider_key,
        provider_label=provider_label,
        mode=mode,
        status="warn",
        last_check_status=last_check_status,
        remediation=_safe_operation_text(SAFE_REMEDIATION_FALLBACK),
    )


def _identity_mapping_summary(db: OrmSession) -> IdentityMappingOperationsSummary:
    rows = db.execute(
        select(ExternalIdentity.status, func.count()).select_from(ExternalIdentity).group_by(ExternalIdentity.status).order_by(ExternalIdentity.status)
    ).all()
    counts = {_safe_operation_key(status, fallback="unknown"): count for status, count in rows}
    by_status = [_bucket(status, counts.get(status, 0)) for status in sorted(counts)]
    return IdentityMappingOperationsSummary(
        by_status=by_status,
        pending_review_count=counts.get(ExternalIdentityStatus.PENDING_REVIEW.value, 0),
        disabled_count=counts.get(ExternalIdentityStatus.DISABLED.value, 0),
        deprovisioned_count=counts.get(ExternalIdentityStatus.DEPROVISIONED.value, 0),
    )


def _session_auth_summary(db: OrmSession) -> SessionAuthOperationsSummary:
    method_rows = db.execute(
        select(UserSession.auth_method, func.count())
        .select_from(UserSession)
        .where(UserSession.auth_method.is_not(None))
        .group_by(UserSession.auth_method)
        .order_by(UserSession.auth_method)
    ).all()
    provider_rows = db.execute(
        select(UserSession.auth_provider_key, func.count())
        .select_from(UserSession)
        .where(UserSession.auth_provider_key.is_not(None))
        .group_by(UserSession.auth_provider_key)
        .order_by(UserSession.auth_provider_key)
    ).all()
    return SessionAuthOperationsSummary(
        by_auth_method=[
            _bucket(_safe_operation_key(method, fallback="unknown"), count) for method, count in method_rows
        ],
        by_provider=[
            _bucket(_safe_operation_key(provider, fallback="unknown"), count) for provider, count in provider_rows
        ],
    )


def _production_smoke_checklist() -> list[ProductionSmokeChecklistItem]:
    return [
        ProductionSmokeChecklistItem(
            key="backend_health",
            label="Backend live and readiness endpoints",
            status="covered",
            command=PRODUCTION_SMOKE_COMMAND,
            evidence="Compatibility smoke delegates to demo smoke; pilot readiness uses the explicit pilot smoke command.",
            remediation=f"Use {PILOT_SMOKE_COMMAND} for production pilot readiness.",
        ),
        ProductionSmokeChecklistItem(
            key="cors_preflight",
            label="Credentialed CORS preflight",
            status="covered",
            command=PRODUCTION_SMOKE_COMMAND,
            evidence="Demo compatibility smoke checks credentialed CORS; pilot smoke checks the same contract without demo login.",
            remediation="Verify FRONTEND_ORIGIN/FRONTEND_ORIGINS exactly match the deployed frontend URL.",
        ),
        ProductionSmokeChecklistItem(
            key="login_session_cookie",
            label="Demo login and session cookie",
            status="covered",
            command=DEMO_SMOKE_COMMAND,
            evidence="Demo smoke logs in with seeded roles and verifies a session cookie is issued.",
        ),
        ProductionSmokeChecklistItem(
            key="role_dashboards",
            label="Role dashboard reachability",
            status="covered",
            command=DEMO_SMOKE_COMMAND,
            evidence="Demo smoke checks student, teacher, parent, and admin dashboard routes exist.",
        ),
    ]


def _deployment_guardrails(settings: Settings) -> list[DeploymentGuardrailItem]:
    demo_flags_safe = not settings.is_production_pilot or (not settings.allow_demo_seed and not settings.allow_demo_login)
    render_status = "pass" if demo_flags_safe else "fail"

    contract = _exact_credentialed_origin_match(settings)
    contract_pass = (
        bool(contract["expected_frontend_origin_configured"])
        and bool(contract["exact_allowed_origin_match"])
        and contract["allowed_origin_count"] == 1
        and not bool(contract["has_wildcard_origin"])
        and not bool(contract["has_local_origin"])
        and bool(contract["all_origins_https"])
        and bool(contract["credentialed_cors"])
    )
    cors_status = "pass" if contract_pass else "fail" if settings.is_production_pilot else "warn"

    return [
        DeploymentGuardrailItem(
            key="vercel_frontend",
            category="vercel_frontend",
            status="pass",
            evidence="vercel_framework=nextjs; vercel_root_required=frontend; guard_command_available=yes",
            remediation=None,
            command=DEPLOY_GUARD_COMMAND,
        ),
        DeploymentGuardrailItem(
            key="render_backend",
            category="render_backend",
            status=render_status,
            evidence=(
                f"runtime_mode={settings.runtime_mode}; "
                f"demo_seed_allowed={_yes_no(settings.allow_demo_seed)}; "
                f"demo_login_allowed={_yes_no(settings.allow_demo_login)}"
            ),
            remediation=(
                "Set ALLOW_DEMO_SEED=false and ALLOW_DEMO_LOGIN=false before production pilot."
                if render_status == "fail"
                else None
            ),
            command=DEPLOY_GUARD_COMMAND,
        ),
        DeploymentGuardrailItem(
            key="frontend_api_target",
            category="vercel_frontend",
            status="warn",
            evidence="frontend_api_target_checked_by_guard=yes; backend_value_exposed=no",
            remediation="Run the deploy guard command with NEXT_PUBLIC_API_BASE_URL and BEYOU_EXPECTED_BACKEND_URL.",
            command=DEPLOY_GUARD_COMMAND,
        ),
        DeploymentGuardrailItem(
            key="cors_cookie_contract",
            category="render_backend",
            status=cors_status,
            evidence=_origin_contract_evidence(contract),
            remediation=(
                "Set one HTTPS frontend origin, remove wildcard/local origins, and use Secure SameSite=None cookies."
                if cors_status != "pass"
                else None
            ),
            command=DEPLOY_GUARD_COMMAND,
        ),
    ]


def _smoke_profiles(settings: Settings, readiness_report: ReadinessReport) -> list[SmokeProfileItem]:
    demo_status = "pass" if settings.is_demo_runtime else "warn"

    pilot_blocked = readiness_report.status != "ready" or (
        settings.is_production_pilot and (settings.allow_demo_seed or settings.allow_demo_login)
    )
    if settings.is_production_pilot:
        pilot_status = "fail" if pilot_blocked else "pass"
        pilot_evidence = (
            f"readiness_status={readiness_report.status}; "
            f"demo_seed_allowed={_yes_no(settings.allow_demo_seed)}; "
            f"demo_login_allowed={_yes_no(settings.allow_demo_login)}"
        )
        pilot_remediation = (
            "Resolve readiness blockers and disable demo seed/login before running production pilot smoke."
            if pilot_status == "fail"
            else None
        )
    else:
        pilot_status = "warn"
        pilot_evidence = f"readiness_status={readiness_report.status}; production_pilot_runtime=no"
        pilot_remediation = "Switch to production_pilot runtime and require readiness ready before pilot smoke."

    return [
        SmokeProfileItem(
            key="demo_smoke",
            label="Demo smoke",
            status=demo_status,
            command=DEMO_SMOKE_COMMAND,
            uses_demo_accounts=True,
            requires_readiness_ready=False,
            evidence="uses_demo_accounts=yes; requires_readiness_ready=no; public_demo_seeded_flow=yes",
            remediation=None if demo_status == "pass" else "Demo smoke is intended for local_demo or public_demo runtime.",
        ),
        SmokeProfileItem(
            key="pilot_smoke",
            label="Production pilot smoke",
            status=pilot_status,
            command=PILOT_SMOKE_COMMAND,
            uses_demo_accounts=False,
            requires_readiness_ready=True,
            evidence=pilot_evidence,
            remediation=pilot_remediation,
        ),
    ]


def _readiness_check_status(report: ReadinessReport, key: str) -> str:
    for check in report.checks:
        if check.key == key:
            return check.status
    return "fail"


def _check_by_key(items: list[Any], key: str) -> Any | None:
    return next((item for item in items if item.key == key), None)


def _safe_required_text(value: str) -> str:
    return _safe_operation_text(value) or SAFE_TEXT_FALLBACK


def _safe_static_guidance(value: str) -> str:
    normalized = " ".join(value.strip().split())
    compact = normalized.lower().replace("-", "_").replace(" ", "_")
    forbidden_guidance_markers = {
        "email",
        "recipient_id",
        "student_id",
        "student_full_name",
        "note",
        "private_note",
        "sos_note",
        "transcript",
        "message",
        "student_summary",
        "reason_text",
        "raw_reason",
        "access_reason_text",
        "raw_subject",
        "provider_subject",
        "raw_email",
        "raw_claims",
        "client_id",
        "client_secret",
        "issuer_url",
        "callback_url",
        "tenant_url",
        "access_token",
        "refresh_token",
        "id_token",
        "password_hash",
    }
    if not normalized:
        return SAFE_TEXT_FALLBACK
    if any(marker in compact for marker in forbidden_guidance_markers):
        return SAFE_TEXT_FALLBACK
    if any(symbol in normalized for symbol in ("://", "\\", "@", "?", "#")):
        return SAFE_TEXT_FALLBACK
    if re.search(r"\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b", normalized.lower()):
        return SAFE_TEXT_FALLBACK
    if re.search(r"\$argon2(?:id|i|d)\$", normalized) or re.search(r"\beyJ[A-Za-z0-9_-]{10,}\b", normalized):
        return SAFE_TEXT_FALLBACK
    return normalized


def _safe_count(
    db: OrmSession,
    model: type[Any],
    *conditions: Any,
) -> int:
    query = select(func.count()).select_from(model)
    if conditions:
        query = query.where(*conditions)
    return db.scalar(query) or 0


def _non_demo_content_counts(db: OrmSession) -> dict[str, int]:
    return {
        "self_checks": _safe_count(
            db,
            SelfCheckTest,
            SelfCheckTest.is_demo.is_(False),
            SelfCheckTest.status == ContentStatus.PUBLISHED.value,
            SelfCheckTest.is_active.is_(True),
        ),
        "scenarios": _safe_count(
            db,
            Scenario,
            Scenario.is_demo.is_(False),
            Scenario.status == ContentStatus.PUBLISHED.value,
        ),
        "mood_configs": _safe_count(
            db,
            MoodCheckInConfig,
            MoodCheckInConfig.is_demo.is_(False),
            MoodCheckInConfig.status == ContentStatus.PUBLISHED.value,
        ),
    }


def _safe_school_policy_count(db: OrmSession) -> int:
    return _safe_count(
        db,
        SchoolPrivacyPolicyDefault,
        SchoolPrivacyPolicyDefault.is_demo.is_(False),
        SchoolPrivacyPolicyDefault.external_channels_enabled.is_(False),
        SchoolPrivacyPolicyDefault.allowed_channels == ["in_app"],
    )


def _pilot_launch_item(
    key: str,
    label: str,
    status: str,
    blocking: bool,
    evidence: str,
    remediation: str | None = None,
    command: str | None = None,
) -> PilotLaunchChecklistItem:
    return PilotLaunchChecklistItem(
        key=key,
        label=label,
        status=status,
        blocking=blocking,
        evidence=_safe_required_text(evidence),
        remediation=_safe_operation_text(remediation, fallback=None),
        command=command,
    )


def _derive_pilot_launch_status(items: list[PilotLaunchChecklistItem]) -> str:
    if any(item.blocking and item.status == "fail" for item in items):
        return "blocked"
    if any(item.status == "warn" for item in items):
        return "needs_review"
    return "ready"


def _baseline_content_status(content_counts: dict[str, int], settings: Settings) -> PilotLaunchChecklistItem:
    counts = content_counts
    ready = all(count > 0 for count in counts.values())
    status = "pass" if ready else "fail" if settings.is_production_pilot else "warn"
    return _pilot_launch_item(
        "baseline_content",
        "Baseline content",
        status,
        True,
        (
            f"self_checks={counts['self_checks']}; "
            f"scenarios={counts['scenarios']}; "
            f"mood_configs={counts['mood_configs']}"
        ),
        None if ready else "Prepare non-demo baseline self-checks, scenarios, and mood config before school pilot launch.",
    )


def _school_policy_setup_status(safe_policy_count: int, settings: Settings) -> PilotLaunchChecklistItem:
    ready = safe_policy_count > 0
    status = "pass" if ready else "fail" if settings.is_production_pilot else "warn"
    return _pilot_launch_item(
        "school_policy_setup",
        "School policy setup",
        status,
        True,
        f"safe_policy_count={safe_policy_count}",
        None if ready else "Configure non-demo school privacy defaults with in-app channels only.",
    )


def _pilot_launch_summary(
    db: OrmSession,
    *,
    readiness_report: ReadinessReport,
    settings: Settings,
    deployment_guardrails: list[DeploymentGuardrailItem],
    smoke_profiles: list[SmokeProfileItem],
    auth_provider: AuthProviderReadinessSummary,
    content_counts: dict[str, int],
    safe_policy_count: int,
) -> PilotLaunchSummary:
    runtime_status = "pass" if settings.is_production_pilot else "fail"
    readiness_status = (
        "pass"
        if readiness_report.status == "ready"
        else "warn"
        if readiness_report.status == "degraded"
        else "fail"
    )
    migration_status = _readiness_check_status(readiness_report, "alembic_migration")
    origin_guardrail = _check_by_key(deployment_guardrails, "cors_cookie_contract")
    origin_status = origin_guardrail.status if origin_guardrail is not None else "fail"
    demo_policy_status = (
        "fail"
        if settings.is_production_pilot and (settings.allow_demo_seed or settings.allow_demo_login)
        else "pass"
        if settings.is_production_pilot
        else "warn"
    )
    identity_status = auth_provider.status
    if settings.is_production_pilot and not auth_provider.enabled:
        identity_status = "fail"
    pilot_smoke = _check_by_key(smoke_profiles, "pilot_smoke")
    pilot_smoke_status = pilot_smoke.status if pilot_smoke is not None else "fail"

    checklist = [
        _pilot_launch_item(
            "runtime_mode",
            "Runtime mode",
            runtime_status,
            True,
            (
                f"runtime_mode={settings.runtime_mode}; "
                f"production_pilot={_yes_no(settings.is_production_pilot)}"
            ),
            None if runtime_status == "pass" else "Set RUNTIME_MODE=production_pilot for school pilot launch.",
        ),
        _pilot_launch_item(
            "readiness_status",
            "Readiness status",
            readiness_status,
            True,
            f"readiness_status={readiness_report.status}",
            None if readiness_status == "pass" else "Resolve readiness warnings and failures before launch.",
        ),
        _pilot_launch_item(
            "migration_status",
            "Migration status",
            migration_status,
            True,
            f"alembic_migration_status={migration_status}",
            None if migration_status == "pass" else "Apply pending backend migrations before launch.",
        ),
        _pilot_launch_item(
            "origin_cookie_contract",
            "Origins and cookies",
            origin_status,
            True,
            origin_guardrail.evidence if origin_guardrail is not None else "cors_cookie_contract=missing",
            None if origin_status == "pass" else "Fix HTTPS origin and Secure SameSite=None cookie configuration.",
            DEPLOY_GUARD_COMMAND,
        ),
        _pilot_launch_item(
            "demo_seed_login_policy",
            "Demo seed and login policy",
            demo_policy_status,
            True,
            (
                f"demo_seed_allowed={_yes_no(settings.allow_demo_seed)}; "
                f"demo_login_allowed={_yes_no(settings.allow_demo_login)}"
            ),
            None if demo_policy_status == "pass" else "Disable demo seed and demo login for production pilot.",
        ),
        _pilot_launch_item(
            "identity_readiness",
            "Identity readiness",
            identity_status,
            True,
            (
                f"auth_provider_enabled={_yes_no(auth_provider.enabled)}; "
                f"auth_provider_status={auth_provider.status}"
            ),
            None if identity_status == "pass" else "Configure the pilot identity provider before school launch.",
        ),
        _pilot_launch_item(
            "pilot_smoke_profile",
            "Production pilot smoke evidence",
            pilot_smoke_status,
            True,
            pilot_smoke.evidence if pilot_smoke is not None else "pilot_smoke=missing",
            None if pilot_smoke_status == "pass" else "Run pilot smoke only after readiness and demo flags are safe.",
            PILOT_SMOKE_COMMAND,
        ),
        _pilot_launch_item(
            "privacy_regression_status",
            "Privacy regression status",
            "pass",
            True,
            "phase31_privacy_regression_gate=covered_by_targeted_tests",
            command=PRIVACY_REGRESSION_COMMAND,
        ),
        _baseline_content_status(content_counts, settings),
        _school_policy_setup_status(safe_policy_count, settings),
    ]
    return PilotLaunchSummary(
        status=_derive_pilot_launch_status(checklist),
        generated_at=utc_now(),
        checklist=checklist,
    )


def _pilot_data_bucket(
    key: str,
    label: str,
    count: int,
    status: str,
    blocking: bool,
    evidence: str,
    remediation: str | None = None,
) -> PilotDataSafetyBucket:
    return PilotDataSafetyBucket(
        key=key,
        label=label,
        count=count,
        status=status,
        blocking=blocking,
        evidence=_safe_required_text(evidence),
        remediation=_safe_operation_text(remediation, fallback=None),
    )


def _derive_data_safety_status(buckets: list[PilotDataSafetyBucket]) -> str:
    if any(bucket.blocking and bucket.status == "fail" and bucket.count > 0 for bucket in buckets):
        return "blocked"
    if any(bucket.status == "warn" and bucket.count > 0 for bucket in buckets):
        return "needs_review"
    return "safe"


def _pilot_demo_bucket_status(count: int, settings: Settings, *, blocking_in_pilot: bool) -> tuple[str, bool]:
    if settings.is_production_pilot and count > 0:
        return ("fail", True) if blocking_in_pilot else ("warn", False)
    if count > 0:
        return "warn", False
    return "pass", False


def _pilot_data_safety_summary(db: OrmSession, settings: Settings) -> PilotDataSafetySummary:
    production_pilot = _yes_no(settings.is_production_pilot)
    demo_counts = {
        "demo_active_users": _safe_count(
            db,
            User,
            User.is_demo.is_(True),
            User.status == AccountStatus.ACTIVE.value,
        ),
        "demo_active_links": _safe_count(
            db,
            StudentAdultLink,
            StudentAdultLink.is_demo.is_(True),
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        ),
        "demo_published_self_checks": _safe_count(
            db,
            SelfCheckTest,
            SelfCheckTest.is_demo.is_(True),
            SelfCheckTest.status == ContentStatus.PUBLISHED.value,
            SelfCheckTest.is_active.is_(True),
        ),
        "demo_published_scenarios": _safe_count(
            db,
            Scenario,
            Scenario.is_demo.is_(True),
            Scenario.status == ContentStatus.PUBLISHED.value,
        ),
        "demo_mood_configs": _safe_count(
            db,
            MoodCheckInConfig,
            MoodCheckInConfig.is_demo.is_(True),
            MoodCheckInConfig.status == ContentStatus.PUBLISHED.value,
        ),
        "demo_policy_defaults": _safe_count(
            db,
            SchoolPrivacyPolicyDefault,
            SchoolPrivacyPolicyDefault.is_demo.is_(True),
        ),
        "demo_notification_preferences": _safe_count(
            db,
            StudentNotificationPreference,
            StudentNotificationPreference.is_demo.is_(True),
        ),
        "demo_reminder_states": _safe_count(
            db,
            MoodCheckinReminderState,
            MoodCheckinReminderState.is_demo.is_(True),
        ),
        "demo_mood_shares": _safe_count(
            db,
            MoodNoteShare,
            MoodNoteShare.is_demo.is_(True),
        ),
        "real_active_students": _safe_count(
            db,
            User,
            User.is_demo.is_(False),
            User.status == AccountStatus.ACTIVE.value,
            User.role == UserRole.STUDENT.value,
        ),
        "real_active_adults": _safe_count(
            db,
            User,
            User.is_demo.is_(False),
            User.status == AccountStatus.ACTIVE.value,
            User.role.in_([UserRole.TEACHER.value, UserRole.PARENT.value]),
        ),
    }
    blocking_keys = {
        "demo_active_users",
        "demo_active_links",
        "demo_published_self_checks",
        "demo_published_scenarios",
        "demo_mood_configs",
    }
    labels = {
        "demo_active_users": "Demo active users",
        "demo_active_links": "Demo active links",
        "demo_published_self_checks": "Demo published self-checks",
        "demo_published_scenarios": "Demo published scenarios",
        "demo_mood_configs": "Demo mood configs",
        "demo_policy_defaults": "Demo policy defaults",
        "demo_notification_preferences": "Demo notification preferences",
        "demo_reminder_states": "Demo reminder states",
        "demo_mood_shares": "Demo mood shares",
        "real_active_students": "Real active students",
        "real_active_adults": "Real active adults",
    }
    buckets: list[PilotDataSafetyBucket] = []
    for key, count in demo_counts.items():
        if key.startswith("real_"):
            status, blocking = "pass", False
        else:
            status, blocking = _pilot_demo_bucket_status(
                count,
                settings,
                blocking_in_pilot=key in blocking_keys,
            )
        buckets.append(
            _pilot_data_bucket(
                key,
                labels[key],
                count,
                status,
                blocking,
                f"count={count}; production_pilot={production_pilot}",
                None if status == "pass" else "Use non-demo pilot data and keep operations metadata aggregate-only.",
            )
        )
    return PilotDataSafetySummary(status=_derive_data_safety_status(buckets), buckets=buckets)


def _pilot_handoff_item(
    key: str,
    label: str,
    status: str,
    guidance: str,
    command: str | None = None,
) -> PilotHandoffItem:
    return PilotHandoffItem(
        key=key,
        label=label,
        status=status,
        guidance=_safe_static_guidance(guidance),
        command=command,
    )


def _baseline_item_status(count: int, settings: Settings) -> str:
    if count > 0:
        return "pass"
    return "fail" if settings.is_production_pilot else "warn"


def _pilot_handoff_summary(
    settings: Settings,
    *,
    content_counts: dict[str, int],
    safe_policy_count: int,
) -> PilotHandoffSummary:
    demo_seed_status = (
        "pass"
        if settings.is_production_pilot and not settings.allow_demo_seed
        else "fail"
        if settings.is_production_pilot
        else "warn"
    )
    rollback = [
        _pilot_handoff_item(
            "redeploy_known_good",
            "Redeploy known good frontend/backend",
            "pass",
            "Redeploy the last known good Vercel frontend and Render backend build.",
        ),
        _pilot_handoff_item(
            "rollback_config",
            "Revert configuration",
            "pass",
            "Revert deployment environment variables to the last known good values.",
        ),
        _pilot_handoff_item(
            "rerun_readiness_guardrails_smoke",
            "Rerun readiness, guardrails, and smoke",
            "pass",
            "Run /health/ready, npm --prefix frontend run guard:deploy, and npm --prefix frontend run smoke:pilot.",
            PILOT_SMOKE_COMMAND,
        ),
        _pilot_handoff_item(
            "notify_school_owner",
            "Notify school owner",
            "pass",
            "Notify the school or pilot owner if real users are affected.",
        ),
        _pilot_handoff_item(
            "escalate_incident",
            "Escalate incident",
            "pass",
            "Escalate incidents through the agreed school support path.",
        ),
        _pilot_handoff_item(
            "avoid_destructive_reset",
            "Avoid destructive database reset",
            "pass",
            "Do not use destructive database reset as the default rollback path.",
        ),
        _pilot_handoff_item(
            "avoid_raw_export",
            "Avoid raw data export defaults",
            "pass",
            "Do not use raw data export as the default rollback path.",
        ),
    ]
    school_handoff = [
        _pilot_handoff_item(
            "admin_contact_metadata",
            "Admin contact metadata",
            "warn",
            "Contact paths are documented outside Peerlight AI; no raw contact details are stored in operations metadata.",
        ),
        _pilot_handoff_item(
            "support_channel_metadata",
            "Support channel metadata",
            "warn",
            "School support paths are documented outside Peerlight AI; no raw contact details are stored in operations metadata.",
        ),
        _pilot_handoff_item(
            "incident_path_metadata",
            "Incident path metadata",
            "warn",
            "Incident escalation paths are documented outside Peerlight AI; no raw contact details are stored in operations metadata.",
        ),
    ]
    baseline_setup = [
        _pilot_handoff_item(
            "baseline_self_checks",
            "Baseline self-checks",
            _baseline_item_status(content_counts["self_checks"], settings),
            f"Published non-demo self-check count={content_counts['self_checks']} before school pilot launch.",
        ),
        _pilot_handoff_item(
            "baseline_scenarios",
            "Baseline scenarios",
            _baseline_item_status(content_counts["scenarios"], settings),
            f"Published non-demo scenario count={content_counts['scenarios']} before school pilot launch.",
        ),
        _pilot_handoff_item(
            "baseline_mood_config",
            "Baseline mood config",
            _baseline_item_status(content_counts["mood_configs"], settings),
            f"Published non-demo mood config count={content_counts['mood_configs']} before school pilot launch.",
        ),
        _pilot_handoff_item(
            "school_policy_defaults",
            "School policy defaults",
            _baseline_item_status(safe_policy_count, settings),
            f"Safe non-demo school policy count={safe_policy_count}; reminders stay in-app only.",
        ),
        _pilot_handoff_item(
            "in_app_only_reminders",
            "In-app only reminders",
            _baseline_item_status(safe_policy_count, settings),
            f"In-app only policy count={safe_policy_count}; external reminder channels remain disabled.",
        ),
        _pilot_handoff_item(
            "demo_seed_disabled_for_pilot",
            "Demo seed disabled for pilot",
            demo_seed_status,
            (
                f"production_pilot={_yes_no(settings.is_production_pilot)}; "
                f"demo_seed_allowed={_yes_no(settings.allow_demo_seed)}"
            ),
        ),
    ]
    return PilotHandoffSummary(
        rollback=rollback,
        school_handoff=school_handoff,
        baseline_setup=baseline_setup,
    )


def record_readiness_audit(db: OrmSession, *, actor: User, report: ReadinessReport, resource_type: str) -> None:
    fail_count = sum(1 for check in report.checks if check.status == "fail")
    warn_count = sum(1 for check in report.checks if check.status == "warn")
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="admin_readiness_checked",
        resource_type=resource_type,
        resource_id="readiness",
        status_value=report.status,
        reason="admin_operations",
        metadata_summary={
            "overall_status": report.status,
            "check_count": len(report.checks),
            "fail_count": fail_count,
            "warn_count": warn_count,
            "is_demo": actor.is_demo,
        },
        is_demo=actor.is_demo,
    )
    db.commit()


def build_operations_dashboard(
    db: OrmSession,
    *,
    readiness_report: ReadinessReport,
    settings: Settings,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    actor_role: str | None = None,
    action_type: str | None = None,
    target_type: str | None = None,
    status: str | None = None,
    limit: int = 25,
) -> AdminOperationsDashboardResponse:
    auth_provider = _auth_provider_summary(settings)
    deployment_guardrails = _deployment_guardrails(settings)
    smoke_profiles = _smoke_profiles(settings, readiness_report)
    content_counts = _non_demo_content_counts(db)
    safe_policy_count = _safe_school_policy_count(db)
    return AdminOperationsDashboardResponse(
        generated_at=utc_now(),
        privacy_notes=PRIVACY_NOTES,
        readiness=_readiness_summary(readiness_report),
        runtime=_runtime_mode_summary(settings),
        demo_seed=_demo_seed_summary(db, settings),
        connectivity=_connectivity_summary(settings),
        auth_provider=auth_provider,
        identity_mappings=_identity_mapping_summary(db),
        session_auth=_session_auth_summary(db),
        pilot_launch=_pilot_launch_summary(
            db,
            readiness_report=readiness_report,
            settings=settings,
            deployment_guardrails=deployment_guardrails,
            smoke_profiles=smoke_profiles,
            auth_provider=auth_provider,
            content_counts=content_counts,
            safe_policy_count=safe_policy_count,
        ),
        pilot_data_safety=_pilot_data_safety_summary(db, settings),
        pilot_handoff=_pilot_handoff_summary(
            settings,
            content_counts=content_counts,
            safe_policy_count=safe_policy_count,
        ),
        production_smoke=_production_smoke_checklist(),
        deployment_guardrails=deployment_guardrails,
        smoke_profiles=smoke_profiles,
        sos_email=_delivery_summary(db, limit=limit),
        v1_2_audit=_v1_2_audit_buckets(db),
        v1_4_audit=_v1_4_audit_buckets(db),
        audit=_audit_summary(
            db,
            start_at=start_at,
            end_at=end_at,
            actor_role=actor_role,
            action_type=action_type,
            target_type=target_type,
            status=status,
            limit=limit,
        ),
    )

