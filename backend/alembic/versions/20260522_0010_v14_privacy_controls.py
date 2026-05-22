"""v1.4 privacy controls

Revision ID: 20260522_0010
Revises: 20260522_0009
Create Date: 2026-05-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0010"
down_revision: str | None = "20260522_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "student_notification_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("in_app_reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("mood_checkin_reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("reminder_cadence", sa.String(length=32), nullable=False, server_default="weekly"),
        sa.Column("allowed_channels", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("consent_version", sa.String(length=32), nullable=True),
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("quiet_hours_start", sa.String(length=5), nullable=True),
        sa.Column("quiet_hours_end", sa.String(length=5), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Ho_Chi_Minh"),
        sa.Column("paused_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pause_reason_code", sa.String(length=64), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("student_id", name="uq_student_notification_preferences_student_id"),
    )
    op.create_index(
        "ix_student_notification_preferences_student_id",
        "student_notification_preferences",
        ["student_id"],
    )
    op.create_index(
        "ix_student_notification_preferences_is_demo",
        "student_notification_preferences",
        ["is_demo"],
    )
    op.create_index(
        "ix_student_notification_preferences_paused_until",
        "student_notification_preferences",
        ["paused_until"],
    )

    op.create_table(
        "mood_checkin_reminder_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reminder_type", sa.String(length=64), nullable=False, server_default="mood_check_in"),
        sa.Column("last_shown_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_dismissed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("snoozed_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "student_id",
            "reminder_type",
            name="uq_mood_checkin_reminder_state_student_type",
        ),
    )
    op.create_index("ix_mood_checkin_reminder_states_student_id", "mood_checkin_reminder_states", ["student_id"])
    op.create_index("ix_mood_checkin_reminder_states_due", "mood_checkin_reminder_states", ["next_due_at"])
    op.create_index("ix_mood_checkin_reminder_states_is_demo", "mood_checkin_reminder_states", ["is_demo"])

    op.create_table(
        "mood_note_shares",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "mood_checkin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mood_check_ins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("adult_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("relationship_type_snapshot", sa.String(length=32), nullable=False),
        sa.Column("share_scope", sa.String(length=32), nullable=False),
        sa.Column("student_summary", sa.Text(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_mood_note_shares_mood_checkin_id", "mood_note_shares", ["mood_checkin_id"])
    op.create_index("ix_mood_note_shares_student_id", "mood_note_shares", ["student_id"])
    op.create_index("ix_mood_note_shares_adult_id", "mood_note_shares", ["adult_id"])
    op.create_index(
        "ix_mood_note_shares_active_unique",
        "mood_note_shares",
        ["mood_checkin_id", "adult_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.create_index("ix_mood_note_shares_student_created", "mood_note_shares", ["student_id", "created_at"])
    op.create_index("ix_mood_note_shares_adult_created", "mood_note_shares", ["adult_id", "created_at"])
    op.create_index("ix_mood_note_shares_is_demo", "mood_note_shares", ["is_demo"])

    op.create_table(
        "school_privacy_policy_defaults",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school_scope", sa.String(length=96), nullable=False, server_default="default"),
        sa.Column("default_in_app_reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("default_quiet_hours_start", sa.String(length=5), nullable=True),
        sa.Column("default_quiet_hours_end", sa.String(length=5), nullable=True),
        sa.Column("default_timezone", sa.String(length=64), nullable=False, server_default="Asia/Ho_Chi_Minh"),
        sa.Column("allowed_channels", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("external_channels_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("note_sharing_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("reason_required_for_adult_summaries", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("reason_required_for_shared_mood_notes", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("allowed_reason_codes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("school_scope", name="uq_school_privacy_policy_defaults_school_scope"),
    )
    op.create_index("ix_school_privacy_policy_defaults_is_demo", "school_privacy_policy_defaults", ["is_demo"])
    op.create_index("ix_school_privacy_policy_defaults_updated", "school_privacy_policy_defaults", ["updated_at"])


def downgrade() -> None:
    op.drop_index("ix_school_privacy_policy_defaults_updated", table_name="school_privacy_policy_defaults")
    op.drop_index("ix_school_privacy_policy_defaults_is_demo", table_name="school_privacy_policy_defaults")
    op.drop_table("school_privacy_policy_defaults")

    op.drop_index("ix_mood_note_shares_is_demo", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_adult_created", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_student_created", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_active_unique", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_adult_id", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_student_id", table_name="mood_note_shares")
    op.drop_index("ix_mood_note_shares_mood_checkin_id", table_name="mood_note_shares")
    op.drop_table("mood_note_shares")

    op.drop_index("ix_mood_checkin_reminder_states_is_demo", table_name="mood_checkin_reminder_states")
    op.drop_index("ix_mood_checkin_reminder_states_due", table_name="mood_checkin_reminder_states")
    op.drop_index("ix_mood_checkin_reminder_states_student_id", table_name="mood_checkin_reminder_states")
    op.drop_table("mood_checkin_reminder_states")

    op.drop_index("ix_student_notification_preferences_paused_until", table_name="student_notification_preferences")
    op.drop_index("ix_student_notification_preferences_is_demo", table_name="student_notification_preferences")
    op.drop_index("ix_student_notification_preferences_student_id", table_name="student_notification_preferences")
    op.drop_table("student_notification_preferences")
