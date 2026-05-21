from __future__ import annotations

import uuid
from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.core.config import Settings
from app.db.models import (
    ChatMessage,
    ChatMessageRole,
    ChatSafetySignal,
    ChatSafetyStage,
    ChatThread,
    ChatbotSafetyConfig,
    User,
    utc_now,
)
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatProviderResponse,
    ChatSafetyResponse,
    ChatSendResponse,
    ChatThreadResponse,
    ChatTranscriptResponse,
    ChatbotProviderStatus,
    ChatbotSafetyConfigResponse,
    ChatbotSafetyConfigUpdate,
)
from app.services.audit import record_audit_event

DEFAULT_KEYWORDS_BY_CATEGORY: dict[str, list[str]] = {
    "self_harm": [
        "tự tử",
        "tu tu",
        "suicide",
        "kill myself",
        "muốn chết",
        "muon chet",
        "không muốn sống",
        "khong muon song",
        "hại bản thân",
        "hai ban than",
        "tự làm đau",
        "tu lam dau",
        "cắt tay",
        "cat tay",
        "self harm",
    ],
    "harm_to_others": [
        "làm hại người khác",
        "lam hai nguoi khac",
        "giết người",
        "giet nguoi",
        "kill someone",
        "hurt someone",
    ],
    "immediate_danger": [
        "không an toàn",
        "khong an toan",
        "đang bị đánh",
        "dang bi danh",
        "bị đe dọa",
        "bi de doa",
        "bị ép",
        "bi ep",
        "nguy hiểm",
        "nguy hiem",
    ],
}

DEFAULT_ESCALATION_MESSAGE = (
    "Mình muốn ưu tiên sự an toàn của em ngay lúc này. Nếu em đang thấy không an toàn "
    "ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou để "
    "người lớn được liên kết biết em cần hỗ trợ."
)
DEFAULT_TRUSTED_ADULT_MESSAGE = (
    "Nếu có người lớn tin cậy ở gần em, hãy nói với họ rằng em cần được ở cùng và được "
    "lắng nghe ngay bây giờ."
)
FIRST_RESPONSE_DISCLAIMER = (
    "Chào em, mình là BeYou — một người bạn hỗ trợ trong ứng dụng. BeYou không thay thế "
    "chuyên gia tư vấn hay bác sĩ. Mình có thể lắng nghe và giúp em nghĩ về bước an toàn "
    "tiếp theo."
)
EMERGENCY_BOUNDARY = "BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài."
CONFIG_NAME = "default"


@dataclass
class SafetyDetection:
    high_risk: bool
    categories: list[str]


class DeterministicSupportProvider:
    name = "fallback"
    used_fallback = True

    def generate(self, *, messages: list[dict[str, str]], first_response: bool) -> str:
        return (
            "Cảm ơn em đã chia sẻ. Mình nghe thấy chuyện này có thể đang làm em nặng lòng. "
            "Em có thể thử dừng lại một chút, hít thở chậm, chọn một việc nhỏ em kiểm soát "
            "được, và nói với một người lớn tin cậy nếu em cần thêm hỗ trợ. Điều gì trong "
            "chuyện này khiến em muốn được lắng nghe nhất?"
        )


class FreemodelProvider:
    name = "freemodel"
    used_fallback = False

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate(self, *, messages: list[dict[str, str]], first_response: bool) -> str:
        headers = {
            "Authorization": f"Bearer {self._settings.freemodel_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._settings.freemodel_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Bạn là BeYou, một chatbot hỗ trợ học sinh bằng tiếng Việt. "
                        "Không chẩn đoán, không tự nhận là bác sĩ hay nhà trị liệu. "
                        "Luôn khuyến khích bước an toàn và người lớn tin cậy khi cần."
                    ),
                },
                *messages,
            ],
        }
        with httpx.Client(timeout=self._settings.freemodel_timeout_seconds) as client:
            response = client.post(
                f"{self._settings.freemodel_base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        try:
            return str(data["choices"][0]["message"]["content"]).strip()
        except (KeyError, IndexError, TypeError):
            text = data.get("text") if isinstance(data, dict) else None
            if isinstance(text, str) and text.strip():
                return text.strip()
            raise ValueError("freemodel response did not include assistant content")


def get_chat_provider(settings: Settings):
    if settings.chat_provider == "freemodel" and settings.freemodel_api_key:
        return FreemodelProvider(settings)
    return DeterministicSupportProvider()


def _provider_status(settings: Settings) -> ChatbotProviderStatus:
    freemodel_configured = bool(settings.freemodel_api_key)
    using_freemodel = settings.chat_provider == "freemodel" and freemodel_configured
    return ChatbotProviderStatus(
        name="freemodel" if using_freemodel else "fallback",
        configured=freemodel_configured,
        using_fallback=not using_freemodel,
    )


def _normalize_keywords(values: list[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        stripped = value.strip().lower()
        if stripped and stripped not in normalized:
            normalized.append(stripped)
    return normalized


def _default_keywords() -> list[str]:
    values: list[str] = []
    for keywords in DEFAULT_KEYWORDS_BY_CATEGORY.values():
        values.extend(keywords)
    return _normalize_keywords(values)


def get_or_create_safety_config(db: OrmSession) -> ChatbotSafetyConfig:
    config = db.scalar(select(ChatbotSafetyConfig).where(ChatbotSafetyConfig.name == CONFIG_NAME))
    if config is not None:
        return config
    config = ChatbotSafetyConfig(
        name=CONFIG_NAME,
        high_risk_keywords=_default_keywords(),
        escalation_message=DEFAULT_ESCALATION_MESSAGE,
        trusted_adult_message=DEFAULT_TRUSTED_ADULT_MESSAGE,
        first_response_disclaimer=FIRST_RESPONSE_DISCLAIMER,
        is_active=True,
        is_demo=False,
    )
    db.add(config)
    db.flush()
    return config


def _config_response(config: ChatbotSafetyConfig, settings: Settings) -> ChatbotSafetyConfigResponse:
    return ChatbotSafetyConfigResponse(
        id=config.id,
        high_risk_keywords=list(config.high_risk_keywords),
        escalation_message=config.escalation_message,
        trusted_adult_message=config.trusted_adult_message,
        first_response_disclaimer=config.first_response_disclaimer,
        guardrails_locked=True,
        provider=_provider_status(settings),
        updated_at=config.updated_at,
        is_demo=config.is_demo,
    )


def get_admin_safety_config(
    db: OrmSession,
    *,
    actor: User,
    settings: Settings,
) -> ChatbotSafetyConfigResponse:
    require_permission(
        db,
        actor,
        resource_type="chatbot_safety_config",
        action="manage",
        purpose="admin_operations",
    )
    config = get_or_create_safety_config(db)
    db.commit()
    db.refresh(config)
    return _config_response(config, settings)


def update_admin_safety_config(
    db: OrmSession,
    *,
    actor: User,
    payload: ChatbotSafetyConfigUpdate,
    settings: Settings,
) -> ChatbotSafetyConfigResponse:
    require_permission(
        db,
        actor,
        resource_type="chatbot_safety_config",
        action="manage",
        purpose="admin_operations",
    )
    config = get_or_create_safety_config(db)
    changed_fields: list[str] = []
    if payload.high_risk_keywords is not None:
        keywords = _normalize_keywords(payload.high_risk_keywords)
        if not keywords:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cần giữ ít nhất một từ khóa nguy cơ cao.",
            )
        config.high_risk_keywords = keywords
        changed_fields.append("high_risk_keywords")
    if payload.escalation_message is not None:
        message = payload.escalation_message.strip()
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lời nhắn an toàn không được để trống.",
            )
        config.escalation_message = message
        changed_fields.append("escalation_message")
    if payload.trusted_adult_message is not None:
        message = payload.trusted_adult_message.strip()
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lời nhắn người lớn tin cậy không được để trống.",
            )
        config.trusted_adult_message = message
        changed_fields.append("trusted_adult_message")
    config.updated_by_id = actor.id
    config.updated_at = utc_now()
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="admin_safety_content_changed",
        resource_type="chatbot_safety_config",
        resource_id=str(config.id),
        status_value="success",
        reason="admin_content_management",
        metadata_summary={
            "content_type": "chatbot_safety_config",
            "content_id": str(config.id),
            "change_type": "edit",
            "changed_fields": changed_fields,
            "admin_actor_id": str(actor.id),
            "guardrails_locked": True,
            "is_demo": config.is_demo or actor.is_demo,
        },
        is_demo=config.is_demo or actor.is_demo,
    )
    db.commit()
    db.refresh(config)
    return _config_response(config, settings)


def _detect_high_risk(text: str, config: ChatbotSafetyConfig) -> SafetyDetection:
    normalized = text.casefold()
    categories: list[str] = []
    for category, keywords in DEFAULT_KEYWORDS_BY_CATEGORY.items():
        if any(keyword.casefold() in normalized for keyword in keywords):
            categories.append(category)
    configured_keywords = _normalize_keywords(list(config.high_risk_keywords))
    default_keywords = set(_default_keywords())
    custom_keywords = [keyword for keyword in configured_keywords if keyword not in default_keywords]
    if any(keyword in normalized for keyword in custom_keywords) and not categories:
        categories.append("configured_high_risk")
    return SafetyDetection(high_risk=bool(categories), categories=categories)


def _escalation_text(config: ChatbotSafetyConfig) -> str:
    return "\n\n".join(
        [
            config.escalation_message,
            config.trusted_adult_message,
            EMERGENCY_BOUNDARY,
        ]
    )


def _message_response(message: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        thread_id=message.thread_id,
        role=message.role,
        content=message.content,
        safety_flagged=message.safety_flagged,
        created_at=message.created_at,
        is_demo=message.is_demo,
    )


def _thread_response(thread: ChatThread) -> ChatThreadResponse:
    return ChatThreadResponse.model_validate(thread)


def _thread_messages(db: OrmSession, thread_id: uuid.UUID) -> list[ChatMessage]:
    return list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at, ChatMessage.id)
        )
    )


def _first_response(db: OrmSession, thread_id: uuid.UUID) -> bool:
    existing_assistant = db.scalar(
        select(ChatMessage.id).where(
            ChatMessage.thread_id == thread_id,
            ChatMessage.role == ChatMessageRole.ASSISTANT.value,
        )
    )
    return existing_assistant is None


def _prepare_provider_messages(messages: list[ChatMessage]) -> list[dict[str, str]]:
    return [{"role": message.role, "content": message.content} for message in messages[-10:]]


def _with_first_response_intro(text: str, *, first_response: bool, config: ChatbotSafetyConfig) -> str:
    if not first_response:
        return text
    return f"{config.first_response_disclaimer}\n\n{text}"


def _record_high_risk_signal(
    db: OrmSession,
    *,
    student: User,
    thread: ChatThread,
    message_id: uuid.UUID,
    stage: str,
    categories: list[str],
) -> ChatSafetySignal:
    signal = ChatSafetySignal(
        thread_id=thread.id,
        message_id=message_id,
        stage=stage,
        categories=categories,
        summary="high_risk_detected",
        escalation_suggestion="suggest_sos_trusted_adult",
        sos_suggested=True,
        is_demo=thread.is_demo,
    )
    db.add(signal)
    db.flush()
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="high_risk_safety_event",
        resource_type="chat_safety_signal",
        resource_id=str(signal.id),
        status_value="success",
        reason="safety_escalation",
        metadata_summary={
            "source": "chatbot",
            "stage": stage,
            "categories": categories,
            "safety_summary": "high_risk_detected",
            "escalation_suggestion": "suggest_sos_trusted_adult",
            "sos_suggested": True,
            "thread_id": str(thread.id),
            "is_demo": thread.is_demo,
        },
        is_demo=thread.is_demo,
    )
    return signal


def _get_or_create_thread(
    db: OrmSession,
    *,
    student: User,
    thread_id: uuid.UUID | None,
) -> ChatThread:
    if thread_id is not None:
        thread = db.get(ChatThread, thread_id)
        if thread is None or thread.student_id != student.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy cuộc trò chuyện.")
        return thread
    thread = ChatThread(
        student_id=student.id,
        title="Cuộc trò chuyện với BeYou",
        safety_state="supportive",
        is_demo=student.is_demo,
        last_message_at=utc_now(),
    )
    db.add(thread)
    db.flush()
    return thread


def send_chat_message(
    db: OrmSession,
    *,
    student: User,
    payload: ChatMessageCreate,
    settings: Settings,
) -> ChatSendResponse:
    require_permission(
        db,
        student,
        resource_type="chat_thread",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    config = get_or_create_safety_config(db)
    thread = _get_or_create_thread(db, student=student, thread_id=payload.thread_id)
    first_response = _first_response(db, thread.id)
    now = utc_now()
    student_message = ChatMessage(
        thread_id=thread.id,
        role=ChatMessageRole.STUDENT.value,
        content=payload.message,
        safety_flagged=False,
        is_demo=thread.is_demo,
        created_at=now,
    )
    db.add(student_message)
    db.flush()
    input_detection = _detect_high_risk(payload.message, config)
    provider_name = "guardrail"
    used_fallback = True
    output_detection = SafetyDetection(high_risk=False, categories=[])
    if input_detection.high_risk:
        student_message.safety_flagged = True
        assistant_content = _escalation_text(config)
        _record_high_risk_signal(
            db,
            student=student,
            thread=thread,
            message_id=student_message.id,
            stage=ChatSafetyStage.INPUT.value,
            categories=input_detection.categories,
        )
    else:
        provider = get_chat_provider(settings)
        provider_name = provider.name
        used_fallback = provider.used_fallback
        try:
            provider_content = provider.generate(
                messages=_prepare_provider_messages(_thread_messages(db, thread.id)),
                first_response=first_response,
            )
        except Exception:
            fallback = DeterministicSupportProvider()
            provider_content = fallback.generate(
                messages=_prepare_provider_messages(_thread_messages(db, thread.id)),
                first_response=first_response,
            )
            provider_name = fallback.name
            used_fallback = True
        assistant_content = _with_first_response_intro(
            provider_content,
            first_response=first_response,
            config=config,
        )
        output_detection = _detect_high_risk(assistant_content, config)
        if output_detection.high_risk:
            assistant_content = _escalation_text(config)
    assistant_message = ChatMessage(
        thread_id=thread.id,
        role=ChatMessageRole.ASSISTANT.value,
        content=assistant_content,
        safety_flagged=input_detection.high_risk or output_detection.high_risk,
        is_demo=thread.is_demo,
    )
    db.add(assistant_message)
    db.flush()
    if output_detection.high_risk:
        _record_high_risk_signal(
            db,
            student=student,
            thread=thread,
            message_id=assistant_message.id,
            stage=ChatSafetyStage.OUTPUT.value,
            categories=output_detection.categories,
        )
    thread.safety_state = "high_risk" if input_detection.high_risk or output_detection.high_risk else "supportive"
    thread.last_message_at = assistant_message.created_at
    thread.updated_at = assistant_message.created_at
    db.commit()
    db.refresh(thread)
    db.refresh(student_message)
    db.refresh(assistant_message)
    categories = input_detection.categories or output_detection.categories
    return ChatSendResponse(
        thread_id=thread.id,
        student_message=_message_response(student_message),
        assistant_message=_message_response(assistant_message),
        safety=ChatSafetyResponse(
            high_risk=input_detection.high_risk or output_detection.high_risk,
            input_flagged=input_detection.high_risk,
            output_flagged=output_detection.high_risk,
            categories=categories,
            suggested_action=(
                "suggest_sos_trusted_adult"
                if input_detection.high_risk or output_detection.high_risk
                else "supportive_chat"
            ),
            sos_suggested=input_detection.high_risk or output_detection.high_risk,
            escalation_message=_escalation_text(config)
            if input_detection.high_risk or output_detection.high_risk
            else None,
        ),
        provider=ChatProviderResponse(name=provider_name, used_fallback=used_fallback),
    )


def list_student_chat_threads(db: OrmSession, *, student: User) -> list[ChatThreadResponse]:
    require_permission(
        db,
        student,
        resource_type="chat_thread",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    threads = list(
        db.scalars(
            select(ChatThread)
            .where(ChatThread.student_id == student.id)
            .order_by(ChatThread.last_message_at.desc().nullslast(), ChatThread.created_at.desc())
            .limit(25)
        )
    )
    return [_thread_response(thread) for thread in threads]


def get_student_chat_transcript(
    db: OrmSession,
    *,
    student: User,
    thread_id: uuid.UUID,
) -> ChatTranscriptResponse:
    thread = db.get(ChatThread, thread_id)
    if thread is None or thread.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy cuộc trò chuyện.")
    require_permission(
        db,
        student,
        resource_type="chat_transcript",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="sensitive_resource_read",
        resource_type="chat_transcript",
        resource_id=str(thread.id),
        status_value="allowed",
        reason="student_private_support",
        metadata_summary={
            "student_id": str(student.id),
            "relationship_check": "own_student",
            "purpose_key": "student_private_support",
            "decision": "own_student_transcript",
            "message_count": len(_thread_messages(db, thread.id)),
            "is_demo": thread.is_demo,
        },
        is_demo=thread.is_demo,
    )
    messages = _thread_messages(db, thread.id)
    db.commit()
    return ChatTranscriptResponse(
        thread=_thread_response(thread),
        messages=[_message_response(message) for message in messages],
    )
