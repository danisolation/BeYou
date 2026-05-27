"""identity foundation

Revision ID: 20260525_0011
Revises: 20260522_0010
Create Date: 2026-05-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260525_0011"
down_revision: str | None = "20260522_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "external_identities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider_key", sa.String(length=96), nullable=False),
        sa.Column("provider_subject_hash", sa.String(length=128), nullable=False),
        sa.Column("linked_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending_review"),
        sa.Column("provider_label", sa.String(length=160), nullable=True),
        sa.Column("email_verified", sa.Boolean(), nullable=True),
        sa.Column("email_hash", sa.String(length=128), nullable=True),
        sa.Column("display_label", sa.String(length=160), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("provider_key", "provider_subject_hash", name="uq_external_identities_provider_subject"),
    )
    op.create_index("ix_external_identities_provider_key", "external_identities", ["provider_key"])
    op.create_index("ix_external_identities_status", "external_identities", ["status"])
    op.create_index("ix_external_identities_linked_user_id", "external_identities", ["linked_user_id"])

    op.add_column("sessions", sa.Column("auth_method", sa.String(length=32), nullable=True))
    op.add_column("sessions", sa.Column("auth_provider_key", sa.String(length=96), nullable=True))
    op.add_column("sessions", sa.Column("external_identity_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_sessions_external_identity_id", "sessions", ["external_identity_id"])
    op.create_foreign_key(
        "fk_sessions_external_identity_id_external_identities",
        "sessions",
        "external_identities",
        ["external_identity_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_sessions_external_identity_id_external_identities", "sessions", type_="foreignkey")
    op.drop_index("ix_sessions_external_identity_id", table_name="sessions")
    op.drop_column("sessions", "external_identity_id")
    op.drop_column("sessions", "auth_provider_key")
    op.drop_column("sessions", "auth_method")

    op.drop_index("ix_external_identities_linked_user_id", table_name="external_identities")
    op.drop_index("ix_external_identities_status", table_name="external_identities")
    op.drop_index("ix_external_identities_provider_key", table_name="external_identities")
    op.drop_table("external_identities")
