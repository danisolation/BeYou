from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.privacy_controls import (
    MoodCheckInReminderResponse,
    MoodReminderActionResponse,
    MoodReminderSnoozeRequest,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required
from app.services.privacy_controls import (
    dismiss_mood_checkin_reminder,
    get_mood_checkin_reminder,
    open_mood_checkin_reminder,
    snooze_mood_checkin_reminder,
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


@router.get("/mood-check-in", response_model=MoodCheckInReminderResponse)
def read_mood_checkin_reminder(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> MoodCheckInReminderResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    return get_mood_checkin_reminder(db, student=student)


@router.post("/mood-check-in/dismiss", response_model=MoodReminderActionResponse)
def dismiss_reminder(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodReminderActionResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return dismiss_mood_checkin_reminder(db, student=student)


@router.post("/mood-check-in/snooze", response_model=MoodReminderActionResponse)
def snooze_reminder(
    payload: MoodReminderSnoozeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodReminderActionResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return snooze_mood_checkin_reminder(db, student=student, payload=payload)


@router.post("/mood-check-in/open", response_model=MoodReminderActionResponse)
def open_reminder(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodReminderActionResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return open_mood_checkin_reminder(db, student=student)
