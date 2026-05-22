from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import get_settings
from app.db.models import (
    AuditEvent,
    ContentStatus,
    SosAlert,
    SosStatusEvent,
    InAppNotification,
    LinkStatus,
    MoodCheckInConfig,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    ChatSafetySignal,
    ChatMessage,
    ChatThread,
    ChatbotSafetyConfig,
    Session as UserSession,
    StudentAdultLink,
    User,
)
from app.db.session import SessionLocal
from app.seeds.demo_seed import (
    DEMO_ADMIN_EMAIL,
    DEMO_PARENT_EMAIL,
    DEMO_STUDENT_EMAIL,
    DEMO_TEACHER_EMAIL,
    seed_demo_data,
)
from app.schemas.readiness import ReadinessReport
from app.services.admin_operations import build_operations_dashboard


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            ChatSafetySignal,
            ChatMessage,
            ChatThread,
            ChatbotSafetyConfig,
            MoodCheckInConfig,
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
            AuditEvent,
            StudentAdultLink,
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


def test_demo_seed_refuses_when_disabled(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "false")
    get_settings.cache_clear()

    assert seed_demo_data(db, get_settings()) is False
    assert db.scalars(select(User)).all() == []
    get_settings.cache_clear()


def test_demo_seed_creates_idempotent_demo_users_and_links(
    db: OrmSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ALLOW_DEMO_SEED", "true")
    get_settings.cache_clear()
    settings = get_settings()

    assert seed_demo_data(db, settings) is True
    assert seed_demo_data(db, settings) is True

    users = {user.email: user for user in db.scalars(select(User)).all()}
    assert set(users) == {
        DEMO_STUDENT_EMAIL,
        DEMO_TEACHER_EMAIL,
        DEMO_PARENT_EMAIL,
        DEMO_ADMIN_EMAIL,
    }
    assert all(user.is_demo is True for user in users.values())
    assert users[DEMO_STUDENT_EMAIL].school == "Trường THPT BeYou Demo"
    assert users[DEMO_STUDENT_EMAIL].class_name == "10A1"

    links = db.scalars(
        select(StudentAdultLink).where(
            StudentAdultLink.student_id == users[DEMO_STUDENT_EMAIL].id,
            StudentAdultLink.status == LinkStatus.ACTIVE.value,
        )
    ).all()
    assert len(links) == 2
    assert {link.relationship_type for link in links} == {"teacher", "parent"}
    assert all(link.is_demo is True for link in links)

    mood_config = db.scalar(select(MoodCheckInConfig).where(MoodCheckInConfig.is_demo.is_(True)))
    assert mood_config is not None
    assert mood_config.status == ContentStatus.PUBLISHED.value
    assert len(mood_config.mood_options) == 6
    assert len(mood_config.context_tags) == 7

    dashboard = build_operations_dashboard(
        db,
        readiness_report=ReadinessReport(
            status="ready",
            generated_at=datetime.now(timezone.utc),
            checks=[],
        ),
        settings=settings,
    )
    assert dashboard.demo_seed.status == "pass"
    assert dashboard.demo_seed.active_link_count == 2
    assert dashboard.demo_seed.published_self_check_count > 0
    assert dashboard.demo_seed.published_scenario_count > 0
    assert dashboard.demo_seed.published_mood_config_count == 1
    assert dashboard.connectivity.health_live_path == "/health/live"
    assert dashboard.connectivity.session_cookie_name == settings.session_cookie_name
    assert all(item.command == "npm --prefix frontend run smoke:production" for item in dashboard.production_smoke)
    get_settings.cache_clear()
