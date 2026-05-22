from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.mood_checkins import (
    MoodCheckInCreate,
    MoodCheckInHistoryResponse,
    MoodCheckInOptionsResponse,
    MoodCheckInResponse,
)
from app.services.mood_checkins import (
    create_mood_checkin,
    get_mood_checkin_options,
    list_student_mood_checkins,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required

router = APIRouter()


def _require_student_with_privacy_ack(db: OrmSession, current_user: User) -> User:
    require_role(current_user, UserRole.STUDENT)
    if privacy_acknowledgement_required(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "privacy_ack_required", "notice_version": NOTICE_VERSION},
        )
    return current_user


@router.get("/options", response_model=MoodCheckInOptionsResponse)
def read_mood_checkin_options(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> MoodCheckInOptionsResponse:
    _require_student_with_privacy_ack(db, current_user)
    return get_mood_checkin_options(db)


@router.post("", response_model=MoodCheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_mood_checkin(
    payload: MoodCheckInCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodCheckInResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return create_mood_checkin(db, student, payload)


@router.get("/history", response_model=MoodCheckInHistoryResponse)
def read_mood_checkin_history(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> MoodCheckInHistoryResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    return list_student_mood_checkins(db, student)
