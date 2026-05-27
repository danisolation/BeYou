from __future__ import annotations

from sqlalchemy import exists, select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import LinkStatus, SosAlert, StudentAdultLink, User


def list_sos_visible_linked_student_rows(
    db: OrmSession,
    *,
    adult: User,
    relationship_type: str,
    limit: int = 200,
) -> list[tuple[StudentAdultLink, User]]:
    rows = db.execute(
        select(StudentAdultLink, User)
        .join(User, User.id == StudentAdultLink.student_id)
        .where(
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
            exists(select(SosAlert.id).where(SosAlert.student_id == User.id)),
        )
        .order_by(User.full_name.asc(), User.email.asc(), User.id.asc())
        .limit(limit)
    ).all()
    return [(link, student) for link, student in rows]
