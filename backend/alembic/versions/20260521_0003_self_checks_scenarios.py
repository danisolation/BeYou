"""self checks scenarios

Revision ID: 20260521_0003
Revises: 20260520_0002
Create Date: 2026-05-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0003"
down_revision: str | None = "20260520_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "self_check_tests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_self_check_tests_status_is_active", "self_check_tests", ["status", "is_active"]
    )
    op.create_index("ix_self_check_tests_is_demo", "self_check_tests", ["is_demo"])

    op.create_table(
        "self_check_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "test_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_tests.id"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_self_check_questions_test_id", "self_check_questions", ["test_id"])

    op.create_table(
        "self_check_choices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_questions.id"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("score_value", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_self_check_choices_question_id", "self_check_choices", ["question_id"])

    op.create_table(
        "self_check_thresholds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "test_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_tests.id"),
            nullable=False,
        ),
        sa.Column("state_label", sa.String(length=64), nullable=False),
        sa.Column("min_score", sa.Integer(), nullable=False),
        sa.Column("max_score", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("advice", sa.Text(), nullable=True),
        sa.Column("positive_content", sa.Text(), nullable=True),
        sa.Column("suggested_next_action", sa.Text(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_self_check_thresholds_test_id", "self_check_thresholds", ["test_id"])

    op.create_table(
        "self_check_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "test_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_tests.id"),
            nullable=False,
        ),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("state_label", sa.String(length=64), nullable=False),
        sa.Column("supportive_headline", sa.Text(), nullable=True),
        sa.Column("short_comment", sa.Text(), nullable=True),
        sa.Column("advice_summary", sa.Text(), nullable=True),
        sa.Column("support_suggestion", sa.Text(), nullable=True),
        sa.Column("positive_content", sa.Text(), nullable=True),
        sa.Column("suggested_next_action", sa.Text(), nullable=True),
        sa.Column("test_title_snapshot", sa.String(length=255), nullable=False),
        sa.Column("test_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_self_check_attempts_student_id", "self_check_attempts", ["student_id"])
    op.create_index("ix_self_check_attempts_test_id", "self_check_attempts", ["test_id"])
    op.create_index(
        "ix_self_check_attempts_student_completed",
        "self_check_attempts",
        ["student_id", "completed_at"],
    )
    op.create_index("ix_self_check_attempts_is_demo", "self_check_attempts", ["is_demo"])

    op.create_table(
        "self_check_attempt_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "attempt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_attempts.id"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_questions.id"),
            nullable=True,
        ),
        sa.Column(
            "choice_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("self_check_choices.id"),
            nullable=True,
        ),
        sa.Column("question_text_snapshot", sa.Text(), nullable=False),
        sa.Column("choice_text_snapshot", sa.Text(), nullable=False),
        sa.Column("score_value_snapshot", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(
        "ix_self_check_attempt_answers_attempt_id", "self_check_attempt_answers", ["attempt_id"]
    )

    op.create_table(
        "scenarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("situation", sa.Text(), nullable=False),
        sa.Column("skill_tag", sa.String(length=96), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("recommended_response", sa.Text(), nullable=False),
        sa.Column("lesson", sa.Text(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scenarios_status", "scenarios", ["status"])
    op.create_index("ix_scenarios_is_demo", "scenarios", ["is_demo"])

    op.create_table(
        "scenario_choices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "scenario_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scenarios.id"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("signal", sa.String(length=32), nullable=False),
        sa.Column("feedback", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_scenario_choices_scenario_id", "scenario_choices", ["scenario_id"])

    op.create_table(
        "scenario_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scenarios.id"), nullable=False),
        sa.Column(
            "selected_choice_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scenario_choices.id"),
            nullable=True,
        ),
        sa.Column("scenario_title_snapshot", sa.String(length=255), nullable=False),
        sa.Column("situation_snapshot", sa.Text(), nullable=False),
        sa.Column("selected_choice_snapshot", sa.Text(), nullable=True),
        sa.Column("signal_snapshot", sa.String(length=32), nullable=True),
        sa.Column("feedback_snapshot", sa.Text(), nullable=True),
        sa.Column("recommended_response_snapshot", sa.Text(), nullable=False),
        sa.Column("lesson_snapshot", sa.Text(), nullable=False),
        sa.Column("skill_tag_snapshot", sa.String(length=96), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scenario_attempts_student_id", "scenario_attempts", ["student_id"])
    op.create_index("ix_scenario_attempts_scenario_id", "scenario_attempts", ["scenario_id"])
    op.create_index(
        "ix_scenario_attempts_student_completed",
        "scenario_attempts",
        ["student_id", "completed_at"],
    )
    op.create_index("ix_scenario_attempts_is_demo", "scenario_attempts", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_scenario_attempts_is_demo", table_name="scenario_attempts")
    op.drop_index("ix_scenario_attempts_student_completed", table_name="scenario_attempts")
    op.drop_index("ix_scenario_attempts_scenario_id", table_name="scenario_attempts")
    op.drop_index("ix_scenario_attempts_student_id", table_name="scenario_attempts")
    op.drop_table("scenario_attempts")
    op.drop_index("ix_scenario_choices_scenario_id", table_name="scenario_choices")
    op.drop_table("scenario_choices")
    op.drop_index("ix_scenarios_is_demo", table_name="scenarios")
    op.drop_index("ix_scenarios_status", table_name="scenarios")
    op.drop_table("scenarios")
    op.drop_index("ix_self_check_attempt_answers_attempt_id", table_name="self_check_attempt_answers")
    op.drop_table("self_check_attempt_answers")
    op.drop_index("ix_self_check_attempts_is_demo", table_name="self_check_attempts")
    op.drop_index("ix_self_check_attempts_student_completed", table_name="self_check_attempts")
    op.drop_index("ix_self_check_attempts_test_id", table_name="self_check_attempts")
    op.drop_index("ix_self_check_attempts_student_id", table_name="self_check_attempts")
    op.drop_table("self_check_attempts")
    op.drop_index("ix_self_check_thresholds_test_id", table_name="self_check_thresholds")
    op.drop_table("self_check_thresholds")
    op.drop_index("ix_self_check_choices_question_id", table_name="self_check_choices")
    op.drop_table("self_check_choices")
    op.drop_index("ix_self_check_questions_test_id", table_name="self_check_questions")
    op.drop_table("self_check_questions")
    op.drop_index("ix_self_check_tests_is_demo", table_name="self_check_tests")
    op.drop_index("ix_self_check_tests_status_is_active", table_name="self_check_tests")
    op.drop_table("self_check_tests")
