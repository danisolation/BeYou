from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.sessions import get_current_user
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.profile import LinkedStudentResponse
from app.services.adult_visibility import list_sos_visible_linked_student_rows

router = APIRouter()


@router.get("/students", response_model=list[LinkedStudentResponse])
def get_teacher_students(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[LinkedStudentResponse]:
    require_role(current_user, UserRole.TEACHER)
    return [
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
        for link, student in list_sos_visible_linked_student_rows(
            db,
            adult=current_user,
            relationship_type=UserRole.TEACHER.value,
        )
    ]
