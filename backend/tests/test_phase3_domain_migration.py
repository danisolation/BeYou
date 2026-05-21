from __future__ import annotations

from sqlalchemy import inspect

from app.db.session import engine


PHASE3_TABLES = {
    "self_check_tests",
    "self_check_questions",
    "self_check_choices",
    "self_check_thresholds",
    "self_check_attempts",
    "self_check_attempt_answers",
    "scenarios",
    "scenario_choices",
    "scenario_attempts",
}


def test_phase3_migration_creates_content_and_attempt_tables() -> None:
    inspector = inspect(engine)

    assert PHASE3_TABLES.issubset(set(inspector.get_table_names()))


def test_phase3_models_expose_locked_enum_values() -> None:
    from app.db.models import ContentStatus, RiskStateLabel, ScenarioSignal

    assert {status.value for status in ContentStatus} == {"draft", "published", "archived"}
    assert {label.value for label in RiskStateLabel} == {
        "On dinh",
        "Can chu y",
        "Nen tim ho tro",
        "Can ho tro som",
    }
    assert {signal.value for signal in ScenarioSignal} == {"constructive", "risky"}


def test_phase3_snapshot_and_demo_columns_exist() -> None:
    inspector = inspect(engine)
    columns_by_table = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in PHASE3_TABLES
    }

    for table_name, columns in columns_by_table.items():
        assert "is_demo" in columns, f"{table_name} must preserve demo/real data separation"

    assert {"test_snapshot", "test_title_snapshot"}.issubset(
        columns_by_table["self_check_attempts"]
    )
    assert {
        "question_text_snapshot",
        "choice_text_snapshot",
        "score_value_snapshot",
    }.issubset(columns_by_table["self_check_attempt_answers"])
    assert {
        "selected_choice_snapshot",
        "feedback_snapshot",
        "recommended_response_snapshot",
        "lesson_snapshot",
        "skill_tag_snapshot",
    }.issubset(columns_by_table["scenario_attempts"])
