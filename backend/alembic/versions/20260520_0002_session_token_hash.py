"""add session token hash

Revision ID: 20260520_0002
Revises: 20260520_0001
Create Date: 2026-05-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260520_0002"
down_revision: str | None = "20260520_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("token_hash", sa.String(length=64), nullable=True))
    op.create_index("ix_sessions_token_hash", "sessions", ["token_hash"], unique=True)
    op.alter_column("sessions", "token_hash", nullable=False)


def downgrade() -> None:
    op.drop_index("ix_sessions_token_hash", table_name="sessions")
    op.drop_column("sessions", "token_hash")
