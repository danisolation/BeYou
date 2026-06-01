from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import SelfCheckAttempt, SelfCheckTest, User, UserRole
from app.db.session import get_db
from app.schemas.self_checks import (
    SelfCheckAttemptDetailResponse,
    SelfCheckAttemptSubmitRequest,
    SelfCheckChoiceResponse,
    SelfCheckHistoryItem,
    SelfCheckHistoryListResponse,
    SelfCheckQuestionResponse,
    SelfCheckResultResponse,
    SelfCheckTestDetailResponse,
    SelfCheckTestListItem,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required
from app.services.self_checks import (
    get_published_test_detail,
    get_student_attempt_detail,
    list_published_tests,
    list_student_attempts,
    submit_self_check_attempt,
)

router = APIRouter()


def _require_student_with_privacy_ack(db: OrmSession, current_user: User) -> User:
    require_role(current_user, UserRole.STUDENT)
    if privacy_acknowledgement_required(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "privacy_ack_required", "notice_version": NOTICE_VERSION},
        )
    return current_user


def _test_list_item(test: SelfCheckTest) -> SelfCheckTestListItem:
    return SelfCheckTestListItem(
        id=test.id,
        title=test.title,
        description=test.description,
        cover_image_url=test.cover_image_url,
        status=test.status,
        is_active=test.is_active,
        is_demo=test.is_demo,
    )


def _test_detail(test: SelfCheckTest) -> SelfCheckTestDetailResponse:
    return SelfCheckTestDetailResponse(
        **_test_list_item(test).model_dump(),
        questions=[
            SelfCheckQuestionResponse(
                id=question.id,
                text=question.text,
                sort_order=question.sort_order,
                is_demo=question.is_demo,
                choices=[
                    SelfCheckChoiceResponse(
                        id=choice.id,
                        text=choice.text,
                        sort_order=choice.sort_order,
                        is_demo=choice.is_demo,
                    )
                    for choice in sorted(
                        question.choices, key=lambda item: (item.sort_order, str(item.id))
                    )
                ],
            )
            for question in sorted(test.questions, key=lambda item: (item.sort_order, str(item.id)))
        ],
    )


def _result_response(attempt: SelfCheckAttempt) -> SelfCheckResultResponse:
    return SelfCheckResultResponse(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        test_title=attempt.test_title_snapshot,
        state_label=attempt.state_label,
        supportive_headline=attempt.supportive_headline or "",
        short_comment=attempt.short_comment,
        advice_summary=attempt.advice_summary,
        support_suggestion=attempt.support_suggestion,
        positive_content=attempt.positive_content,
        suggested_next_action=attempt.suggested_next_action,
        score=attempt.score,
        completed_at=attempt.completed_at,
        is_demo=attempt.is_demo,
    )


def _history_item(attempt: SelfCheckAttempt) -> SelfCheckHistoryItem:
    return SelfCheckHistoryItem(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        test_title=attempt.test_title_snapshot,
        state_label=attempt.state_label,
        supportive_headline=attempt.supportive_headline,
        suggested_next_action=attempt.suggested_next_action,
        completed_at=attempt.completed_at,
        is_demo=attempt.is_demo,
    )


def _attempt_detail_response(attempt: SelfCheckAttempt) -> SelfCheckAttemptDetailResponse:
    result = _result_response(attempt)
    return SelfCheckAttemptDetailResponse(
        **result.model_dump(),
        answers=attempt.answers,
    )


@router.get("", response_model=list[SelfCheckTestListItem])
def list_self_checks(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[SelfCheckTestListItem]:
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="self_check_summary",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return [_test_list_item(test) for test in list_published_tests(db)]


@router.get("/history", response_model=SelfCheckHistoryListResponse)
def list_self_check_history(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SelfCheckHistoryListResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="self_check_summary",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return SelfCheckHistoryListResponse(
        items=[_history_item(attempt) for attempt in list_student_attempts(db, student)]
    )


@router.get("/history/{attempt_id}", response_model=SelfCheckAttemptDetailResponse)
def get_self_check_attempt_detail(
    attempt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SelfCheckAttemptDetailResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="self_check_raw_answers",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    attempt = get_student_attempt_detail(db, student, attempt_id)
    require_permission(
        db,
        student,
        resource_type="self_check_summary",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return _attempt_detail_response(attempt)


@router.get("/{test_id}", response_model=SelfCheckTestDetailResponse)
def get_self_check_detail(
    test_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> SelfCheckTestDetailResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="self_check_summary",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return _test_detail(get_published_test_detail(db, test_id))


@router.post(
    "/{test_id}/attempts",
    response_model=SelfCheckResultResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_self_check_attempt(
    test_id: uuid.UUID,
    payload: SelfCheckAttemptSubmitRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SelfCheckResultResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="self_check_raw_answers",
        action="write",
        purpose="student_reflection",
        student_id=student.id,
    )
    attempt = submit_self_check_attempt(db, student, test_id, payload.answers)
    require_permission(
        db,
        student,
        resource_type="self_check_summary",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return _result_response(attempt)
