from __future__ import annotations

from datetime import timedelta

import pytest
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.db.models import (
    AuditEvent,
    LinkStatus,
    MoodCheckIn,
    MoodNoteShare,
    SchoolPrivacyPolicyDefault,
    SelfCheckAttempt,
    SelfCheckAttemptAnswer,
    SelfCheckChoice,
    SelfCheckQuestion,
    SelfCheckTest,
    Session as UserSession,
    SosAlert,
    StudentAdultLink,
    StudentSupportPlan,
    StudentSupportPlanAdult,
    SupportPlanStatus,
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

PRIVATE_NOTE_MARKER = "PHASE36_PRIVATE_NOTE_SHOULD_NOT_LEAK"
RAW_ANSWER_MARKER = "PHASE36_RAW_ANSWER_SHOULD_NOT_LEAK"
ALLOWED_REASON = "support_plan_context"


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).where(User.email.like("%phase36-adult-summary%@example.test"))))
        if user_ids:
            checkin_ids = list(db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(user_ids))))
            plan_ids = list(
                db.scalars(select(StudentSupportPlan.id).where(StudentSupportPlan.student_id.in_(user_ids)))
            )
            test_ids = list(db.scalars(select(SelfCheckTest.id).where(SelfCheckTest.title.like("Phase 36 Adult%"))))
            attempt_ids = list(
                db.scalars(select(SelfCheckAttempt.id).where(SelfCheckAttempt.student_id.in_(user_ids)))
            )
            if checkin_ids:
                db.execute(delete(MoodNoteShare).where(MoodNoteShare.mood_checkin_id.in_(checkin_ids)))
                db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(checkin_ids)))
            if plan_ids:
                db.execute(delete(StudentSupportPlanAdult).where(StudentSupportPlanAdult.support_plan_id.in_(plan_ids)))
                db.execute(delete(StudentSupportPlan).where(StudentSupportPlan.id.in_(plan_ids)))
            if attempt_ids:
                db.execute(delete(SelfCheckAttemptAnswer).where(SelfCheckAttemptAnswer.attempt_id.in_(attempt_ids)))
                db.execute(delete(SelfCheckAttempt).where(SelfCheckAttempt.id.in_(attempt_ids)))
            if test_ids:
                question_ids = list(
                    db.scalars(select(SelfCheckQuestion.id).where(SelfCheckQuestion.test_id.in_(test_ids)))
                )
                if question_ids:
                    db.execute(delete(SelfCheckChoice).where(SelfCheckChoice.question_id.in_(question_ids)))
                db.execute(delete(SelfCheckQuestion).where(SelfCheckQuestion.test_id.in_(test_ids)))
                db.execute(delete(SelfCheckTest).where(SelfCheckTest.id.in_(test_ids)))
            db.execute(delete(SosAlert).where(SosAlert.student_id.in_(user_ids)))
            db.execute(
                delete(AuditEvent).where(
                    or_(
                        AuditEvent.actor_id.in_(user_ids),
                        AuditEvent.resource_id.in_([str(user_id) for user_id in user_ids]),
                    )
                )
            )
            db.execute(
                delete(StudentAdultLink).where(
                    or_(
                        StudentAdultLink.student_id.in_(user_ids),
                        StudentAdultLink.adult_id.in_(user_ids),
                        StudentAdultLink.created_by.in_(user_ids),
                    )
                )
            )
            db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
            db.execute(delete(User).where(User.id.in_(user_ids)))
        db.execute(delete(SchoolPrivacyPolicyDefault).where(SchoolPrivacyPolicyDefault.school_scope == "default"))
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


def _seed_policy(db: OrmSession, *, require_reasons: bool = True) -> None:
    db.add(
        SchoolPrivacyPolicyDefault(
            school_scope="default",
            default_in_app_reminders_enabled=False,
            default_quiet_hours_start="21:30",
            default_quiet_hours_end="06:30",
            default_timezone="Asia/Ho_Chi_Minh",
            allowed_channels=["in_app"],
            external_channels_enabled=False,
            note_sharing_enabled=True,
            reason_required_for_adult_summaries=require_reasons,
            reason_required_for_shared_mood_notes=require_reasons,
            allowed_reason_codes=[ALLOWED_REASON, "follow_up_after_checkin"],
            is_demo=True,
        )
    )


def _seed_student_teacher(db: OrmSession) -> tuple[User, User]:
    student = make_user(
        db,
        "student-phase36-adult-summary@example.test",
        UserRole.STUDENT,
        "Phase 36 Student",
        school="THPT Phase 36",
        class_name="10A1",
    )
    teacher = make_user(
        db,
        "teacher-phase36-adult-summary@example.test",
        UserRole.TEACHER,
        "Phase 36 Teacher",
    )
    seed_student_link(db, student, teacher, relationship_type=UserRole.TEACHER, created_by=teacher)
    seed_sos_alert(db, student)
    return student, teacher


def _seed_self_check_attempts(db: OrmSession, student: User) -> None:
    test = SelfCheckTest(
        title="Phase 36 Adult Self Check",
        status="published",
        is_active=True,
        is_demo=True,
    )
    db.add(test)
    db.flush()
    question = SelfCheckQuestion(test_id=test.id, text="Phase 36 private question", sort_order=1, is_demo=True)
    db.add(question)
    db.flush()
    choice = SelfCheckChoice(
        question_id=question.id,
        text=RAW_ANSWER_MARKER,
        score_value=4,
        sort_order=1,
        is_demo=True,
    )
    db.add(choice)
    db.flush()
    for index in range(12):
        recent = index < 6
        attempt = SelfCheckAttempt(
            student_id=student.id,
            test_id=test.id,
            score=4,
            state_label="Can ho tro som" if recent else "On dinh",
            supportive_headline="Tóm tắt an toàn.",
            short_comment="Không chứa câu trả lời thô.",
            advice_summary="Ưu tiên hỗ trợ nhẹ nhàng.",
            support_suggestion="Hỏi học sinh cần hỗ trợ gì.",
            positive_content="Học sinh đang tìm kiếm hỗ trợ.",
            suggested_next_action="Tiếp tục theo dõi.",
            test_title_snapshot=f"Phase 36 Attempt {index:02d}",
            test_snapshot={"redline": RAW_ANSWER_MARKER},
            is_demo=True,
            completed_at=utc_now() - timedelta(days=index if recent else 40 + index),
        )
        db.add(attempt)
        db.flush()
        db.add(
            SelfCheckAttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                choice_id=choice.id,
                question_text_snapshot="Private question",
                choice_text_snapshot=RAW_ANSWER_MARKER,
                score_value_snapshot=4,
                sort_order=1,
                is_demo=True,
            )
        )


def _seed_mood_checkins(db: OrmSession, student: User) -> None:
    for index in range(8):
        recent = index < 3
        db.add(
            MoodCheckIn(
                student_id=student.id,
                mood_label="overwhelmed" if recent else "steady",
                energy_level=2 if recent else 4,
                stress_level=5 if recent else 2,
                context_tags=["school"],
                private_note=PRIVATE_NOTE_MARKER,
                trend_label="Cần hỗ trợ sớm" if recent else "Ổn định",
                supportive_message="Điều em đang cảm thấy đáng được lắng nghe.",
                suggested_next_action="Chọn một bước hỗ trợ nhỏ.",
                suggest_support_plan=recent,
                suggest_sos=False,
                is_demo=True,
                created_at=utc_now() - timedelta(days=index if recent else 20 + index),
            )
        )


def _seed_support_plan(db: OrmSession, student: User, teacher: User) -> None:
    plan = StudentSupportPlan(
        student_id=student.id,
        status=SupportPlanStatus.ACTIVE.value,
        what_helps="Nói chậm và hỏi một câu mỗi lần.",
        what_does_not_help="Không hỏi dồn.",
        preferred_contact_method="Nhắn tin trước.",
        safe_contact_times="Sau giờ học.",
        shareable_note="Em đồng ý chia sẻ kế hoạch hỗ trợ.",
        is_demo=True,
    )
    db.add(plan)
    db.flush()
    db.add(
        StudentSupportPlanAdult(
            support_plan_id=plan.id,
            adult_id=teacher.id,
            relationship_type_snapshot=UserRole.TEACHER.value,
            adult_full_name_snapshot=teacher.full_name,
            is_demo=True,
        )
    )


def _seed_summary_graph(db: OrmSession, *, require_reasons: bool = True) -> tuple[User, User]:
    _seed_policy(db, require_reasons=require_reasons)
    student, teacher = _seed_student_teacher(db)
    _seed_self_check_attempts(db, student)
    _seed_mood_checkins(db, student)
    _seed_support_plan(db, student, teacher)
    db.commit()
    return student, teacher


def test_adult_self_check_summaries_use_sql_side_recent_limit(db: OrmSession) -> None:
    student, teacher = _seed_summary_graph(db, require_reasons=False)
    teacher_client = login_client(teacher.email)

    response = teacher_client.get(f"/api/teacher/students/{student.id}/self-check-summaries")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["recent_summaries"]) == 5
    assert payload["latest_summary"]["test_type"] == "Phase 36 Attempt 00"
    response_text = response.text
    assert "raw_answers" not in response_text
    assert RAW_ANSWER_MARKER not in response_text
    assert "private_note" not in response_text
    assert "transcript" not in response_text
    assert_aggregate_only_text(response_text)


def test_adult_support_mood_summary_uses_sql_cutoff_and_keeps_privacy(db: OrmSession) -> None:
    student, teacher = _seed_summary_graph(db)
    teacher_client = login_client(teacher.email)

    response, query_count = measure_queries(
        lambda: teacher_client.get(
            f"/api/teacher/students/{student.id}/support-summary?reason_code={ALLOWED_REASON}"
        )
    )

    assert response.status_code == 200
    payload = response.json()
    recent_checkin_count = payload["mood_summary"]["recent_checkin_count"]
    assert recent_checkin_count == 3
    assert payload["mood_summary"]["high_concern_count"] == 3
    assert payload["support_plan"]["shared_with_viewer"] is True
    assert PRIVATE_NOTE_MARKER not in response.text
    assert "private_note" not in response.text
    assert "raw_answers" not in response.text
    assert "transcript" not in response.text
    assert_aggregate_only_text(response.text)
    assert query_count <= 12

    audit_event = db.scalar(
        select(AuditEvent).where(
            AuditEvent.action == "sensitive_resource_read",
            AuditEvent.resource_type == "adult_support_summary",
        )
    )
    assert audit_event is not None
    assert audit_event.metadata_summary["recent_mood_checkin_count"] == 3
    assert PRIVATE_NOTE_MARKER not in str(audit_event.metadata_summary)


def test_adult_support_summary_reason_gate_still_blocks_before_loading_sensitive_summary(
    db: OrmSession,
) -> None:
    student, teacher = _seed_summary_graph(db)
    teacher_client = login_client(teacher.email)

    response = teacher_client.get(f"/api/teacher/students/{student.id}/support-summary")

    assert response.status_code == 428
    assert PRIVATE_NOTE_MARKER not in response.text
    assert RAW_ANSWER_MARKER not in response.text
