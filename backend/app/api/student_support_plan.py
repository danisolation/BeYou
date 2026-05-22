from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.support_plan import StudentSupportPlanResponse, SupportPlanUpsertRequest
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required
from app.services.support_plan import get_student_support_plan, upsert_student_support_plan

router = APIRouter()


def _require_student_with_privacy_ack(db: OrmSession, current_user: User) -> User:
    require_role(current_user, UserRole.STUDENT)
    if privacy_acknowledgement_required(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "privacy_ack_required", "notice_version": NOTICE_VERSION},
        )
    return current_user


@router.get("", response_model=StudentSupportPlanResponse)
def read_support_plan(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> StudentSupportPlanResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    return get_student_support_plan(db, student)


@router.put("", response_model=StudentSupportPlanResponse)
def save_support_plan(
    payload: SupportPlanUpsertRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StudentSupportPlanResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return upsert_student_support_plan(db, student, payload)
