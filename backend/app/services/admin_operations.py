from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import AuditEvent, SosNotificationDelivery, User, utc_now
from app.schemas.admin_operations import (
    AdminOperationsDashboardResponse,
    AuditEventItem,
    AuditEventSummary,
    AuditFilterSummary,
    OperationCountBucket,
    OperationReadinessAttentionCheck,
    OperationReadinessSummary,
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
}

PRIVACY_NOTES = [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời tự kiểm tra, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
    "Support plan, mood check-in, adult summary và admin config chỉ hiển thị bằng count/status metadata an toàn.",
    "Dùng trang này để kiểm tra vận hành và xử lý sự cố, không dùng để giám sát từng học sinh.",
]

V1_2_RESOURCE_LABELS = {
    "support_plan": "Support plans",
    "mood_check_in": "Mood check-ins",
    "adult_support_summary": "Adult summaries",
    "mood_checkin_config": "Mood config",
}


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


def _delivery_item(delivery: SosNotificationDelivery) -> SosEmailDeliveryItem:
    return SosEmailDeliveryItem(
        id=str(delivery.id),
        alert_id=str(delivery.alert_id),
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
        recent=[_delivery_item(delivery) for delivery in recent],
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
        resource_id=event.resource_id,
        status=event.status,
        timestamp=event.timestamp,
        reason=event.reason,
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
        sos_email=_delivery_summary(db, limit=limit),
        v1_2_audit=_v1_2_audit_buckets(db),
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

