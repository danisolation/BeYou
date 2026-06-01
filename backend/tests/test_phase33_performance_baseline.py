from __future__ import annotations

from collections.abc import Callable
from time import perf_counter

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, event, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ChatMessage,
    ChatSafetySignal,
    ChatThread,
    ChatbotSafetyConfig,
    InAppNotification,
    LinkStatus,
    MoodCheckIn,
    MoodCheckinReminderState,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SchoolPrivacyPolicyDefault,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    Session as UserSession,
    SosAlert,
    SosAlertStatus,
    SosSeverity,
    SosStatusEvent,
    StudentAdultLink,
    StudentNotificationPreference,
    StudentSupportPlan,
    StudentSupportPlanAdult,
    SupportPlanStatus,
    User,
    UserRole,
)
from app.db.session import SessionLocal, engine
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
COMMAND_SOURCE = "python -m pytest tests/test_phase33_performance_baseline.py -q"

AGGREGATE_KEYS = {
    "endpoint",
    "role",
    "statusCategory",
    "durationMs",
    "payloadBytes",
    "queryCountCandidate",
    "coldWarmLabel",
    "commandSource",
}
FORBIDDEN_EVIDENCE_KEYS = {
    "body",
    "requestBody",
    "responseBody",
    "id",
    "email",
    "name",
    "token",
    "cookie",
    "transcript",
    "answer",
    "privateNote",
    "reason",
    "claim",
    "export",
    "leaderboard",
    "drilldown",
}


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            ChatSafetySignal,
            ChatMessage,
            ChatThread,
            ChatbotSafetyConfig,
            InAppNotification,
            SosStatusEvent,
            SosAlert,
            ScenarioAttempt,
            ScenarioChoice,
            Scenario,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckThreshold,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            StudentSupportPlanAdult,
            StudentSupportPlan,
            MoodCheckIn,
            AuditEvent,
            StudentAdultLink,
            StudentNotificationPreference,
            MoodCheckinReminderState,
            SchoolPrivacyPolicyDefault,
            PrivacyAcknowledgement,
            UserSession,
            User,
        ):
            db.execute(delete(model))
        db.commit()


@pytest.fixture()
def db() -> OrmSession:
    _clean_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_database()


def _user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    full_name: str,
    school: str | None = None,
    class_name: str | None = None,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=full_name,
        school=school,
        class_name=class_name,
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(email: str) -> TestClient:
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200
    return client


def _seed_baseline_users(db: OrmSession) -> dict[str, User]:
    student = _user(
        db,
        email="phase33-student@example.test",
        role=UserRole.STUDENT.value,
        full_name="Phase 33 Student",
        school="THPT Phase 33",
        class_name="10A1",
    )
    teacher = _user(
        db,
        email="phase33-teacher@example.test",
        role=UserRole.TEACHER.value,
        full_name="Phase 33 Teacher",
    )
    parent = _user(
        db,
        email="phase33-parent@example.test",
        role=UserRole.PARENT.value,
        full_name="Phase 33 Parent",
    )
    admin = _user(
        db,
        email="phase33-admin@example.test",
        role=UserRole.ADMIN.value,
        full_name="Phase 33 Admin",
    )
    db.add(PrivacyAcknowledgement(user_id=student.id, notice_version=NOTICE_VERSION, is_demo=True))
    for adult, relationship_type in (
        (teacher, UserRole.TEACHER.value),
        (parent, UserRole.PARENT.value),
    ):
        db.add(
            StudentAdultLink(
                student_id=student.id,
                adult_id=adult.id,
                relationship_type=relationship_type,
                status=LinkStatus.ACTIVE.value,
                created_by=admin.id,
                is_demo=True,
            )
        )
    db.add(
        SosAlert(
            student_id=student.id,
            student_full_name_snapshot=student.full_name,
            student_school_snapshot=student.school,
            student_class_name_snapshot=student.class_name,
            severity=SosSeverity.SUPPORT.value,
            source="demo_seed",
            current_status=SosAlertStatus.SENT.value,
            is_demo=True,
        )
    )
    db.add(
        StudentSupportPlan(
            student_id=student.id,
            status=SupportPlanStatus.ACTIVE.value,
            what_helps="aggregate test support plan text",
            what_does_not_help="aggregate test boundary text",
            preferred_contact_method="aggregate test contact method",
            safe_contact_times="aggregate test safe time",
            shareable_note="aggregate test shared note",
            is_demo=True,
        )
    )
    db.add(
        MoodCheckIn(
            student_id=student.id,
            mood_label="steady",
            energy_level=3,
            stress_level=2,
            context_tags=["school"],
            private_note="phase33_private_note_not_recorded_in_evidence",
            trend_label="Ổn định",
            supportive_message="aggregate supportive message",
            suggested_next_action="aggregate next action",
            suggest_support_plan=False,
            suggest_sos=False,
            is_demo=True,
        )
    )
    db.commit()
    return {"student": student, "teacher": teacher, "parent": parent, "admin": admin}


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


def _status_category(status_code: int) -> str:
    return f"{status_code // 100}xx"


def _measure_endpoint(
    *,
    client: TestClient,
    role: str,
    safe_endpoint: str,
    request_path: str,
) -> dict[str, object]:
    with QueryCounter(engine) as counter:
        started = perf_counter()
        response = client.get(request_path)
        duration_ms = round((perf_counter() - started) * 1000, 3)
    return {
        "endpoint": safe_endpoint,
        "role": role,
        "statusCategory": _status_category(response.status_code),
        "durationMs": duration_ms,
        "payloadBytes": len(response.content),
        "queryCountCandidate": counter.count,
        "coldWarmLabel": "local deterministic warm TestClient request",
        "commandSource": COMMAND_SOURCE,
    }


def _assert_aggregate_only_evidence(evidence_rows: list[dict[str, object]]) -> None:
    assert evidence_rows
    for row in evidence_rows:
        assert set(row) == AGGREGATE_KEYS
        assert not (set(row) & FORBIDDEN_EVIDENCE_KEYS)
        assert isinstance(row["durationMs"], float)
        assert row["durationMs"] >= 0
        assert isinstance(row["payloadBytes"], int)
        assert isinstance(row["queryCountCandidate"], int)
        assert row["commandSource"] == COMMAND_SOURCE
        assert "@" not in str(row["endpoint"])
        assert "phase33_private_note" not in str(row)


def test_phase33_backend_performance_baseline_collects_aggregate_endpoint_evidence(
    db: OrmSession,
) -> None:
    users = _seed_baseline_users(db)
    student_client = _login(users["student"].email)
    teacher_client = _login(users["teacher"].email)
    parent_client = _login(users["parent"].email)
    admin_client = _login(users["admin"].email)
    student_id = users["student"].id

    endpoint_specs: list[tuple[TestClient, str, str, str]] = [
        (student_client, "student", "/api/auth/me", "/api/auth/me"),
        (student_client, "student", "/api/student/profile", "/api/student/profile"),
        (student_client, "student", "/api/student/sos-alerts", "/api/student/sos-alerts"),
        (
            student_client,
            "student",
            "/api/student/reminders/mood-check-in",
            "/api/student/reminders/mood-check-in",
        ),
        (teacher_client, "teacher", "/api/teacher/students", "/api/teacher/students"),
        (parent_client, "parent", "/api/parent/students", "/api/parent/students"),
        (
            teacher_client,
            "teacher",
            "/api/teacher/support-overview",
            "/api/teacher/support-overview",
        ),
        (parent_client, "parent", "/api/parent/support-overview", "/api/parent/support-overview"),
        (
            teacher_client,
            "teacher",
            "/api/teacher/students/{student}/support-summary",
            f"/api/teacher/students/{student_id}/support-summary?reason_code=support_plan_context",
        ),
        (
            parent_client,
            "parent",
            "/api/parent/students/{student}/support-summary",
            f"/api/parent/students/{student_id}/support-summary?reason_code=support_plan_context",
        ),
        (admin_client, "admin", "/api/admin/users", "/api/admin/users"),
        (admin_client, "admin", "/api/admin/links", "/api/admin/links"),
        (
            admin_client,
            "admin",
            "/api/admin/operations/dashboard",
            "/api/admin/operations/dashboard",
        ),
        (admin_client, "admin", "/api/admin/reports/aggregate", "/api/admin/reports/aggregate"),
    ]

    evidence_rows = [
        _measure_endpoint(
            client=client,
            role=role,
            safe_endpoint=safe_endpoint,
            request_path=request_path,
        )
        for client, role, safe_endpoint, request_path in endpoint_specs
    ]

    _assert_aggregate_only_evidence(evidence_rows)
    for row in evidence_rows:
        assert row["statusCategory"] == "2xx", row
    assert (
        db.scalar(select(AuditEvent).where(AuditEvent.action == "sensitive_resource_read"))
        is not None
    )


def test_phase33_backend_evidence_shape_rejects_forbidden_keys() -> None:
    def assert_no_forbidden_keys(factory: Callable[[], dict[str, object]]) -> None:
        row = factory()
        assert set(row) == AGGREGATE_KEYS
        assert not (set(row) & FORBIDDEN_EVIDENCE_KEYS)

    assert_no_forbidden_keys(
        lambda: {
            "endpoint": "/api/auth/me",
            "role": "student",
            "statusCategory": "2xx",
            "durationMs": 1.0,
            "payloadBytes": 100,
            "queryCountCandidate": 1,
            "coldWarmLabel": "local deterministic warm TestClient request",
            "commandSource": COMMAND_SOURCE,
        }
    )
