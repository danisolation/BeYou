from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession, selectinload

from app.db.models import ContentStatus, Scenario, ScenarioAttempt, ScenarioChoice, ScenarioSignal, User

VALID_SCENARIO_SIGNALS = {ScenarioSignal.CONSTRUCTIVE.value, ScenarioSignal.RISKY.value}
MAX_FEEDBACK_LENGTH = 500


def _published_scenario_query(scenario_id: uuid.UUID | None = None):
    query = (
        select(Scenario)
        .options(selectinload(Scenario.choices))
        .where(Scenario.status == ContentStatus.PUBLISHED.value)
    )
    if scenario_id is not None:
        query = query.where(Scenario.id == scenario_id)
    return query


def _ordered_choices(scenario: Scenario) -> list[ScenarioChoice]:
    return sorted(scenario.choices, key=lambda choice: (choice.sort_order, str(choice.id)))


def _validate_scenario_content(scenario: Scenario) -> None:
    if not scenario.recommended_response.strip() or not scenario.lesson.strip() or not scenario.skill_tag.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung tình huống chưa đủ gợi ý hỗ trợ.",
        )

    for choice in _ordered_choices(scenario):
        if choice.signal not in VALID_SCENARIO_SIGNALS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tín hiệu lựa chọn phải là constructive hoặc risky.",
            )
        if not choice.feedback.strip() or len(choice.feedback) > MAX_FEEDBACK_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phản hồi lựa chọn cần ngắn gọn và hỗ trợ học sinh.",
            )


def list_published_scenarios(db: OrmSession) -> list[Scenario]:
    return list(
        db.scalars(
            select(Scenario)
            .where(Scenario.status == ContentStatus.PUBLISHED.value)
            .order_by(Scenario.created_at.asc(), Scenario.title.asc())
        )
    )


def get_published_scenario_detail(db: OrmSession, scenario_id: uuid.UUID) -> Scenario:
    scenario = db.scalar(_published_scenario_query(scenario_id))
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tình huống.")
    _validate_scenario_content(scenario)
    scenario.choices.sort(key=lambda choice: (choice.sort_order, str(choice.id)))
    return scenario


def submit_scenario_attempt(
    db: OrmSession,
    student: User,
    scenario_id: uuid.UUID,
    choice_id: uuid.UUID,
) -> ScenarioAttempt:
    scenario = get_published_scenario_detail(db, scenario_id)
    choices_by_id = {choice.id: choice for choice in scenario.choices}
    selected_choice = choices_by_id.get(choice_id)
    if selected_choice is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lựa chọn không thuộc tình huống này.",
        )

    if selected_choice.signal not in VALID_SCENARIO_SIGNALS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tín hiệu lựa chọn phải là constructive hoặc risky.",
        )

    attempt = ScenarioAttempt(
        student_id=student.id,
        scenario_id=scenario.id,
        selected_choice_id=selected_choice.id,
        scenario_title_snapshot=scenario.title,
        situation_snapshot=scenario.situation,
        selected_choice_snapshot=selected_choice.text,
        signal_snapshot=selected_choice.signal,
        feedback_snapshot=selected_choice.feedback,
        recommended_response_snapshot=scenario.recommended_response,
        lesson_snapshot=scenario.lesson,
        skill_tag_snapshot=scenario.skill_tag,
        is_demo=student.is_demo or scenario.is_demo or selected_choice.is_demo,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def list_student_scenario_attempts(db: OrmSession, student: User) -> list[ScenarioAttempt]:
    return list(
        db.scalars(
            select(ScenarioAttempt)
            .where(ScenarioAttempt.student_id == student.id)
            .order_by(ScenarioAttempt.completed_at.desc(), ScenarioAttempt.id.desc())
        )
    )
