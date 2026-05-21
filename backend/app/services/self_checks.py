from __future__ import annotations

import uuid
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession, selectinload

from app.db.models import (
    ContentStatus,
    RiskStateLabel,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    User,
)
from app.schemas.self_checks import SelfCheckAnswerSubmit

VALID_STATE_LABELS = {label.value for label in RiskStateLabel}

DEFAULT_RESULT_COPY = {
    RiskStateLabel.STABLE.value: {
        "supportive_headline": "Em đang có nhiều dấu hiệu ổn định.",
        "short_comment": "Kết quả không phải chẩn đoán, chỉ giúp BeYou chọn gợi ý phù hợp.",
        "advice_summary": "Hãy tiếp tục để ý những điều đang giúp em thấy an toàn và thoải mái.",
        "support_suggestion": "Nếu có điều gì làm em băn khoăn, em vẫn có thể chia sẻ với người em tin tưởng.",
        "positive_content": "Việc em dành thời gian lắng nghe bản thân là một thói quen tích cực.",
        "suggested_next_action": "Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
    },
    RiskStateLabel.ATTENTION.value: {
        "supportive_headline": "Có một vài dấu hiệu em nên để ý thêm.",
        "short_comment": "Kết quả không phải chẩn đoán, chỉ là gợi ý để em chăm sóc bản thân hơn.",
        "advice_summary": "Chọn một việc nhỏ giúp em bình tĩnh, nghỉ ngơi hoặc sắp xếp lại điều đang lo.",
        "support_suggestion": "Em có thể chia sẻ với bạn tin cậy, giáo viên hoặc người thân khi thấy cần.",
        "positive_content": "Nhận ra cảm xúc của mình là bước đầu rất đáng quý.",
        "suggested_next_action": "Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.",
    },
    RiskStateLabel.SUPPORT.value: {
        "supportive_headline": "Em không cần tự xử lý mọi thứ một mình.",
        "short_comment": "Kết quả không phải chẩn đoán, nhưng cho thấy em nên có thêm hỗ trợ.",
        "advice_summary": "Hãy chọn một người lớn tin cậy và nói ngắn gọn điều em đang trải qua.",
        "support_suggestion": "Giáo viên, phụ huynh hoặc người phụ trách có thể cùng em tìm bước tiếp theo an toàn.",
        "positive_content": "Tìm kiếm hỗ trợ là một cách chăm sóc bản thân, không phải lỗi của em.",
        "suggested_next_action": "Hãy cân nhắc nói chuyện với giáo viên, phụ huynh hoặc một người lớn tin cậy.",
    },
    RiskStateLabel.EARLY_SUPPORT.value: {
        "supportive_headline": "Điều em đang trải qua đáng được hỗ trợ sớm.",
        "short_comment": "Kết quả không phải chẩn đoán, nhưng em nên có người lớn tin cậy ở bên.",
        "advice_summary": "Ưu tiên ở gần nơi an toàn và nói với một người lớn em tin tưởng.",
        "support_suggestion": "Nếu em thấy không ổn, hãy tìm giáo viên, phụ huynh hoặc người lớn gần nhất.",
        "positive_content": "Em xứng đáng được lắng nghe và hỗ trợ kịp thời.",
        "suggested_next_action": "Hãy tìm một người lớn tin cậy ở gần em. BeYou sẽ có nút SOS ở bước tiếp theo của sản phẩm.",
    },
}


def _published_test_query(test_id: uuid.UUID | None = None):
    query = (
        select(SelfCheckTest)
        .options(
            selectinload(SelfCheckTest.questions).selectinload(SelfCheckQuestion.choices),
            selectinload(SelfCheckTest.thresholds),
        )
        .where(
            SelfCheckTest.status == ContentStatus.PUBLISHED.value,
            SelfCheckTest.is_active.is_(True),
        )
    )
    if test_id is not None:
        query = query.where(SelfCheckTest.id == test_id)
    return query


def list_published_tests(db: OrmSession) -> list[SelfCheckTest]:
    return list(
        db.scalars(
            select(SelfCheckTest)
            .where(
                SelfCheckTest.status == ContentStatus.PUBLISHED.value,
                SelfCheckTest.is_active.is_(True),
            )
            .order_by(SelfCheckTest.created_at.asc(), SelfCheckTest.title.asc())
        )
    )


def get_published_test_detail(db: OrmSession, test_id: uuid.UUID) -> SelfCheckTest:
    test = db.scalar(_published_test_query(test_id))
    if test is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài tự kiểm tra.")
    return test


def _normalise_answers(
    answers: Sequence[SelfCheckAnswerSubmit | dict[str, uuid.UUID]],
) -> dict[uuid.UUID, uuid.UUID]:
    answer_map: dict[uuid.UUID, uuid.UUID] = {}
    for answer in answers:
        question_id = answer.question_id if hasattr(answer, "question_id") else answer["question_id"]
        choice_id = answer.choice_id if hasattr(answer, "choice_id") else answer["choice_id"]
        if question_id in answer_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mỗi câu hỏi chỉ được chọn một câu trả lời.",
            )
        answer_map[question_id] = choice_id
    return answer_map


def _ordered_questions(test: SelfCheckTest) -> list[SelfCheckQuestion]:
    return sorted(test.questions, key=lambda question: (question.sort_order, str(question.id)))


def _ordered_choices(question: SelfCheckQuestion) -> list[SelfCheckChoice]:
    return sorted(question.choices, key=lambda choice: (choice.sort_order, str(choice.id)))


def _validate_answers(
    test: SelfCheckTest,
    answers: Sequence[SelfCheckAnswerSubmit | dict[str, uuid.UUID]],
) -> list[tuple[SelfCheckQuestion, SelfCheckChoice]]:
    answer_map = _normalise_answers(answers)
    questions = _ordered_questions(test)
    expected_question_ids = {question.id for question in questions}

    if set(answer_map) != expected_question_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng trả lời đầy đủ các câu hỏi.",
        )

    selected: list[tuple[SelfCheckQuestion, SelfCheckChoice]] = []
    for question in questions:
        choices_by_id = {choice.id: choice for choice in question.choices}
        choice = choices_by_id.get(answer_map[question.id])
        if choice is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lựa chọn không thuộc bài tự kiểm tra này.",
            )
        selected.append((question, choice))
    return selected


def _matching_threshold(test: SelfCheckTest, score: int) -> SelfCheckThreshold:
    matches = [
        threshold
        for threshold in test.thresholds
        if threshold.min_score <= score <= threshold.max_score and threshold.state_label in VALID_STATE_LABELS
    ]
    if len(matches) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cấu hình ngưỡng điểm chưa phù hợp.",
        )
    return matches[0]


def _snapshot_for_test(test: SelfCheckTest) -> dict:
    questions = [
        {
            "id": str(question.id),
            "text": question.text,
            "sort_order": question.sort_order,
            "choices": [
                {
                    "id": str(choice.id),
                    "text": choice.text,
                    "score_value": choice.score_value,
                    "sort_order": choice.sort_order,
                }
                for choice in _ordered_choices(question)
            ],
        }
        for question in _ordered_questions(test)
    ]
    thresholds = [
        {
            "state_label": threshold.state_label,
            "min_score": threshold.min_score,
            "max_score": threshold.max_score,
            "short_comment": threshold.comment,
            "advice_summary": threshold.advice,
            "positive_content": threshold.positive_content,
            "suggested_next_action": threshold.suggested_next_action,
        }
        for threshold in sorted(test.thresholds, key=lambda item: (item.min_score, item.max_score, item.state_label))
    ]
    return {
        "id": str(test.id),
        "title": test.title,
        "description": test.description,
        "questions": questions,
        "thresholds": thresholds,
        "copy_fields": {
            "supportive_headline": "derived_by_state_label",
            "short_comment": "threshold.comment_or_default",
            "advice_summary": "threshold.advice_or_default",
            "support_suggestion": "threshold.suggested_next_action_or_default",
            "positive_content": "threshold.positive_content_or_default",
            "suggested_next_action": "threshold.suggested_next_action_or_default",
        },
    }


def _copy_for_threshold(threshold: SelfCheckThreshold) -> dict[str, str | None]:
    defaults = DEFAULT_RESULT_COPY[threshold.state_label]
    return {
        "supportive_headline": defaults["supportive_headline"],
        "short_comment": threshold.comment or defaults["short_comment"],
        "advice_summary": threshold.advice or defaults["advice_summary"],
        "support_suggestion": threshold.suggested_next_action or defaults["support_suggestion"],
        "positive_content": threshold.positive_content or defaults["positive_content"],
        "suggested_next_action": threshold.suggested_next_action or defaults["suggested_next_action"],
    }


def submit_self_check_attempt(
    db: OrmSession,
    student: User,
    test_id: uuid.UUID,
    answers: Sequence[SelfCheckAnswerSubmit | dict[str, uuid.UUID]],
) -> SelfCheckAttempt:
    test = get_published_test_detail(db, test_id)
    selected_answers = _validate_answers(test, answers)
    score = sum(choice.score_value for _, choice in selected_answers)
    threshold = _matching_threshold(test, score)
    copy = _copy_for_threshold(threshold)

    attempt = SelfCheckAttempt(
        student_id=student.id,
        test_id=test.id,
        score=score,
        state_label=threshold.state_label,
        supportive_headline=copy["supportive_headline"],
        short_comment=copy["short_comment"],
        advice_summary=copy["advice_summary"],
        support_suggestion=copy["support_suggestion"],
        positive_content=copy["positive_content"],
        suggested_next_action=copy["suggested_next_action"],
        test_title_snapshot=test.title,
        test_snapshot=_snapshot_for_test(test),
        is_demo=student.is_demo or test.is_demo,
    )
    db.add(attempt)
    db.flush()

    for question, choice in selected_answers:
        db.add(
            SelfCheckAttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                choice_id=choice.id,
                question_text_snapshot=question.text,
                choice_text_snapshot=choice.text,
                score_value_snapshot=choice.score_value,
                sort_order=question.sort_order,
                is_demo=attempt.is_demo,
            )
        )

    db.commit()
    return get_student_attempt_detail(db, student, attempt.id)


def list_student_attempts(db: OrmSession, student: User) -> list[SelfCheckAttempt]:
    return list(
        db.scalars(
            select(SelfCheckAttempt)
            .where(SelfCheckAttempt.student_id == student.id)
            .order_by(SelfCheckAttempt.completed_at.desc(), SelfCheckAttempt.id.desc())
        )
    )


def get_student_attempt_detail(
    db: OrmSession,
    student: User,
    attempt_id: uuid.UUID,
) -> SelfCheckAttempt:
    attempt = db.scalar(
        select(SelfCheckAttempt)
        .options(selectinload(SelfCheckAttempt.answers))
        .where(SelfCheckAttempt.id == attempt_id)
    )
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy kết quả tự kiểm tra.")
    if attempt.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy kết quả tự kiểm tra.")
    attempt.answers.sort(key=lambda answer: (answer.sort_order, str(answer.id)))
    return attempt
