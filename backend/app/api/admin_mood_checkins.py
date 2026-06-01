from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.admin_mood_checkins import (
    AdminMoodCheckInConfigResponse,
    AdminMoodCheckInConfigUpsert,
    AdminMoodCheckInPreviewResponse,
)
from app.services.admin_mood_checkins import (
    list_mood_checkin_configs,
    preview_mood_checkin_config,
    save_mood_checkin_config,
)

router = APIRouter()


def _require_admin(db: OrmSession, current_user: User) -> None:
    require_role(current_user, UserRole.ADMIN)
    require_permission(
        db,
        current_user,
        resource_type="mood_checkin_config",
        action="write",
        purpose="admin_operations",
    )


@router.get("/configs", response_model=list[AdminMoodCheckInConfigResponse])
def list_configs(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdminMoodCheckInConfigResponse]:
    _require_admin(db, current_user)
    return list_mood_checkin_configs(db)


@router.post(
    "/configs", response_model=AdminMoodCheckInConfigResponse, status_code=status.HTTP_201_CREATED
)
def create_config(
    payload: AdminMoodCheckInConfigUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminMoodCheckInConfigResponse:
    require_same_site_mutation(request, settings)
    _require_admin(db, current_user)
    return save_mood_checkin_config(db, current_user, payload)


@router.put("/configs/{config_id}", response_model=AdminMoodCheckInConfigResponse)
def update_config(
    config_id: uuid.UUID,
    payload: AdminMoodCheckInConfigUpsert,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminMoodCheckInConfigResponse:
    require_same_site_mutation(request, settings)
    _require_admin(db, current_user)
    return save_mood_checkin_config(db, current_user, payload, config_id=config_id)


@router.get("/configs/{config_id}/preview", response_model=AdminMoodCheckInPreviewResponse)
def preview_config(
    config_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdminMoodCheckInPreviewResponse:
    _require_admin(db, current_user)
    return preview_mood_checkin_config(db, config_id)
