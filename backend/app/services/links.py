from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import LinkStatus, RelationshipType, StudentAdultLink, User, UserRole, utc_now
from app.services.audit import record_audit_event


def get_link_or_404(db: OrmSession, link_id: uuid.UUID) -> StudentAdultLink:
    link = db.get(StudentAdultLink, link_id)
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy liên kết.")
    return link


def list_links(db: OrmSession) -> list[StudentAdultLink]:
    return list(db.scalars(select(StudentAdultLink).order_by(StudentAdultLink.created_at)).all())


def validate_relationship_pair(student: User | None, adult: User | None, relationship_type: str) -> None:
    if relationship_type not in {relationship.value for relationship in RelationshipType}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="relationship_type không hợp lệ.")
    if student is None or student.role != UserRole.STUDENT.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="student_id phải là tài khoản student.")
    if adult is None or adult.role != relationship_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="adult_id không khớp relationship_type.",
        )


def create_link(
    db: OrmSession,
    *,
    actor: User,
    student_id: uuid.UUID,
    adult_id: uuid.UUID,
    relationship_type: str,
) -> StudentAdultLink:
    student = db.get(User, student_id)
    adult = db.get(User, adult_id)
    validate_relationship_pair(student, adult, relationship_type)
    existing = db.scalar(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == student_id,
            StudentAdultLink.adult_id == adult_id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Liên kết đang hoạt động đã tồn tại.")

    link = StudentAdultLink(
        student_id=student_id,
        adult_id=adult_id,
        relationship_type=relationship_type,
        status=LinkStatus.ACTIVE.value,
        created_by=actor.id,
        is_demo=student.is_demo and adult.is_demo,
    )
    db.add(link)
    db.flush()
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="student_adult_link_created",
        resource_type="student_adult_link",
        resource_id=str(link.id),
        status_value="success",
        metadata_summary={
            "student_id": str(student_id),
            "adult_id": str(adult_id),
            "relationship_type": relationship_type,
            "is_demo": link.is_demo,
        },
        reason="admin_operations",
        is_demo=link.is_demo,
    )
    db.commit()
    db.refresh(link)
    return link


def revoke_link(db: OrmSession, *, actor: User, link: StudentAdultLink) -> StudentAdultLink:
    link.status = LinkStatus.REVOKED.value
    link.revoked_by = actor.id
    link.revoked_at = utc_now()
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="student_adult_link_revoked",
        resource_type="student_adult_link",
        resource_id=str(link.id),
        status_value="success",
        metadata_summary={
            "student_id": str(link.student_id),
            "adult_id": str(link.adult_id),
            "relationship_type": link.relationship_type,
            "is_demo": link.is_demo,
        },
        reason="admin_operations",
        is_demo=link.is_demo,
    )
    db.commit()
    db.refresh(link)
    return link
