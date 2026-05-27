from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as OrmSession

from app.api.admin_users import _require_admin
from app.core.sessions import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.admin_reports import AdminAggregateReportResponse, DemoScope
from app.services.admin_reports import get_admin_aggregate_report

router = APIRouter()


@router.get("/aggregate", response_model=AdminAggregateReportResponse)
def get_aggregate_report(
    demo_scope: DemoScope = Query(default="all"),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> AdminAggregateReportResponse:
    _require_admin(db, current_user)
    return get_admin_aggregate_report(db, actor=current_user, demo_scope=demo_scope)
