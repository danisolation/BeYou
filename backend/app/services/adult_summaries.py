from __future__ import annotations

import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import SelfCheckAttempt, User, UserRole, utc_now
from app.schemas.adult_summaries import (
    AdultSelfCheckSummaryItem,
    AdultSelfCheckSummaryResponse,
    AdultStudentContext,
)
from app.services.audit import record_audit_event

RECENT_SUMMARY_LIMIT = 5
RECENT_SUMMARY_DAYS = 30


def _relationship_check(relationship_type: str) -> str:
    if relationship_type == UserRole.TEACHER.value:
        return "linked_teacher"
    if relationship_type == UserRole.PARENT.value:
        return "linked_parent"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")


def _summary_item(attempt: SelfCheckAttempt) -> AdultSelfCheckSummaryItem:
    return AdultSelfCheckSummaryItem(
        completed_at=attempt.completed_at,
        test_type=attempt.test_title_snapshot,
        state_label=attempt.state_label,
        advice_summary=attempt.advice_summary,
        support_suggestion=attempt.support_suggestion,
        is_demo=attempt.is_demo,
    )


def get_adult_self_check_summaries(
    db: OrmSession,
    adult: User,
    student_id: uuid.UUID,
    relationship_type: str,
) -> AdultSelfCheckSummaryResponse:
    relationship_check = _relationship_check(relationship_type)
    require_permission(
        db,
        adult,
        resource_type="self_check_summary",
        action="read",
        purpose="support_not_surveillance",
        student_id=student_id,
    )

    student = db.get(User, student_id)
    if student is None or student.role != UserRole.STUDENT.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy học sinh.")

    attempts = list(
        db.scalars(
            select(SelfCheckAttempt)
            .where(SelfCheckAttempt.student_id == student_id)
            .order_by(SelfCheckAttempt.completed_at.desc(), SelfCheckAttempt.id.desc())
        )
    )
    latest_summary = _summary_item(attempts[0]) if attempts else None
    recent_cutoff = utc_now() - timedelta(days=RECENT_SUMMARY_DAYS)
    recent_summaries = [
        _summary_item(attempt)
        for attempt in attempts
        if attempt.completed_at >= recent_cutoff
    ][:RECENT_SUMMARY_LIMIT]

    record_audit_event(
        db,
        actor=adult,
        actor_role=adult.role,
        action="sensitive_resource_read",
        resource_type="self_check_summary",
        resource_id=str(student_id),
        status_value="allowed",
        reason="support_not_surveillance",
        metadata_summary={
            "student_id": str(student_id),
            "relationship_check": relationship_check,
            "purpose_key": "support_not_surveillance",
            "decision": "summary_only",
        },
        is_demo=student.is_demo,
    )
    db.commit()

    return AdultSelfCheckSummaryResponse(
        student=AdultStudentContext(
            id=student.id,
            full_name=student.full_name,
            school=student.school,
            class_name=student.class_name,
        ),
        latest_summary=latest_summary,
        recent_summaries=recent_summaries,
        is_demo=student.is_demo,
    )
