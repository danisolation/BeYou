from __future__ import annotations

import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    SosAlert,
    SosStatusEvent,
    InAppNotification,
    ContentStatus,
    PrivacyAcknowledgement,
    ScenarioAttempt,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    ChatSafetySignal,
    ChatMessage,
    ChatThread,
    ChatbotSafetyConfig,
    ScenarioChoice,
    Scenario,
    Session as UserSession,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            ChatSafetySignal,
            ChatMessage,
            ChatThread,
            ChatbotSafetyConfig,
            InAppNotification,
            SosStatusEvent,
            SosAlert,
            ScenarioAttempt,
            ScenarioChoice,
            Scenario,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckThreshold,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            AuditEvent,
            StudentAdultLink,
            PrivacyAcknowledgement,
            UserSession,
            User,
        ):
            db.execute(delete(model))
        db.commit()


@pytest.fixture()
def db() -> OrmSession:
    _clean_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_database()


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def _student(db: OrmSession, email: str = "student-self-check@example.test") -> User:
    user = User(
        email=email,
        password_hash=hash_password("secret123"),
        role=UserRole.STUDENT.value,
        status=AccountStatus.ACTIVE.value,
        full_name="Học sinh Demo",
        school="THPT Demo",
        class_name="10A1",
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _ack_privacy(db: OrmSession, student: User) -> None:
    db.add(
        PrivacyAcknowledgement(
            user_id=student.id,
            notice_version=NOTICE_VERSION,
            is_demo=student.is_demo,
        )
    )
    db.commit()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _published_test(
    db: OrmSession,
    *,
    title: str = "Sức khỏe cảm xúc",
    status_value: str = ContentStatus.PUBLISHED.value,
    is_active: bool = True,
    include_matching_threshold: bool = True,
) -> tuple[SelfCheckTest, list[SelfCheckQuestion], list[list[SelfCheckChoice]]]:
    test = SelfCheckTest(
        title=title,
        description="Bài tự kiểm tra ngắn, kết quả không phải chẩn đoán.",
        status=status_value,
        is_active=is_active,
        is_demo=True,
    )
    db.add(test)
    db.flush()

    questions: list[SelfCheckQuestion] = []
    choices_by_question: list[list[SelfCheckChoice]] = []
    for index, text in enumerate(
        ("Tuần này em ngủ có ổn không?", "Em có thấy được lắng nghe không?"), start=1
    ):
        question = SelfCheckQuestion(
            test_id=test.id,
            text=text,
            sort_order=index,
            is_demo=True,
        )
        db.add(question)
        db.flush()
        choices = [
            SelfCheckChoice(
                question_id=question.id,
                text="Khá ổn",
                score_value=0,
                sort_order=1,
                is_demo=True,
            ),
            SelfCheckChoice(
                question_id=question.id,
                text="Cần để ý thêm",
                score_value=2,
                sort_order=2,
                is_demo=True,
            ),
        ]
        db.add_all(choices)
        questions.append(question)
        choices_by_question.append(choices)

    if include_matching_threshold:
        db.add_all(
            [
                SelfCheckThreshold(
                    test_id=test.id,
                    state_label="On dinh",
                    min_score=0,
                    max_score=1,
                    comment="Em đang ổn.",
                    advice="Duy trì thói quen đang giúp em thấy an toàn.",
                    positive_content="Em có thể ghi lại điều đã giúp mình hôm nay.",
                    suggested_next_action="Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
                    is_demo=True,
                ),
                SelfCheckThreshold(
                    test_id=test.id,
                    state_label="Can chu y",
                    min_score=2,
                    max_score=4,
                    comment="Có một vài dấu hiệu cần chú ý.",
                    advice="Chọn một việc nhỏ giúp em bình tĩnh hơn.",
                    positive_content="Việc em nhận ra cảm xúc của mình là một bước tốt.",
                    suggested_next_action="Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.",
                    is_demo=True,
                ),
            ]
        )
    else:
        db.add(
            SelfCheckThreshold(
                test_id=test.id,
                state_label="On dinh",
                min_score=8,
                max_score=10,
                is_demo=True,
            )
        )
    db.commit()
    for obj in [
        test,
        *questions,
        *[choice for choices in choices_by_question for choice in choices],
    ]:
        db.refresh(obj)
    return test, questions, choices_by_question


def _answers(
    questions: list[SelfCheckQuestion],
    choices_by_question: list[list[SelfCheckChoice]],
    choice_index: int,
) -> list[dict[str, uuid.UUID]]:
    return [
        {"question_id": question.id, "choice_id": choices_by_question[index][choice_index].id}
        for index, question in enumerate(questions)
    ]


def test_submit_self_check_scores_thresholds_and_preserves_snapshots(db: OrmSession) -> None:
    from app.services.self_checks import submit_self_check_attempt

    student = _student(db)
    test, questions, choices = _published_test(db)

    attempt = submit_self_check_attempt(db, student, test.id, _answers(questions, choices, 1))
    assert attempt.score == 4
    assert attempt.state_label == "Can chu y"
    assert attempt.test_title_snapshot == "Sức khỏe cảm xúc"
    assert attempt.test_snapshot["title"] == "Sức khỏe cảm xúc"
    assert len(attempt.answers) == 2
    assert attempt.answers[0].score_value_snapshot == 2

    test.title = "Tên đã chỉnh sửa"
    questions[0].text = "Câu hỏi đã chỉnh sửa"
    choices[0][1].text = "Lựa chọn đã chỉnh sửa"
    db.commit()
    db.expire_all()

    saved = db.get(SelfCheckAttempt, attempt.id)
    assert saved is not None
    assert saved.test_title_snapshot == "Sức khỏe cảm xúc"
    assert saved.test_snapshot["questions"][0]["text"] == "Tuần này em ngủ có ổn không?"
    assert saved.answers[0].choice_text_snapshot == "Cần để ý thêm"


@pytest.mark.parametrize(
    "status_value,is_active",
    [(ContentStatus.DRAFT.value, True), (ContentStatus.PUBLISHED.value, False)],
)
def test_submit_rejects_unpublished_or_inactive_tests(
    db: OrmSession,
    status_value: str,
    is_active: bool,
) -> None:
    from app.services.self_checks import submit_self_check_attempt

    student = _student(db)
    test, questions, choices = _published_test(db, status_value=status_value, is_active=is_active)

    with pytest.raises(HTTPException) as exc_info:
        submit_self_check_attempt(db, student, test.id, _answers(questions, choices, 0))

    assert exc_info.value.status_code == 404
    assert db.scalar(select(func.count()).select_from(SelfCheckAttempt)) == 0


def test_submit_rejects_missing_answer_choice_from_another_test_and_missing_threshold(
    db: OrmSession,
) -> None:
    from app.services.self_checks import submit_self_check_attempt

    student = _student(db)
    test, questions, choices = _published_test(db)
    other_test, other_questions, other_choices = _published_test(db, title="Áp lực bạn bè")
    no_threshold_test, no_threshold_questions, no_threshold_choices = _published_test(
        db,
        title="Không có ngưỡng phù hợp",
        include_matching_threshold=False,
    )

    invalid_cases = [
        _answers(questions[:1], choices[:1], 0),
        [
            {"question_id": questions[0].id, "choice_id": other_choices[0][0].id},
            _answers(questions, choices, 0)[1],
        ],
        _answers(no_threshold_questions, no_threshold_choices, 0),
    ]

    for answers in invalid_cases:
        with pytest.raises(HTTPException) as exc_info:
            submit_self_check_attempt(
                db,
                student,
                no_threshold_test.id if answers is invalid_cases[-1] else test.id,
                answers,
            )
        assert exc_info.value.status_code == 400

    assert db.scalar(select(func.count()).select_from(SelfCheckAttempt)) == 0
    assert other_test.title == "Áp lực bạn bè"
    assert other_questions[0].test_id == other_test.id


def test_student_self_check_routes_list_submit_history_detail_and_protect_raw_answers(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _student(db, "route-student@example.test")
    other_student = _student(db, "other-route-student@example.test")
    _ack_privacy(db, student)
    _ack_privacy(db, other_student)
    test, questions, choices = _published_test(db)
    _published_test(db, title="Nháp", status_value=ContentStatus.DRAFT.value)
    _published_test(db, title="Tắt", is_active=False)

    _login(client, student.email)
    list_response = client.get("/api/student/self-checks")
    detail_response = client.get(f"/api/student/self-checks/{test.id}")
    submit_response = client.post(
        f"/api/student/self-checks/{test.id}/attempts",
        json={
            "answers": [
                {"question_id": str(answer["question_id"]), "choice_id": str(answer["choice_id"])}
                for answer in _answers(questions, choices, 1)
            ]
        },
        headers=ORIGIN_HEADERS,
    )
    history_response = client.get("/api/student/self-checks/history")

    assert list_response.status_code == 200
    assert [item["title"] for item in list_response.json()] == ["Sức khỏe cảm xúc"]
    assert detail_response.status_code == 200
    assert "thresholds" not in detail_response.text
    assert "score_value" not in detail_response.text
    assert submit_response.status_code == 201
    result = submit_response.json()
    assert result["score"] == 4
    assert result["state_label"] == "Can chu y"
    assert result["supportive_headline"]
    assert result["suggested_next_action"]
    assert history_response.status_code == 200
    assert "items" in history_response.json()
    assert history_response.json()["items"][0]["attempt_id"] == result["attempt_id"]

    detail_attempt_response = client.get(f"/api/student/self-checks/history/{result['attempt_id']}")
    assert detail_attempt_response.status_code == 200
    assert len(detail_attempt_response.json()["answers"]) == 2
    assert detail_attempt_response.json()["answers"][0]["score_value_snapshot"] == 2

    other_client = TestClient(app)
    _login(other_client, other_student.email)
    cross_student_response = other_client.get(
        f"/api/student/self-checks/history/{result['attempt_id']}"
    )
    assert cross_student_response.status_code in {403, 404}


def test_self_check_routes_require_privacy_acknowledgement(
    db: OrmSession, client: TestClient
) -> None:
    student = _student(db, "privacy-gated-self-check@example.test")
    _published_test(db)

    _login(client, student.email)
    response = client.get("/api/student/self-checks")

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "privacy_ack_required"
