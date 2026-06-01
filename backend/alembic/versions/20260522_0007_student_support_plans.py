"""student support plans

Revision ID: 20260522_0007
Revises: 20260521_0006
Create Date: 2026-05-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0007"
down_revision: str | None = "20260521_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "student_support_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("what_helps", sa.Text(), nullable=True),
        sa.Column("what_does_not_help", sa.Text(), nullable=True),
        sa.Column("preferred_contact_method", sa.Text(), nullable=True),
        sa.Column("safe_contact_times", sa.Text(), nullable=True),
        sa.Column("shareable_note", sa.Text(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paused_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("student_id", name="uq_student_support_plans_student_id"),
    )
    op.create_index("ix_student_support_plans_student_id", "student_support_plans", ["student_id"])
    op.create_index("ix_student_support_plans_status", "student_support_plans", ["status"])
    op.create_index("ix_student_support_plans_is_demo", "student_support_plans", ["is_demo"])

    op.create_table(
        "student_support_plan_adults",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "support_plan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_support_plans.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "adult_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("relationship_type_snapshot", sa.String(length=32), nullable=False),
        sa.Column("adult_full_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("support_plan_id", "adult_id", name="uq_student_support_plan_adult"),
    )
    op.create_index(
        "ix_student_support_plan_adults_support_plan_id",
        "student_support_plan_adults",
        ["support_plan_id"],
    )
    op.create_index(
        "ix_student_support_plan_adults_adult_id", "student_support_plan_adults", ["adult_id"]
    )
    op.create_index(
        "ix_student_support_plan_adults_is_demo", "student_support_plan_adults", ["is_demo"]
    )


def downgrade() -> None:
    op.drop_index(
        "ix_student_support_plan_adults_is_demo", table_name="student_support_plan_adults"
    )
    op.drop_index(
        "ix_student_support_plan_adults_adult_id", table_name="student_support_plan_adults"
    )
    op.drop_index(
        "ix_student_support_plan_adults_support_plan_id", table_name="student_support_plan_adults"
    )
    op.drop_table("student_support_plan_adults")
    op.drop_index("ix_student_support_plans_is_demo", table_name="student_support_plans")
    op.drop_index("ix_student_support_plans_status", table_name="student_support_plans")
    op.drop_index("ix_student_support_plans_student_id", table_name="student_support_plans")
    op.drop_table("student_support_plans")
