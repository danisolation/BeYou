from __future__ import annotations

import uuid
from collections.abc import Mapping

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    InAppNotification,
    LinkStatus,
    MoodCheckIn,
    MoodNoteShare,
    PrivacyAcknowledgement,
    Session as UserSession,
    SosAlert,
    StudentAdultLink,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.services.privacy import NOTICE_VERSION

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PHASE23_PRIVATE_MOOD_NOTE"
SUMMARY_MARKER = "RAW_PHASE23_STUDENT_WRITTEN_SUMMARY"
FORBIDDEN_AUDIT_KEYS = {
    "private_note",
    "student_summary",
    "shared_note_text",
    "reason_detail",
    "email",
    "full_name",
}


def _clean_database() -> None:
    with SessionLocal() as db:
        user_ids = list(db.scalars(select(User.id).where(User.email.like("%phase23-share%@example.test"))))
        if not user_ids:
            return
        checkin_ids = list(db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(user_ids))))
        db.execute(
            delete(MoodNoteShare).where(
                or_(
                    MoodNoteShare.student_id.in_(user_ids),
                    MoodNoteShare.adult_id.in_(user_ids),
                    MoodNoteShare.mood_checkin_id.in_(checkin_ids or [uuid.uuid4()]),
                )
            )
        )
        if checkin_ids:
            db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(checkin_ids)))
        db.execute(delete(SosAlert).where(SosAlert.student_id.in_(user_ids)))
        db.execute(
            delete(AuditEvent).where(
                or_(
                    AuditEvent.actor_id.in_(user_ids),
                    AuditEvent.resource_type.in_(
                        ["mood_note_share", "shared_mood_note", "adult_support_summary"]
                    ),
                )
            )
        )
        db.execute(delete(PrivacyAcknowledgement).where(PrivacyAcknowledgement.user_id.in_(user_ids)))
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


def _user(
    db: OrmSession,
    *,
    email: str,
    role: str,
    status: str = AccountStatus.ACTIVE.value,
    is_demo: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        status=status,
        full_name=f"{role.title()} Phase23 Share",
        school="THPT Phase23" if role == UserRole.STUDENT.value else None,
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


def _login(client: TestClient, email: str) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": PASSWORD},
        headers=ORIGIN_HEADERS,
    )
    assert response.status_code == 200


def _link(
    db: OrmSession,
    *,
    student: User,
    adult: User,
    relationship_type: str,
    status_value: str = LinkStatus.ACTIVE.value,
) -> StudentAdultLink:
    link = StudentAdultLink(
        student_id=student.id,
        adult_id=adult.id,
        relationship_type=relationship_type,
        status=status_value,
        created_by=adult.id,
        revoked_by=adult.id if status_value == LinkStatus.REVOKED.value else None,
        is_demo=student.is_demo and adult.is_demo,
    )
    db.add(link)
    if status_value == LinkStatus.ACTIVE.value and relationship_type in {UserRole.TEACHER.value, UserRole.PARENT.value}:
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
                    is_demo=student.is_demo,
                )
            )
    db.commit()
    db.refresh(link)
    return link


def _checkin(db: OrmSession, *, student: User, private_note: str | None) -> MoodCheckIn:
    checkin = MoodCheckIn(
        student_id=student.id,
        mood_label="overwhelmed" if private_note else "steady",
        energy_level=2 if private_note else 4,
        stress_level=5 if private_note else 1,
        context_tags=["school"],
        private_note=private_note,
        trend_label="Cần hỗ trợ sớm" if private_note else "Ổn định",
        supportive_message="Điều em đang cảm thấy đáng được lắng nghe.",
        suggested_next_action="Chọn một bước hỗ trợ nhỏ.",
        suggest_support_plan=bool(private_note),
        suggest_sos=False,
        is_demo=student.is_demo,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


def _share(
    client: TestClient,
    checkin_id: uuid.UUID,
    adult_ids: list[uuid.UUID],
    *,
    share_scope: str = "private_note",
    student_summary: str | None = None,
):
    return client.post(
        f"/api/student/mood-check-ins/{checkin_id}/shares",
        json={
            "adult_ids": [str(adult_id) for adult_id in adult_ids],
            "share_scope": share_scope,
            "student_summary": student_summary,
        },
        headers=ORIGIN_HEADERS,
    )


def _assert_no_forbidden_audit(value: object) -> None:
    serialized = str(value)
    assert PRIVATE_MARKER not in serialized
    assert SUMMARY_MARKER not in serialized
    if isinstance(value, Mapping):
        for key, nested_value in value.items():
            assert str(key).lower() not in FORBIDDEN_AUDIT_KEYS
            _assert_no_forbidden_audit(nested_value)
    elif isinstance(value, list):
        for nested_value in value:
            _assert_no_forbidden_audit(nested_value)


def test_student_shares_private_note_with_active_linked_adults(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-private-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-private-phase23-share@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-private-phase23-share@example.test", role=UserRole.PARENT.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    checkin = _checkin(db, student=student, private_note=f"Em cần nói riêng. {PRIVATE_MARKER}")

    _login(client, student.email)
    options_response = client.get("/api/student/mood-check-ins/share-options")
    assert options_response.status_code == 200
    options_payload = options_response.json()
    assert {adult["id"] for adult in options_payload["available_adults"]} == {
        str(teacher.id),
        str(parent.id),
    }
    assert "email" not in str(options_payload["available_adults"])

    response = _share(client, checkin.id, [teacher.id, parent.id])

    assert response.status_code == 200
    payload = response.json()
    assert payload["mood_checkin_id"] == str(checkin.id)
    assert payload["shareable"] is True
    assert payload["can_share_private_note"] is True
    assert {share["adult_id"] for share in payload["active_shares"]} == {
        str(teacher.id),
        str(parent.id),
    }
    assert {share["share_scope"] for share in payload["active_shares"]} == {"private_note"}
    assert all(share["has_private_note"] for share in payload["active_shares"])
    assert "email" not in str(payload["active_shares"])

    history_response = client.get("/api/student/mood-check-ins/history")
    assert history_response.status_code == 200
    history_item = history_response.json()["items"][0]
    assert history_item["shareable"] is True
    assert len(history_item["active_shares"]) == 2

    audit_events = list(
        db.scalars(select(AuditEvent).where(AuditEvent.action.in_(["mood_note_share_created"])))
    )
    assert len(audit_events) == 2
    for event in audit_events:
        assert event.resource_type == "mood_note_share"
        assert event.reason == "student_consented_share"
        assert event.metadata_summary["selected_adult_count"] == 2
        assert event.metadata_summary["has_private_note"] is True
        _assert_no_forbidden_audit(event.metadata_summary)


def test_student_summary_scope_requires_student_written_summary_without_private_note(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-summary-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-summary-phase23-share@example.test", role=UserRole.TEACHER.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    checkin = _checkin(db, student=student, private_note=None)

    _login(client, student.email)
    blank_response = _share(
        client,
        checkin.id,
        [teacher.id],
        share_scope="student_summary",
        student_summary="   ",
    )
    assert blank_response.status_code == 422

    response = _share(
        client,
        checkin.id,
        [teacher.id],
        share_scope="student_summary",
        student_summary=f"Em chỉ muốn chia sẻ phần em tự viết. {SUMMARY_MARKER}",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["shareable"] is True
    assert payload["can_share_private_note"] is False
    assert payload["active_shares"][0]["share_scope"] == "student_summary"
    assert payload["active_shares"][0]["has_student_summary"] is True

    _login(client, teacher.email)
    adult_response = client.get(f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert adult_response.status_code == 200
    adult_payload = adult_response.json()
    assert adult_payload["shared_mood_notes"][0]["content"] == (
        f"Em chỉ muốn chia sẻ phần em tự viết. {SUMMARY_MARKER}"
    )
    assert adult_payload["shared_mood_notes"][0]["share_scope"] == "student_summary"
    assert "private_note" not in adult_response.text


def test_rejects_unowned_empty_or_stale_adult_shares(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-reject-phase23-share@example.test", role=UserRole.STUDENT.value)
    other_student = _user(db, email="other-student-reject-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-reject-phase23-share@example.test", role=UserRole.TEACHER.value)
    unlinked_parent = _user(db, email="unlinked-parent-reject-phase23-share@example.test", role=UserRole.PARENT.value)
    revoked_parent = _user(db, email="revoked-parent-reject-phase23-share@example.test", role=UserRole.PARENT.value)
    disabled_teacher = _user(
        db,
        email="disabled-teacher-reject-phase23-share@example.test",
        role=UserRole.TEACHER.value,
        status=AccountStatus.DISABLED.value,
    )
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(
        db,
        student=student,
        adult=revoked_parent,
        relationship_type=UserRole.PARENT.value,
        status_value=LinkStatus.REVOKED.value,
    )
    _link(db, student=student, adult=disabled_teacher, relationship_type=UserRole.TEACHER.value)
    private_checkin = _checkin(db, student=student, private_note=f"Riêng tư. {PRIVATE_MARKER}")
    no_note_checkin = _checkin(db, student=student, private_note=None)
    other_checkin = _checkin(db, student=other_student, private_note=f"Của bạn khác. {PRIVATE_MARKER}")

    _login(client, student.email)

    assert _share(client, other_checkin.id, [teacher.id]).status_code == 404
    assert _share(client, no_note_checkin.id, [teacher.id], share_scope="private_note").status_code == 422
    assert _share(client, private_checkin.id, []).status_code == 422
    assert _share(client, private_checkin.id, [unlinked_parent.id]).status_code == 422
    assert _share(client, private_checkin.id, [revoked_parent.id]).status_code == 422
    assert _share(client, private_checkin.id, [disabled_teacher.id]).status_code == 422
    assert db.scalar(select(func.count()).select_from(MoodNoteShare)) == 0


def test_reshare_updates_active_grant_idempotently(db: OrmSession, client: TestClient) -> None:
    student = _user(db, email="student-idempotent-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-idempotent-phase23-share@example.test", role=UserRole.TEACHER.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    checkin = _checkin(db, student=student, private_note=f"Ghi chú riêng. {PRIVATE_MARKER}")

    _login(client, student.email)
    first_response = _share(client, checkin.id, [teacher.id])
    assert first_response.status_code == 200
    first_share_id = first_response.json()["active_shares"][0]["id"]

    second_response = _share(
        client,
        checkin.id,
        [teacher.id],
        share_scope="student_summary",
        student_summary=f"Cập nhật sang tóm tắt. {SUMMARY_MARKER}",
    )
    assert second_response.status_code == 200
    active_shares = second_response.json()["active_shares"]
    assert len(active_shares) == 1
    assert active_shares[0]["id"] == first_share_id
    assert active_shares[0]["share_scope"] == "student_summary"
    assert (
        db.scalar(
            select(func.count()).select_from(MoodNoteShare).where(
                MoodNoteShare.mood_checkin_id == checkin.id,
                MoodNoteShare.adult_id == teacher.id,
                MoodNoteShare.revoked_at.is_(None),
            )
        )
        == 1
    )
    updated_events = list(db.scalars(select(AuditEvent).where(AuditEvent.action == "mood_note_share_updated")))
    assert len(updated_events) == 1
    _assert_no_forbidden_audit(updated_events[0].metadata_summary)


def test_adult_support_summary_requires_relationship_and_active_grant(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-adult-read-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-adult-read-phase23-share@example.test", role=UserRole.TEACHER.value)
    relationship_only_teacher = _user(
        db,
        email="relationship-only-teacher-adult-read-phase23-share@example.test",
        role=UserRole.TEACHER.value,
    )
    parent = _user(db, email="parent-adult-read-phase23-share@example.test", role=UserRole.PARENT.value)
    outsider = _user(db, email="outsider-adult-read-phase23-share@example.test", role=UserRole.TEACHER.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=relationship_only_teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    checkin = _checkin(db, student=student, private_note=f"Chỉ giáo viên được chọn thấy. {PRIVATE_MARKER}")

    _login(client, student.email)
    share_response = _share(client, checkin.id, [teacher.id])
    assert share_response.status_code == 200

    _login(client, teacher.email)
    teacher_response = client.get(f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert teacher_response.status_code == 200
    assert teacher_response.json()["shared_mood_notes"][0]["content"].endswith(PRIVATE_MARKER)

    _login(client, relationship_only_teacher.email)
    relationship_only_response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context"
    )
    assert relationship_only_response.status_code == 200
    assert relationship_only_response.json()["shared_mood_notes"] == []
    assert PRIVATE_MARKER not in relationship_only_response.text

    _login(client, parent.email)
    parent_response = client.get(f"/api/parent/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert parent_response.status_code == 200
    assert parent_response.json()["shared_mood_notes"] == []
    assert PRIVATE_MARKER not in parent_response.text

    _login(client, outsider.email)
    outsider_response = client.get(
        f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context"
    )
    assert outsider_response.status_code == 403
    assert PRIVATE_MARKER not in outsider_response.text


def test_adult_shared_note_read_rejects_inconsistent_cross_student_share(
    db: OrmSession,
    client: TestClient,
) -> None:
    student = _user(db, email="student-consistency-phase23-share@example.test", role=UserRole.STUDENT.value)
    other_student = _user(
        db,
        email="other-student-consistency-phase23-share@example.test",
        role=UserRole.STUDENT.value,
    )
    teacher = _user(db, email="teacher-consistency-phase23-share@example.test", role=UserRole.TEACHER.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    other_checkin = _checkin(
        db,
        student=other_student,
        private_note=f"Không thuộc học sinh được mở. {PRIVATE_MARKER}",
    )
    db.add(
        MoodNoteShare(
            mood_checkin_id=other_checkin.id,
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type_snapshot=UserRole.TEACHER.value,
            share_scope="private_note",
            is_demo=True,
        )
    )
    db.commit()

    _login(client, teacher.email)
    response = client.get(f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context")

    assert response.status_code == 200
    assert response.json()["shared_mood_notes"] == []
    assert PRIVATE_MARKER not in response.text


def test_revoked_share_disappears_immediately(db: OrmSession, client: TestClient) -> None:
    student = _user(db, email="student-revoke-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-revoke-phase23-share@example.test", role=UserRole.TEACHER.value)
    parent = _user(db, email="parent-revoke-phase23-share@example.test", role=UserRole.PARENT.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    _link(db, student=student, adult=parent, relationship_type=UserRole.PARENT.value)
    checkin = _checkin(db, student=student, private_note=f"Nội dung có thể thu hồi. {PRIVATE_MARKER}")

    _login(client, student.email)
    share_response = _share(client, checkin.id, [teacher.id, parent.id])
    assert share_response.status_code == 200

    revoke_one_response = client.delete(
        f"/api/student/mood-check-ins/{checkin.id}/shares/{teacher.id}",
        headers=ORIGIN_HEADERS,
    )
    assert revoke_one_response.status_code == 200
    assert revoke_one_response.json()["revoked_count"] == 1
    assert {share["adult_id"] for share in revoke_one_response.json()["active_shares"]} == {str(parent.id)}

    _login(client, teacher.email)
    teacher_response = client.get(f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert teacher_response.status_code == 200
    assert teacher_response.json()["shared_mood_notes"] == []
    assert PRIVATE_MARKER not in teacher_response.text

    _login(client, student.email)
    revoke_all_response = client.delete(
        f"/api/student/mood-check-ins/{checkin.id}/shares",
        headers=ORIGIN_HEADERS,
    )
    assert revoke_all_response.status_code == 200
    assert revoke_all_response.json()["revoked_count"] == 1
    assert revoke_all_response.json()["active_shares"] == []

    revoked_shares = list(db.scalars(select(MoodNoteShare).where(MoodNoteShare.mood_checkin_id == checkin.id)))
    assert len(revoked_shares) == 2
    assert all(share.revoked_at is not None for share in revoked_shares)
    assert all(share.revoked_by_id == student.id for share in revoked_shares)

    _login(client, parent.email)
    parent_response = client.get(f"/api/parent/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert parent_response.status_code == 200
    assert parent_response.json()["shared_mood_notes"] == []
    assert PRIVATE_MARKER not in parent_response.text


def test_phase23_audit_and_side_effect_invariants(db: OrmSession, client: TestClient) -> None:
    student = _user(db, email="student-invariants-phase23-share@example.test", role=UserRole.STUDENT.value)
    teacher = _user(db, email="teacher-invariants-phase23-share@example.test", role=UserRole.TEACHER.value)
    _ack(db, student)
    _link(db, student=student, adult=teacher, relationship_type=UserRole.TEACHER.value)
    checkin = _checkin(db, student=student, private_note=f"Nội dung không vào audit. {PRIVATE_MARKER}")
    before_sos_count = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    before_notification_count = db.scalar(select(func.count()).select_from(InAppNotification)) or 0

    _login(client, student.email)
    share_response = _share(client, checkin.id, [teacher.id])
    assert share_response.status_code == 200

    _login(client, teacher.email)
    read_response = client.get(f"/api/teacher/students/{student.id}/support-summary?reason_code=support_plan_context")
    assert read_response.status_code == 200
    assert PRIVATE_MARKER in read_response.text

    _login(client, student.email)
    revoke_response = client.delete(
        f"/api/student/mood-check-ins/{checkin.id}/shares/{teacher.id}",
        headers=ORIGIN_HEADERS,
    )
    assert revoke_response.status_code == 200

    after_sos_count = db.scalar(select(func.count()).select_from(SosAlert)) or 0
    after_notification_count = db.scalar(select(func.count()).select_from(InAppNotification)) or 0
    assert after_sos_count == before_sos_count
    assert after_notification_count == before_notification_count

    audit_events = list(
        db.scalars(
            select(AuditEvent).where(
                AuditEvent.action.in_(
                    [
                        "mood_note_share_created",
                        "mood_note_share_read",
                        "mood_note_share_revoked",
                    ]
                )
            )
        )
    )
    assert {event.action for event in audit_events} == {
        "mood_note_share_created",
        "mood_note_share_read",
        "mood_note_share_revoked",
    }
    for event in audit_events:
        assert event.status in {"success", "allowed"}
        _assert_no_forbidden_audit(event.metadata_summary)
        assert student.full_name not in str(event.metadata_summary)
        assert teacher.full_name not in str(event.metadata_summary)
        assert student.email not in str(event.metadata_summary)
        assert teacher.email not in str(event.metadata_summary)
