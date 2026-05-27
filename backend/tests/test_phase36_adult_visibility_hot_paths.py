from __future__ import annotations

from datetime import timedelta

import pytest
from sqlalchemy import delete
from sqlalchemy.orm import Session as OrmSession

from app.db.models import (
    AuditEvent,
    LinkStatus,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    Session as UserSession,
    SosAlert,
    SosStatusEvent,
    StudentAdultLink,
    User,
    UserRole,
    utc_now,
)
from app.db.session import SessionLocal

from phase36_hot_path_utils import (
    assert_aggregate_only_text,
    login_client,
    make_user,
    measure_queries,
    seed_sos_alert,
    seed_student_link,
)


def _clean_database() -> None:
    with SessionLocal() as db:
        for model in (
            SosStatusEvent,
            SosAlert,
            SelfCheckAttemptAnswer,
            SelfCheckAttempt,
            SelfCheckChoice,
            SelfCheckQuestion,
            SelfCheckTest,
            AuditEvent,
            UserSession,
            StudentAdultLink,
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


def _visible_students(db: OrmSession, *, admin: User, teacher: User, parent: User) -> list[User]:
    students: list[User] = []
    for index in range(12):
        student = make_user(
            db,
            f"phase36-visible-{index:03d}@example.test",
            UserRole.STUDENT,
            f"Phase 36 Visible {index:03d}",
            school="THPT Phase 36",
            class_name="10A1",
        )
        seed_student_link(db, student, teacher, relationship_type=UserRole.TEACHER, created_by=admin)
        seed_student_link(db, student, parent, relationship_type=UserRole.PARENT, created_by=admin)
        seed_sos_alert(db, student)
        students.append(student)
    return students


def _hidden_students(db: OrmSession, *, admin: User, teacher: User, parent: User) -> list[User]:
    no_sos = make_user(
        db,
        "phase36-no-sos@example.test",
        UserRole.STUDENT,
        "Phase 36 No SOS",
        school="THPT Phase 36",
        class_name="10A1",
    )
    seed_student_link(db, no_sos, teacher, relationship_type=UserRole.TEACHER, created_by=admin)
    seed_student_link(db, no_sos, parent, relationship_type=UserRole.PARENT, created_by=admin)

    revoked = make_user(
        db,
        "phase36-revoked@example.test",
        UserRole.STUDENT,
        "Phase 36 Revoked",
        school="THPT Phase 36",
        class_name="10A1",
    )
    seed_student_link(
        db,
        revoked,
        teacher,
        relationship_type=UserRole.TEACHER,
        status=LinkStatus.REVOKED,
        created_by=admin,
    )
    seed_student_link(
        db,
        revoked,
        parent,
        relationship_type=UserRole.PARENT,
        status=LinkStatus.REVOKED,
        created_by=admin,
    )
    seed_sos_alert(db, revoked)

    wrong_teacher = make_user(
        db,
        "phase36-wrong-teacher@example.test",
        UserRole.STUDENT,
        "Phase 36 Wrong Teacher",
        school="THPT Phase 36",
        class_name="10A1",
    )
    seed_student_link(db, wrong_teacher, teacher, relationship_type=UserRole.PARENT, created_by=admin)
    seed_sos_alert(db, wrong_teacher)

    wrong_parent = make_user(
        db,
        "phase36-wrong-parent@example.test",
        UserRole.STUDENT,
        "Phase 36 Wrong Parent",
        school="THPT Phase 36",
        class_name="10A1",
    )
    seed_student_link(db, wrong_parent, parent, relationship_type=UserRole.TEACHER, created_by=admin)
    seed_sos_alert(db, wrong_parent)
    return [no_sos, revoked, wrong_teacher, wrong_parent]


def _seed_self_check(db: OrmSession, student: User, index: int) -> None:
    test = SelfCheckTest(
        title=f"Phase 36 Self Check {index:03d}",
        status="published",
        is_active=True,
        is_demo=True,
    )
    db.add(test)
    db.flush()
    attempt = SelfCheckAttempt(
        student_id=student.id,
        test_id=test.id,
        score=4,
        state_label="Can ho tro som",
        supportive_headline="Cần được hỗ trợ sớm.",
        short_comment="Tóm tắt an toàn.",
        advice_summary="Ưu tiên ở cạnh người lớn tin cậy.",
        support_suggestion="Hỏi học sinh cần hỗ trợ gì ngay.",
        positive_content="Tìm kiếm hỗ trợ là phù hợp.",
        suggested_next_action="Tiếp tục theo dõi hỗ trợ.",
        test_title_snapshot=f"Phase 36 Self Check {index:03d}",
        test_snapshot={"kind": "aggregate"},
        is_demo=True,
        completed_at=utc_now() - timedelta(minutes=index),
    )
    db.add(attempt)
    db.flush()


def _seed_status_event(db: OrmSession, alert: SosAlert, student: User) -> None:
    db.add(
        SosStatusEvent(
            alert_id=alert.id,
            actor_id=student.id,
            actor_role=UserRole.STUDENT.value,
            previous_status=None,
            new_status=alert.current_status,
            note="safe status event",
            is_demo=True,
        )
    )


def _seed_adult_visibility_graph(db: OrmSession) -> tuple[User, User, User, User, list[User], list[User]]:
    admin = make_user(db, "phase36-visibility-admin@example.test", UserRole.ADMIN, "Phase 36 Admin")
    teacher = make_user(db, "phase36-visibility-teacher@example.test", UserRole.TEACHER, "Phase 36 Teacher")
    parent = make_user(db, "phase36-visibility-parent@example.test", UserRole.PARENT, "Phase 36 Parent")
    outsider = make_user(db, "phase36-visibility-outsider@example.test", UserRole.TEACHER, "Phase 36 Outsider")
    visible = _visible_students(db, admin=admin, teacher=teacher, parent=parent)
    hidden = _hidden_students(db, admin=admin, teacher=teacher, parent=parent)
    db.commit()
    return admin, teacher, parent, outsider, visible, hidden


def test_teacher_parent_students_batch_sos_visibility_without_leaks(db: OrmSession) -> None:
    _, teacher, parent, outsider, visible, hidden = _seed_adult_visibility_graph(db)
    teacher_client = login_client(teacher.email)
    parent_client = login_client(parent.email)
    outsider_client = login_client(outsider.email)

    teacher_response, teacher_queries = measure_queries(lambda: teacher_client.get("/api/teacher/students"))
    parent_response, parent_queries = measure_queries(lambda: parent_client.get("/api/parent/students"))

    assert teacher_response.status_code == 200
    assert parent_response.status_code == 200
    visible_ids = {str(student.id) for student in visible}
    hidden_ids = {str(student.id) for student in hidden}
    assert {row["id"] for row in teacher_response.json()} == visible_ids
    assert {row["id"] for row in parent_response.json()} == visible_ids
    assert hidden_ids.isdisjoint({row["id"] for row in teacher_response.json()})
    assert hidden_ids.isdisjoint({row["id"] for row in parent_response.json()})
    assert teacher_queries <= 8
    assert parent_queries <= 8

    outsider_response = outsider_client.get("/api/teacher/students")
    assert outsider_response.status_code == 200
    assert outsider_response.json() == []


def test_support_overview_batches_latest_signals_and_keeps_audit_metadata_only(db: OrmSession) -> None:
    _, teacher, _, _, visible, hidden = _seed_adult_visibility_graph(db)
    for index, student in enumerate(visible):
        _seed_self_check(db, student, index)
        alert = seed_sos_alert(db, student)
        _seed_status_event(db, alert, student)
    db.commit()

    teacher_client = login_client(teacher.email)
    response, query_count = measure_queries(lambda: teacher_client.get("/api/teacher/support-overview"))

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 12
    assert {row["student"]["id"] for row in payload} == {str(student.id) for student in visible}
    assert {str(student.id) for student in hidden}.isdisjoint({row["student"]["id"] for row in payload})
    response_text = response.text
    assert "raw_answers" not in response_text
    assert "private_note" not in response_text
    assert "transcript" not in response_text
    assert "access_token" not in response_text
    assert_aggregate_only_text(response_text)
    assert query_count <= 14
