from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import dashboard_route_for_role
from app.core.config import Settings, get_settings
from app.core.security import (
    check_login_rate_limit,
    record_login_failure,
    reset_login_failures,
    verify_password,
)
from app.core.sessions import clear_session_cookie, create_session, require_same_site_mutation, revoke_session
from app.db.models import AccountStatus, User
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required

router = APIRouter()

INVALID_LOGIN_DETAIL = "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập."
DISABLED_LOGIN_DETAIL = (
    "Tài khoản này đang bị tạm khóa. Hãy liên hệ quản trị viên hoặc người phụ trách demo."
)
DEMO_LOGIN_DISABLED_DETAIL = "Demo accounts are disabled in production pilot mode."
PRODUCTION_PILOT_AUTH_UNSAFE_DETAIL = "Production pilot authentication is not safely configured."


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client is not None else None


def _login_response(db: OrmSession, user: User) -> LoginResponse:
    return LoginResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        status=user.status,
        full_name=user.full_name,
        is_demo=user.is_demo,
        privacy_acknowledgement_required=privacy_acknowledgement_required(db, user),
        dashboard_route=dashboard_route_for_role(user.role),
        notice_version=NOTICE_VERSION,
    )


def _origin_unsafe_for_production_pilot(origin: str) -> bool:
    normalized = origin.strip().lower()
    return "*" in normalized or "localhost" in normalized or "127.0.0.1" in normalized or not normalized.startswith("https://")


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    require_same_site_mutation(request, settings)
    client_ip = _client_ip(request)
    check_login_rate_limit(payload.email, client_ip)

    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        record_login_failure(payload.email, client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_LOGIN_DETAIL)

    if user.status != AccountStatus.ACTIVE.value:
        record_login_failure(payload.email, client_ip)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=DISABLED_LOGIN_DETAIL)

    if user.is_demo and (settings.is_production_pilot or not settings.allow_demo_login):
        record_login_failure(payload.email, client_ip)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=DEMO_LOGIN_DISABLED_DETAIL)

    if settings.is_production_pilot and (
        not settings.session_cookie_secure
        or any(_origin_unsafe_for_production_pilot(origin) for origin in settings.allowed_frontend_origins)
    ):
        record_login_failure(payload.email, client_ip)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=PRODUCTION_PILOT_AUTH_UNSAFE_DETAIL)

    reset_login_failures(payload.email, client_ip)
    create_session(db, user, response, settings)
    return _login_response(db, user)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    require_same_site_mutation(request, settings)
    revoke_session(db, request.cookies.get(settings.session_cookie_name))
    clear_session_cookie(response, settings)
    return {"status": "ok"}
