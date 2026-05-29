from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import StreamingResponse
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
    get_adult_chat_transcript,
    get_student_chat_transcript,
    list_adult_chat_threads,
    list_student_chat_threads,
    send_adult_chat_message,
    send_chat_message,
    send_chat_message_stream,
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


@router.post("/student/chat/messages/stream", status_code=status.HTTP_200_OK)
def post_student_chat_message_stream(
    payload: ChatMessageCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    """Stream chat response via Server-Sent Events."""
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.STUDENT)

    def event_generator():
        import json as _json, logging as _log, traceback as _tb
        try:
            for event in send_chat_message_stream(db, student=current_user, payload=payload, settings=settings):
                yield f"data: {event}\n\n"
        except Exception as exc:
            _log.getLogger("beyou.chat.stream").error("SSE generator error: %s\n%s", exc, _tb.format_exc())
            yield f"data: {_json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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


# ---------------------------------------------------------------------------
# Teacher chat endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/teacher/chat/messages",
    response_model=ChatSendResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_teacher_chat_message(
    payload: ChatMessageCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatSendResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.TEACHER)
    return send_adult_chat_message(db, user=current_user, payload=payload, settings=settings)


@router.get("/teacher/chat/threads", response_model=list[ChatThreadResponse])
def get_teacher_chat_threads(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[ChatThreadResponse]:
    require_role(current_user, UserRole.TEACHER)
    return list_adult_chat_threads(db, user=current_user)


@router.get("/teacher/chat/threads/{thread_id}/messages", response_model=ChatTranscriptResponse)
def get_teacher_chat_messages(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> ChatTranscriptResponse:
    require_role(current_user, UserRole.TEACHER)
    return get_adult_chat_transcript(db, user=current_user, thread_id=thread_id)


# ---------------------------------------------------------------------------
# Parent chat endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/parent/chat/messages",
    response_model=ChatSendResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_parent_chat_message(
    payload: ChatMessageCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatSendResponse:
    require_same_site_mutation(request, settings)
    require_role(current_user, UserRole.PARENT)
    return send_adult_chat_message(db, user=current_user, payload=payload, settings=settings)


@router.get("/parent/chat/threads", response_model=list[ChatThreadResponse])
def get_parent_chat_threads(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[ChatThreadResponse]:
    require_role(current_user, UserRole.PARENT)
    return list_adult_chat_threads(db, user=current_user)


@router.get("/parent/chat/threads/{thread_id}/messages", response_model=ChatTranscriptResponse)
def get_parent_chat_messages(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> ChatTranscriptResponse:
    require_role(current_user, UserRole.PARENT)
    return get_adult_chat_transcript(db, user=current_user, thread_id=thread_id)
