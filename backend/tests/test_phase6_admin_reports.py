from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    ChatMessage,
    ChatMessageRole,
    ChatSafetySignal,
    ChatSafetyStage,
    ChatThread,
    ChatbotSafetyConfig,
    InAppNotification,
    LinkStatus,
    PrivacyAcknowledgement,
    Scenario,
    ScenarioAttempt,
    ScenarioChoice,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    Session as UserSession,
    SosAlert,
    SosSeverity,
    SosSource,
    SosStatusEvent,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
)
from app.db.session import SessionLocal
from app.main import app

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"


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


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = False, full_name: str | None = None) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=full_name or f"{role.title()} Private Name",
        school="THPT Privacy" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _link(db: OrmSession, *, student: User, adult: User, relationship_type: str, is_demo: bool = False) -> None:
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=adult.id,
            relationship_type=relationship_type,
            status=LinkStatus.ACTIVE.value,
            created_by=adult.id,
            is_demo=is_demo,
        )
    )
    db.commit()


def _self_check_test(db: OrmSession, title: str, *, is_demo: bool = False) -> SelfCheckTest:
    test = SelfCheckTest(title=title, status="published", is_active=True, is_demo=is_demo)
    db.add(test)
    db.flush()
    question = SelfCheckQuestion(test_id=test.id, text=f"Câu hỏi riêng {title}", sort_order=1, is_demo=is_demo)
    db.add(question)
    db.flush()
    choice = SelfCheckChoice(
        question_id=question.id,
        text=f"RAW_SELF_CHECK_CHOICE_{title}",
        score_value=1,
        sort_order=1,
        is_demo=is_demo,
    )
    db.add(choice)
    db.flush()
    db.add(
        SelfCheckThreshold(
            test_id=test.id,
            state_label="Can chu y",
            min_score=0,
            max_score=2,
            comment="Nhận xét hỗ trợ",
            advice="Gợi ý hỗ trợ",
            is_demo=is_demo,
        )
    )
    db.commit()
    db.refresh(test)
    return test


def _attempt(
    db: OrmSession,
    *,
    student: User,
    test: SelfCheckTest,
    state_label: str,
    is_demo: bool = False,
    raw_answer_text: str = "RAW_SELF_CHECK_PRIVATE_ANSWER",
) -> None:
    question = db.scalar(select(SelfCheckQuestion).where(SelfCheckQuestion.test_id == test.id))
    choice = db.scalar(select(SelfCheckChoice).where(SelfCheckChoice.question_id == question.id))
    assert question is not None
    assert choice is not None
    attempt = SelfCheckAttempt(
        student_id=student.id,
        test_id=test.id,
        score=1,
        state_label=state_label,
        supportive_headline="Tóm tắt hỗ trợ",
        short_comment="Không phải chẩn đoán.",
        advice_summary="Gợi ý chung để hỗ trợ.",
        support_suggestion="Hỏi em cần hỗ trợ gì.",
        positive_content="Em xứng đáng được lắng nghe.",
        suggested_next_action="Chọn một bước an toàn.",
        test_title_snapshot=test.title,
        test_snapshot={"title": test.title, "raw_answers": raw_answer_text},
        is_demo=is_demo,
        completed_at=utc_now() - timedelta(minutes=5),
    )
    db.add(attempt)
    db.flush()
    db.add(
        SelfCheckAttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            choice_id=choice.id,
            question_text_snapshot="RAW_SELF_CHECK_PRIVATE_QUESTION",
            choice_text_snapshot=raw_answer_text,
            score_value_snapshot=1,
            sort_order=1,
            is_demo=is_demo,
        )
    )
    db.commit()


def _scenario_attempt(db: OrmSession, *, student: User, title: str, is_demo: bool = False) -> None:
    scenario = Scenario(
        title=title,
        situation="RAW_SCENARIO_PRIVATE_SITUATION",
        skill_tag="Từ chối an toàn",
        status="published",
        recommended_response="Chọn bước an toàn.",
        lesson="Dừng lại giúp em an toàn hơn.",
        is_demo=is_demo,
    )
    db.add(scenario)
    db.flush()
    choice = ScenarioChoice(
        scenario_id=scenario.id,
        text="RAW_SCENARIO_PRIVATE_CHOICE",
        signal="constructive",
        feedback="Phản hồi hỗ trợ.",
        sort_order=1,
        is_demo=is_demo,
    )
    db.add(choice)
    db.flush()
    db.add(
        ScenarioAttempt(
            student_id=student.id,
            scenario_id=scenario.id,
            selected_choice_id=choice.id,
            scenario_title_snapshot=title,
            situation_snapshot="RAW_SCENARIO_PRIVATE_SITUATION",
            selected_choice_snapshot="RAW_SCENARIO_PRIVATE_CHOICE",
            signal_snapshot="constructive",
            feedback_snapshot="RAW_SCENARIO_PRIVATE_FEEDBACK",
            recommended_response_snapshot="Chọn bước an toàn.",
            lesson_snapshot="Dừng lại giúp em an toàn hơn.",
            skill_tag_snapshot="Từ chối an toàn",
            is_demo=is_demo,
        )
    )
    db.commit()


def _sos_alert(db: OrmSession, *, student: User, status_value: str, is_demo: bool = False) -> None:
    db.add(
        SosAlert(
            student_id=student.id,
            student_full_name_snapshot="RAW_STUDENT_NAME_IN_SOS",
            student_school_snapshot="RAW_STUDENT_SCHOOL_IN_SOS",
            student_class_name_snapshot="RAW_STUDENT_CLASS_IN_SOS",
            severity=SosSeverity.URGENT.value,
            source=SosSource.STUDENT_DASHBOARD.value,
            note="RAW_SOS_PRIVATE_NOTE",
            current_status=status_value,
            is_demo=is_demo,
        )
    )
    db.commit()


def _chat_safety_signal(db: OrmSession, *, student: User, is_demo: bool = False) -> None:
    thread = ChatThread(student_id=student.id, safety_state="high_risk", is_demo=is_demo)
    db.add(thread)
    db.flush()
    message = ChatMessage(
        thread_id=thread.id,
        role=ChatMessageRole.STUDENT.value,
        content="RAW_CHAT_PRIVATE_MESSAGE",
        safety_flagged=True,
        is_demo=is_demo,
    )
    db.add(message)
    db.flush()
    db.add(
        ChatSafetySignal(
            thread_id=thread.id,
            message_id=message.id,
            stage=ChatSafetyStage.INPUT.value,
            categories=["self_harm"],
            summary="high_risk_detected",
            escalation_suggestion="suggest_sos_trusted_adult",
            sos_suggested=True,
            is_demo=is_demo,
        )
    )
    db.commit()


def _seed_report_data(db: OrmSession) -> dict[str, User]:
    admin = _user(db, email="admin-report@example.test", role=UserRole.ADMIN.value, full_name="Admin Raw Name")
    teacher = _user(db, email="teacher-report@example.test", role=UserRole.TEACHER.value, full_name="Teacher Raw Name")
    parent = _user(db, email="parent-report@example.test", role=UserRole.PARENT.value, full_name="Parent Raw Name")
    students = [
        _user(db, email=f"student-report-{index}@example.test", role=UserRole.STUDENT.value, full_name=f"Student Raw Name {index}")
        for index in range(1, 5)
    ]
    demo_student = _user(
        db,
        email="student-demo-report@example.test",
        role=UserRole.STUDENT.value,
        is_demo=True,
        full_name="Demo Student Raw Name",
    )
    _link(db, student=students[0], adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=demo_student, adult=parent, relationship_type=UserRole.PARENT.value, is_demo=True)

    main_test = _self_check_test(db, "Sức khỏe cảm xúc")
    small_test = _self_check_test(db, "Áp lực bạn bè")
    demo_test = _self_check_test(db, "Bài demo", is_demo=True)
    for student in students[:3]:
        _attempt(db, student=student, test=main_test, state_label="Can chu y")
    _attempt(db, student=students[3], test=small_test, state_label="Can ho tro som")
    _attempt(db, student=demo_student, test=demo_test, state_label="Can chu y", is_demo=True)

    for student in students[:3]:
        _scenario_attempt(db, student=student, title="Rủ rê sau giờ học")
    _scenario_attempt(db, student=students[3], title="Áp lực điểm số")

    for student in students[:3]:
        _sos_alert(db, student=student, status_value="sent")
    _sos_alert(db, student=students[3], status_value="supporting")

    for student in students[:2]:
        _chat_safety_signal(db, student=student)

    return {"admin": admin, "teacher": teacher, "demo_student": demo_student}


def test_admin_aggregate_report_is_privacy_limited_suppressed_and_audited(
    db: OrmSession,
    client: TestClient,
) -> None:
    users = _seed_report_data(db)
    _login(client, users["admin"].email)

    response = client.get("/api/admin/reports/aggregate")

    assert response.status_code == 200
    payload = response.json()
    assert payload["demo_scope"] == "all"
    assert payload["suppression_threshold"] == 3
    assert payload["user_counts"]["total"] == 8
    assert {bucket["key"]: bucket["count"] for bucket in payload["user_counts"]["by_role"]}["student"] == 5
    assert payload["linked_students"]["linked_students"] == 2
    assert payload["self_check_usage"]["total_completed"]["count"] == 5

    risk_buckets = {bucket["key"]: bucket for bucket in payload["self_check_usage"]["risk_distribution"]}
    assert risk_buckets["Can chu y"]["count"] == 4
    assert risk_buckets["Can ho tro som"]["count"] is None
    assert risk_buckets["Can ho tro som"]["suppressed"] is True

    test_buckets = {bucket["key"]: bucket for bucket in payload["self_check_usage"]["by_test"]}
    assert test_buckets["Sức khỏe cảm xúc"]["count"] == 3
    assert test_buckets["Áp lực bạn bè"]["count"] is None
    assert payload["chatbot_safety"]["high_risk_signals"]["suppressed"] is True
    assert payload["sos_counts"]["by_status"][0]["key"] in {"sent", "supporting"}

    response_text = response.text
    forbidden_fragments = [
        "RAW_",
        "admin-report@example.test",
        "student-report-1@example.test",
        "Student Raw Name",
        "answer_text",
        "transcript",
        "message_content",
        '"note"',
        "RAW_SOS_PRIVATE_NOTE",
        "RAW_CHAT_PRIVATE_MESSAGE",
    ]
    for fragment in forbidden_fragments:
        assert fragment not in response_text

    audit = db.scalar(select(AuditEvent).where(AuditEvent.resource_type == "aggregate_report"))
    assert audit is not None
    assert audit.action == "sensitive_resource_read"
    assert audit.status == "allowed"
    assert audit.metadata_summary == {
        "demo_scope": "all",
        "suppression_threshold": 3,
        "sections": ["users", "links", "self_checks", "sos", "scenarios", "chatbot_safety"],
        "decision": "aggregate_only_no_raw_exports",
    }
    assert "RAW_" not in str(audit.metadata_summary)


def test_aggregate_report_demo_scope_filters_sensitive_domains(
    db: OrmSession,
    client: TestClient,
) -> None:
    users = _seed_report_data(db)
    _login(client, users["admin"].email)

    real_response = client.get("/api/admin/reports/aggregate?demo_scope=real")
    demo_response = client.get("/api/admin/reports/aggregate?demo_scope=demo")

    assert real_response.status_code == 200
    assert demo_response.status_code == 200
    assert real_response.json()["user_counts"]["total"] == 7
    assert "Bài demo" not in real_response.text
    assert demo_response.json()["user_counts"]["total"] == 1
    assert demo_response.json()["self_check_usage"]["total_completed"]["suppressed"] is True


def test_aggregate_report_is_admin_only(db: OrmSession, client: TestClient) -> None:
    users = _seed_report_data(db)
    _login(client, users["teacher"].email)

    response = client.get("/api/admin/reports/aggregate")

    assert response.status_code == 403
