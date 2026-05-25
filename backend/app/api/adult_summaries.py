from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.sessions import get_current_user
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.adult_summaries import AdultSelfCheckSummaryResponse, AdultSupportSummaryResponse
from app.services.adult_summaries import get_adult_self_check_summaries, get_adult_support_summary

router = APIRouter()


@router.get(
    "/teacher/students/{student_id}/self-check-summaries",
    response_model=AdultSelfCheckSummaryResponse,
)
def get_teacher_student_self_check_summaries(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdultSelfCheckSummaryResponse:
    require_role(current_user, UserRole.TEACHER)
    return get_adult_self_check_summaries(
        db,
        current_user,
        student_id,
        relationship_type=UserRole.TEACHER.value,
    )


@router.get(
    "/parent/students/{student_id}/self-check-summaries",
    response_model=AdultSelfCheckSummaryResponse,
)
def get_parent_student_self_check_summaries(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdultSelfCheckSummaryResponse:
    require_role(current_user, UserRole.PARENT)
    return get_adult_self_check_summaries(
        db,
        current_user,
        student_id,
        relationship_type=UserRole.PARENT.value,
    )


@router.get(
    "/teacher/students/{student_id}/support-summary",
    response_model=AdultSupportSummaryResponse,
)
def get_teacher_student_support_summary(
    student_id: uuid.UUID,
    reason_code: str | None = Query(default=None, max_length=64),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdultSupportSummaryResponse:
    require_role(current_user, UserRole.TEACHER)
    return get_adult_support_summary(
        db,
        current_user,
        student_id,
        relationship_type=UserRole.TEACHER.value,
        access_reason_code=reason_code,
    )


@router.get(
    "/parent/students/{student_id}/support-summary",
    response_model=AdultSupportSummaryResponse,
)
def get_parent_student_support_summary(
    student_id: uuid.UUID,
    reason_code: str | None = Query(default=None, max_length=64),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdultSupportSummaryResponse:
    require_role(current_user, UserRole.PARENT)
    return get_adult_support_summary(
        db,
        current_user,
        student_id,
        relationship_type=UserRole.PARENT.value,
        access_reason_code=reason_code,
    )
