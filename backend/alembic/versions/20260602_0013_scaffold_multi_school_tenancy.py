"""scaffold multi school tenancy

Revision ID: 20260602_0013
Revises: 20260526_0012
Create Date: 2026-06-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260602_0013"
down_revision: str | None = "20260526_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add tenant_id to users
    op.add_column("users", sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"], unique=False)

    # Add tenant_id to sessions
    op.add_column("sessions", sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_sessions_tenant_id", "sessions", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_sessions_tenant_id", table_name="sessions")
    op.drop_column("sessions", "tenant_id")

    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_column("users", "tenant_id")
