from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.chat import (
    ChatMessageCreate,
    ChatSendResponse,
    ChatThreadResponse,
    ChatTranscriptResponse,
    ChatbotSafetyConfigResponse,
    ChatbotSafetyConfigUpdate,
)
from app.services.chat import (
    get_admin_safety_config,
    get_student_chat_transcript,
    list_student_chat_threads,
    send_chat_message,
    update_admin_safety_config,
)

router = APIRouter()


@router.post(
    "/student/chat/messages",
    response_model=ChatSendResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_student_chat_message(
    payload: ChatMessageCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatSendResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.STUDENT)
    return send_chat_message(db, student=current_user, payload=payload, settings=settings)


@router.get("/student/chat/threads", response_model=list[ChatThreadResponse])
def get_student_chat_threads(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[ChatThreadResponse]:
    require_role(current_user, UserRole.STUDENT)
    return list_student_chat_threads(db, student=current_user)


@router.get("/student/chat/threads/{thread_id}/messages", response_model=ChatTranscriptResponse)
def get_student_chat_messages(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> ChatTranscriptResponse:
    require_role(current_user, UserRole.STUDENT)
    return get_student_chat_transcript(db, student=current_user, thread_id=thread_id)


@router.get("/admin/chatbot/config", response_model=ChatbotSafetyConfigResponse)
def get_chatbot_config(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatbotSafetyConfigResponse:
    require_role(current_user, UserRole.ADMIN)
    return get_admin_safety_config(db, actor=current_user, settings=settings)


@router.patch("/admin/chatbot/config", response_model=ChatbotSafetyConfigResponse)
def patch_chatbot_config(
    payload: ChatbotSafetyConfigUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatbotSafetyConfigResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.ADMIN)
    return update_admin_safety_config(db, actor=current_user, payload=payload, settings=settings)
