from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User
from app.db.session import get_db
from app.services.privacy import acknowledge_privacy_notice

router = APIRouter()


@router.post("/acknowledgements")
def acknowledge_privacy(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, str | bool]:
    require_same_site_mutation(request, settings)
    acknowledgement = acknowledge_privacy_notice(db, current_user)
    return {
        "acknowledged": True,
        "notice_version": acknowledgement.notice_version,
        "acknowledged_at": acknowledgement.acknowledged_at.isoformat(),
    }
