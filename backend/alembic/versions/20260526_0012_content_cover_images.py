"""content cover images

Revision ID: 20260526_0012
Revises: 20260525_0011
Create Date: 2026-05-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260526_0012"
down_revision: str | None = "20260525_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("self_check_tests", sa.Column("cover_image_url", sa.Text(), nullable=True))
    op.add_column("scenarios", sa.Column("cover_image_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("scenarios", "cover_image_url")
    op.drop_column("self_check_tests", "cover_image_url")
