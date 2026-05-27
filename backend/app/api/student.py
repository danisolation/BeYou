from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.sessions import get_current_user
from app.db.models import LinkStatus, StudentAdultLink, User, UserRole
from app.db.session import get_db
from app.schemas.profile import LinkedAdultResponse, StudentProfileResponse
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required

router = APIRouter()


@router.get("/profile", response_model=StudentProfileResponse)
def get_student_profile(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> StudentProfileResponse:
    require_role(current_user, UserRole.STUDENT)
    if privacy_acknowledgement_required(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "privacy_ack_required", "notice_version": NOTICE_VERSION},
        )
    require_permission(
        db,
        current_user,
        resource_type="student_profile",
        action="read",
        purpose="student_reflection",
        student_id=current_user.id,
    )

    rows = db.execute(
        select(StudentAdultLink, User)
        .join(User, User.id == StudentAdultLink.adult_id)
        .where(
            StudentAdultLink.student_id == current_user.id,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    ).all()
    linked_adults = [
        LinkedAdultResponse(
            id=adult.id,
            full_name=adult.full_name,
            email=adult.email,
            relationship_type=link.relationship_type,
            link_status=link.status,
            is_demo=adult.is_demo,
        )
        for link, adult in rows
    ]
    return StudentProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        school=current_user.school,
        class_name=current_user.class_name,
        is_demo=current_user.is_demo,
        linked_adults=linked_adults,
    )
