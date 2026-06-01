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
    PrivacyAcknowledgement,
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
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PRIVATE_SUPPORT_PLAN_TEXT"


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(
            db.scalars(select(User.id).where(User.email.like("%support-plan%@example.test")))
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
            db.execute(
                delete(AuditEvent).where(
                    AuditEvent.resource_type == "support_plan",
                    AuditEvent.resource_id.in_([str(plan_id) for plan_id in plan_ids]),
                )
            )
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
        db.execute(
            delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id.in_(user_ids))
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
        full_name=f"{role.title()} Support Plan",
        school="THPT Support Plan" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _ack(db: OrmSession, student: User) -> None:
    db.add(
        PrivacyAcknowledgement(
            user_id=student.id,
            notice_version=NOTICE_VERSION,
            is_demo=student.is_demo,
        )
    )
    db.commit()


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


def test_student_creates_updates_and_deactivates_support_plan_with_metadata_only_audit(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-support-plan@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-support-plan@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-support-plan@example.test", role=UserRole.PARENT.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)

    _login(client, student.email)
    initial_response = client.get("/api/student/support-plan")
    assert initial_response.status_code == 200
    initial_payload = initial_response.json()
    assert initial_payload["plan"] is None
    assert {adult["id"] for adult in initial_payload["available_adults"]} == {
        str(teacher.id),
        str(parent.id),
    }
    assert "không tự động được chia sẻ" in " ".join(initial_payload["privacy_notes"])

    create_response = client.put(
        "/api/student/support-plan",
        json={
            "adult_ids": [str(teacher.id)],
            "status": SupportPlanStatus.ACTIVE.value,
            "what_helps": f"Nhắc em thở chậm. {PRIVATE_MARKER}",
            "what_does_not_help": "Đừng hỏi dồn dập.",
            "preferred_contact_method": "Nhắn tin trước khi gọi.",
            "safe_contact_times": "Sau giờ học.",
            "shareable_note": "Em muốn được hỏi nhẹ nhàng.",
        },
        headers=ORIGIN_HEADERS,
    )
    assert create_response.status_code == 200
    plan = create_response.json()["plan"]
    assert plan["status"] == SupportPlanStatus.ACTIVE.value
    assert plan["what_helps"].endswith(PRIVATE_MARKER)
    assert plan["selected_adults"] == [
        {
            "id": str(teacher.id),
            "full_name": teacher.full_name,
            "relationship_type": UserRole.TEACHER.value,
            "is_demo": True,
        }
    ]

    stored_plan = db.scalar(
        select(StudentSupportPlan).where(StudentSupportPlan.student_id == student.id)
    )
    assert stored_plan is not None
    assert len(stored_plan.selected_adults) == 1

    create_audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "support_plan_created"))
    assert create_audit is not None
    assert create_audit.resource_type == "support_plan"
    assert create_audit.metadata_summary["selected_adult_count"] == 1
    assert create_audit.metadata_summary["selected_relationship_types"] == [UserRole.TEACHER.value]
    assert create_audit.metadata_summary["has_what_helps"] is True
    assert PRIVATE_MARKER not in str(create_audit.metadata_summary)
    assert "what_helps" not in create_audit.metadata_summary

    deactivate_response = client.put(
        "/api/student/support-plan",
        json={
            "adult_ids": [],
            "status": SupportPlanStatus.DEACTIVATED.value,
            "what_helps": None,
            "what_does_not_help": None,
            "preferred_contact_method": None,
            "safe_contact_times": None,
            "shareable_note": None,
        },
        headers=ORIGIN_HEADERS,
    )
    assert deactivate_response.status_code == 200
    deactivated_plan = deactivate_response.json()["plan"]
    assert deactivated_plan["status"] == SupportPlanStatus.DEACTIVATED.value
    assert deactivated_plan["selected_adults"] == []
    assert deactivated_plan["deactivated_at"] is not None

    update_audit = db.scalar(select(AuditEvent).where(AuditEvent.action == "support_plan_updated"))
    assert update_audit is not None
    assert update_audit.metadata_summary["status"] == SupportPlanStatus.DEACTIVATED.value
    assert update_audit.metadata_summary["selected_adult_count"] == 0


def test_support_plan_rejects_unlinked_adults(db: OrmSession, client: TestClient) -> None:
    student = _user(
        db, email="student-support-plan-invalid@example.test", role=UserRole.STUDENT.value
    )
    unrelated_adult = _user(
        db, email="teacher-unlinked-support-plan@example.test", role=UserRole.TEACHER.value
    )
    _ack(db, student)

    _login(client, student.email)
    response = client.put(
        "/api/student/support-plan",
        json={
            "adult_ids": [str(unrelated_adult.id)],
            "status": SupportPlanStatus.ACTIVE.value,
        },
        headers=ORIGIN_HEADERS,
    )

    assert response.status_code == 422
    assert "đang được liên kết" in response.text
    assert (
        db.scalar(select(StudentSupportPlan).where(StudentSupportPlan.student_id == student.id))
        is None
    )


def test_support_plan_is_student_only_and_privacy_ack_gated(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(
        db, email="student-support-plan-privacy@example.test", role=UserRole.STUDENT.value
    )
    teacher = _user(
        db, email="teacher-support-plan-denied@example.test", role=UserRole.TEACHER.value
    )

    anonymous_response = client.get("/api/student/support-plan")
    assert anonymous_response.status_code == 401

    _login(client, student.email)
    privacy_response = client.get("/api/student/support-plan")
    assert privacy_response.status_code == 409
    assert privacy_response.json()["detail"]["code"] == "privacy_ack_required"

    client.cookies.clear()
    _login(client, teacher.email)
    denied_response = client.get("/api/student/support-plan")
    assert denied_response.status_code == 403
