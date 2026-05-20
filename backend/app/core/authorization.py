from __future__ import annotations

import uuid
from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import AccountStatus, LinkStatus, StudentAdultLink, User, UserRole

deny_by_default = True


def require_authenticated(user: User | None) -> User:
    if user is None or user.status != AccountStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập.")
    return user


def require_role(user: User, allowed_roles: UserRole | str | Iterable[UserRole | str]) -> User:
    if isinstance(allowed_roles, (UserRole, str)):
        roles = {allowed_roles.value if isinstance(allowed_roles, UserRole) else allowed_roles}
    else:
        roles = {role.value if isinstance(role, UserRole) else role for role in allowed_roles}

    if user.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")
    return user


def dashboard_route_for_role(role: str) -> str:
    routes = {
        UserRole.STUDENT.value: "/student",
        UserRole.TEACHER.value: "/teacher",
        UserRole.PARENT.value: "/parent",
        UserRole.ADMIN.value: "/admin",
    }
    if role not in routes:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vai trò không hợp lệ.")
    return routes[role]


def has_active_student_link(
    db: OrmSession,
    adult: User,
    student_id: uuid.UUID,
    relationship_type: str | None = None,
) -> bool:
    expected_relationship = relationship_type or adult.role
    link = db.scalar(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == student_id,
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == expected_relationship,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    )
    return link is not None


def require_permission(
    db: OrmSession,
    actor: User,
    resource_type: str,
    action: str,
    purpose: str,
    student_id: uuid.UUID | None = None,
) -> None:
    require_authenticated(actor)

    if actor.role == UserRole.ADMIN.value and purpose == "admin_operations":
        return

    if actor.role == UserRole.STUDENT.value:
        if resource_type in {"student_profile", "privacy_notice", "student_adult_link"} and (
            student_id is None or student_id == actor.id
        ):
            return

    if (
        actor.role in {UserRole.TEACHER.value, UserRole.PARENT.value}
        and purpose == "support_not_surveillance"
        and resource_type in {"student_profile", "student_adult_link", "self_check_summary"}
        and student_id is not None
        and has_active_student_link(db, actor, student_id)
    ):
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")
