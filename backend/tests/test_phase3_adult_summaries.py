from __future__ import annotations

from datetime import timedelta
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    LinkStatus,
    ScenarioAttempt,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    SelfCheckThreshold,
    Session as UserSession,
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
            ScenarioAttempt,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckThreshold,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            AuditEvent,
            StudentAdultLink,
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


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = True) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Demo",
        school="THPT Demo" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _link(db: OrmSession, *, student: User, adult: User, relationship_type: str) -> None:
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=adult.id,
            relationship_type=relationship_type,
            status=LinkStatus.ACTIVE.value,
            created_by=adult.id,
            is_demo=True,
        )
    )
    db.commit()


def _attempt(
    db: OrmSession,
    *,
    student: User,
    days_ago: int,
    label: str,
    raw_answer_text: str,
) -> SelfCheckAttempt:
    test = SelfCheckTest(title=f"Bài {label}", status="published", is_active=True, is_demo=True)
    db.add(test)
    db.flush()
    question = SelfCheckQuestion(test_id=test.id, text=f"Câu hỏi riêng {label}", sort_order=1, is_demo=True)
    db.add(question)
    db.flush()
    choice = SelfCheckChoice(
        question_id=question.id,
        text=raw_answer_text,
        score_value=1,
        sort_order=1,
        is_demo=True,
    )
    db.add(choice)
    db.flush()
    attempt = SelfCheckAttempt(
        student_id=student.id,
        test_id=test.id,
        score=1,
        state_label="Can chu y",
        supportive_headline=f"Tóm tắt {label}",
        short_comment=f"Nhận xét {label}",
        advice_summary=f"Tóm tắt gợi ý {label}",
        support_suggestion=f"Gợi ý hỗ trợ {label}",
        positive_content=f"Nội dung tích cực {label}",
        suggested_next_action=f"Bước tiếp theo {label}",
        test_title_snapshot=f"Sức khỏe cảm xúc {label}",
        test_snapshot={"title": f"Sức khỏe cảm xúc {label}"},
        is_demo=True,
        completed_at=utc_now() - timedelta(days=days_ago),
    )
    db.add(attempt)
    db.flush()
    db.add(
        SelfCheckAttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            choice_id=choice.id,
            question_text_snapshot=f"Câu hỏi riêng tư {label}",
            choice_text_snapshot=raw_answer_text,
            score_value_snapshot=1,
            sort_order=1,
            is_demo=True,
        )
    )
    db.commit()
    db.refresh(attempt)
    return attempt


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def test_adult_summary_service_minimizes_recent_attempts_and_audits(db: OrmSession) -> None:
    from app.schemas.adult_summaries import AdultSelfCheckSummaryResponse
    from app.services.adult_summaries import get_adult_self_check_summaries

    student = _user(db, email="student-adult-summary@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-adult-summary@example.test", role=UserRole.TEACHER.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    for index in range(6):
        _attempt(
            db,
            student=student,
            days_ago=index,
            label=f"recent-{index}",
            raw_answer_text=f"RAW_PRIVATE_ANSWER_{index}",
        )
    _attempt(db, student=student, days_ago=31, label="old", raw_answer_text="RAW_PRIVATE_ANSWER_OLD")

    response = get_adult_self_check_summaries(
        db, teacher, student.id, relationship_type=UserRole.TEACHER.value
    )

    assert isinstance(response, AdultSelfCheckSummaryResponse)
    assert response.student.id == student.id
    assert response.latest_summary is not None
    assert response.latest_summary.test_type == "Sức khỏe cảm xúc recent-0"
    assert len(response.recent_summaries) == 5
    assert [item.test_type for item in response.recent_summaries] == [
        "Sức khỏe cảm xúc recent-0",
        "Sức khỏe cảm xúc recent-1",
        "Sức khỏe cảm xúc recent-2",
        "Sức khỏe cảm xúc recent-3",
        "Sức khỏe cảm xúc recent-4",
    ]
    payload = response.model_dump_json()
    assert "RAW_PRIVATE_ANSWER" not in payload
    assert "score_breakdown" not in payload
    assert "scenario_attempts" not in payload

    audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "sensitive_resource_read"))
    assert audit is not None
    assert audit.resource_type == "self_check_summary"
    assert audit.reason == "support_not_surveillance"
    assert audit.status == "allowed"
    assert audit.metadata_summary == {
        "student_id": str(student.id),
        "relationship_check": "linked_teacher",
        "purpose_key": "support_not_surveillance",
        "decision": "summary_only",
    }


def test_adult_summary_service_denies_unlinked_adult(db: OrmSession) -> None:
    from fastapi import HTTPException

    from app.services.adult_summaries import get_adult_self_check_summaries

    student = _user(db, email="student-unlinked-summary@example.test", role=UserRole.STUDENT.value)
    parent = _user(db, email="parent-unlinked-summary@example.test", role=UserRole.PARENT.value)
    _attempt(db, student=student, days_ago=0, label="latest", raw_answer_text="RAW_PRIVATE_DENIED")

    try:
        get_adult_self_check_summaries(db, parent, student.id, relationship_type=UserRole.PARENT.value)
    except HTTPException as exc:
        assert exc.status_code == 403
    else:  # pragma: no cover - explicit failure path for readability
        raise AssertionError("Unlinked adult should not read student summaries")
    assert db.scalar(select(func.count()).select_from(AuditEvent)) == 0


def test_teacher_and_parent_summary_routes_enforce_link_and_omit_raw_answers(
    client: TestClient,
) -> None:
    _clean_database()
    try:
        with SessionLocal() as db:
            student = _user(db, email="student-route-summary@example.test", role=UserRole.STUDENT.value)
            teacher = _user(db, email="teacher-route-summary@example.test", role=UserRole.TEACHER.value)
            parent = _user(db, email="parent-route-summary@example.test", role=UserRole.PARENT.value)
            unlinked_teacher = _user(
                db,
                email="teacher-unlinked-route-summary@example.test",
                role=UserRole.TEACHER.value,
            )
            _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
            _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
            _attempt(
                db,
                student=student,
                days_ago=0,
                label="route",
                raw_answer_text="RAW_ROUTE_PRIVATE_ANSWER",
            )
            student_id = student.id
            teacher_email = teacher.email
            parent_email = parent.email
            unlinked_teacher_email = unlinked_teacher.email
            student_email = student.email

        _login(client, teacher_email)
        teacher_response = client.get(f"/api/teacher/students/{student_id}/self-check-summaries")
        assert teacher_response.status_code == 200
        assert teacher_response.json()["latest_summary"]["advice_summary"] == "Tóm tắt gợi ý route"
        assert "RAW_ROUTE_PRIVATE_ANSWER" not in teacher_response.text
        assert "answers" not in teacher_response.text
        assert "question_text_snapshot" not in teacher_response.text

        _login(client, parent_email)
        parent_response = client.get(f"/api/parent/students/{student_id}/self-check-summaries")
        assert parent_response.status_code == 200
        assert "RAW_ROUTE_PRIVATE_ANSWER" not in parent_response.text

        _login(client, unlinked_teacher_email)
        denied_response = client.get(f"/api/teacher/students/{student_id}/self-check-summaries")
        assert denied_response.status_code == 403

        _login(client, student_email)
        student_denied = client.get(f"/api/teacher/students/{student_id}/self-check-summaries")
        assert student_denied.status_code == 403

        with SessionLocal() as db:
            assert db.scalar(select(func.count()).select_from(AuditEvent)) == 2
    finally:
        _clean_database()


def test_adult_summary_schema_has_no_raw_answer_fields() -> None:
    from app.schemas.adult_summaries import AdultSelfCheckSummaryItem, AdultSelfCheckSummaryResponse

    forbidden = {
        "answers",
        "raw_answers",
        "question_text_snapshot",
        "choice_text_snapshot",
        "score_breakdown",
        "scenario_attempts",
    }
    assert forbidden.isdisjoint(AdultSelfCheckSummaryItem.model_fields)
    assert forbidden.isdisjoint(AdultSelfCheckSummaryResponse.model_fields)
    assert "latest_summary" in AdultSelfCheckSummaryResponse.model_fields
    assert "recent_summaries" in AdultSelfCheckSummaryResponse.model_fields
