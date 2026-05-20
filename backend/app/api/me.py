from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from app.api.auth import _login_response
from app.core.sessions import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import UserSessionResponse

router = APIRouter()


@router.get("/me", response_model=UserSessionResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> UserSessionResponse:
    return _login_response(db, current_user)
