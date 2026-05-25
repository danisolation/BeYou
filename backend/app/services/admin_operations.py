from __future__ import annotations

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
    LinkStatus,
    MoodCheckInConfig,
    MoodCheckinReminderState,
    MoodNoteShare,
    Scenario,
    SchoolPrivacyPolicyDefault,
    SelfCheckTest,
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
    AuditEventItem,
    AuditEventSummary,
    AuditFilterSummary,
    ConnectivitySummary,
    DemoSeedRoleStatus,
    DemoSeedSummary,
    DeploymentGuardrailItem,
    OperationCountBucket,
    OperationReadinessAttentionCheck,
    OperationReadinessSummary,
    ProductionSmokeChecklistItem,
    RuntimeModeSummary,
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
    "sos_note",
    "transcript",
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
}

PRIVACY_NOTES = [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
    "Support plan, mood check-in, adult summary và admin config chỉ hiển thị bằng count/status metadata an toàn.",
    "Dùng trang này để kiểm tra vận hành và xử lý sự cố, không dùng để giám sát từng học sinh.",
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


def _bucket(key: str, count: int, label_map: Mapping[str, str] | None = None) -> OperationCountBucket:
    return OperationCountBucket(key=key, label=(label_map or {}).get(key, key), count=count)


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
            if normalized_key in OPERATIONS_FORBIDDEN_METADATA_KEYS:
                continue
            safe[str(key)] = _safe_metadata(nested_value)
        return safe
    if isinstance(value, list):
        return [_safe_metadata(item) for item in value]
    if isinstance(value, str | int | float | bool) or value is None:
        return value
    return str(value)


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
    roles: list[DemoSeedRoleStatus] = []
    for role, email in EXPECTED_DEMO_ROLES:
        user = db.scalar(select(User).where(User.email == email))
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
    return AdminOperationsDashboardResponse(
        generated_at=utc_now(),
        privacy_notes=PRIVACY_NOTES,
        readiness=_readiness_summary(readiness_report),
        runtime=_runtime_mode_summary(settings),
        demo_seed=_demo_seed_summary(db, settings),
        connectivity=_connectivity_summary(settings),
        production_smoke=_production_smoke_checklist(),
        deployment_guardrails=_deployment_guardrails(settings),
        smoke_profiles=_smoke_profiles(settings, readiness_report),
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

