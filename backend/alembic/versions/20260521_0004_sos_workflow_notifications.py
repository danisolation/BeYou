"""sos workflow notifications

Revision ID: 20260521_0004
Revises: 20260521_0003
Create Date: 2026-05-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0004"
down_revision: str | None = "20260521_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sos_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("student_full_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("student_school_snapshot", sa.String(length=255), nullable=True),
        sa.Column("student_class_name_snapshot", sa.String(length=64), nullable=True),
        sa.Column("severity", sa.String(length=32), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("current_status", sa.String(length=32), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sos_alerts_student_id", "sos_alerts", ["student_id"])
    op.create_index("ix_sos_alerts_student_created", "sos_alerts", ["student_id", "created_at"])
    op.create_index("ix_sos_alerts_current_status", "sos_alerts", ["current_status"])
    op.create_index("ix_sos_alerts_is_demo", "sos_alerts", ["is_demo"])

    op.create_table(
        "sos_status_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("alert_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sos_alerts.id"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("actor_role", sa.String(length=32), nullable=False),
        sa.Column("previous_status", sa.String(length=32), nullable=True),
        sa.Column("new_status", sa.String(length=32), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sos_status_events_alert_id", "sos_status_events", ["alert_id"])
    op.create_index("ix_sos_status_events_actor_id", "sos_status_events", ["actor_id"])
    op.create_index("ix_sos_status_events_alert_created", "sos_status_events", ["alert_id", "created_at"])
    op.create_index("ix_sos_status_events_is_demo", "sos_status_events", ["is_demo"])

    op.create_table(
        "in_app_notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resource_type", sa.String(length=96), nullable=False),
        sa.Column("resource_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("href", sa.String(length=512), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_in_app_notifications_recipient_id", "in_app_notifications", ["recipient_id"])
    op.create_index("ix_in_app_notifications_actor_id", "in_app_notifications", ["actor_id"])
    op.create_index(
        "ix_in_app_notifications_recipient_created",
        "in_app_notifications",
        ["recipient_id", "created_at"],
    )
    op.create_index(
        "ix_in_app_notifications_resource",
        "in_app_notifications",
        ["resource_type", "resource_id"],
    )
    op.create_index("ix_in_app_notifications_is_demo", "in_app_notifications", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_in_app_notifications_is_demo", table_name="in_app_notifications")
    op.drop_index("ix_in_app_notifications_resource", table_name="in_app_notifications")
    op.drop_index("ix_in_app_notifications_recipient_created", table_name="in_app_notifications")
    op.drop_index("ix_in_app_notifications_actor_id", table_name="in_app_notifications")
    op.drop_index("ix_in_app_notifications_recipient_id", table_name="in_app_notifications")
    op.drop_table("in_app_notifications")
    op.drop_index("ix_sos_status_events_is_demo", table_name="sos_status_events")
    op.drop_index("ix_sos_status_events_alert_created", table_name="sos_status_events")
    op.drop_index("ix_sos_status_events_actor_id", table_name="sos_status_events")
    op.drop_index("ix_sos_status_events_alert_id", table_name="sos_status_events")
    op.drop_table("sos_status_events")
    op.drop_index("ix_sos_alerts_is_demo", table_name="sos_alerts")
    op.drop_index("ix_sos_alerts_current_status", table_name="sos_alerts")
    op.drop_index("ix_sos_alerts_student_created", table_name="sos_alerts")
    op.drop_index("ix_sos_alerts_student_id", table_name="sos_alerts")
    op.drop_table("sos_alerts")
