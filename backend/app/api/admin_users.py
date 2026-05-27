from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.admin import AdminUserCreateRequest, AdminUserResponse, AdminUserUpdateRequest
from app.services.users import create_user, delete_user, get_user_or_404, list_users, update_user

router = APIRouter()


def _require_admin(db: OrmSession, current_user: User) -> None:
    require_role(current_user, UserRole.ADMIN)
    require_permission(
        db,
        current_user,
        resource_type="account_profile",
        action="manage",
        purpose="admin_operations",
    )


def _user_response(user: User) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        status=user.status,
        full_name=user.full_name,
        school=user.school,
        class_name=user.class_name,
        is_demo=user.is_demo,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("", response_model=list[AdminUserResponse])
def get_admin_users(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdminUserResponse]:
    _require_admin(db, current_user)
    return [_user_response(user) for user in list_users(db, limit=limit, offset=offset)]


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def post_admin_user(
    payload: AdminUserCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminUserResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    return _user_response(create_user(db, payload))


@router.patch("/{user_id}", response_model=AdminUserResponse)
def patch_admin_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminUserResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    target = get_user_or_404(db, user_id)
    return _user_response(update_user(db, actor=current_user, target=target, payload=payload))


@router.delete("/{user_id}", response_model=AdminUserResponse | None)
def delete_admin_user(
    user_id: uuid.UUID,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminUserResponse | None:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    target = get_user_or_404(db, user_id)
    deleted_user = delete_user(db, actor=current_user, target=target)
    if deleted_user is None:
        response.status_code = status.HTTP_204_NO_CONTENT
        return None
    return _user_response(deleted_user)
