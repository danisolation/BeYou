from __future__ import annotations

import uuid
from collections.abc import Mapping

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    LinkStatus,
    MoodCheckIn,
    MoodNoteShare,
    SchoolPrivacyPolicyDefault,
    Session as UserSession,
    SosAlert,
    StudentAdultLink,
    StudentSupportPlan,
    StudentSupportPlanAdult,
    SupportPlanStatus,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PHASE24_PRIVATE_SHARED_NOTE"
SUPPORT_PLAN_MARKER = "RAW_PHASE24_SUPPORT_PLAN_DETAIL"
ALLOWED_REASON = "support_plan_context"
FORBIDDEN_AUDIT_KEYS = {
    "private_note",
    "student_summary",
    "shared_note_text",
    "reason_detail",
    "reason_details",
    "access_reason_text",
    "email",
    "full_name",
    "what_helps",
}


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(
            db.scalars(select(User.id).where(User.email.like("%phase24-reason%@example.test")))
        )
        if not user_ids:
            db.execute(
                delete(SchoolPrivacyPolicyDefault).where(
                    SchoolPrivacyPolicyDefault.school_scope == "default"
                )
            )
            db.commit()
            return
        checkin_ids = list(
            db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(user_ids)))
        )
        plan_ids = list(
            db.scalars(
                select(StudentSupportPlan.id).where(StudentSupportPlan.student_id.in_(user_ids))
            )
        )
        if checkin_ids:
            db.execute(delete(MoodNoteShare).where(MoodNoteShare.mood_checkin_id.in_(checkin_ids)))
            db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(checkin_ids)))
        db.execute(delete(SosAlert).where(SosAlert.student_id.in_(user_ids)))
        if plan_ids:
            db.execute(
                delete(StudentSupportPlanAdult).where(
                    StudentSupportPlanAdult.support_plan_id.in_(plan_ids)
                )
            )
            db.execute(delete(StudentSupportPlan).where(StudentSupportPlan.id.in_(plan_ids)))
        db.execute(
            delete(AuditEvent).where(
                or_(
                    AuditEvent.actor_id.in_(user_ids),
                    AuditEvent.resource_type.in_(["adult_support_summary", "shared_mood_note"]),
                    AuditEvent.action == "adult_access_reason_checked",
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
        db.execute(
            delete(SchoolPrivacyPolicyDefault).where(
                SchoolPrivacyPolicyDefault.school_scope == "default"
            )
        )
        db.execute(delete(UserSession).where(UserSession.user_id.in_(user_ids)))
        db.execute(delete(User).where(User.id.in_(user_ids)))
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


def _user(db: OrmSession, *, email: str, role: str) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Phase24 Reason",
        school="THPT Phase24" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=True,
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
    existing_sos = db.scalar(select(SosAlert.id).where(SosAlert.student_id == student.id).limit(1))
    if existing_sos is None:
        db.add(
            SosAlert(
                student_id=student.id,
                student_full_name_snapshot=student.full_name,
                student_school_snapshot=student.school,
                student_class_name_snapshot=student.class_name,
                severity="support",
                source="test",
                current_status="sent",
                is_demo=True,
            )
        )
    db.commit()


def _login(client: TestClient, email: str) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


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
    db.commit()


def _seed_summary_data(db: OrmSession) -> tuple[User, User, User]:
    student = _user(
        db, email=f"student-{uuid.uuid4()}-phase24-reason@example.test", role=UserRole.STUDENT.value
    )
    teacher = _user(
        db, email=f"teacher-{uuid.uuid4()}-phase24-reason@example.test", role=UserRole.TEACHER.value
    )
    outsider = _user(
        db,
        email=f"outsider-{uuid.uuid4()}-phase24-reason@example.test",
        role=UserRole.TEACHER.value,
    )
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    plan = StudentSupportPlan(
        student_id=student.id,
        status=SupportPlanStatus.ACTIVE.value,
        what_helps=SUPPORT_PLAN_MARKER,
        what_does_not_help="Không hỏi dồn.",
        preferred_contact_method="Nhắn tin trước.",
        safe_contact_times="Sau giờ học.",
        shareable_note="Em muốn người lớn biết cách hỗ trợ.",
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
    checkin = MoodCheckIn(
        student_id=student.id,
        mood_label="overwhelmed",
        energy_level=2,
        stress_level=5,
        context_tags=["school"],
        private_note=PRIVATE_MARKER,
        trend_label="Cần hỗ trợ sớm",
        supportive_message="Điều em đang cảm thấy đáng được lắng nghe.",
        suggested_next_action="Chọn một bước hỗ trợ nhỏ.",
        suggest_support_plan=True,
        suggest_sos=False,
        is_demo=True,
    )
    db.add(checkin)
    db.flush()
    db.add(
        MoodNoteShare(
            mood_checkin_id=checkin.id,
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type_snapshot=UserRole.TEACHER.value,
            share_scope="private_note",
            is_demo=True,
        )
    )
    db.commit()
    return student, teacher, outsider


def _assert_no_forbidden_audit(value: object) -> None:
    serialized = str(value)
    assert PRIVATE_MARKER not in serialized
    assert SUPPORT_PLAN_MARKER not in serialized
    if isinstance(value, Mapping):
        for key, nested_value in value.items():
            assert str(key).lower() not in FORBIDDEN_AUDIT_KEYS
            _assert_no_forbidden_audit(nested_value)
    elif isinstance(value, list):
        for nested_value in value:
            _assert_no_forbidden_audit(nested_value)


def test_missing_reason_blocks_linked_adult_and_audits_without_content(
    db: OrmSession,
    client: TestClient,
) -> None:
    _seed_policy(db)
    student, teacher, _ = _seed_summary_data(db)

    _login(client, teacher.email)
    response = client.get(f"/api/teacher/students/{student.id}/support-summary")

    assert response.status_code == 428
    detail = response.json()["detail"]
    assert detail["code"] == "access_reason_required"
    assert {reason["code"] for reason in detail["allowed_reasons"]} == {
        ALLOWED_REASON,
        "follow_up_after_checkin",
    }
    assert PRIVATE_MARKER not in response.text
    assert SUPPORT_PLAN_MARKER not in response.text

    events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action == "adult_access_reason_checked"))
    )
    assert {event.status for event in events} == {"missing"}
    assert {event.resource_type for event in events} == {
        "adult_support_summary",
        "shared_mood_note",
    }
    for event in events:
        assert event.reason is None
        assert event.metadata_summary["reason_required"] is True
        _assert_no_forbidden_audit(event.metadata_summary)


def test_allowed_reason_returns_summary_shared_notes_and_metadata_only_audit(
    db: OrmSession,
    client: TestClient,
) -> None:
    _seed_policy(db)
    student, teacher, _ = _seed_summary_data(db)

    _login(client, teacher.email)
    response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code={ALLOWED_REASON}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_reason"]["required"] is True
    assert payload["access_reason"]["reason_code"] == ALLOWED_REASON
    assert payload["support_plan"]["what_helps"] == SUPPORT_PLAN_MARKER
    assert payload["shared_mood_notes"][0]["content"] == PRIVATE_MARKER

    reason_events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action == "adult_access_reason_checked"))
    )
    assert {event.status for event in reason_events} == {"allowed"}
    assert {event.resource_type for event in reason_events} == {
        "adult_support_summary",
        "shared_mood_note",
    }
    for event in reason_events:
        assert event.reason == ALLOWED_REASON
        assert event.metadata_summary["reason_code"] == ALLOWED_REASON
        _assert_no_forbidden_audit(event.metadata_summary)

    summary_event = db.scalar(
        select(AuditEvent).where(
            AuditEvent.resource_type == "adult_support_summary",
            AuditEvent.action == "sensitive_resource_read",
        )
    )
    assert summary_event is not None
    assert summary_event.reason == ALLOWED_REASON
    assert summary_event.metadata_summary["access_reason_code"] == ALLOWED_REASON
    _assert_no_forbidden_audit(summary_event.metadata_summary)

    share_read_event = db.scalar(
        select(AuditEvent).where(AuditEvent.action == "mood_note_share_read")
    )
    assert share_read_event is not None
    assert share_read_event.metadata_summary["access_reason_code"] == ALLOWED_REASON
    _assert_no_forbidden_audit(share_read_event.metadata_summary)


def test_invalid_reason_is_denied_and_does_not_return_sensitive_content(
    db: OrmSession,
    client: TestClient,
) -> None:
    _seed_policy(db)
    student, teacher, _ = _seed_summary_data(db)

    _login(client, teacher.email)
    response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code=curiosity"
    )

    assert response.status_code == 422
    assert PRIVATE_MARKER not in response.text
    assert SUPPORT_PLAN_MARKER not in response.text
    events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action == "adult_access_reason_checked"))
    )
    assert {event.status for event in events} == {"denied"}
    for event in events:
        assert event.reason is None
        assert "curiosity" not in str(event.metadata_summary)
        _assert_no_forbidden_audit(event.metadata_summary)


def test_reason_submission_does_not_bypass_active_relationship(
    db: OrmSession,
    client: TestClient,
) -> None:
    _seed_policy(db)
    student, _, outsider = _seed_summary_data(db)

    _login(client, outsider.email)
    response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code={ALLOWED_REASON}"
    )

    assert response.status_code == 403
    assert PRIVATE_MARKER not in response.text
    assert SUPPORT_PLAN_MARKER not in response.text
    event = db.scalar(select(AuditEvent).where(AuditEvent.action == "adult_access_reason_checked"))
    assert event is not None
    assert event.status == "denied"
    assert event.reason == ALLOWED_REASON
    assert event.metadata_summary["decision"] == "authorization_denied"
    _assert_no_forbidden_audit(event.metadata_summary)


def test_policy_can_disable_reason_prompt_for_existing_support_summary_flow(
    db: OrmSession,
    client: TestClient,
) -> None:
    _seed_policy(db, require_reasons=False)
    student, teacher, _ = _seed_summary_data(db)

    _login(client, teacher.email)
    response = client.get(f"/api/teacher/students/{student.id}/support-summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_reason"]["required"] is False
    assert payload["access_reason"]["reason_code"] is None
    assert payload["support_plan"]["what_helps"] == SUPPORT_PLAN_MARKER
    assert payload["shared_mood_notes"][0]["content"] == PRIVATE_MARKER
    assert (
        db.scalar(select(AuditEvent).where(AuditEvent.action == "adult_access_reason_checked"))
        is None
    )
