from __future__ import annotations

from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ContentStatus,
    ExternalIdentity,
    LinkStatus,
    MoodCheckIn,
    MoodCheckInConfig,
    MoodCheckinReminderState,
    MoodNoteShare,
    MoodNoteShareScope,
    RelationshipType,
    SchoolPrivacyPolicyDefault,
    Scenario,
    SelfCheckTest,
    Session as UserSession,
    StudentAdultLink,
    StudentNotificationPreference,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.schemas.readiness import ReadinessCheck, ReadinessReport
from app.seeds.demo_seed import DEMO_STUDENT_EMAIL, DEMO_TEACHER_EMAIL
from app.services.admin_operations import build_operations_dashboard

PASSWORD = "secret123"
RAW_SELF_CHECK_TITLE = "RAW_PHASE31_SELF_CHECK_TITLE_SHOULD_NOT_RENDER"
RAW_SCENARIO_TITLE = "RAW_PHASE31_SCENARIO_TITLE_SHOULD_NOT_RENDER"
RAW_PRIVATE_NOTE = "RAW_PHASE31_PRIVATE_NOTE_SHOULD_NOT_RENDER"
PHASE31_REQUIREMENT_IDS = ("PILOT-01", "PILOT-02", "PILOT-03", "PILOT-04", "PILOT-05")
PHASE31_FORBIDDEN_OUTPUT_MARKERS = (
    "student.demo@beyou.local",
    "teacher.demo@beyou.local",
    "provider_subject",
    "raw_claims",
    "private_note",
    "sos_note",
    "transcript",
    "self_check_answer",
    "scenario_answer",
    "reason_text",
    "student_id",
    "recipient_id",
    "export_url",
    "risk_leaderboard",
)


def _clean_database() -> None:
    with SessionLocal() as db:
        phase_user_ids = list(
            db.scalars(
                select(User.id).where(
                    or_(
                        User.email.like("%phase31%@example.test"),
                        User.email.in_([DEMO_STUDENT_EMAIL, DEMO_TEACHER_EMAIL]),
                    )
                )
            )
        )
        if phase_user_ids:
            mood_checkin_ids = list(
                db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(phase_user_ids)))
            )
            if mood_checkin_ids:
                db.execute(
                    delete(MoodNoteShare).where(MoodNoteShare.mood_checkin_id.in_(mood_checkin_ids))
                )
                db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(mood_checkin_ids)))
            db.execute(
                delete(MoodCheckinReminderState).where(
                    MoodCheckinReminderState.student_id.in_(phase_user_ids)
                )
            )
            db.execute(
                delete(StudentNotificationPreference).where(
                    StudentNotificationPreference.student_id.in_(phase_user_ids)
                )
            )
            db.execute(
                delete(StudentAdultLink).where(
                    or_(
                        StudentAdultLink.student_id.in_(phase_user_ids),
                        StudentAdultLink.adult_id.in_(phase_user_ids),
                        StudentAdultLink.created_by.in_(phase_user_ids),
                    )
                )
            )
            db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(phase_user_ids)))
            db.execute(delete(UserSession).where(UserSession.user_id.in_(phase_user_ids)))
            db.execute(
                delete(ExternalIdentity).where(ExternalIdentity.linked_user_id.in_(phase_user_ids))
            )
        db.execute(delete(SelfCheckTest).where(SelfCheckTest.title.like("%PHASE31%")))
        db.execute(delete(Scenario).where(Scenario.title.like("%PHASE31%")))
        db.execute(delete(MoodCheckInConfig).where(MoodCheckInConfig.name.like("%phase31%")))
        db.execute(
            delete(SchoolPrivacyPolicyDefault).where(
                or_(
                    SchoolPrivacyPolicyDefault.school_scope.like("%phase31%"),
                    SchoolPrivacyPolicyDefault.is_demo.is_(True),
                )
            )
        )
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


def _readiness(status: str = "ready", migration_status: str = "pass") -> ReadinessReport:
    return ReadinessReport(
        status=status,
        generated_at=datetime.now(timezone.utc),
        checks=[
            ReadinessCheck(
                key="alembic_migration",
                category="database",
                status=migration_status,
                summary="Migration metadata safe.",
            )
        ],
    )


def _pilot_settings(**updates: object) -> Settings:
    values = {
        "RUNTIME_MODE": "production_pilot",
        "ALLOW_DEMO_SEED": False,
        "ALLOW_DEMO_LOGIN": False,
        "SESSION_COOKIE_SECURE": True,
        "SESSION_COOKIE_SAMESITE": "none",
        "FRONTEND_ORIGIN": "https://pilot.example",
        "FRONTEND_ORIGINS": "",
        "AUTH_PROVIDER_ENABLED": True,
        "AUTH_PROVIDER_KEY": "pilot_sso",
        "AUTH_PROVIDER_LABEL": "pilot",
        "AUTH_PROVIDER_MODE": "pilot",
        "AUTH_PROVIDER_LAST_CHECK_STATUS": "ready",
    }
    values.update(updates)
    return Settings(**values)


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name="Phase31 User",
        school="Phase31 School",
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _seed_safe_baseline(db: OrmSession) -> None:
    db.add_all(
        [
            SelfCheckTest(
                title=RAW_SELF_CHECK_TITLE,
                description="safe",
                status=ContentStatus.PUBLISHED.value,
                is_active=True,
                is_demo=False,
            ),
            Scenario(
                title=RAW_SCENARIO_TITLE,
                situation="safe situation",
                skill_tag="safe_skill",
                status=ContentStatus.PUBLISHED.value,
                recommended_response="safe response",
                lesson="safe lesson",
                is_demo=False,
            ),
            MoodCheckInConfig(
                name="phase31_safe_mood_config",
                status=ContentStatus.PUBLISHED.value,
                student_prompt="safe prompt",
                adult_guidance="safe guidance",
                mood_options=[],
                context_tags=[],
                is_demo=False,
            ),
            SchoolPrivacyPolicyDefault(
                school_scope="phase31_safe",
                allowed_channels=["in_app"],
                external_channels_enabled=False,
                is_demo=False,
            ),
        ]
    )
    db.commit()


def _seed_demo_dependencies(db: OrmSession) -> tuple[User, User]:
    student = _user(db, email=DEMO_STUDENT_EMAIL, role=UserRole.STUDENT.value, is_demo=True)
    teacher = _user(db, email=DEMO_TEACHER_EMAIL, role=UserRole.TEACHER.value, is_demo=True)
    db.add_all(
        [
            StudentAdultLink(
                student_id=student.id,
                adult_id=teacher.id,
                relationship_type=RelationshipType.TEACHER.value,
                status=LinkStatus.ACTIVE.value,
                created_by=teacher.id,
                is_demo=True,
            ),
            SelfCheckTest(
                title="RAW_PHASE31_DEMO_SELF_CHECK_TITLE",
                description="safe",
                status=ContentStatus.PUBLISHED.value,
                is_active=True,
                is_demo=True,
            ),
            Scenario(
                title="RAW_PHASE31_DEMO_SCENARIO_TITLE",
                situation="safe situation",
                skill_tag="safe_skill",
                status=ContentStatus.PUBLISHED.value,
                recommended_response="safe response",
                lesson="safe lesson",
                is_demo=True,
            ),
            MoodCheckInConfig(
                name="phase31_demo_mood_config",
                status=ContentStatus.PUBLISHED.value,
                student_prompt="safe prompt",
                adult_guidance="safe guidance",
                mood_options=[],
                context_tags=[],
                is_demo=True,
            ),
            SchoolPrivacyPolicyDefault(
                school_scope="phase31_demo",
                allowed_channels=["in_app"],
                external_channels_enabled=False,
                is_demo=True,
            ),
            StudentNotificationPreference(
                student_id=student.id,
                allowed_channels=["in_app"],
                in_app_reminders_enabled=True,
                mood_checkin_reminders_enabled=True,
                is_demo=True,
            ),
            MoodCheckinReminderState(student_id=student.id, reminder_type="phase31", is_demo=True),
        ]
    )
    db.commit()
    mood = MoodCheckIn(
        student_id=student.id,
        mood_label="safe",
        energy_level=3,
        stress_level=2,
        context_tags=[],
        private_note=RAW_PRIVATE_NOTE,
        trend_label="safe",
        supportive_message="safe",
        suggested_next_action="safe",
        is_demo=True,
    )
    db.add(mood)
    db.commit()
    db.refresh(mood)
    db.add(
        MoodNoteShare(
            mood_checkin_id=mood.id,
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type_snapshot=RelationshipType.TEACHER.value,
            share_scope=MoodNoteShareScope.STUDENT_SUMMARY.value,
            student_summary="RAW_PHASE31_STUDENT_SUMMARY",
            is_demo=True,
        )
    )
    db.commit()
    return student, teacher


def _dashboard_json(db: OrmSession, settings: Settings | None = None) -> str:
    return build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=settings or _pilot_settings(),
    ).model_dump_json()


def _assert_phase31_privacy_redlines(rendered: str) -> None:
    for forbidden in PHASE31_FORBIDDEN_OUTPUT_MARKERS:
        assert forbidden not in rendered
    assert "destructive_reset_workflow" not in rendered


def test_phase31_requirement_ids_are_documented_for_backend_gate() -> None:
    assert set(PHASE31_REQUIREMENT_IDS) == {
        "PILOT-01",
        "PILOT-02",
        "PILOT-03",
        "PILOT-04",
        "PILOT-05",
    }


def test_pilot_launch_checklist_blocks_non_pilot_runtime_and_demo_policy(db: OrmSession) -> None:
    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(status="degraded", migration_status="warn"),
        settings=_pilot_settings(
            RUNTIME_MODE="public_demo",
            ALLOW_DEMO_SEED=True,
            ALLOW_DEMO_LOGIN=True,
            AUTH_PROVIDER_ENABLED=False,
        ),
    )

    items = {item.key: item for item in dashboard.pilot_launch.checklist}
    assert dashboard.pilot_launch.status == "blocked"
    assert items["runtime_mode"].status == "fail"
    assert items["demo_seed_login_policy"].status == "warn"
    assert items["identity_readiness"].status == "warn"
    assert items["migration_status"].status == "warn"


def test_pilot_launch_checklist_can_report_ready_for_safe_pilot_metadata(db: OrmSession) -> None:
    _seed_safe_baseline(db)

    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(),
    )

    assert dashboard.pilot_launch.status == "ready"
    assert {item.key for item in dashboard.pilot_launch.checklist} == {
        "runtime_mode",
        "readiness_status",
        "migration_status",
        "origin_cookie_contract",
        "demo_seed_login_policy",
        "identity_readiness",
        "pilot_smoke_profile",
        "privacy_regression_status",
        "baseline_content",
        "school_policy_setup",
    }
    rendered = dashboard.model_dump_json()
    assert '"pilot_launch"' in rendered
    assert '"pilot_data_safety"' in rendered
    assert '"pilot_handoff"' in rendered
    _assert_phase31_privacy_redlines(rendered)
    for forbidden in (
        "access_token",
        "refresh_token",
        "id_token",
        "answer",
        RAW_SELF_CHECK_TITLE,
        RAW_SCENARIO_TITLE,
    ):
        assert forbidden not in rendered


def test_pilot_data_safety_counts_demo_rows_as_aggregate_metadata_only(db: OrmSession) -> None:
    student, teacher = _seed_demo_dependencies(db)

    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(RUNTIME_MODE="public_demo"),
    )

    buckets = {bucket.key: bucket for bucket in dashboard.pilot_data_safety.buckets}
    assert buckets["demo_active_users"].count == 2
    assert buckets["demo_active_links"].count == 1
    assert buckets["demo_published_self_checks"].count == 1
    assert buckets["demo_published_scenarios"].count == 1
    assert buckets["demo_mood_configs"].count == 1
    assert buckets["demo_policy_defaults"].count == 1
    assert buckets["demo_notification_preferences"].count == 1
    assert buckets["demo_reminder_states"].count == 1
    assert buckets["demo_mood_shares"].count == 1
    assert dashboard.pilot_data_safety.status == "needs_review"

    rendered = dashboard.model_dump_json()
    _assert_phase31_privacy_redlines(rendered)
    for forbidden in (
        str(student.id),
        str(teacher.id),
        "RAW_PHASE31_DEMO_SELF_CHECK_TITLE",
        "RAW_PHASE31_DEMO_SCENARIO_TITLE",
        RAW_PRIVATE_NOTE,
        "student_summary",
        "answer",
    ):
        assert forbidden not in rendered


def test_pilot_data_safety_blocks_production_pilot_demo_dependencies(db: OrmSession) -> None:
    _seed_demo_dependencies(db)

    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(),
    )

    buckets = {bucket.key: bucket for bucket in dashboard.pilot_data_safety.buckets}
    assert dashboard.pilot_data_safety.status == "blocked"
    assert buckets["demo_active_users"].status == "fail"
    assert buckets["demo_active_users"].blocking is True
    assert buckets["demo_active_links"].status == "fail"
    assert buckets["demo_policy_defaults"].status == "warn"
    assert buckets["demo_policy_defaults"].blocking is False


def test_pilot_handoff_guidance_is_static_safe_metadata(db: OrmSession) -> None:
    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(),
    )

    rendered = dashboard.model_dump_json()
    for required in (
        "Redeploy the last known good Vercel frontend and Render backend build.",
        "Revert deployment environment variables to the last known good values.",
        "Run /health/ready, npm --prefix frontend run guard:deploy, and npm --prefix frontend run smoke:pilot.",
        "Notify the school or pilot owner if real users are affected.",
        "Escalate incidents through the agreed school support path.",
        "Do not use destructive database reset as the default rollback path.",
        "Do not use raw data export as the default rollback path.",
    ):
        assert required in rendered
    for forbidden in (
        "support@example",
        "incident_id",
        "delete_button",
        "drop database",
        "download",
        "student_id",
        "reason_text",
    ):
        assert forbidden not in rendered.lower()


def test_baseline_setup_guidance_uses_counts_without_creating_demo_data(db: OrmSession) -> None:
    _seed_safe_baseline(db)
    before = {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "links": db.scalar(select(func.count()).select_from(StudentAdultLink)) or 0,
        "self_checks": db.scalar(select(func.count()).select_from(SelfCheckTest)) or 0,
        "scenarios": db.scalar(select(func.count()).select_from(Scenario)) or 0,
        "mood_configs": db.scalar(select(func.count()).select_from(MoodCheckInConfig)) or 0,
    }

    dashboard = build_operations_dashboard(
        db,
        readiness_report=_readiness(),
        settings=_pilot_settings(),
    )

    after = {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "links": db.scalar(select(func.count()).select_from(StudentAdultLink)) or 0,
        "self_checks": db.scalar(select(func.count()).select_from(SelfCheckTest)) or 0,
        "scenarios": db.scalar(select(func.count()).select_from(Scenario)) or 0,
        "mood_configs": db.scalar(select(func.count()).select_from(MoodCheckInConfig)) or 0,
    }
    baseline = {item.key: item for item in dashboard.pilot_handoff.baseline_setup}

    assert before == after
    assert baseline["baseline_self_checks"].status == "pass"
    assert baseline["baseline_scenarios"].status == "pass"
    assert baseline["baseline_mood_config"].status == "pass"
    assert baseline["school_policy_defaults"].status == "pass"
    assert baseline["demo_seed_disabled_for_pilot"].status == "pass"
    rendered = dashboard.model_dump_json()
    assert RAW_SELF_CHECK_TITLE not in rendered
    assert RAW_SCENARIO_TITLE not in rendered
