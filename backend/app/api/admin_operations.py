from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.admin_operations import AdminOperationsDashboardResponse
from app.schemas.readiness import ReadinessReport
from app.services.admin_operations import build_operations_dashboard, record_readiness_audit
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
    report = build_readiness_report(db, settings)
    record_readiness_audit(db, actor=current_user, report=report, resource_type="operations_readiness")
    return report


@router.get("/dashboard", response_model=AdminOperationsDashboardResponse)
def get_admin_operations_dashboard(
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    actor_role: str | None = Query(default=None),
    action_type: str | None = Query(default=None),
    target_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminOperationsDashboardResponse:
    _require_admin_operations(db, current_user)
    report = build_readiness_report(db, settings)
    dashboard = build_operations_dashboard(
        db,
        readiness_report=report,
        start_at=start_at,
        end_at=end_at,
        actor_role=actor_role,
        action_type=action_type,
        target_type=target_type,
        status=status,
        limit=limit,
    )
    record_readiness_audit(db, actor=current_user, report=report, resource_type="operations_dashboard")
    return dashboard

