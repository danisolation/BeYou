"""mood check-in configs

Revision ID: 20260522_0009
Revises: 20260522_0008
Create Date: 2026-05-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0009"
down_revision: str | None = "20260522_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "mood_checkin_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=96), nullable=False, unique=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("student_prompt", sa.Text(), nullable=False),
        sa.Column("adult_guidance", sa.Text(), nullable=False),
        sa.Column("mood_options", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("context_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
        ),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_mood_checkin_configs_status_sort", "mood_checkin_configs", ["status", "sort_order"]
    )
    op.create_index("ix_mood_checkin_configs_is_demo", "mood_checkin_configs", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_mood_checkin_configs_is_demo", table_name="mood_checkin_configs")
    op.drop_index("ix_mood_checkin_configs_status_sort", table_name="mood_checkin_configs")
    op.drop_table("mood_checkin_configs")
