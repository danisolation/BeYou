"""chatbot gateway guardrails

Revision ID: 20260521_0005
Revises: 20260521_0004
Create Date: 2026-05-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260521_0005"
down_revision: str | None = "20260521_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "chat_threads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("safety_state", sa.String(length=32), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_chat_threads_student_id", "chat_threads", ["student_id"])
    op.create_index("ix_chat_threads_student_last_message", "chat_threads", ["student_id", "last_message_at"])
    op.create_index("ix_chat_threads_is_demo", "chat_threads", ["is_demo"])

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("thread_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_threads.id"), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("safety_flagged", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_chat_messages_thread_id", "chat_messages", ["thread_id"])
    op.create_index("ix_chat_messages_thread_created", "chat_messages", ["thread_id", "created_at"])
    op.create_index("ix_chat_messages_is_demo", "chat_messages", ["is_demo"])

    op.create_table(
        "chat_safety_signals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("thread_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_threads.id"), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_messages.id"), nullable=True),
        sa.Column("stage", sa.String(length=32), nullable=False),
        sa.Column("categories", postgresql.JSONB(), nullable=False),
        sa.Column("summary", sa.String(length=128), nullable=False),
        sa.Column("escalation_suggestion", sa.String(length=128), nullable=False),
        sa.Column("sos_suggested", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_chat_safety_signals_thread_id", "chat_safety_signals", ["thread_id"])
    op.create_index("ix_chat_safety_signals_message_id", "chat_safety_signals", ["message_id"])
    op.create_index("ix_chat_safety_signals_thread_created", "chat_safety_signals", ["thread_id", "created_at"])
    op.create_index("ix_chat_safety_signals_stage", "chat_safety_signals", ["stage"])
    op.create_index("ix_chat_safety_signals_is_demo", "chat_safety_signals", ["is_demo"])

    op.create_table(
        "chatbot_safety_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("high_risk_keywords", postgresql.JSONB(), nullable=False),
        sa.Column("escalation_message", sa.Text(), nullable=False),
        sa.Column("trusted_adult_message", sa.Text(), nullable=False),
        sa.Column("first_response_disclaimer", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_chatbot_safety_configs_name"),
    )
    op.create_index("ix_chatbot_safety_configs_name", "chatbot_safety_configs", ["name"])
    op.create_index("ix_chatbot_safety_configs_is_demo", "chatbot_safety_configs", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_chatbot_safety_configs_is_demo", table_name="chatbot_safety_configs")
    op.drop_index("ix_chatbot_safety_configs_name", table_name="chatbot_safety_configs")
    op.drop_table("chatbot_safety_configs")
    op.drop_index("ix_chat_safety_signals_is_demo", table_name="chat_safety_signals")
    op.drop_index("ix_chat_safety_signals_stage", table_name="chat_safety_signals")
    op.drop_index("ix_chat_safety_signals_thread_created", table_name="chat_safety_signals")
    op.drop_index("ix_chat_safety_signals_message_id", table_name="chat_safety_signals")
    op.drop_index("ix_chat_safety_signals_thread_id", table_name="chat_safety_signals")
    op.drop_table("chat_safety_signals")
    op.drop_index("ix_chat_messages_is_demo", table_name="chat_messages")
    op.drop_index("ix_chat_messages_thread_created", table_name="chat_messages")
    op.drop_index("ix_chat_messages_thread_id", table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index("ix_chat_threads_is_demo", table_name="chat_threads")
    op.drop_index("ix_chat_threads_student_last_message", table_name="chat_threads")
    op.drop_index("ix_chat_threads_student_id", table_name="chat_threads")
    op.drop_table("chat_threads")
