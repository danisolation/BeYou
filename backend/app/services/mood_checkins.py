from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import MoodCheckIn, User
from app.schemas.mood_checkins import (
    ContextTagOption,
    MoodCheckInCreate,
    MoodCheckInHistoryResponse,
    MoodCheckInOptionsResponse,
    MoodCheckInResponse,
    MoodOption,
)
from app.services.audit import record_audit_event

MOOD_OPTIONS = [
    MoodOption(key="steady", label="Khá ổn", helper="Em thấy tương đối cân bằng."),
    MoodOption(key="okay", label="Bình thường", helper="Không quá tốt, không quá tệ."),
    MoodOption(key="tired", label="Mệt", helper="Em thấy thiếu năng lượng."),
    MoodOption(key="sad", label="Buồn", helper="Em đang thấy nặng lòng."),
    MoodOption(key="anxious", label="Lo lắng", helper="Em thấy căng hoặc khó yên tâm."),
    MoodOption(key="overwhelmed", label="Quá tải", helper="Em thấy mọi thứ hơi nhiều với mình."),
]

CONTEXT_TAG_OPTIONS = [
    ContextTagOption(key="school", label="Trường/lớp"),
    ContextTagOption(key="family", label="Gia đình"),
    ContextTagOption(key="friends", label="Bạn bè"),
    ContextTagOption(key="body", label="Cơ thể/sức khỏe"),
    ContextTagOption(key="sleep", label="Giấc ngủ"),
    ContextTagOption(key="future", label="Tương lai"),
    ContextTagOption(key="other", label="Khác"),
]

MOOD_PRIVACY_NOTES = [
    "Check-in giúp em tự nhìn lại cảm xúc, không phải chẩn đoán.",
    "Ghi chú riêng tư chỉ hiển thị cho em trong Phase 13.",
    "BeYou không tự động gửi SOS hoặc thông báo người lớn từ check-in này.",
]


def get_mood_checkin_options() -> MoodCheckInOptionsResponse:
    return MoodCheckInOptionsResponse(
        mood_options=MOOD_OPTIONS,
        context_tags=CONTEXT_TAG_OPTIONS,
        privacy_notes=MOOD_PRIVACY_NOTES,
        energy_scale_label="1 là rất ít năng lượng, 5 là nhiều năng lượng",
        stress_scale_label="1 là rất nhẹ, 5 là rất căng",
    )


def _derive_guidance(payload: MoodCheckInCreate) -> tuple[str, str, str, bool, bool]:
    high_concern = payload.stress_level == 5 or payload.mood_label == "overwhelmed"
    needs_attention = payload.stress_level >= 4 or payload.energy_level <= 2 or payload.mood_label in {
        "sad",
        "anxious",
        "tired",
    }
    if high_concern:
        return (
            "Cần hỗ trợ sớm",
            "Điều em đang cảm thấy đáng được người lớn tin cậy lắng nghe sớm.",
            "Nếu em thấy không an toàn hoặc không thể tự xử lý, hãy dùng SOS như một hành động riêng em chủ động xác nhận.",
            True,
            payload.stress_level == 5,
        )
    if needs_attention:
        return (
            "Cần quan tâm",
            "Cảm xúc của em đang cần thêm sự chăm sóc nhẹ nhàng.",
            "Em có thể xem lại kế hoạch người lớn tin cậy hoặc chọn một bước nhỏ giúp mình bình ổn hơn.",
            True,
            False,
        )
    return (
        "Ổn định",
        "Cảm ơn em đã dành một phút lắng nghe bản thân.",
        "Hãy ghi nhớ điều đang giúp em ổn hơn hôm nay.",
        False,
        False,
    )


def _response(checkin: MoodCheckIn) -> MoodCheckInResponse:
    return MoodCheckInResponse.model_validate(checkin)


def create_mood_checkin(
    db: OrmSession,
    student: User,
    payload: MoodCheckInCreate,
) -> MoodCheckInResponse:
    require_permission(
        db,
        student,
        resource_type="mood_check_in",
        action="write",
        purpose="student_private_support",
        student_id=student.id,
    )
    trend_label, supportive_message, next_action, suggest_support_plan, suggest_sos = _derive_guidance(payload)
    checkin = MoodCheckIn(
        student_id=student.id,
        mood_label=payload.mood_label,
        energy_level=payload.energy_level,
        stress_level=payload.stress_level,
        context_tags=payload.context_tags,
        private_note=payload.private_note,
        trend_label=trend_label,
        supportive_message=supportive_message,
        suggested_next_action=next_action,
        suggest_support_plan=suggest_support_plan,
        suggest_sos=suggest_sos,
        is_demo=student.is_demo,
    )
    db.add(checkin)
    db.flush()
    record_audit_event(
        db,
        actor=student,
        actor_role=student.role,
        action="mood_check_in_created",
        resource_type="mood_check_in",
        resource_id=str(checkin.id),
        status_value="success",
        reason="student_private_check_in",
        metadata_summary={
            "student_id": str(student.id),
            "mood_label": payload.mood_label,
            "energy_level": payload.energy_level,
            "stress_level": payload.stress_level,
            "context_tag_count": len(payload.context_tags),
            "has_private_note": payload.private_note is not None,
            "trend_label": trend_label,
            "suggest_support_plan": suggest_support_plan,
            "suggest_sos": suggest_sos,
            "decision": "no_auto_sos_no_adult_alert",
        },
        is_demo=student.is_demo,
    )
    db.commit()
    db.refresh(checkin)
    return _response(checkin)


def list_student_mood_checkins(
    db: OrmSession,
    student: User,
    *,
    limit: int = 30,
) -> MoodCheckInHistoryResponse:
    require_permission(
        db,
        student,
        resource_type="mood_check_in",
        action="read",
        purpose="student_private_support",
        student_id=student.id,
    )
    items = list(
        db.scalars(
            select(MoodCheckIn)
            .where(MoodCheckIn.student_id == student.id)
            .order_by(MoodCheckIn.created_at.desc(), MoodCheckIn.id.desc())
            .limit(limit)
        )
    )
    return MoodCheckInHistoryResponse(items=[_response(item) for item in items])
