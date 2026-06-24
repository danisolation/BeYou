from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session as OrmSession

from app.api.auth import _login_response
from app.core.authorization import dashboard_route_for_role
from app.core.sessions import get_current_user
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.auth import UserSessionResponse

router = APIRouter()

SELECTABLE_ROLES = {UserRole.STUDENT.value, UserRole.TEACHER.value, UserRole.PARENT.value}


class RoleUpdateRequest(BaseModel):
    role: str


@router.get("/me", response_model=UserSessionResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> UserSessionResponse:
    return _login_response(db, current_user)


@router.patch("/me/role", response_model=UserSessionResponse)
def update_my_role(
    payload: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> UserSessionResponse:
    """Allow a newly-registered Google user to choose their role (student/teacher/parent)."""
    if payload.role not in SELECTABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role không hợp lệ. Chọn một trong: {', '.join(sorted(SELECTABLE_ROLES))}",
        )
    if current_user.role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không thể thay đổi role của admin.",
        )
    current_user.role = payload.role
    db.commit()
    db.refresh(current_user)
    return _login_response(db, current_user)
