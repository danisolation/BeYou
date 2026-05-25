from __future__ import annotations

import uuid

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
from app.schemas.mood_note_shares import (
    MoodNoteRevokeResponse,
    MoodNoteShareOptionsResponse,
    MoodNoteShareRequest,
    MoodNoteShareResponse,
)
from app.services.mood_checkins import (
    create_mood_checkin,
    get_mood_checkin_options,
    list_student_mood_checkins,
)
from app.services.mood_note_shares import (
    create_or_update_mood_note_shares,
    list_share_options,
    revoke_all_mood_note_shares,
    revoke_mood_note_share,
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


@router.get("/share-options", response_model=MoodNoteShareOptionsResponse)
def read_mood_note_share_options(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> MoodNoteShareOptionsResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    return list_share_options(db, student)


@router.post("/{checkin_id}/shares", response_model=MoodNoteShareResponse)
def share_mood_checkin_note(
    checkin_id: uuid.UUID,
    payload: MoodNoteShareRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodNoteShareResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return create_or_update_mood_note_shares(db, student, checkin_id, payload)


@router.delete("/{checkin_id}/shares/{adult_id}", response_model=MoodNoteRevokeResponse)
def revoke_single_mood_checkin_note_share(
    checkin_id: uuid.UUID,
    adult_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodNoteRevokeResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return revoke_mood_note_share(db, student, checkin_id, adult_id)


@router.delete("/{checkin_id}/shares", response_model=MoodNoteRevokeResponse)
def revoke_all_mood_checkin_note_shares(
    checkin_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MoodNoteRevokeResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    return revoke_all_mood_note_shares(db, student, checkin_id)
