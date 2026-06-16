from __future__ import annotations

import secrets
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
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
from app.core.sessions import (
    clear_session_cookie,
    create_session,
    require_same_site_mutation,
    revoke_session,
    utc_now,
)
import uuid
from app.core.security import get_password_hash
from app.db.models import AccountStatus, AuthSessionMethod, ExternalIdentity, ExternalIdentityStatus, User, UserRole
from app.db.session import get_db
from app.schemas.auth import AuthCapabilitiesResponse, LoginRequest, LoginResponse
from app.services.external_identity import (
    hash_external_email,
    hash_external_subject,
    resolve_external_identity,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required

router = APIRouter()

INVALID_LOGIN_DETAIL = "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập."
DISABLED_LOGIN_DETAIL = (
    "Tài khoản này đang bị tạm khóa. Hãy liên hệ quản trị viên hoặc người phụ trách demo."
)
DEMO_LOGIN_DISABLED_DETAIL = "Demo accounts are disabled in production pilot mode."
PRODUCTION_PILOT_AUTH_UNSAFE_DETAIL = "Production pilot authentication is not safely configured."
GOOGLE_LOGIN_DISABLED_DETAIL = "Google login is not configured."
GOOGLE_ACCOUNT_NOT_ALLOWED_DETAIL = (
    "Tài khoản Google này chưa được cấp quyền trong Peerlight AI."
)
GOOGLE_STATE_COOKIE_MAX_AGE_SECONDS = 300


class GoogleOAuthError(Exception):
    pass


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


def _frontend_redirect(settings: Settings, path: str, params: dict[str, str] | None = None) -> str:
    normalized_path = path if path.startswith("/") else f"/{path}"
    url = f"{settings.frontend_origin}{normalized_path}"
    if params:
        url = f"{url}?{urlencode(params)}"
    return url


def _google_oauth_configured(settings: Settings) -> bool:
    return settings.google_login_configured


def _set_google_state_cookie(response: RedirectResponse, state_value: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.google_oauth_state_cookie_name,
        value=state_value,
        max_age=GOOGLE_STATE_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/api/auth/google",
    )


def _clear_google_state_cookie(response: RedirectResponse, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.google_oauth_state_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/api/auth/google",
    )


def _google_error_redirect(settings: Settings, code: str) -> RedirectResponse:
    response = RedirectResponse(
        _frontend_redirect(settings, "/login", {"error": code}),
        status_code=status.HTTP_303_SEE_OTHER,
    )
    _clear_google_state_cookie(response, settings)
    return response


def _valid_google_next_path(next_path: str | None) -> str:
    if not next_path:
        return "/"
    stripped = next_path.strip()
    if not stripped.startswith("/") or stripped.startswith("//"):
        return "/"
    if "://" in stripped or "\\" in stripped:
        return "/"
    if stripped.startswith("/login"):
        return "/"
    return stripped[:512]


def _build_google_authorization_url(settings: Settings, state_value: str, next_path: str) -> str:
    return f"{settings.google_oauth_authorize_url}?{urlencode({
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': f'{state_value}:{next_path}',
        'access_type': 'online',
        'prompt': 'select_account',
    })}"


def _parse_google_state(raw_state: str) -> tuple[str, str]:
    if ":" not in raw_state:
        raise GoogleOAuthError()
    state_value, next_path = raw_state.split(":", 1)
    if not state_value:
        raise GoogleOAuthError()
    return state_value, next_path


def _exchange_google_code(settings: Settings, code: str) -> str:
    try:
        with httpx.Client(timeout=settings.google_oauth_timeout_seconds) as client:
            token_response = client.post(
                settings.google_oauth_token_url,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            token_payload = token_response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise GoogleOAuthError() from exc

    id_token = token_payload.get("id_token")
    if not isinstance(id_token, str) or not id_token:
        raise GoogleOAuthError()
    return id_token


def _verify_google_id_token(settings: Settings, id_token: str) -> dict[str, Any]:
    try:
        with httpx.Client(timeout=settings.google_oauth_timeout_seconds) as client:
            tokeninfo_response = client.get(
                settings.google_tokeninfo_url,
                params={"id_token": id_token},
            )
            tokeninfo_response.raise_for_status()
            payload = tokeninfo_response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise GoogleOAuthError() from exc

    if payload.get("aud") != settings.google_client_id:
        raise GoogleOAuthError()
    if payload.get("email_verified") not in {True, "true", "True"}:
        raise GoogleOAuthError()
    if not isinstance(payload.get("sub"), str) or not isinstance(payload.get("email"), str):
        raise GoogleOAuthError()
    return payload


def _resolve_google_user(
    db: OrmSession, settings: Settings, claims: dict[str, Any]
) -> tuple[User, ExternalIdentity]:
    provider_key = settings.auth_provider_key
    subject = str(claims["sub"])
    email = str(claims["email"]).strip().lower()
    
    resolution = resolve_external_identity(db, provider_key, subject)

    if resolution.status == "linked_active_user" and resolution.user and resolution.identity:
        resolution.identity.last_seen_at = utc_now()
        db.commit()
        return resolution.user, resolution.identity

    if resolution.status in {"disabled_identity", "deprovisioned_identity"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=GOOGLE_ACCOUNT_NOT_ALLOWED_DETAIL
        )

    user = db.scalar(select(User).where(User.email == email))
    display_label = str(claims.get("name") or "").strip()[:160] or None
    
    if user is None:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=get_password_hash(secrets.token_urlsafe(32)),
            role=UserRole.STUDENT.value,
            status=AccountStatus.DISABLED.value,
            full_name=display_label or email.split("@")[0],
            is_demo=False,
        )
        db.add(user)
        db.flush()

    identity = resolution.identity
    if not identity:
        identity = ExternalIdentity(
            provider_key=provider_key,
            provider_subject_hash=hash_external_subject(provider_key, subject),
            status=ExternalIdentityStatus.LINKED.value if user.status == AccountStatus.ACTIVE.value else ExternalIdentityStatus.PENDING_REVIEW.value,
            provider_label=settings.auth_provider_label,
            email_verified=True,
            email_hash=hash_external_email(provider_key, email),
            display_label=display_label,
            linked_user_id=user.id,
            last_seen_at=utc_now(),
        )
        db.add(identity)
    else:
        identity.last_seen_at = utc_now()
        identity.linked_user_id = user.id
        identity.status = ExternalIdentityStatus.LINKED.value if user.status == AccountStatus.ACTIVE.value else ExternalIdentityStatus.PENDING_REVIEW.value

    db.commit()

    if user.status != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=GOOGLE_ACCOUNT_NOT_ALLOWED_DETAIL
        )

    return user, identity


def _origin_unsafe_for_production_pilot(origin: str) -> bool:
    normalized = origin.strip().lower()
    return (
        "*" in normalized
        or "localhost" in normalized
        or "127.0.0.1" in normalized
        or not normalized.startswith("https://")
    )


@router.get("/capabilities", response_model=AuthCapabilitiesResponse)
def capabilities(settings: Settings = Depends(get_settings)) -> AuthCapabilitiesResponse:
    google_enabled = _google_oauth_configured(settings)
    return AuthCapabilitiesResponse(
        demo_login_enabled=settings.allow_demo_login,
        public_demo_entry_enabled=settings.allow_demo_login,
        email_password_enabled=True,
        provider_login_enabled=google_enabled,
        provider_label=settings.auth_provider_label if google_enabled else None,
        provider_mode=settings.auth_provider_mode if google_enabled else None,
        production_pilot=settings.is_production_pilot,
    )


@router.get("/google/start")
def google_start(
    next: str | None = None,
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    if not _google_oauth_configured(settings):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=GOOGLE_LOGIN_DISABLED_DETAIL,
        )

    state_value = secrets.token_urlsafe(32)
    next_path = _valid_google_next_path(next)
    response = RedirectResponse(
        _build_google_authorization_url(settings, state_value, next_path),
        status_code=status.HTTP_302_FOUND,
    )
    _set_google_state_cookie(response, state_value, settings)
    return response


@router.get("/google/callback")
def google_callback(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    if not _google_oauth_configured(settings):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=GOOGLE_LOGIN_DISABLED_DETAIL,
        )
    if error or not code or not state:
        return _google_error_redirect(settings, "google_login_failed")

    try:
        state_value, next_path = _parse_google_state(state)
    except GoogleOAuthError:
        return _google_error_redirect(settings, "google_login_failed")

    cookie_state = request.cookies.get(settings.google_oauth_state_cookie_name)
    if not cookie_state or not secrets.compare_digest(cookie_state, state_value):
        return _google_error_redirect(settings, "google_login_failed")

    try:
        id_token = _exchange_google_code(settings, code)
        claims = _verify_google_id_token(settings, id_token)
        user, identity = _resolve_google_user(db, settings, claims)
        if user.is_demo and (settings.is_production_pilot or not settings.allow_demo_login):
            return _google_error_redirect(settings, "google_account_not_allowed")
    except (GoogleOAuthError, HTTPException):
        return _google_error_redirect(settings, "google_account_not_allowed")

    create_session(
        db,
        user,
        response,
        settings,
        auth_method=AuthSessionMethod.SSO.value,
        auth_provider_key=settings.auth_provider_key,
        external_identity_id=identity.id,
    )
    destination = _valid_google_next_path(next_path)
    if user.role == "student" and privacy_acknowledgement_required(db, user):
        destination = f"/privacy?{urlencode({'next': dashboard_route_for_role(user.role)})}"
    elif destination == "/":
        destination = dashboard_route_for_role(user.role)

    redirect = RedirectResponse(
        _frontend_redirect(settings, destination),
        status_code=status.HTTP_303_SEE_OTHER,
    )
    for header_value in response.headers.getlist("set-cookie"):
        redirect.headers.append("set-cookie", header_value)
    _clear_google_state_cookie(redirect, settings)
    return redirect


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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=DEMO_LOGIN_DISABLED_DETAIL
        )

    if settings.is_production_pilot and (
        not settings.session_cookie_secure
        or any(
            _origin_unsafe_for_production_pilot(origin)
            for origin in settings.allowed_frontend_origins
        )
    ):
        record_login_failure(payload.email, client_ip)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=PRODUCTION_PILOT_AUTH_UNSAFE_DETAIL,
        )

    reset_login_failures(payload.email, client_ip)
    auth_method = (
        AuthSessionMethod.DEMO_PASSWORD.value if user.is_demo else AuthSessionMethod.PASSWORD.value
    )
    create_session(db, user, response, settings, auth_method=auth_method, auth_provider_key="local")
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
