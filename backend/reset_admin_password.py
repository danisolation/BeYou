"""
One-off script to reset the admin demo account password.
Usage: python reset_admin_password.py
"""
from __future__ import annotations

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import AccountStatus, User, UserRole
from app.db.session import SessionLocal

ADMIN_EMAIL = "admin.demo@beyou.local"
NEW_PASSWORD = "BeYouDemo!2026"


def reset_admin_password() -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == ADMIN_EMAIL))
        if user is None:
            # Create if not exists
            user = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(NEW_PASSWORD),
                role=UserRole.ADMIN.value,
                full_name="Quản trị viên Demo",
                is_demo=True,
            )
            db.add(user)
            db.commit()
            print(f"✅ Created admin account: {ADMIN_EMAIL}")
        else:
            user.password_hash = hash_password(NEW_PASSWORD)
            user.status = AccountStatus.ACTIVE.value
            user.role = UserRole.ADMIN.value
            db.commit()
            print(f"✅ Password reset for: {ADMIN_EMAIL}")

        print(f"   Password: {NEW_PASSWORD}")


if __name__ == "__main__":
    reset_admin_password()
