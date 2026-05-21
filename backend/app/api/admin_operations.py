from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.readiness import ReadinessReport
from app.services.readiness import build_readiness_report

router = APIRouter()


def _require_admin_operations(db: OrmSession, current_user: User) -> None:
    require_role(current_user, UserRole.ADMIN)
    require_permission(
        db,
        current_user,
        resource_type="operations_readiness",
        action="read",
        purpose="admin_operations",
    )


@router.get("/readiness", response_model=ReadinessReport)
def get_admin_readiness(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ReadinessReport:
    _require_admin_operations(db, current_user)
    return build_readiness_report(db, settings)

