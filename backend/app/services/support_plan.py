from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import (
    AccountStatus,
    LinkStatus,
    StudentAdultLink,
    StudentSupportPlan,
    StudentSupportPlanAdult,
    SupportPlanStatus,
    User,
    UserRole,
    utc_now,
)
from app.schemas.support_plan import (
    StudentSupportPlanResponse,
    SupportPlanDetail,
    SupportPlanLinkedAdult,
    SupportPlanSelectedAdult,
    SupportPlanUpsertRequest,
)
from app.services.audit import record_audit_event

SUPPORT_PLAN_PRIVACY_NOTES = [
    "Kế hoạch này chỉ gồm phần em chọn để chia sẻ với người lớn tin tưởng.",
    "Ghi chú mood, câu trả lời test tâm lý và nội dung trò chuyện riêng tư không tự động được chia sẻ.",
    "Em có thể tạm dừng hoặc ngừng chia sẻ kế hoạch bất cứ lúc nào.",
]


def _active_linked_adult_rows(
    db: OrmSession, student_id: uuid.UUID
) -> list[tuple[StudentAdultLink, User]]:
    return list(
        db.execute(
            select(StudentAdultLink, User)
            .join(User, User.id == StudentAdultLink.adult_id)
            .where(
                StudentAdultLink.student_id == student_id,
                StudentAdultLink.status == LinkStatus.ACTIVE.value,
            )
            .order_by(User.full_name.asc(), User.email.asc())
        ).all()
    )


def _available_adults(db: OrmSession, student: User) -> list[SupportPlanLinkedAdult]:
    adults = db.scalars(
        select(User)
        .where(User.role.in_([UserRole.TEACHER.value, UserRole.PARENT.value]))
        .where(User.status == AccountStatus.ACTIVE.value)
        .order_by(User.full_name.asc(), User.email.asc())
    ).all()
    return [
        SupportPlanLinkedAdult(
            id=adult.id,
            full_name=adult.full_name,
            email=adult.email,
            relationship_type=adult.role, # pyright: ignore
            is_demo=adult.is_demo,
        )
        for adult in adults
    ]


def _selected_adults(plan: StudentSupportPlan) -> list[SupportPlanSelectedAdult]:
    return [
        SupportPlanSelectedAdult(
            id=adult.adult_id,
            full_name=adult.adult_full_name_snapshot,
            relationship_type=adult.relationship_type_snapshot,
            is_demo=adult.is_demo,
        )
        for adult in sorted(
            plan.selected_adults, key=lambda item: (item.adult_full_name_snapshot, str(item.id))
        )
    ]


def _plan_detail(plan: StudentSupportPlan | None) -> SupportPlanDetail | None:
    if plan is None:
        return None
    return SupportPlanDetail(
        id=plan.id,
        status=plan.status,
        what_helps=plan.what_helps,
        what_does_not_help=plan.what_does_not_help,
        preferred_contact_method=plan.preferred_contact_method,
        safe_contact_times=plan.safe_contact_times,
        shareable_note=plan.shareable_note,
        selected_adults=_selected_adults(plan),
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        paused_at=plan.paused_at,
        deactivated_at=plan.deactivated_at,
        is_demo=plan.is_demo,
    )


def get_student_support_plan(db: OrmSession, student: User) -> StudentSupportPlanResponse:
    require_permission(
        db,
        student,
        resource_type="support_plan",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    plan = db.scalar(select(StudentSupportPlan).where(StudentSupportPlan.student_id == student.id))
    return StudentSupportPlanResponse(
        plan=_plan_detail(plan),
        available_adults=_available_adults(db, student),
        privacy_notes=SUPPORT_PLAN_PRIVACY_NOTES,
        is_demo=student.is_demo,
    )


def _validate_selected_adults(
    db: OrmSession,
    student: User,
    adult_ids: list[uuid.UUID],
    status_value: str,
) -> list[User]:
    if status_value == SupportPlanStatus.ACTIVE.value and not adult_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Kế hoạch đang bật cần ít nhất một người lớn tin tưởng.",
        )

    if not adult_ids:
        return []

    adults = db.scalars(
        select(User)
        .where(User.id.in_(adult_ids))
        .where(User.role.in_([UserRole.TEACHER.value, UserRole.PARENT.value]))
        .where(User.status == AccountStatus.ACTIVE.value)
    ).all()

    found_ids = {adult.id for adult in adults}
    missing = [adult_id for adult_id in adult_ids if adult_id not in found_ids]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Người lớn không hợp lệ hoặc đã bị khóa tài khoản.",
        )
    return list(adults)


def _apply_lifecycle(plan: StudentSupportPlan, status_value: str) -> None:
    now = utc_now()
    plan.status = status_value
    if status_value == SupportPlanStatus.ACTIVE.value:
        plan.paused_at = None
        plan.deactivated_at = None
    elif status_value == SupportPlanStatus.PAUSED.value:
        plan.paused_at = plan.paused_at or now
        plan.deactivated_at = None
    elif status_value == SupportPlanStatus.DEACTIVATED.value:
        plan.deactivated_at = plan.deactivated_at or now


def upsert_student_support_plan(
    db: OrmSession,
    student: User,
    payload: SupportPlanUpsertRequest,
) -> StudentSupportPlanResponse:
    require_permission(
        db,
        student,
        resource_type="support_plan",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    selected_rows = _validate_selected_adults(db, student, payload.adult_ids, payload.status)
    plan = db.scalar(select(StudentSupportPlan).where(StudentSupportPlan.student_id == student.id))
    created = plan is None
    if plan is None:
        plan = StudentSupportPlan(student_id=student.id, is_demo=student.is_demo)
        db.add(plan)
        db.flush()

    plan.what_helps = payload.what_helps
    plan.what_does_not_help = payload.what_does_not_help
    plan.preferred_contact_method = payload.preferred_contact_method
    plan.safe_contact_times = payload.safe_contact_times
    plan.shareable_note = payload.shareable_note
    plan.is_demo = student.is_demo
    _apply_lifecycle(plan, payload.status)

    db.execute(
        delete(StudentSupportPlanAdult).where(StudentSupportPlanAdult.support_plan_id == plan.id)
    )
    db.flush()
    plan.selected_adults = [
        StudentSupportPlanAdult(
            support_plan_id=plan.id,
            adult_id=adult.id,
            relationship_type_snapshot=adult.role,
            adult_full_name_snapshot=adult.full_name,
            is_demo=student.is_demo and adult.is_demo,
        )
        for adult in selected_rows
    ]
    db.flush()

    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="support_plan_created" if created else "support_plan_updated",
        resource_type="support_plan",
        resource_id=str(plan.id),
        status_value="success",
        reason="student_owned_support_plan",
        metadata_summary={
            "student_id": str(student.id),
            "status": plan.status,
            "selected_adult_count": len(selected_rows),
            "selected_relationship_types": sorted(
                {link.relationship_type for link, _ in selected_rows}
            ),
            "has_what_helps": payload.what_helps is not None,
            "has_what_does_not_help": payload.what_does_not_help is not None,
            "has_preferred_contact_method": payload.preferred_contact_method is not None,
            "has_safe_contact_times": payload.safe_contact_times is not None,
            "has_shareable_note": payload.shareable_note is not None,
            "decision": "metadata_only",
        },
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(plan)
    return get_student_support_plan(db, student)
