from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import has_student_sos_signal, require_permission, require_role
from app.core.sessions import get_current_user
from app.db.models import LinkStatus, StudentAdultLink, User, UserRole
from app.db.session import get_db
from app.schemas.profile import LinkedStudentResponse

router = APIRouter()


@router.get("/students", response_model=list[LinkedStudentResponse])
def get_teacher_students(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[LinkedStudentResponse]:
    require_role(current_user, UserRole.TEACHER)
    rows = db.execute(
        select(StudentAdultLink, User)
        .join(User, User.id == StudentAdultLink.student_id)
        .where(
            StudentAdultLink.adult_id == current_user.id,
            StudentAdultLink.relationship_type == UserRole.TEACHER.value,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
        .limit(200)
    ).all()
    students: list[LinkedStudentResponse] = []
    for link, student in rows:
        if not has_student_sos_signal(db, student.id):
            continue
        require_permission(
            db,
            current_user,
            resource_type="student_profile",
            action="read",
            purpose="support_not_surveillance",
            student_id=student.id,
        )
        students.append(
            LinkedStudentResponse(
                id=student.id,
                full_name=student.full_name,
                email=student.email,
                school=student.school,
                class_name=student.class_name,
                relationship_type=link.relationship_type,
                link_status=link.status,
                is_demo=student.is_demo,
            )
        )
    return students
