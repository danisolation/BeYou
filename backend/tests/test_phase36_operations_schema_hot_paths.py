from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import delete, event, or_, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.db.models import AuditEvent, Session as UserSession, User, UserRole
from app.db.session import SessionLocal, engine
from app.schemas.readiness import ReadinessCheck, ReadinessReport
from app.seeds.demo_seed import DEMO_ADMIN_EMAIL, DEMO_PARENT_EMAIL, DEMO_STUDENT_EMAIL, DEMO_TEACHER_EMAIL
from app.services.admin_operations import build_operations_dashboard
from phase36_hot_path_utils import assert_aggregate_only_text, login_client, make_user, measure_queries

ROOT = Path(__file__).resolve().parents[2]
PHASE36_EMAIL_PATTERN = "%phase36-ops%@example.test"
SAFE_ACTION = "phase36_operations_metadata_checked"
UNSAFE_MARKERS = (
    "phase36-student@example.test",
    "RAW_PHASE36_PRIVATE_NOTE",
    "RAW_PHASE36_TRANSCRIPT",
    "RAW_PHASE36_PROVIDER_SUBJECT",
    "RAW_PHASE36_EXPORT_URL",
    "RAW_PHASE36_RISK_LEADERBOARD",
    "RAW_PHASE36_REASON_TEXT",
    "student_email",
    "private_note",
    "transcript",
    "provider_subject",
    "export_url",
    "risk_leaderboard",
    "reason_text",
)


class StatementRecorder:
    def __init__(self, target_engine: Engine) -> None:
        self.target_engine = target_engine
        self.statements: list[str] = []

    def __enter__(self) -> StatementRecorder:
        event.listen(self.target_engine, "before_cursor_execute", self._before_cursor_execute)
        return self

    def __exit__(self, *exc_info: object) -> None:
        event.remove(self.target_engine, "before_cursor_execute", self._before_cursor_execute)

    def _before_cursor_execute(
        self,
        conn: object,
        cursor: object,
        statement: str,
        parameters: object,
        context: object,
        executemany: bool,
    ) -> None:
        self.statements.append(" ".join(statement.split()).lower())


def _clean_database() -> None:
    with SessionLocal() as db:
        phase_user_ids = list(
            db.scalars(
                select(User.id).where(
                    or_(
                        User.email.like(PHASE36_EMAIL_PATTERN),
                        User.email.in_(
                            [DEMO_STUDENT_EMAIL, DEMO_TEACHER_EMAIL, DEMO_PARENT_EMAIL, DEMO_ADMIN_EMAIL]
                        ),
                    )
                )
            )
        )
        if phase_user_ids:
            db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(phase_user_ids)))
            db.execute(delete(UserSession).where(UserSession.user_id.in_(phase_user_ids)))
        db.execute(delete(AuditEvent).where(AuditEvent.resource_id.like("phase36-ops%")))
        if phase_user_ids:
            db.execute(delete(User).where(User.id.in_(phase_user_ids)))
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


def _readiness() -> ReadinessReport:
    return ReadinessReport(
        status="ready",
        generated_at=datetime.now(timezone.utc),
        checks=[
            ReadinessCheck(
                key="phase36_metadata_gate",
                category="database",
                status="pass",
                summary="Phase 36 metadata-only gate.",
            )
        ],
    )


def _settings() -> Settings:
    return Settings(ALLOW_DEMO_SEED=True, ALLOW_DEMO_LOGIN=True)


def _seed_admin(db: OrmSession) -> User:
    admin = make_user(
        db,
        "admin-phase36-ops@example.test",
        UserRole.ADMIN,
        "Phase36 Ops Admin",
        is_demo=True,
    )
    db.commit()
    return admin


def _seed_expected_demo_roles(db: OrmSession) -> None:
    for role, email in (
        (UserRole.STUDENT, DEMO_STUDENT_EMAIL),
        (UserRole.TEACHER, DEMO_TEACHER_EMAIL),
        (UserRole.PARENT, DEMO_PARENT_EMAIL),
        (UserRole.ADMIN, DEMO_ADMIN_EMAIL),
    ):
        make_user(db, email, role, f"Phase36 Demo {role.value}", is_demo=True)
    db.commit()


def _seed_unsafe_audit_events(db: OrmSession, admin: User, count: int = 35) -> None:
    now = datetime.now(timezone.utc)
    for index in range(count):
        db.add(
            AuditEvent(
                actor_id=admin.id,
                actor_role=UserRole.ADMIN.value,
                action=SAFE_ACTION,
                resource_type="operations_readiness",
                resource_id=f"phase36-ops-{index}",
                status="success",
                reason="phase36_operations",
                timestamp=now,
                metadata_summary={
                    "safe_action": SAFE_ACTION,
                    "safe_count": index,
                    "student_email": "phase36-student@example.test",
                    "private_note": "RAW_PHASE36_PRIVATE_NOTE",
                    "transcript": "RAW_PHASE36_TRANSCRIPT",
                    "provider_subject": "RAW_PHASE36_PROVIDER_SUBJECT",
                    "export_url": "RAW_PHASE36_EXPORT_URL",
                    "risk_leaderboard": "RAW_PHASE36_RISK_LEADERBOARD",
                    "reason_text": "RAW_PHASE36_REASON_TEXT",
                    "nested": {
                        "safe_status": "pass",
                        "details": "RAW_PHASE36_PRIVATE_NOTE",
                    },
                },
                is_demo=True,
            )
        )
    db.commit()


def test_operations_dashboard_limit_remains_clamped_and_metadata_only(db: OrmSession) -> None:
    admin = _seed_admin(db)
    _seed_unsafe_audit_events(db, admin)
    admin_email = admin.email
    admin_client = login_client(admin_email)

    rejected = admin_client.get("/api/admin/operations/dashboard?limit=150")
    assert rejected.status_code == 422

    response, query_count = measure_queries(lambda: admin_client.get("/api/admin/operations/dashboard?limit=20"))
    assert response.status_code == 200
    assert query_count <= 40
    rendered = response.text
    assert SAFE_ACTION in rendered
    for marker in UNSAFE_MARKERS:
        assert marker not in rendered
    assert_aggregate_only_text(rendered)


def test_operations_demo_seed_summary_uses_batched_role_lookup(db: OrmSession) -> None:
    _seed_expected_demo_roles(db)

    with StatementRecorder(engine) as recorder:
        dashboard = build_operations_dashboard(
            db,
            readiness_report=_readiness(),
            settings=_settings(),
            limit=20,
        )

    role_lookup_statements = [
        statement
        for statement in recorder.statements
        if " from users " in statement and "users.email" in statement
    ]
    assert len(role_lookup_statements) <= 1
    assert {role.role for role in dashboard.demo_seed.roles} == {
        UserRole.STUDENT.value,
        UserRole.TEACHER.value,
        UserRole.PARENT.value,
        UserRole.ADMIN.value,
    }
    assert all(role.present and role.active and role.is_demo for role in dashboard.demo_seed.roles)


def test_phase36_schema_index_decision_is_evidence_tied() -> None:
    decision_path = ROOT / ".planning" / "phases" / "36-backend-db-hot-path-optimization" / "36-SCHEMA-INDEX-DECISION.md"

    assert decision_path.exists()
    text = decision_path.read_text(encoding="utf-8")
    assert "DBPERF-05" in text
    assert "student_adult_links" in text
    assert "sos_alerts" in text
    assert "self_check_attempts" in text
    assert "mood_check_ins" in text
    assert (
        "No new indexes added" in text
        or "20260527_0012_phase36_hot_path_indexes.py" in text
    )
