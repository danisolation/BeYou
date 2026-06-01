from __future__ import annotations

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
    SosAlert,
    Session as UserSession,
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
PRIVATE_MOOD_NOTE = "RAW_PRIVATE_MOOD_NOTE_FOR_ADULT_SUMMARY"
SHARED_PLAN_TEXT = "Em dễ bình tĩnh hơn khi người lớn nói chậm."


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(
            db.scalars(select(User.id).where(User.email.like("%adult-summary%@example.test")))
        )
        if not user_ids:
            return
        plan_ids = list(
            db.scalars(
                select(StudentSupportPlan.id).where(StudentSupportPlan.student_id.in_(user_ids))
            )
        )
        if plan_ids:
            db.execute(
                delete(StudentSupportPlanAdult).where(
                    StudentSupportPlanAdult.support_plan_id.in_(plan_ids)
                )
            )
            db.execute(delete(StudentSupportPlan).where(StudentSupportPlan.id.in_(plan_ids)))
        db.execute(delete(MoodCheckIn).where(MoodCheckIn.student_id.in_(user_ids)))
        db.execute(delete(SosAlert).where(SosAlert.student_id.in_(user_ids)))
        db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(user_ids)))
        db.execute(
            delete(StudentAdultLink).where(
                or_(
                    StudentAdultLink.student_id.in_(user_ids),
                    StudentAdultLink.adult_id.in_(user_ids),
                    StudentAdultLink.created_by.in_(user_ids),
                    StudentAdultLink.revoked_by.in_(user_ids),
                )
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


def _user(db: OrmSession, *, email: str, role: str, is_demo: bool = True) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=AccountStatus.ACTIVE.value,
        full_name=f"{role.title()} Adult Summary",
        school="THPT Summary" if role == UserRole.STUDENT.value else None,
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
            is_demo=student.is_demo and adult.is_demo,
        )
    )
    db.commit()


def _login(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _seed_summary_data(db: OrmSession) -> tuple[User, User, User, User]:
    student = _user(db, email="student-adult-summary@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-adult-summary@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-adult-summary@example.test", role=UserRole.PARENT.value)
    outsider = _user(db, email="outsider-adult-summary@example.test", role=UserRole.TEACHER.value)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
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

    plan = StudentSupportPlan(
        student_id=student.id,
        status=SupportPlanStatus.ACTIVE.value,
        what_helps=SHARED_PLAN_TEXT,
        what_does_not_help="Đừng hỏi dồn dập.",
        preferred_contact_method="Nhắn tin trước khi gọi.",
        safe_contact_times="Sau giờ học.",
        shareable_note="Em đồng ý để cô Bình xem phần này.",
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
    db.add(
        MoodCheckIn(
            student_id=student.id,
            mood_label="overwhelmed",
            energy_level=2,
            stress_level=5,
            context_tags=["school", "sleep"],
            private_note=PRIVATE_MOOD_NOTE,
            trend_label="Cần hỗ trợ sớm",
            supportive_message="Điều em đang cảm thấy đáng được lắng nghe.",
            suggested_next_action="Gợi ý SOS nhưng không tự động gửi.",
            suggest_support_plan=True,
            suggest_sos=True,
            is_demo=True,
        )
    )
    db.commit()
    return student, teacher, parent, outsider


def test_selected_teacher_gets_support_plan_and_mood_summary_without_private_notes(
    db: OrmSession,
    client: TestClient,
) -> None:
    student, teacher, _, _ = _seed_summary_data(db)

    _login(client, teacher.email)
    response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["id"] == str(student.id)
    assert payload["support_plan"]["shared_with_viewer"] is True
    assert payload["support_plan"]["what_helps"] == SHARED_PLAN_TEXT
    assert payload["support_plan"]["shareable_note"] == "Em đồng ý để cô Bình xem phần này."
    assert payload["mood_summary"]["latest_trend_label"] == "Cần hỗ trợ sớm"
    assert payload["mood_summary"]["recent_checkin_count"] == 1
    assert payload["mood_summary"]["high_concern_count"] == 1
    assert "đúng phạm vi học sinh đã chọn" in " ".join(payload["privacy_notes"])
    assert PRIVATE_MOOD_NOTE not in response.text

    audit_event = db.scalar(
        select(AuditEvent).where(
            AuditEvent.resource_type == "adult_support_summary",
            AuditEvent.action == "sensitive_resource_read",
        )
    )
    assert audit_event is not None
    assert audit_event.metadata_summary["support_plan_shared"] is True
    assert audit_event.metadata_summary["recent_mood_checkin_count"] == 1
    assert PRIVATE_MOOD_NOTE not in str(audit_event.metadata_summary)


def test_linked_parent_gets_mood_summary_but_not_unselected_support_plan(
    db: OrmSession,
    client: TestClient,
) -> None:
    student, _, parent, _ = _seed_summary_data(db)

    _login(client, parent.email)
    response = client.get(
        f"/api/parent/students/{student.id}/support-summary?reason_code=support_plan_context"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["support_plan"]["shared_with_viewer"] is False
    assert payload["support_plan"]["what_helps"] is None
    assert payload["mood_summary"]["latest_trend_label"] == "Cần hỗ trợ sớm"
    assert PRIVATE_MOOD_NOTE not in response.text


def test_unlinked_adult_is_denied_without_sensitive_content(
    db: OrmSession,
    client: TestClient,
) -> None:
    student, _, _, outsider = _seed_summary_data(db)

    _login(client, outsider.email)
    response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context"
    )

    assert response.status_code == 403
    assert PRIVATE_MOOD_NOTE not in response.text
    assert SHARED_PLAN_TEXT not in response.text
