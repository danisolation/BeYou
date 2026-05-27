from __future__ import annotations

import uuid
from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session as OrmSession, selectinload

from app.db.models import (
    ContentStatus,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    User,
)
from app.schemas.admin_content import (
    AdminScenarioChoiceUpsert,
    AdminScenarioUpsert,
    AdminSelfCheckQuestionUpsert,
    AdminSelfCheckTestUpsert,
    VALID_RISK_LABELS,
    VALID_SIGNALS,
)
from app.services.audit import record_audit_event

SELF_CHECK_PUBLISH_ERROR = "Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm."
SCENARIO_PUBLISH_ERROR = "Chưa thể xuất bản vì nội dung tình huống còn thiếu lựa chọn, phản hồi hoặc bài học."


def _ordered_questions(test: SelfCheckTest) -> list[SelfCheckQuestion]:
    return sorted(test.questions, key=lambda item: (item.sort_order, str(item.id)))


def _ordered_choices(choices: Iterable[SelfCheckChoice | ScenarioChoice]) -> list:
    return sorted(choices, key=lambda item: (item.sort_order, str(item.id)))


def _self_check_query(test_id: uuid.UUID | None = None):
    query = select(SelfCheckTest).options(
        selectinload(SelfCheckTest.questions).selectinload(SelfCheckQuestion.choices),
        selectinload(SelfCheckTest.thresholds),
    )
    if test_id is not None:
        query = query.where(SelfCheckTest.id == test_id)
    return query


def _scenario_query(scenario_id: uuid.UUID | None = None):
    query = select(Scenario).options(selectinload(Scenario.choices))
    if scenario_id is not None:
        query = query.where(Scenario.id == scenario_id)
    return query


def get_self_check_test_or_404(db: OrmSession, test_id: uuid.UUID) -> SelfCheckTest:
    test = db.scalar(_self_check_query(test_id))
    if test is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy test tâm lý.")
    return test


def get_scenario_or_404(db: OrmSession, scenario_id: uuid.UUID) -> Scenario:
    scenario = db.scalar(_scenario_query(scenario_id))
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tình huống.")
    return scenario


def _record_content_audit(
    db: OrmSession,
    *,
    actor: User,
    resource_type: str,
    content_id: uuid.UUID,
    change_type: str,
    is_demo: bool,
) -> None:
    record_audit_event(
        db,
        actor=actor,
        actor_role=actor.role,
        action="admin_safety_content_changed",
        resource_type=resource_type,
        resource_id=str(content_id),
        status_value="success",
        reason="admin_content_management",
        is_demo=is_demo or actor.is_demo,
        metadata_summary={
            "content_type": resource_type,
            "content_id": str(content_id),
            "change_type": change_type,
            "admin_actor_id": str(actor.id),
            "is_demo": is_demo or actor.is_demo,
        },
    )


def _assert_draft_for_delete(status_value: str) -> None:
    if status_value != ContentStatus.DRAFT.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ có thể xoá bản nháp chưa dùng.")


def _replace_self_check_children(
    db: OrmSession,
    test: SelfCheckTest,
    *,
    questions: list[AdminSelfCheckQuestionUpsert] | None,
    thresholds: list,
) -> None:
    db.execute(
        update(SelfCheckAttemptAnswer)
        .where(
            SelfCheckAttemptAnswer.attempt_id.in_(
                select(SelfCheckAttempt.id).where(SelfCheckAttempt.test_id == test.id)
            )
        )
        .values(question_id=None, choice_id=None)
    )
    db.execute(delete(SelfCheckThreshold).where(SelfCheckThreshold.test_id == test.id))
    db.execute(
        delete(SelfCheckChoice).where(
            SelfCheckChoice.question_id.in_(
                select(SelfCheckQuestion.id).where(SelfCheckQuestion.test_id == test.id)
            )
        )
    )
    db.execute(delete(SelfCheckQuestion).where(SelfCheckQuestion.test_id == test.id))
    db.flush()

    for question_index, question_payload in enumerate(questions or [], start=1):
        question = SelfCheckQuestion(
            test_id=test.id,
            text=question_payload.text,
            sort_order=question_payload.sort_order or question_index,
            is_demo=test.is_demo if question_payload.is_demo is None else question_payload.is_demo,
        )
        db.add(question)
        db.flush()
        for choice_index, choice_payload in enumerate(question_payload.choices, start=1):
            db.add(
                SelfCheckChoice(
                    question_id=question.id,
                    text=choice_payload.text,
                    score_value=choice_payload.score_value,
                    sort_order=choice_payload.sort_order or choice_index,
                    is_demo=test.is_demo if choice_payload.is_demo is None else choice_payload.is_demo,
                )
            )

    for threshold_payload in thresholds or []:
        db.add(
            SelfCheckThreshold(
                test_id=test.id,
                state_label=threshold_payload.state_label,
                min_score=threshold_payload.min_score,
                max_score=threshold_payload.max_score,
                comment=threshold_payload.comment,
                advice=threshold_payload.advice,
                positive_content=threshold_payload.positive_content,
                suggested_next_action=threshold_payload.suggested_next_action,
                is_demo=test.is_demo if threshold_payload.is_demo is None else threshold_payload.is_demo,
            )
        )


def validate_self_check_publishable(test: SelfCheckTest) -> None:
    questions = _ordered_questions(test)
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)

    possible_min = 0
    possible_max = 0
    for question in questions:
        if not question.text.strip() or len(question.choices) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)
        scores = []
        for choice in question.choices:
            if not choice.text.strip() or not isinstance(choice.score_value, int):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)
            scores.append(choice.score_value)
        possible_min += min(scores)
        possible_max += max(scores)

    thresholds = sorted(test.thresholds, key=lambda item: (item.min_score, item.max_score, item.state_label))
    if not thresholds:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)
    covered: set[int] = set()
    for threshold in thresholds:
        if (
            threshold.state_label not in VALID_RISK_LABELS
            or threshold.min_score > threshold.max_score
            or not (threshold.comment or "").strip()
            or not (threshold.advice or "").strip()
            or not (threshold.suggested_next_action or "").strip()
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)
        for score_value in range(threshold.min_score, threshold.max_score + 1):
            if score_value in covered:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)
            covered.add(score_value)

    if covered != set(range(possible_min, possible_max + 1)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SELF_CHECK_PUBLISH_ERROR)


def list_self_check_tests(db: OrmSession) -> list[SelfCheckTest]:
    return list(db.scalars(_self_check_query().order_by(SelfCheckTest.created_at.asc(), SelfCheckTest.title.asc())))


def create_self_check_test(db: OrmSession, *, actor: User, payload: AdminSelfCheckTestUpsert) -> SelfCheckTest:
    test = SelfCheckTest(
        title=payload.title,
        description=payload.description,
        status=payload.status or ContentStatus.DRAFT.value,
        is_active=True if payload.is_active is None else payload.is_active,
        is_demo=bool(payload.is_demo),
    )
    db.add(test)
    db.flush()
    _replace_self_check_children(db, test, questions=payload.questions or [], thresholds=payload.thresholds or [])
    if test.status == ContentStatus.PUBLISHED.value:
        validate_self_check_publishable(test)
    _record_content_audit(
        db, actor=actor, resource_type="self_check_content", content_id=test.id, change_type="create", is_demo=test.is_demo
    )
    db.commit()
    return get_self_check_test_or_404(db, test.id)


def update_self_check_test(
    db: OrmSession, *, actor: User, test_id: uuid.UUID, payload: AdminSelfCheckTestUpsert
) -> SelfCheckTest:
    test = get_self_check_test_or_404(db, test_id)
    test.title = payload.title
    test.description = payload.description
    test.is_active = True if payload.is_active is None else payload.is_active
    test.is_demo = bool(payload.is_demo)
    if payload.status is not None:
        test.status = payload.status
    _replace_self_check_children(db, test, questions=payload.questions or [], thresholds=payload.thresholds or [])
    if test.status == ContentStatus.PUBLISHED.value:
        validate_self_check_publishable(test)
    _record_content_audit(
        db, actor=actor, resource_type="self_check_content", content_id=test.id, change_type="edit", is_demo=test.is_demo
    )
    db.commit()
    return get_self_check_test_or_404(db, test.id)


def publish_self_check_test(db: OrmSession, *, actor: User, test_id: uuid.UUID) -> SelfCheckTest:
    test = get_self_check_test_or_404(db, test_id)
    validate_self_check_publishable(test)
    test.status = ContentStatus.PUBLISHED.value
    _record_content_audit(
        db, actor=actor, resource_type="self_check_content", content_id=test.id, change_type="publish", is_demo=test.is_demo
    )
    db.commit()
    return get_self_check_test_or_404(db, test.id)


def archive_self_check_test(db: OrmSession, *, actor: User, test_id: uuid.UUID) -> SelfCheckTest:
    test = get_self_check_test_or_404(db, test_id)
    test.status = ContentStatus.ARCHIVED.value
    _record_content_audit(
        db, actor=actor, resource_type="self_check_content", content_id=test.id, change_type="archive", is_demo=test.is_demo
    )
    db.commit()
    return get_self_check_test_or_404(db, test.id)


def delete_unused_draft_self_check_test(db: OrmSession, *, actor: User, test_id: uuid.UUID) -> SelfCheckTest:
    test = get_self_check_test_or_404(db, test_id)
    _assert_draft_for_delete(test.status)
    used_count = db.scalar(select(func.count()).select_from(SelfCheckAttempt).where(SelfCheckAttempt.test_id == test.id))
    if used_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ có thể xoá bản nháp chưa dùng.")
    deleted_id = test.id
    deleted = test
    _record_content_audit(
        db, actor=actor, resource_type="self_check_content", content_id=deleted_id, change_type="delete_draft", is_demo=test.is_demo
    )
    db.delete(test)
    db.commit()
    return deleted


def _replace_scenario_choices(
    db: OrmSession,
    scenario: Scenario,
    choices: list[AdminScenarioChoiceUpsert] | None,
) -> None:
    db.execute(
        update(ScenarioAttempt)
        .where(ScenarioAttempt.scenario_id == scenario.id)
        .values(selected_choice_id=None)
    )
    db.execute(delete(ScenarioChoice).where(ScenarioChoice.scenario_id == scenario.id))
    db.flush()
    for choice_index, choice_payload in enumerate(choices or [], start=1):
        db.add(
            ScenarioChoice(
                scenario_id=scenario.id,
                text=choice_payload.text,
                signal=choice_payload.signal,
                feedback=choice_payload.feedback,
                sort_order=choice_payload.sort_order or choice_index,
                is_demo=scenario.is_demo if choice_payload.is_demo is None else choice_payload.is_demo,
            )
        )


def validate_scenario_publishable(scenario: Scenario) -> None:
    if (
        not scenario.title.strip()
        or not scenario.situation.strip()
        or not scenario.skill_tag.strip()
        or not scenario.recommended_response.strip()
        or not scenario.lesson.strip()
        or len(scenario.choices) < 2
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SCENARIO_PUBLISH_ERROR)
    for choice in scenario.choices:
        if not choice.text.strip() or choice.signal not in VALID_SIGNALS or not choice.feedback.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=SCENARIO_PUBLISH_ERROR)


def list_scenarios(db: OrmSession) -> list[Scenario]:
    return list(db.scalars(_scenario_query().order_by(Scenario.created_at.asc(), Scenario.title.asc())))


def create_scenario(db: OrmSession, *, actor: User, payload: AdminScenarioUpsert) -> Scenario:
    scenario = Scenario(
        title=payload.title,
        situation=payload.situation,
        skill_tag=payload.skill_tag,
        status=payload.status or ContentStatus.DRAFT.value,
        recommended_response=payload.recommended_response,
        lesson=payload.lesson,
        is_demo=bool(payload.is_demo),
    )
    db.add(scenario)
    db.flush()
    _replace_scenario_choices(db, scenario, payload.choices or [])
    if scenario.status == ContentStatus.PUBLISHED.value:
        validate_scenario_publishable(scenario)
    _record_content_audit(
        db, actor=actor, resource_type="scenario_content", content_id=scenario.id, change_type="create", is_demo=scenario.is_demo
    )
    db.commit()
    return get_scenario_or_404(db, scenario.id)


def update_scenario(db: OrmSession, *, actor: User, scenario_id: uuid.UUID, payload: AdminScenarioUpsert) -> Scenario:
    scenario = get_scenario_or_404(db, scenario_id)
    scenario.title = payload.title
    scenario.situation = payload.situation
    scenario.skill_tag = payload.skill_tag
    scenario.recommended_response = payload.recommended_response
    scenario.lesson = payload.lesson
    scenario.is_demo = bool(payload.is_demo)
    if payload.status is not None:
        scenario.status = payload.status
    _replace_scenario_choices(db, scenario, payload.choices or [])
    if scenario.status == ContentStatus.PUBLISHED.value:
        validate_scenario_publishable(scenario)
    _record_content_audit(
        db, actor=actor, resource_type="scenario_content", content_id=scenario.id, change_type="edit", is_demo=scenario.is_demo
    )
    db.commit()
    return get_scenario_or_404(db, scenario.id)


def publish_scenario(db: OrmSession, *, actor: User, scenario_id: uuid.UUID) -> Scenario:
    scenario = get_scenario_or_404(db, scenario_id)
    validate_scenario_publishable(scenario)
    scenario.status = ContentStatus.PUBLISHED.value
    _record_content_audit(
        db, actor=actor, resource_type="scenario_content", content_id=scenario.id, change_type="publish", is_demo=scenario.is_demo
    )
    db.commit()
    return get_scenario_or_404(db, scenario.id)


def archive_scenario(db: OrmSession, *, actor: User, scenario_id: uuid.UUID) -> Scenario:
    scenario = get_scenario_or_404(db, scenario_id)
    scenario.status = ContentStatus.ARCHIVED.value
    _record_content_audit(
        db, actor=actor, resource_type="scenario_content", content_id=scenario.id, change_type="archive", is_demo=scenario.is_demo
    )
    db.commit()
    return get_scenario_or_404(db, scenario.id)


def delete_unused_draft_scenario(db: OrmSession, *, actor: User, scenario_id: uuid.UUID) -> Scenario:
    scenario = get_scenario_or_404(db, scenario_id)
    _assert_draft_for_delete(scenario.status)
    used_count = db.scalar(
        select(func.count()).select_from(ScenarioAttempt).where(ScenarioAttempt.scenario_id == scenario.id)
    )
    if used_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ có thể xoá bản nháp chưa dùng.")
    deleted = scenario
    _record_content_audit(
        db, actor=actor, resource_type="scenario_content", content_id=scenario.id, change_type="delete_draft", is_demo=scenario.is_demo
    )
    db.delete(scenario)
    db.commit()
    return deleted
