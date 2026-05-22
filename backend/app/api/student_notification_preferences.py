from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.privacy_controls import (
    StudentNotificationPreferenceResponse,
    StudentNotificationPreferenceUpdate,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required
from app.services.privacy_controls import (
    read_student_notification_preference,
    update_student_notification_preference,
)

router = APIRouter()


def _require_student_with_privacy_ack(db: OrmSession, current_user: User) -> User:
    require_role(current_user, UserRole.STUDENT)
    if privacy_acknowledgement_required(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "privacy_ack_required", "notice_version": NOTICE_VERSION},
        )
    return current_user


@router.get("", response_model=StudentNotificationPreferenceResponse)
def read_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> StudentNotificationPreferenceResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    return read_student_notification_preference(db, student=student)


@router.put("", response_model=StudentNotificationPreferenceResponse)
def update_notification_preferences(
    payload: StudentNotificationPreferenceUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StudentNotificationPreferenceResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return update_student_notification_preference(db, student=student, payload=payload)
