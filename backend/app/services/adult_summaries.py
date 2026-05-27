from __future__ import annotations

import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission
from app.db.models import (
    MoodCheckIn,
    SchoolPrivacyPolicyDefault,
    SelfCheckAttempt,
    StudentSupportPlan,
    StudentSupportPlanAdult,
    SupportPlanStatus,
    User,
    UserRole,
    utc_now,
)
from app.schemas.adult_summaries import (
    AdultAccessReasonStatus,
    AdultMoodTrendSummary,
    AdultSelfCheckSummaryItem,
    AdultSelfCheckSummaryResponse,
    AdultStudentContext,
    AdultSupportPlanSummary,
    AdultSupportSummaryResponse,
)
from app.schemas.privacy_controls import ACCESS_REASON_LABELS, access_reason_options, normalize_reason_codes
from app.services.audit import record_audit_event
from app.services.mood_note_shares import list_active_shared_notes_for_adult
from app.services.privacy_controls import get_or_create_school_privacy_policy

RECENT_SUMMARY_LIMIT = 5
RECENT_SUMMARY_DAYS = 30
RECENT_MOOD_DAYS = 14
ADULT_SUPPORT_PRIVACY_NOTES = [
    "Bạn đang xem tóm tắt hỗ trợ được phép xem, không phải toàn bộ dữ liệu riêng tư của học sinh.",
    "Ghi chú cảm xúc chỉ hiển thị khi học sinh đã chủ động đồng ý chia sẻ.",
    "Mục tiêu là lắng nghe và hỗ trợ trong đúng phạm vi học sinh đã chọn.",
]
REASON_REQUIRED_DETAIL_CODE = "access_reason_required"


def _relationship_check(relationship_type: str) -> str:
    if relationship_type == UserRole.TEACHER.value:
        return "linked_teacher"
    if relationship_type == UserRole.PARENT.value:
        return "linked_parent"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập.")


def _required_reason_resources(policy: SchoolPrivacyPolicyDefault) -> list[str]:
    resources: list[str] = []
    if policy.reason_required_for_adult_summaries:
        resources.append("adult_support_summary")
    if policy.reason_required_for_shared_mood_notes:
        resources.append("shared_mood_note")
    return resources


def _reason_required_detail(policy: SchoolPrivacyPolicyDefault) -> dict:
    return {
        "code": REASON_REQUIRED_DETAIL_CODE,
        "message": "Vui lòng chọn lý do hỗ trợ trước khi xem tóm tắt này.",
        "allowed_reasons": [option.model_dump() for option in access_reason_options(policy.allowed_reason_codes)],
        "copy": [
            "Lý do này giúp minh bạch việc truy cập và chỉ được lưu trong audit metadata.",
            "Lý do không cấp thêm quyền; Peerlight AI vẫn kiểm tra vai trò và liên kết đang hoạt động.",
        ],
    }


def _access_reason_status(
    policy: SchoolPrivacyPolicyDefault,
    *,
    required: bool,
    reason_code: str | None,
) -> AdultAccessReasonStatus:
    return AdultAccessReasonStatus(
        required=required,
        reason_code=reason_code,
        reason_label=ACCESS_REASON_LABELS.get(reason_code) if reason_code is not None else None,
        allowed_reasons=access_reason_options(policy.allowed_reason_codes),
    )


def _record_access_reason_event(
    db: OrmSession,
    *,
    adult: User,
    student_id: uuid.UUID,
    resource_type: str,
    status_value: str,
    relationship_check: str,
    reason_code: str | None,
    reason_required: bool,
    allowed_reason_count: int,
    decision: str,
) -> None:
    record_audit_event(
        db,
        actor=adult,
        actor_role=adult.role,
        action="adult_access_reason_checked",
        resource_type=resource_type,
        resource_id=str(student_id),
        status_value=status_value,
        reason=reason_code,
        metadata_summary={
            "student_id": str(student_id),
            "actor_role": adult.role,
            "resource_type": resource_type,
            "relationship_check": relationship_check,
            "reason_code": reason_code,
            "reason_required": reason_required,
            "allowed_reason_count": allowed_reason_count,
            "decision": decision,
        },
        is_demo=adult.is_demo,
    )


def _safe_allowed_reason_or_none(policy: SchoolPrivacyPolicyDefault, reason_code: str | None) -> str | None:
    if reason_code is None:
        return None
    normalized = reason_code.strip().lower()
    if normalized in normalize_reason_codes(policy.allowed_reason_codes):
        return normalized
    return None


def _enforce_access_reason(
    db: OrmSession,
    *,
    adult: User,
    student_id: uuid.UUID,
    relationship_check: str,
    policy: SchoolPrivacyPolicyDefault,
    reason_code: str | None,
) -> tuple[AdultAccessReasonStatus, str | None]:
    required_resources = _required_reason_resources(policy)
    allowed_reasons = normalize_reason_codes(policy.allowed_reason_codes)
    if not required_resources:
        return _access_reason_status(policy, required=False, reason_code=None), None

    if reason_code is None or not reason_code.strip():
        for resource_type in required_resources:
            _record_access_reason_event(
                db,
                adult=adult,
                student_id=student_id,
                resource_type=resource_type,
                status_value="missing",
                relationship_check=relationship_check,
                reason_code=None,
                reason_required=True,
                allowed_reason_count=len(allowed_reasons),
                decision="reason_required_missing",
            )
        db.commit()
        raise HTTPException(status_code=status.HTTP_428_PRECONDITION_REQUIRED, detail=_reason_required_detail(policy))

    normalized = reason_code.strip().lower()
    if normalized not in allowed_reasons:
        for resource_type in required_resources:
            _record_access_reason_event(
                db,
                adult=adult,
                student_id=student_id,
                resource_type=resource_type,
                status_value="denied",
                relationship_check=relationship_check,
                reason_code=None,
                reason_required=True,
                allowed_reason_count=len(allowed_reasons),
                decision="invalid_reason_code",
            )
        db.commit()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Lý do truy cập không hợp lệ.")

    for resource_type in required_resources:
        _record_access_reason_event(
            db,
            adult=adult,
            student_id=student_id,
            resource_type=resource_type,
            status_value="allowed",
            relationship_check=relationship_check,
            reason_code=normalized,
            reason_required=True,
            allowed_reason_count=len(allowed_reasons),
            decision="reason_accepted",
        )
    return _access_reason_status(policy, required=True, reason_code=normalized), normalized


def _summary_item(attempt: SelfCheckAttempt) -> AdultSelfCheckSummaryItem:
    return AdultSelfCheckSummaryItem(
        completed_at=attempt.completed_at,
        test_type=attempt.test_title_snapshot,
        state_label=attempt.state_label,
        advice_summary=attempt.advice_summary,
        support_suggestion=attempt.support_suggestion,
        is_demo=attempt.is_demo,
    )


def get_adult_self_check_summaries(
    db: OrmSession,
    adult: User,
    student_id: uuid.UUID,
    relationship_type: str,
) -> AdultSelfCheckSummaryResponse:
    relationship_check = _relationship_check(relationship_type)
    require_permission(
        db,
        adult,
        resource_type="self_check_summary",
        action="read",
        purpose="support_not_surveillance",
        student_id=student_id,
    )

    student = db.get(User, student_id)
    if student is None or student.role != UserRole.STUDENT.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy học sinh.")

    latest_attempt = db.scalar(
        select(SelfCheckAttempt)
        .where(SelfCheckAttempt.student_id == student_id)
        .order_by(SelfCheckAttempt.completed_at.desc(), SelfCheckAttempt.id.desc())
        .limit(1)
    )
    recent_cutoff = utc_now() - timedelta(days=RECENT_SUMMARY_DAYS)
    recent_attempts = list(
        db.scalars(
            select(SelfCheckAttempt)
            .where(
                SelfCheckAttempt.student_id == student_id,
                SelfCheckAttempt.completed_at >= recent_cutoff,
            )
            .order_by(SelfCheckAttempt.completed_at.desc(), SelfCheckAttempt.id.desc())
            .limit(RECENT_SUMMARY_LIMIT)
        )
    )
    latest_summary = _summary_item(latest_attempt) if latest_attempt else None
    recent_summaries = [_summary_item(attempt) for attempt in recent_attempts]

    record_audit_event(
        db,
        actor=adult,
        actor_role=adult.role,
        action="sensitive_resource_read",
        resource_type="self_check_summary",
        resource_id=str(student_id),
        status_value="allowed",
        reason="support_not_surveillance",
        metadata_summary={
            "student_id": str(student_id),
            "relationship_check": relationship_check,
            "purpose_key": "support_not_surveillance",
            "decision": "summary_only",
        },
        is_demo=student.is_demo,
    )
    db.commit()

    return AdultSelfCheckSummaryResponse(
        student=AdultStudentContext(
            id=student.id,
            full_name=student.full_name,
            school=student.school,
            class_name=student.class_name,
        ),
        latest_summary=latest_summary,
        recent_summaries=recent_summaries,
        is_demo=student.is_demo,
    )


def _adult_student_context(student: User) -> AdultStudentContext:
    return AdultStudentContext(
        id=student.id,
        full_name=student.full_name,
        school=student.school,
        class_name=student.class_name,
    )


def _support_plan_summary(
    db: OrmSession,
    *,
    student_id: uuid.UUID,
    adult_id: uuid.UUID,
) -> AdultSupportPlanSummary:
    plan = db.scalar(select(StudentSupportPlan).where(StudentSupportPlan.student_id == student_id))
    if plan is None:
        return AdultSupportPlanSummary(
            status=None,
            shared_with_viewer=False,
            selected_adult_count=0,
        )

    selected_count = db.scalar(
        select(func.count()).select_from(StudentSupportPlanAdult).where(
            StudentSupportPlanAdult.support_plan_id == plan.id
        )
    )
    selected_for_viewer = db.scalar(
        select(StudentSupportPlanAdult).where(
            StudentSupportPlanAdult.support_plan_id == plan.id,
            StudentSupportPlanAdult.adult_id == adult_id,
        )
    )
    shared_with_viewer = plan.status == SupportPlanStatus.ACTIVE.value and selected_for_viewer is not None
    if not shared_with_viewer:
        return AdultSupportPlanSummary(
            status=plan.status,
            shared_with_viewer=False,
            selected_adult_count=selected_count or 0,
            updated_at=plan.updated_at,
        )

    return AdultSupportPlanSummary(
        status=plan.status,
        shared_with_viewer=True,
        selected_adult_count=selected_count or 0,
        what_helps=plan.what_helps,
        what_does_not_help=plan.what_does_not_help,
        preferred_contact_method=plan.preferred_contact_method,
        safe_contact_times=plan.safe_contact_times,
        shareable_note=plan.shareable_note,
        updated_at=plan.updated_at,
    )


def _mood_summary(db: OrmSession, student_id: uuid.UUID) -> AdultMoodTrendSummary:
    items = list(
        db.scalars(
            select(MoodCheckIn)
            .where(MoodCheckIn.student_id == student_id)
            .order_by(MoodCheckIn.created_at.desc(), MoodCheckIn.id.desc())
            .limit(RECENT_SUMMARY_LIMIT)
        )
    )
    cutoff = utc_now() - timedelta(days=RECENT_MOOD_DAYS)
    recent_items = [item for item in items if item.created_at >= cutoff]
    high_concern_count = sum(1 for item in recent_items if item.trend_label == "Cần hỗ trợ sớm")

    if not items:
        return AdultMoodTrendSummary(
            recent_checkin_count=0,
            high_concern_count=0,
            recent_trend_labels=[],
            suggested_supportive_action="Chưa có check-in gần đây. Hãy tiếp tục tạo không gian để em chia sẻ khi sẵn sàng.",
        )

    latest = items[0]
    if high_concern_count > 0:
        action = "Hỏi em cần được hỗ trợ thế nào hôm nay và nhắc em có thể dùng SOS nếu em chủ động xác nhận cần hỗ trợ ngay."
    elif latest.trend_label == "Cần quan tâm":
        action = "Bắt đầu bằng lắng nghe, hỏi một câu nhẹ nhàng và tôn trọng điều em muốn chia sẻ."
    else:
        action = "Duy trì sự hiện diện ổn định và khích lệ em tiếp tục chăm sóc bản thân."

    return AdultMoodTrendSummary(
        latest_checkin_at=latest.created_at,
        latest_trend_label=latest.trend_label,
        recent_checkin_count=len(recent_items),
        high_concern_count=high_concern_count,
        recent_trend_labels=[item.trend_label for item in items],
        suggested_supportive_action=action,
    )


def get_adult_support_summary(
    db: OrmSession,
    adult: User,
    student_id: uuid.UUID,
    relationship_type: str,
    access_reason_code: str | None = None,
) -> AdultSupportSummaryResponse:
    relationship_check = _relationship_check(relationship_type)
    student = db.get(User, student_id)
    if student is None or student.role != UserRole.STUDENT.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy học sinh.")
    policy = get_or_create_school_privacy_policy(db, is_demo=student.is_demo)
    try:
        require_permission(
            db,
            adult,
            resource_type="adult_support_summary",
            action="read",
            purpose="support_not_surveillance",
            student_id=student_id,
        )
    except HTTPException:
        _record_access_reason_event(
            db,
            adult=adult,
            student_id=student_id,
            resource_type="adult_support_summary",
            status_value="denied",
            relationship_check=relationship_check,
            reason_code=_safe_allowed_reason_or_none(policy, access_reason_code),
            reason_required=bool(_required_reason_resources(policy)),
            allowed_reason_count=len(normalize_reason_codes(policy.allowed_reason_codes)),
            decision="authorization_denied",
        )
        db.commit()
        raise
    access_reason, accepted_reason_code = _enforce_access_reason(
        db,
        adult=adult,
        student_id=student_id,
        relationship_check=relationship_check,
        policy=policy,
        reason_code=access_reason_code,
    )

    support_plan = _support_plan_summary(db, student_id=student_id, adult_id=adult.id)
    mood_summary = _mood_summary(db, student_id)
    shared_mood_notes = list_active_shared_notes_for_adult(
        db,
        adult,
        student_id,
        relationship_type,
        access_reason_code=accepted_reason_code,
    )
    record_audit_event(
        db,
        actor=adult,
        actor_role=adult.role,
        action="sensitive_resource_read",
        resource_type="adult_support_summary",
        resource_id=str(student_id),
        status_value="allowed",
        reason=accepted_reason_code or "support_not_surveillance",
        metadata_summary={
            "student_id": str(student_id),
            "relationship_check": relationship_check,
            "purpose_key": "support_not_surveillance",
            "access_reason_required": access_reason.required,
            "access_reason_code": accepted_reason_code,
            "support_plan_shared": support_plan.shared_with_viewer,
            "recent_mood_checkin_count": mood_summary.recent_checkin_count,
            "high_concern_count": mood_summary.high_concern_count,
            "shared_mood_note_count": len(shared_mood_notes),
            "decision": "summary_with_student_consented_shared_notes",
        },
        is_demo=student.is_demo,
    )
    db.commit()

    return AdultSupportSummaryResponse(
        student=_adult_student_context(student),
        support_plan=support_plan,
        mood_summary=mood_summary,
        shared_mood_notes=shared_mood_notes,
        access_reason=access_reason,
        privacy_notes=ADULT_SUPPORT_PRIVACY_NOTES,
        is_demo=student.is_demo,
    )
