from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.db.models import AccountStatus, LinkStatus, StudentAdultLink, User, UserRole
from app.db.session import SessionLocal
from app.services.links import create_link

DEMO_PASSWORD = "BeYouDemo!2026"
DEMO_STUDENT_EMAIL = "student.demo@beyou.local"
DEMO_TEACHER_EMAIL = "teacher.demo@beyou.local"
DEMO_PARENT_EMAIL = "parent.demo@beyou.local"
DEMO_ADMIN_EMAIL = "admin.demo@beyou.local"


def _upsert_demo_user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str,
    school: str | None = None,
    class_name: str | None = None,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, password_hash=hash_password(DEMO_PASSWORD), role=role, full_name=full_name)
        db.add(user)
    user.password_hash = hash_password(DEMO_PASSWORD)
    user.role = role
    user.status = AccountStatus.ACTIVE.value
    user.full_name = full_name
    user.school = school
    user.class_name = class_name
    user.is_demo = True
    db.commit()
    db.refresh(user)
    return user


def _ensure_active_demo_link(db: OrmSession, *, admin: User, student: User, adult: User, relationship_type: str) -> None:
    existing = db.scalar(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == student.id,
            StudentAdultLink.adult_id == adult.id,
            StudentAdultLink.relationship_type == relationship_type,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    )
    if existing is None:
        create_link(db, actor=admin, student_id=student.id, adult_id=adult.id, relationship_type=relationship_type)


def seed_demo_data(db: OrmSession, settings: Settings) -> bool:
    if not settings.allow_demo_seed:
        return False

    student = _upsert_demo_user(
        db,
        email=DEMO_STUDENT_EMAIL,
        role=UserRole.STUDENT.value,
        full_name="Nguyễn An Demo",
        school="Trường THPT BeYou Demo",
        class_name="10A1",
    )
    teacher = _upsert_demo_user(
        db,
        email=DEMO_TEACHER_EMAIL,
        role=UserRole.TEACHER.value,
        full_name="Cô Bình Demo",
    )
    parent = _upsert_demo_user(
        db,
        email=DEMO_PARENT_EMAIL,
        role=UserRole.PARENT.value,
        full_name="Phụ huynh Chi Demo",
    )
    admin = _upsert_demo_user(
        db,
        email=DEMO_ADMIN_EMAIL,
        role=UserRole.ADMIN.value,
        full_name="Quản trị viên Demo",
    )
    _ensure_active_demo_link(db, admin=admin, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _ensure_active_demo_link(db, admin=admin, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    return True


def main() -> None:
    settings = get_settings()
    with SessionLocal() as db:
        if not seed_demo_data(db, settings):
            print("Demo seed is disabled for this environment.")
            return
    print("Demo seed completed.")


if __name__ == "__main__":
    main()
