from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session as OrmSession

from app.core.authorization import require_permission, require_role
from app.core.config import Settings, get_settings
from app.core.sessions import get_current_user, require_same_site_mutation
from app.db.models import Scenario, ScenarioAttempt, User, UserRole
from app.db.session import get_db
from app.schemas.scenarios import (
    ScenarioAttemptRequest,
    ScenarioChoiceResponse,
    ScenarioDetailResponse,
    ScenarioFeedbackResponse,
    ScenarioHistoryItem,
    ScenarioHistoryListResponse,
    ScenarioListItem,
)
from app.services.privacy import NOTICE_VERSION, privacy_acknowledgement_required
from app.services.scenarios import (
    get_published_scenario_detail,
    list_published_scenarios,
    list_student_scenario_attempts,
    submit_scenario_attempt,
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


def _scenario_list_item(scenario: Scenario) -> ScenarioListItem:
    return ScenarioListItem(
        id=scenario.id,
        title=scenario.title,
        situation=scenario.situation,
        skill_tag=scenario.skill_tag,
        cover_image_url=scenario.cover_image_url,
        status=scenario.status,
        is_demo=scenario.is_demo,
    )


def _scenario_detail(scenario: Scenario) -> ScenarioDetailResponse:
    return ScenarioDetailResponse(
        **_scenario_list_item(scenario).model_dump(),
        recommended_response=scenario.recommended_response,
        lesson=scenario.lesson,
        choices=[
            ScenarioChoiceResponse(
                id=choice.id,
                text=choice.text,
                signal=choice.signal,
                feedback=choice.feedback,
                sort_order=choice.sort_order,
                is_demo=choice.is_demo,
            )
            for choice in sorted(scenario.choices, key=lambda item: (item.sort_order, str(item.id)))
        ],
    )


def _feedback_response(attempt: ScenarioAttempt) -> ScenarioFeedbackResponse:
    return ScenarioFeedbackResponse(
        attempt_id=attempt.id,
        scenario_id=attempt.scenario_id,
        selected_choice_id=attempt.selected_choice_id,
        selected_choice=attempt.selected_choice_snapshot,
        signal=attempt.signal_snapshot,
        feedback=attempt.feedback_snapshot,
        recommended_response=attempt.recommended_response_snapshot,
        lesson=attempt.lesson_snapshot,
        skill_tag=attempt.skill_tag_snapshot,
        completed_at=attempt.completed_at,
        is_demo=attempt.is_demo,
    )


def _history_item(attempt: ScenarioAttempt) -> ScenarioHistoryItem:
    return ScenarioHistoryItem(
        attempt_id=attempt.id,
        scenario_id=attempt.scenario_id,
        scenario_title=attempt.scenario_title_snapshot,
        selected_choice=attempt.selected_choice_snapshot,
        signal=attempt.signal_snapshot,
        feedback=attempt.feedback_snapshot,
        skill_tag=attempt.skill_tag_snapshot,
        completed_at=attempt.completed_at,
        is_demo=attempt.is_demo,
    )


@router.get("", response_model=list[ScenarioListItem])
def list_scenarios(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> list[ScenarioListItem]:
    _require_student_with_privacy_ack(db, current_user)
    return [_scenario_list_item(scenario) for scenario in list_published_scenarios(db)]


@router.get("/history", response_model=ScenarioHistoryListResponse)
def list_scenario_history(
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> ScenarioHistoryListResponse:
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="scenario_attempt_private",
        action="read",
        purpose="student_reflection",
        student_id=student.id,
    )
    return ScenarioHistoryListResponse(
        items=[_history_item(attempt) for attempt in list_student_scenario_attempts(db, student)]
    )


@router.get("/{scenario_id}", response_model=ScenarioDetailResponse)
def get_scenario_detail(
    scenario_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
) -> ScenarioDetailResponse:
    _require_student_with_privacy_ack(db, current_user)
    return _scenario_detail(get_published_scenario_detail(db, scenario_id))


@router.post(
    "/{scenario_id}/attempts",
    response_model=ScenarioFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_scenario_attempt(
    scenario_id: uuid.UUID,
    payload: ScenarioAttemptRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ScenarioFeedbackResponse:
    require_same_site_mutation(request, settings)
    student = _require_student_with_privacy_ack(db, current_user)
    require_permission(
        db,
        student,
        resource_type="scenario_attempt_private",
        action="write",
        purpose="student_reflection",
        student_id=student.id,
    )
    return _feedback_response(
        submit_scenario_attempt(db, student, scenario_id, payload.selected_choice_id)
    )
