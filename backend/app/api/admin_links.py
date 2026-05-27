from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session as OrmSession

from app.api.admin_users import _require_admin
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import StudentAdultLink, User
from app.db.session import get_db
from app.schemas.admin import AdminLinkCreateRequest, AdminLinkResponse, AdminLinkUpdateRequest
from app.services.links import create_link, get_link_or_404, list_links_with_users, revoke_link

router = APIRouter()


def _link_response(db: OrmSession, link: StudentAdultLink) -> AdminLinkResponse:
    student = db.get(User, link.student_id)
    adult = db.get(User, link.adult_id)
    if student is None or adult is None:
        raise ValueError("Link references missing users")
    return AdminLinkResponse(
        id=link.id,
        student_id=student.id,
        student_full_name=student.full_name,
        student_email=student.email,
        student_school=student.school,
        student_class_name=student.class_name,
        adult_id=adult.id,
        adult_full_name=adult.full_name,
        adult_email=adult.email,
        adult_role=adult.role,
        relationship_type=link.relationship_type,
        status=link.status,
        created_at=link.created_at,
        updated_at=link.updated_at,
        revoked_at=link.revoked_at,
        is_demo=link.is_demo,
    )


def _link_response_from_users(link: StudentAdultLink, student: User, adult: User) -> AdminLinkResponse:
    return AdminLinkResponse(
        id=link.id,
        student_id=student.id,
        student_full_name=student.full_name,
        student_email=student.email,
        student_school=student.school,
        student_class_name=student.class_name,
        adult_id=adult.id,
        adult_full_name=adult.full_name,
        adult_email=adult.email,
        adult_role=adult.role,
        relationship_type=link.relationship_type,
        status=link.status,
        created_at=link.created_at,
        updated_at=link.updated_at,
        revoked_at=link.revoked_at,
        is_demo=link.is_demo,
    )


@router.get("", response_model=list[AdminLinkResponse])
def get_admin_links(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[AdminLinkResponse]:
    _require_admin(db, current_user)
    return [
        _link_response_from_users(link, student, adult)
        for link, student, adult in list_links_with_users(db, limit=limit, offset=offset)
    ]


@router.post("", response_model=AdminLinkResponse, status_code=201)
def post_admin_link(
    payload: AdminLinkCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminLinkResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    link = create_link(
        db,
        actor=current_user,
        student_id=payload.student_id,
        adult_id=payload.adult_id,
        relationship_type=payload.relationship_type,
    )
    return _link_response(db, link)


@router.patch("/{link_id}", response_model=AdminLinkResponse)
def patch_admin_link(
    link_id: uuid.UUID,
    payload: AdminLinkUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminLinkResponse:
    _require_admin(db, current_user)
    require_same_site_mutation(request, settings)
    link = get_link_or_404(db, link_id)
    return _link_response(db, revoke_link(db, actor=current_user, link=link))
