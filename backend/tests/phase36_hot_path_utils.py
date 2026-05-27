from __future__ import annotations

from collections.abc import Callable
from typing import TypeVar

from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    LinkStatus,
    SosAlert,
    SosAlertStatus,
    SosSeverity,
    SosSource,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import engine
from app.main import app

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"

_SENSITIVE_MARKERS = (
    "access_token",
    "refresh_token",
    "id_token",
    "password_hash",
    "private_note",
    "transcript",
    "raw_answers",
    "provider_subject",
    "raw_claims",
    "export_url",
    "risk_leaderboard",
    "reason_text",
)

T = TypeVar("T")


class QueryCounter:
    def __init__(self, target_engine: Engine) -> None:
        self.target_engine = target_engine
        self.count = 0

    def __enter__(self) -> QueryCounter:
        event.listen(self.target_engine, "before_cursor_execute", self._before_cursor_execute)
        return self

    def __exit__(self, *exc_info: object) -> None:
        event.remove(self.target_engine, "before_cursor_execute", self._before_cursor_execute)

    def _before_cursor_execute(self, *args: object) -> None:
        self.count += 1


def _value(value: str | UserRole | LinkStatus | SosAlertStatus | SosSeverity | SosSource) -> str:
    return value.value if hasattr(value, "value") else value


def make_user(
    db: OrmSession,
    email: str,
    role: str | UserRole,
    full_name: str,
    school: str | None = None,
    class_name: str | None = None,
    is_demo: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=_value(role),
        status=AccountStatus.ACTIVE.value,
        full_name=full_name,
        school=school,
        class_name=class_name,
        is_demo=is_demo,
    )
    db.add(user)
    db.flush()
    return user


def login_client(email: str) -> TestClient:
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200
    return client


def measure_queries(callable_: Callable[[], T]) -> tuple[T, int]:
    with QueryCounter(engine) as counter:
        result = callable_()
    return result, counter.count


def seed_student_link(
    db: OrmSession,
    student: User,
    adult: User,
    *,
    relationship_type: str | UserRole | None = None,
    status: str | LinkStatus = LinkStatus.ACTIVE,
    created_by: User | None = None,
    is_demo: bool = True,
) -> StudentAdultLink:
    link = StudentAdultLink(
        student_id=student.id,
        adult_id=adult.id,
        relationship_type=_value(relationship_type or adult.role),
        status=_value(status),
        created_by=(created_by or adult).id,
        is_demo=is_demo,
    )
    db.add(link)
    db.flush()
    return link


def seed_sos_alert(
    db: OrmSession,
    student: User,
    *,
    severity: str | SosSeverity = SosSeverity.SUPPORT,
    source: str | SosSource = SosSource.DEMO_SEED,
    current_status: str | SosAlertStatus = SosAlertStatus.SENT,
    note: str | None = None,
    is_demo: bool = True,
) -> SosAlert:
    alert = SosAlert(
        student_id=student.id,
        student_full_name_snapshot=student.full_name,
        student_school_snapshot=student.school,
        student_class_name_snapshot=student.class_name,
        severity=_value(severity),
        source=_value(source),
        note=note,
        current_status=_value(current_status),
        is_demo=is_demo,
    )
    db.add(alert)
    db.flush()
    return alert


def assert_aggregate_only_text(text: str) -> None:
    normalized = text.lower()
    for marker in _SENSITIVE_MARKERS:
        assert marker not in normalized
