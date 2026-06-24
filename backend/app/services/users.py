from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    PrivacyAcknowledgement,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.schemas.admin import AdminUserCreateRequest, AdminUserUpdateRequest
from app.schemas.auth import RegisterRequest
from app.services.audit import record_audit_event


def _ensure_student_profile_fields(
    role: str, full_name: str, school: str | None, class_name: str | None
) -> None:
    if role == UserRole.STUDENT.value and (not full_name or not school or not class_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student accounts require full_name, school, and class_name.",
        )


def _ensure_email_available(
    db: OrmSession, email: str, existing_user_id: uuid.UUID | None = None
) -> None:
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None and existing.id != existing_user_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email đã được sử dụng.")


def get_user_or_404(db: OrmSession, user_id: uuid.UUID) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng."
        )
    return user


def list_users(db: OrmSession, *, limit: int = 100, offset: int = 0) -> list[User]:
    return list(
        db.scalars(
            select(User).order_by(User.created_at, User.email).limit(limit).offset(offset)
        ).all()
    )


def create_user(db: OrmSession, payload: AdminUserCreateRequest) -> User:
    _ensure_email_available(db, payload.email)
    _ensure_student_profile_fields(
        payload.role, payload.full_name, payload.school, payload.class_name
    )
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        status=payload.status,
        full_name=payload.full_name,
        school=payload.school,
        class_name=payload.class_name,
        is_demo=payload.is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_user(db: OrmSession, payload: RegisterRequest) -> User:
    _ensure_email_available(db, payload.email)
    if payload.role == UserRole.STUDENT.value:
        if not payload.school or not payload.class_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Học sinh cần cung cấp tên trường và lớp học.",
            )
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        status=AccountStatus.ACTIVE.value,
        full_name=payload.full_name,
        school=payload.school,
        class_name=payload.class_name,
        is_demo=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: OrmSession,
    *,
    actor: User,
    target: User,
    payload: AdminUserUpdateRequest,
) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data:
        _ensure_email_available(db, update_data["email"], target.id)

    previous_role = target.role
    previous_status = target.status
    for field, value in update_data.items():
        setattr(target, field, value)

    # Only enforce student profile completeness when role is explicitly being set to student in this request
    if "role" in update_data and target.role == UserRole.STUDENT.value:
        _ensure_student_profile_fields(target.role, target.full_name, target.school, target.class_name)

    if "role" in update_data and target.role != previous_role:
        record_audit_event(
            db,
            actor=actor,
            actor_role=actor.role,
            action="role_changed",
            resource_type="account_profile",
            resource_id=str(target.id),
            status_value="success",
            metadata_summary={
                "target_user_id": str(target.id),
                "previous_role": previous_role,
                "new_role": target.role,
                "admin_actor_id": str(actor.id),
                "is_demo": target.is_demo,
            },
            reason="admin_operations",
            is_demo=target.is_demo,
        )

    if "status" in update_data and target.status != previous_status:
        record_account_status_changed(
            db,
            actor=actor,
            target=target,
            previous_status=previous_status,
            new_status=target.status,
        )

    db.commit()
    db.refresh(target)
    return target


def record_account_status_changed(
    db: OrmSession,
    *,
    actor: User,
    target: User,
    previous_status: str,
    new_status: str,
) -> None:
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="account_status_changed",
        resource_type="account_profile",
        resource_id=str(target.id),
        status_value="success",
        metadata_summary={
            "target_user_id": str(target.id),
            "previous_status": previous_status,
            "new_status": new_status,
            "admin_actor_id": str(actor.id),
            "is_demo": target.is_demo,
        },
        reason="admin_operations",
        is_demo=target.is_demo,
    )


def delete_user(db: OrmSession, *, actor: User, target: User) -> User | None:
    previous_status = target.status
    if target.is_demo:
        record_account_status_changed(
            db,
            actor=actor,
            target=target,
            previous_status=previous_status,
            new_status="physically_deleted_demo",
        )
        db.execute(
            delete(StudentAdultLink).where(
                or_(
                    StudentAdultLink.student_id == target.id,
                    StudentAdultLink.adult_id == target.id,
                    StudentAdultLink.created_by == target.id,
                    StudentAdultLink.revoked_by == target.id,
                )
            )
        )
        db.execute(delete(UserSession).where(UserSession.user_id == target.id))
        db.execute(
            delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id == target.id)
        )
        db.delete(target)
        db.commit()
        return None

    target.status = AccountStatus.DELETED.value
    record_account_status_changed(
        db,
        actor=actor,
        target=target,
        previous_status=previous_status,
        new_status=target.status,
    )
    db.commit()
    db.refresh(target)
    return target
