from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import ContentStatus, MoodCheckInConfig, User
from app.schemas.admin_mood_checkins import (
    AdminContextTagConfig,
    AdminMoodCheckInConfigResponse,
    AdminMoodCheckInConfigUpsert,
    AdminMoodCheckInPreviewResponse,
    AdminMoodOptionConfig,
)
from app.schemas.mood_checkins import CONTEXT_TAGS, MOOD_LABELS, ContextTagOption, MoodOption
from app.services.audit import record_audit_event
from app.services.mood_checkins import MOOD_PRIVACY_NOTES

UNSAFE_COPY_TERMS = {
    "chẩn đoán",
    "chan doan",
    "diagnosis",
    "điều trị",
    "dieu tri",
    "treatment",
    "xếp hạng",
    "xep hang",
    "leaderboard",
    "kỷ luật",
    "ky luat",
    "discipline",
    "risk score",
}


def _contains_unsafe_copy(value: str) -> bool:
    normalized = value.lower()
    return any(term in normalized for term in UNSAFE_COPY_TERMS)


def _validate_publishable(payload: AdminMoodCheckInConfigUpsert) -> None:
    if payload.status != ContentStatus.PUBLISHED.value:
        return
    mood_keys = {option.key for option in payload.mood_options}
    context_keys = {tag.key for tag in payload.context_tags}
    if mood_keys != MOOD_LABELS or context_keys != CONTEXT_TAGS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Cấu hình published cần đủ mood options và context tags an toàn.",
        )
    text_values = [payload.name, payload.student_prompt, payload.adult_guidance]
    text_values.extend(option.label for option in payload.mood_options)
    text_values.extend(option.helper for option in payload.mood_options)
    text_values.extend(tag.label for tag in payload.context_tags)
    if any(_contains_unsafe_copy(value) for value in text_values):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Copy cấu hình phải giữ ranh giới hỗ trợ không chẩn đoán, không giám sát.",
        )


def _mood_options(options: list[AdminMoodOptionConfig] | list[dict]) -> list[MoodOption]:
    return [MoodOption.model_validate(option) for option in options]


def _context_tags(tags: list[AdminContextTagConfig] | list[dict]) -> list[ContextTagOption]:
    return [ContextTagOption.model_validate(tag) for tag in tags]


def _response(config: MoodCheckInConfig) -> AdminMoodCheckInConfigResponse:
    return AdminMoodCheckInConfigResponse(
        id=config.id,
        name=config.name,
        status=config.status,
        student_prompt=config.student_prompt,
        adult_guidance=config.adult_guidance,
        mood_options=_mood_options(config.mood_options),
        context_tags=_context_tags(config.context_tags),
        sort_order=config.sort_order,
        updated_by_id=config.updated_by_id,
        is_demo=config.is_demo,
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


def list_mood_checkin_configs(db: OrmSession) -> list[AdminMoodCheckInConfigResponse]:
    configs = list(
        db.scalars(
            select(MoodCheckInConfig).order_by(MoodCheckInConfig.sort_order.asc(), MoodCheckInConfig.updated_at.desc())
        )
    )
    return [_response(config) for config in configs]


def get_mood_checkin_config(db: OrmSession, config_id: uuid.UUID) -> MoodCheckInConfig:
    config = db.get(MoodCheckInConfig, config_id)
    if config is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy cấu hình.")
    return config


def save_mood_checkin_config(
    db: OrmSession,
    actor: User,
    payload: AdminMoodCheckInConfigUpsert,
    *,
    config_id: uuid.UUID | None = None,
) -> AdminMoodCheckInConfigResponse:
    _validate_publishable(payload)
    config = get_mood_checkin_config(db, config_id) if config_id else None
    created = config is None
    if config is None:
        config = MoodCheckInConfig(
            name=payload.name,
            status=payload.status,
            student_prompt=payload.student_prompt,
            adult_guidance=payload.adult_guidance,
            mood_options=[option.model_dump() for option in payload.mood_options],
            context_tags=[tag.model_dump() for tag in payload.context_tags],
            sort_order=payload.sort_order,
            updated_by_id=actor.id,
            is_demo=actor.is_demo,
        )
        db.add(config)

    config.name = payload.name
    config.status = payload.status
    config.student_prompt = payload.student_prompt
    config.adult_guidance = payload.adult_guidance
    config.mood_options = [option.model_dump() for option in payload.mood_options]
    config.context_tags = [tag.model_dump() for tag in payload.context_tags]
    config.sort_order = payload.sort_order
    config.updated_by_id = actor.id
    config.is_demo = actor.is_demo
    db.flush()

    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="mood_checkin_config_created" if created else "mood_checkin_config_updated",
        resource_type="mood_checkin_config",
        resource_id=str(config.id),
        status_value="success",
        reason="admin_content_safety",
        metadata_summary={
            "config_id": str(config.id),
            "status": config.status,
            "mood_option_count": len(config.mood_options),
            "context_tag_count": len(config.context_tags),
            "sort_order": config.sort_order,
            "decision": "metadata_only",
        },
        is_demo=actor.is_demo,
    )
    db.commit()
    db.refresh(config)
    return _response(config)


def preview_mood_checkin_config(db: OrmSession, config_id: uuid.UUID) -> AdminMoodCheckInPreviewResponse:
    config = get_mood_checkin_config(db, config_id)
    return AdminMoodCheckInPreviewResponse(
        student_prompt=config.student_prompt,
        adult_guidance=config.adult_guidance,
        mood_options=_mood_options(config.mood_options),
        context_tags=_context_tags(config.context_tags),
        privacy_notes=MOOD_PRIVACY_NOTES,
    )
