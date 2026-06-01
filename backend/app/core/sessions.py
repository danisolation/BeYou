from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings, get_settings
from app.db.models import AccountStatus, AuthSessionMethod, Session as UserSession, User
from app.db.session import get_db

SESSION_TOKEN_BYTES = 32
LAST_SEEN_WRITE_INTERVAL_SECONDS = 60


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def validate_host_prefix_cookie(settings: Settings) -> None:
    if settings.session_cookie_name.startswith("__Host-") and not settings.session_cookie_secure:
        raise ValueError(
            "SESSION_COOKIE_NAME values starting with __Host- require SESSION_COOKIE_SECURE=true"
        )


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    validate_host_prefix_cookie(settings)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )


def create_session(
    db: OrmSession,
    user: User,
    response: Response,
    settings: Settings,
    *,
    auth_method: str = AuthSessionMethod.PASSWORD.value,
    auth_provider_key: str = "local",
    external_identity_id: uuid.UUID | None = None,
) -> UserSession:
    token = secrets.token_urlsafe(SESSION_TOKEN_BYTES)
    now = utc_now()
    session = UserSession(
        token_hash=hash_session_token(token),
        user_id=user.id,
        created_at=now,
        expires_at=now + timedelta(seconds=settings.session_max_age_seconds),
        is_demo=user.is_demo,
        auth_method=auth_method,
        auth_provider_key=auth_provider_key,
        external_identity_id=external_identity_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    set_session_cookie(response, token, settings)
    return session


def load_session(db: OrmSession, token: str | None) -> UserSession | None:
    if not token:
        return None
    token_hash = hash_session_token(token)
    return db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))


def revoke_session(db: OrmSession, token: str | None) -> None:
    session = load_session(db, token)
    if session is None or session.revoked_at is not None:
        return
    session.revoked_at = utc_now()
    db.commit()


def get_current_user(
    request: Request,
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    session = load_session(db, request.cookies.get(settings.session_cookie_name))
    now = utc_now()
    if session is None or session.revoked_at is not None or session.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập.")

    user = db.get(User, session.user_id)
    if user is None or user.status != AccountStatus.ACTIVE.value:
        session.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ."
        )

    if (
        session.last_seen_at is None
        or (now - session.last_seen_at).total_seconds() > LAST_SEEN_WRITE_INTERVAL_SECONDS
    ):
        session.last_seen_at = now
        db.commit()
    return user


def require_same_site_mutation(request: Request, settings: Settings) -> None:
    if request.method in {"GET", "HEAD", "OPTIONS", "TRACE"}:
        return

    origin = request.headers.get("origin")
    fetch_site = request.headers.get("sec-fetch-site")

    # Check 1: Origin header present → validate against allowlist
    if origin is not None:
        if origin not in settings.allowed_frontend_origins:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ."
            )
        return

    # Check 2: Sec-Fetch-Site header present → validate same-origin/same-site
    if fetch_site is not None:
        if fetch_site in {"same-origin", "same-site"}:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")

    # Check 3: Referer fallback (Safari/iOS compatibility — may omit Origin and Sec-Fetch-Site)
    referer = request.headers.get("referer")
    if referer is not None:
        parsed = urlparse(referer)
        referer_origin = f"{parsed.scheme}://{parsed.netloc}"
        if referer_origin in settings.allowed_frontend_origins:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")

    # No Origin, no Sec-Fetch-Site, no Referer → block
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")
