from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.core.authorization import require_role
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.sos import (
    AdultSupportOverviewItem,
    InAppNotificationResponse,
    SosAlertCreate,
    SosAlertResponse,
    SosStatusUpdate,
)
from app.services.sos import (
    create_sos_alert,
    get_adult_sos_alert,
    get_student_sos_alert,
    get_support_overview,
    list_adult_sos_alerts,
    list_notifications,
    list_student_sos_alerts,
    mark_notification_read,
    update_sos_status,
)

router = APIRouter()


@router.post(
    "/student/sos-alerts",
    response_model=SosAlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student_sos_alert(
    payload: SosAlertCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SosAlertResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.STUDENT)
    return create_sos_alert(db, current_user, payload)


@router.get("/student/sos-alerts", response_model=list[SosAlertResponse])
def get_student_sos_alerts(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SosAlertResponse]:
    require_role(current_user, UserRole.STUDENT)
    return list_student_sos_alerts(db, current_user)


@router.get("/student/sos-alerts/{alert_id}", response_model=SosAlertResponse)
def get_student_sos_alert_detail(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SosAlertResponse:
    require_role(current_user, UserRole.STUDENT)
    return get_student_sos_alert(db, current_user, alert_id)


@router.get("/teacher/sos-alerts", response_model=list[SosAlertResponse])
def get_teacher_sos_alerts(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SosAlertResponse]:
    require_role(current_user, UserRole.TEACHER)
    return list_adult_sos_alerts(db, current_user, relationship_type=UserRole.TEACHER.value)


@router.get("/teacher/students/{student_id}/sos-alerts", response_model=list[SosAlertResponse])
def get_teacher_student_sos_alerts(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SosAlertResponse]:
    require_role(current_user, UserRole.TEACHER)
    return list_adult_sos_alerts(
        db,
        current_user,
        relationship_type=UserRole.TEACHER.value,
        student_id=student_id,
    )


@router.get("/teacher/sos-alerts/{alert_id}", response_model=SosAlertResponse)
def get_teacher_sos_alert_detail(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SosAlertResponse:
    require_role(current_user, UserRole.TEACHER)
    return get_adult_sos_alert(db, current_user, alert_id)


@router.patch("/teacher/sos-alerts/{alert_id}/status", response_model=SosAlertResponse)
def update_teacher_sos_status(
    alert_id: uuid.UUID,
    payload: SosStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SosAlertResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.TEACHER)
    return update_sos_status(db, current_user, alert_id, payload)


@router.get("/teacher/support-overview", response_model=list[AdultSupportOverviewItem])
def get_teacher_support_overview(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdultSupportOverviewItem]:
    require_role(current_user, UserRole.TEACHER)
    return get_support_overview(db, current_user, relationship_type=UserRole.TEACHER.value)


@router.get("/parent/sos-alerts", response_model=list[SosAlertResponse])
def get_parent_sos_alerts(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SosAlertResponse]:
    require_role(current_user, UserRole.PARENT)
    return list_adult_sos_alerts(db, current_user, relationship_type=UserRole.PARENT.value)


@router.get("/parent/students/{student_id}/sos-alerts", response_model=list[SosAlertResponse])
def get_parent_student_sos_alerts(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SosAlertResponse]:
    require_role(current_user, UserRole.PARENT)
    return list_adult_sos_alerts(
        db,
        current_user,
        relationship_type=UserRole.PARENT.value,
        student_id=student_id,
    )


@router.get("/parent/sos-alerts/{alert_id}", response_model=SosAlertResponse)
def get_parent_sos_alert_detail(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SosAlertResponse:
    require_role(current_user, UserRole.PARENT)
    return get_adult_sos_alert(db, current_user, alert_id)


@router.get("/parent/support-overview", response_model=list[AdultSupportOverviewItem])
def get_parent_support_overview(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdultSupportOverviewItem]:
    require_role(current_user, UserRole.PARENT)
    return get_support_overview(db, current_user, relationship_type=UserRole.PARENT.value)


@router.get("/notifications", response_model=list[InAppNotificationResponse])
def get_current_user_notifications(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[InAppNotificationResponse]:
    return list_notifications(db, current_user)


@router.patch("/notifications/{notification_id}/read", response_model=InAppNotificationResponse)
def mark_current_user_notification_read(
    notification_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InAppNotificationResponse:
    require_same_site_mutation(request, settings)
    return mark_notification_read(db, current_user, notification_id)
