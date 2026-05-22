from __future__ import annotations

from collections.abc import Mapping

from fastapi import HTTPException, status
from sqlalchemy.orm import Session as OrmSession

from app.db.models import AuditEvent, User

FORBIDDEN_METADATA_KEYS = {
    "password",
    "password_hash",
    "token",
    "session_cookie",
    "api_key",
    "raw_chat_content",
    "raw_answers",
    "raw_self_check_answers",
    "answer_text",
    "assistant_raw",
    "chat_message",
    "message_content",
    "chat_transcript_raw",
    "self_check_raw_answers",
    "full_self_check_answers",
    "private_note",
    "support_plan_private_note",
    "mood_note",
    "private_mood_note",
    "mood_private_note",
    "raw_mood",
    "raw_mood_note",
    "private_note_text",
    "shareable_note",
    "what_helps",
    "what_does_not_help",
    "preferred_contact_method",
    "safe_contact_times",
}


def _validate_metadata_keys(value: object) -> None:
    if isinstance(value, Mapping):
        for key, nested_value in value.items():
            if str(key).lower() in FORBIDDEN_METADATA_KEYS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Audit metadata contains forbidden sensitive fields.",
                )
            _validate_metadata_keys(nested_value)
    elif isinstance(value, list):
        for nested_value in value:
            _validate_metadata_keys(nested_value)


def record_audit_event(
    db: OrmSession,
    *,
    actor: User | None,
    actor_role: str,
    action: str,
    resource_type: str,
    resource_id: str,
    status_value: str,
    metadata_summary: dict,
    reason: str | None = None,
    is_demo: bool = False,
) -> AuditEvent:
    _validate_metadata_keys(metadata_summary)
    event = AuditEvent(
        actor_id=actor.id if actor is not None else None,
        actor_role=actor.role if actor is not None else actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        status=status_value,
        metadata_summary=metadata_summary,
        is_demo=is_demo,
    )
    db.add(event)
    return event
