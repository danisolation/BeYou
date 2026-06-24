"""Temporary admin reset endpoint — remove after use."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.db.models import AccountStatus, User, UserRole
from app.db.session import get_db

router = APIRouter()

ADMIN_EMAIL = "admin.demo@beyou.local"
ADMIN_PASSWORD = "BeYouDemo!2026"


@router.post("/reset-admin")
def reset_admin(
    x_reset_token: str = Header(...),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    expected = settings.admin_reset_token
    if not expected or x_reset_token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")

    user = db.scalar(select(User).where(User.email == ADMIN_EMAIL))
    if user is None:
        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN.value,
            full_name="Quản trị viên Demo",
            is_demo=True,
            status=AccountStatus.ACTIVE.value,
        )
        db.add(user)
        db.commit()
        return {"status": "created", "email": ADMIN_EMAIL}

    user.password_hash = hash_password(ADMIN_PASSWORD)
    user.status = AccountStatus.ACTIVE.value
    user.role = UserRole.ADMIN.value
    db.commit()
    return {"status": "reset", "email": ADMIN_EMAIL}
