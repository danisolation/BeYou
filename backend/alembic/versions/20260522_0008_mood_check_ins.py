"""mood check-ins

Revision ID: 20260522_0008
Revises: 20260522_0007
Create Date: 2026-05-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0008"
down_revision: str | None = "20260522_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "mood_check_ins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("mood_label", sa.String(length=64), nullable=False),
        sa.Column("energy_level", sa.Integer(), nullable=False),
        sa.Column("stress_level", sa.Integer(), nullable=False),
        sa.Column("context_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("private_note", sa.Text(), nullable=True),
        sa.Column("trend_label", sa.String(length=64), nullable=False),
        sa.Column("supportive_message", sa.Text(), nullable=False),
        sa.Column("suggested_next_action", sa.Text(), nullable=False),
        sa.Column("suggest_support_plan", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("suggest_sos", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_mood_check_ins_student_id", "mood_check_ins", ["student_id"])
    op.create_index("ix_mood_check_ins_student_created", "mood_check_ins", ["student_id", "created_at"])
    op.create_index("ix_mood_check_ins_trend_label", "mood_check_ins", ["trend_label"])
    op.create_index("ix_mood_check_ins_is_demo", "mood_check_ins", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_mood_check_ins_is_demo", table_name="mood_check_ins")
    op.drop_index("ix_mood_check_ins_trend_label", table_name="mood_check_ins")
    op.drop_index("ix_mood_check_ins_student_created", table_name="mood_check_ins")
    op.drop_index("ix_mood_check_ins_student_id", table_name="mood_check_ins")
    op.drop_table("mood_check_ins")
