"""sos email delivery metadata

Revision ID: 20260521_0006
Revises: 20260521_0005
Create Date: 2026-05-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0006"
down_revision: str | None = "20260521_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sos_notification_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "alert_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sos_alerts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("recipient_role_snapshot", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(length=96), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_sos_notification_deliveries_alert_id",
        "sos_notification_deliveries",
        ["alert_id"],
    )
    op.create_index(
        "ix_sos_notification_deliveries_recipient_id",
        "sos_notification_deliveries",
        ["recipient_id"],
    )
    op.create_index(
        "ix_sos_notification_deliveries_alert_created",
        "sos_notification_deliveries",
        ["alert_id", "created_at"],
    )
    op.create_index(
        "ix_sos_notification_deliveries_status",
        "sos_notification_deliveries",
        ["status"],
    )
    op.create_index(
        "ix_sos_notification_deliveries_is_demo",
        "sos_notification_deliveries",
        ["is_demo"],
    )


def downgrade() -> None:
    op.drop_index("ix_sos_notification_deliveries_is_demo", table_name="sos_notification_deliveries")
    op.drop_index("ix_sos_notification_deliveries_status", table_name="sos_notification_deliveries")
    op.drop_index("ix_sos_notification_deliveries_alert_created", table_name="sos_notification_deliveries")
    op.drop_index("ix_sos_notification_deliveries_recipient_id", table_name="sos_notification_deliveries")
    op.drop_index("ix_sos_notification_deliveries_alert_id", table_name="sos_notification_deliveries")
    op.drop_table("sos_notification_deliveries")

