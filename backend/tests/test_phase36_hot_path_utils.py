from __future__ import annotations

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import Session as UserSession
from app.db.models import User, UserRole
from app.db.session import SessionLocal

from phase36_hot_path_utils import assert_aggregate_only_text, make_user, measure_queries


def _clean_database() -> None:
    with SessionLocal() as db:
        db.execute(delete(UserSession))
        db.execute(delete(User))
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


def test_phase36_query_counter_counts_selects(db: OrmSession) -> None:
    make_user(
        db,
        "phase36-admin@example.test",
        UserRole.ADMIN,
        "Phase 36 Admin",
    )
    db.commit()

    result, count = measure_queries(lambda: db.scalar(select(func.count()).select_from(User)))

    assert count >= 1
    assert result is not None
    assert result >= 1


def test_phase36_aggregate_redline_helper_rejects_sensitive_markers() -> None:
    assert_aggregate_only_text("safe aggregate status")

    with pytest.raises(AssertionError):
        assert_aggregate_only_text("private_note")
    with pytest.raises(AssertionError):
        assert_aggregate_only_text("access_token")
