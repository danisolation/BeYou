from __future__ import annotations

import time
from collections import defaultdict

from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error, VerifyMismatchError
from fastapi import HTTPException, status

LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5
LOGIN_RATE_LIMIT_WINDOW_SECONDS = 300

_password_hasher = PasswordHasher()
_login_failures: dict[str, list[float]] = defaultdict(list)

RATE_LIMIT_DETAIL = "Quá nhiều lần đăng nhập chưa thành công. Hãy thử lại sau ít phút."


def hash_password(plain_password: str) -> str:
    return _password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, plain_password)
    except (VerifyMismatchError, Argon2Error):
        return False


def _normalize_rate_limit_value(value: str | None) -> str:
    normalized = (value or "unknown").strip().lower()
    return normalized or "unknown"


def _rate_limit_keys(email: str, client_ip: str | None) -> tuple[str, str]:
    normalized_email = _normalize_rate_limit_value(email)
    normalized_ip = _normalize_rate_limit_value(client_ip)
    return (f"email:{normalized_email}", f"email_ip:{normalized_email}:{normalized_ip}")


def _prune_failures(key: str, now: float) -> list[float]:
    cutoff = now - LOGIN_RATE_LIMIT_WINDOW_SECONDS
    recent = [timestamp for timestamp in _login_failures[key] if timestamp >= cutoff]
    _login_failures[key] = recent
    return recent


def check_login_rate_limit(email: str, client_ip: str | None) -> None:
    now = time.time()
    for key in _rate_limit_keys(email, client_ip):
        if len(_prune_failures(key, now)) >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=RATE_LIMIT_DETAIL
            )


def record_login_failure(email: str, client_ip: str | None) -> None:
    now = time.time()
    for key in _rate_limit_keys(email, client_ip):
        _prune_failures(key, now)
        _login_failures[key].append(now)


def reset_login_failures(email: str, client_ip: str | None) -> None:
    for key in _rate_limit_keys(email, client_ip):
        _login_failures.pop(key, None)
