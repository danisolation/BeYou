from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.core.config import Settings
from app.db.models import (
    InAppNotification,
    LinkStatus,
    SelfCheckAttempt,
    SosAlert,
    SosAlertStatus,
    SosSeverity,
    SosStatusEvent,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
)
from app.schemas.sos import (
    AdultLatestSummary,
    AdultSupportOverviewItem,
    InAppNotificationResponse,
    SosAlertCreate,
    SosAlertResponse,
    SosStatusUpdate,
    SosStudentContext,
)
from app.services.audit import record_audit_event
from app.services.sos_email import create_sos_email_deliveries

STATUS_SEQUENCE = [
    SosAlertStatus.SENT.value,
    SosAlertStatus.RECEIVED.value,
    SosAlertStatus.SUPPORTING.value,
    SosAlertStatus.COMPLETED.value,
]
NEXT_STATUS = dict(zip(STATUS_SEQUENCE, STATUS_SEQUENCE[1:], strict=False))
ACTIVE_SOS_STATUSES = {
    SosAlertStatus.SENT.value,
    SosAlertStatus.RECEIVED.value,
    SosAlertStatus.SUPPORTING.value,
}


def _student_context_from_alert(alert: SosAlert) -> SosStudentContext:
    return SosStudentContext(
        id=alert.student_id,
        full_name=alert.student_full_name_snapshot,
        school=alert.student_school_snapshot,
        class_name=alert.student_class_name_snapshot,
    )


def _student_context(student: User) -> SosStudentContext:
    return SosStudentContext(
        id=student.id,
        full_name=student.full_name,
        school=student.school,
        class_name=student.class_name,
    )


def _events(db: OrmSession, alert_id: uuid.UUID) -> list[SosStatusEvent]:
    return list(
        db.scalars(
            select(SosStatusEvent)
            .where(SosStatusEvent.alert_id == alert_id)
            .order_by(SosStatusEvent.created_at, SosStatusEvent.id)
        )
    )


def _alert_response(db: OrmSession, alert: SosAlert, *, include_events: bool = True) -> SosAlertResponse:
    return SosAlertResponse(
        id=alert.id,
        student=_student_context_from_alert(alert),
        severity=alert.severity,
        source=alert.source,
        note=alert.note,
        current_status=alert.current_status,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
        completed_at=alert.completed_at,
        status_events=_events(db, alert.id) if include_events else [],
        is_demo=alert.is_demo,
    )


def _relationship_type_for_role(role: str) -> str:
    if role == UserRole.TEACHER.value:
        return UserRole.TEACHER.value
    if role == UserRole.PARENT.value:
        return UserRole.PARENT.value
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")


def _relationship_check(role: str) -> str:
    if role == UserRole.TEACHER.value:
        return "linked_teacher"
    if role == UserRole.PARENT.value:
        return "linked_parent"
    return "own_student"


def _linked_students(db: OrmSession, adult: User, relationship_type: str) -> list[User]:
    rows = db.execute(
        select(StudentAdultLink, User)
        .join(User, User.id == StudentAdultLink.student_id)
        .where(
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
        .order_by(User.full_name)
        .limit(200)
    ).all()
    return [student for _, student in rows]


def _active_linked_adults(db: OrmSession, student_id: uuid.UUID) -> list[User]:
    rows = db.execute(
        select(StudentAdultLink, User)
        .join(User, User.id == StudentAdultLink.adult_id)
        .where(
            StudentAdultLink.student_id == student_id,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
            StudentAdultLink.relationship_type.in_([UserRole.TEACHER.value, UserRole.PARENT.value]),
        )
    ).all()
    return [adult for _, adult in rows]


def _notification_href(recipient: User, alert_id: uuid.UUID) -> str:
    if recipient.role == UserRole.TEACHER.value:
        return f"/teacher/sos-alerts/{alert_id}"
    if recipient.role == UserRole.PARENT.value:
        return f"/parent/sos-alerts/{alert_id}"
    return "/"


def _record_status_event(
    db: OrmSession,
    *,
    alert: SosAlert,
    actor: User,
    previous_status: str | None,
    new_status: str,
    note: str | None,
) -> SosStatusEvent:
    event = SosStatusEvent(
        alert_id=alert.id,
        actor_id=actor.id,
        actor_role=actor.role,
        previous_status=previous_status,
        new_status=new_status,
        note=note,
        is_demo=alert.is_demo,
    )
    db.add(event)
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="sos_status_changed",
        resource_type="sos_alert",
        resource_id=str(alert.id),
        status_value="success",
        reason="safety_escalation",
        metadata_summary={
            "student_id": str(alert.student_id),
            "previous_status": previous_status,
            "new_status": new_status,
            "actor_role": actor.role,
            "is_demo": alert.is_demo,
        },
        is_demo=alert.is_demo,
    )
    return event


def _record_sos_read(
    db: OrmSession,
    *,
    actor: User,
    resource_id: str,
    relationship_check: str,
    student_id: uuid.UUID | None,
    is_demo: bool,
) -> None:
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="sensitive_resource_read",
        resource_type="sos_alert",
        resource_id=resource_id,
        status_value="allowed",
        reason="safety_escalation",
        metadata_summary={
            "student_id": str(student_id) if student_id is not None else None,
            "relationship_check": relationship_check,
            "purpose_key": "safety_escalation",
            "decision": "sos_status_only",
        },
        is_demo=is_demo,
    )


def create_sos_alert(
    db: OrmSession,
    student: User,
    payload: SosAlertCreate,
    *,
    settings: Settings,
) -> SosAlertResponse:
    require_permission(
        db,
        student,
        resource_type="sos_alert",
        action="write",
        purpose="safety_escalation",
        student_id=student.id,
    )
    alert = SosAlert(
        student_id=student.id,
        student_full_name_snapshot=student.full_name,
        student_school_snapshot=student.school,
        student_class_name_snapshot=student.class_name,
        severity=payload.severity,
        source=payload.source,
        note=payload.note,
        current_status=SosAlertStatus.SENT.value,
        is_demo=student.is_demo,
    )
    db.add(alert)
    db.flush()
    _record_status_event(
        db,
        alert=alert,
        actor=student,
        previous_status=None,
        new_status=SosAlertStatus.SENT.value,
        note=None,
    )
    recipients = _active_linked_adults(db, student.id)
    for recipient in recipients:
        db.add(
            InAppNotification(
                recipient_id=recipient.id,
                actor_id=student.id,
                resource_type="sos_alert",
                resource_id=str(alert.id),
                title="Tín hiệu SOS mới",
                body="Có tín hiệu hỗ trợ mới từ học sinh được liên kết trong BeYou.",
                href=_notification_href(recipient, alert.id),
                is_demo=student.is_demo or recipient.is_demo,
            )
        )
    create_sos_email_deliveries(
        db,
        alert=alert,
        student=student,
        recipients=recipients,
        settings=settings,
    )
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="sos_alert_created",
        resource_type="sos_alert",
        resource_id=str(alert.id),
        status_value="success",
        reason="safety_escalation",
        metadata_summary={
            "student_id": str(student.id),
            "source": payload.source,
            "severity": payload.severity,
            "recipient_count": len(recipients),
            "initial_status": SosAlertStatus.SENT.value,
            "is_demo": alert.is_demo,
        },
        is_demo=alert.is_demo,
    )
    db.commit()
    db.refresh(alert)
    return _alert_response(db, alert)


def list_student_sos_alerts(db: OrmSession, student: User) -> list[SosAlertResponse]:
    require_permission(
        db,
        student,
        resource_type="sos_alert",
        action="read",
        purpose="safety_escalation",
        student_id=student.id,
    )
    alerts = list(
        db.scalars(
            select(SosAlert)
            .where(SosAlert.student_id == student.id)
            .order_by(SosAlert.created_at.desc(), SosAlert.id.desc())
            .limit(50)
        )
    )
    _record_sos_read(
        db,
        actor=student,
        resource_id=str(student.id),
        relationship_check="own_student",
        student_id=student.id,
        is_demo=student.is_demo,
    )
    db.commit()
    return [_alert_response(db, alert) for alert in alerts]


def get_student_sos_alert(db: OrmSession, student: User, alert_id: uuid.UUID) -> SosAlertResponse:
    alert = db.get(SosAlert, alert_id)
    if alert is None or alert.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy SOS.")
    require_permission(
        db,
        student,
        resource_type="sos_alert",
        action="read",
        purpose="safety_escalation",
        student_id=student.id,
    )
    _record_sos_read(
        db,
        actor=student,
        resource_id=str(alert.id),
        relationship_check="own_student",
        student_id=student.id,
        is_demo=alert.is_demo,
    )
    db.commit()
    return _alert_response(db, alert)


def list_adult_sos_alerts(
    db: OrmSession,
    adult: User,
    *,
    relationship_type: str,
    student_id: uuid.UUID | None = None,
) -> list[SosAlertResponse]:
    students = _linked_students(db, adult, relationship_type)
    student_ids = [student.id for student in students]
    if student_id is not None:
        require_permission(
            db,
            adult,
            resource_type="sos_alert",
            action="read",
            purpose="safety_escalation",
            student_id=student_id,
        )
        student_ids = [student_id]
    if not student_ids:
        return []
    alerts = list(
        db.scalars(
            select(SosAlert)
            .where(SosAlert.student_id.in_(student_ids))
            .order_by(SosAlert.created_at.desc(), SosAlert.id.desc())
            .limit(100)
        )
    )
    _record_sos_read(
        db,
        actor=adult,
        resource_id=str(student_id) if student_id is not None else str(adult.id),
        relationship_check=_relationship_check(adult.role),
        student_id=student_id,
        is_demo=all(student.is_demo for student in students) if students else adult.is_demo,
    )
    db.commit()
    return [_alert_response(db, alert) for alert in alerts]


def get_adult_sos_alert(db: OrmSession, adult: User, alert_id: uuid.UUID) -> SosAlertResponse:
    alert = db.get(SosAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy SOS.")
    require_permission(
        db,
        adult,
        resource_type="sos_alert",
        action="read",
        purpose="safety_escalation",
        student_id=alert.student_id,
    )
    _record_sos_read(
        db,
        actor=adult,
        resource_id=str(alert.id),
        relationship_check=_relationship_check(adult.role),
        student_id=alert.student_id,
        is_demo=alert.is_demo,
    )
    db.commit()
    return _alert_response(db, alert)


def update_sos_status(
    db: OrmSession,
    teacher: User,
    alert_id: uuid.UUID,
    payload: SosStatusUpdate,
) -> SosAlertResponse:
    alert = db.get(SosAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy SOS.")
    require_permission(
        db,
        teacher,
        resource_type="sos_alert",
        action="update",
        purpose="safety_escalation",
        student_id=alert.student_id,
    )
    expected_next = NEXT_STATUS.get(alert.current_status)
    if expected_next is None or payload.status != expected_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trạng thái SOS chỉ có thể được cập nhật theo đúng thứ tự hỗ trợ.",
        )
    previous_status = alert.current_status
    alert.current_status = payload.status
    alert.updated_at = utc_now()
    if payload.status == SosAlertStatus.COMPLETED.value:
        alert.completed_at = alert.updated_at
    _record_status_event(
        db,
        alert=alert,
        actor=teacher,
        previous_status=previous_status,
        new_status=payload.status,
        note=payload.note,
    )
    db.commit()
    db.refresh(alert)
    return _alert_response(db, alert)


def list_notifications(db: OrmSession, user: User) -> list[InAppNotificationResponse]:
    notifications = list(
        db.scalars(
            select(InAppNotification)
            .where(InAppNotification.recipient_id == user.id)
            .order_by(InAppNotification.created_at.desc(), InAppNotification.id.desc())
            .limit(50)
        )
    )
    return [InAppNotificationResponse.model_validate(notification) for notification in notifications]


def mark_notification_read(
    db: OrmSession,
    user: User,
    notification_id: uuid.UUID,
) -> InAppNotificationResponse:
    notification = db.get(InAppNotification, notification_id)
    if notification is None or notification.recipient_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông báo.")
    if notification.read_at is None:
        notification.read_at = utc_now()
        db.commit()
        db.refresh(notification)
    return InAppNotificationResponse.model_validate(notification)


def _latest_self_check(db: OrmSession, student_id: uuid.UUID) -> SelfCheckAttempt | None:
    return db.scalar(
        select(SelfCheckAttempt)
        .where(SelfCheckAttempt.student_id == student_id)
        .order_by(SelfCheckAttempt.completed_at.desc(), SelfCheckAttempt.id.desc())
    )


def _latest_sos(db: OrmSession, student_id: uuid.UUID) -> SosAlert | None:
    return db.scalar(
        select(SosAlert)
        .where(SosAlert.student_id == student_id)
        .order_by(SosAlert.created_at.desc(), SosAlert.id.desc())
    )


def _open_sos_count(db: OrmSession, student_id: uuid.UUID) -> int:
    return int(
        db.scalar(
            select(func.count(SosAlert.id)).where(
                SosAlert.student_id == student_id,
                SosAlert.current_status.in_(ACTIVE_SOS_STATUSES),
            )
        )
        or 0
    )


def _warning_group(latest_summary: SelfCheckAttempt | None, latest_alert: SosAlert | None) -> tuple[str, str]:
    if latest_alert is not None and latest_alert.current_status in ACTIVE_SOS_STATUSES:
        if latest_alert.severity == SosSeverity.URGENT.value:
            return "nguy_co_cao", "Nguy cơ cao"
        return "can_quan_tam", "Cần quan tâm"
    if latest_summary is not None:
        if latest_summary.state_label == "Can ho tro som":
            return "nguy_co_cao", "Nguy cơ cao"
        if latest_summary.state_label in {"Can chu y", "Nen tim ho tro"}:
            return "can_quan_tam", "Cần quan tâm"
    return "on_dinh", "Ổn định"


def _summary_response(attempt: SelfCheckAttempt | None) -> AdultLatestSummary | None:
    if attempt is None:
        return None
    return AdultLatestSummary(
        completed_at=attempt.completed_at,
        test_type=attempt.test_title_snapshot,
        state_label=attempt.state_label,
        advice_summary=attempt.advice_summary,
        support_suggestion=attempt.support_suggestion,
        is_demo=attempt.is_demo,
    )


def get_support_overview(
    db: OrmSession,
    adult: User,
    *,
    relationship_type: str | None = None,
) -> list[AdultSupportOverviewItem]:
    relationship = relationship_type or _relationship_type_for_role(adult.role)
    students = _linked_students(db, adult, relationship)
    items: list[AdultSupportOverviewItem] = []
    for student in students:
        require_permission(
            db,
            adult,
            resource_type="student_profile",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )
        latest_summary = _latest_self_check(db, student.id)
        latest_alert = _latest_sos(db, student.id)
        group, label = _warning_group(latest_summary, latest_alert)
        if latest_summary is not None:
            record_audit_event(
                db,
                actor=adult,
                actor_role=adult.role,
                action="sensitive_resource_read",
                resource_type="self_check_summary",
                resource_id=str(student.id),
                status_value="allowed",
                reason="support_not_surveillance",
                metadata_summary={
                    "student_id": str(student.id),
                    "relationship_check": _relationship_check(adult.role),
                    "purpose_key": "support_not_surveillance",
                    "decision": "summary_only",
                    "source": "support_overview",
                },
                is_demo=student.is_demo,
            )
        if latest_alert is not None:
            _record_sos_read(
                db,
                actor=adult,
                resource_id=str(latest_alert.id),
                relationship_check=_relationship_check(adult.role),
                student_id=student.id,
                is_demo=latest_alert.is_demo,
            )
        items.append(
            AdultSupportOverviewItem(
                student=_student_context(student),
                warning_group=group,
                warning_group_label=label,
                latest_self_check_summary=_summary_response(latest_summary),
                latest_sos_alert=_alert_response(db, latest_alert) if latest_alert is not None else None,
                open_sos_count=_open_sos_count(db, student.id),
                is_demo=student.is_demo,
            )
        )
    if items:
        db.commit()
    return items
