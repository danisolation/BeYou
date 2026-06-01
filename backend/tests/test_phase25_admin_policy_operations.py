from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.core.security import hash_password
from app.db.models import (
    AccountStatus,
    AuditEvent,
    AuthSessionMethod,
    ExternalIdentity,
    ExternalIdentityStatus,
    LinkStatus,
    MoodCheckIn,
    MoodCheckinReminderState,
    MoodNoteShare,
    SchoolPrivacyPolicyDefault,
    Session as UserSession,
    StudentAdultLink,
    StudentNotificationPreference,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.main import app
from app.schemas.readiness import ReadinessReport
from app.seeds.demo_seed import (
    DEMO_ADMIN_EMAIL,
    DEMO_PARENT_EMAIL,
    DEMO_STUDENT_EMAIL,
    DEMO_TEACHER_EMAIL,
)
from app.services.admin_operations import build_operations_dashboard
from app.services.readiness import evaluate_static_readiness_checks

FRONTEND_ORIGIN = "http://localhost:3000"
ORIGIN_HEADERS = {"Origin": FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site"}
PASSWORD = "secret123"
PRIVATE_MARKER = "RAW_PHASE25_PRIVATE_CONTENT"
RAW_REASON = "RAW_PHASE25_FREE_TEXT_REASON"


def _clean_database() -> None:
    with SessionLocal() as db:
        phase_user_ids = list(
            db.scalars(
                select(User.id).where(
                    or_(
                        User.email.like("%phase25%@example.test"),
                        User.email.in_(
                            [
                                DEMO_STUDENT_EMAIL,
                                DEMO_TEACHER_EMAIL,
                                DEMO_PARENT_EMAIL,
                                DEMO_ADMIN_EMAIL,
                            ]
                        ),
                    )
                )
            )
        )
        checkin_ids = list(
            db.scalars(select(MoodCheckIn.id).where(MoodCheckIn.student_id.in_(phase_user_ids)))
        )
        if checkin_ids:
            db.execute(delete(MoodNoteShare).where(MoodNoteShare.mood_checkin_id.in_(checkin_ids)))
            db.execute(delete(MoodCheckIn).where(MoodCheckIn.id.in_(checkin_ids)))
        if phase_user_ids:
            db.execute(
                delete(MoodCheckinReminderState).where(
                    MoodCheckinReminderState.student_id.in_(phase_user_ids)
                )
            )
            db.execute(
                delete(StudentNotificationPreference).where(
                    StudentNotificationPreference.student_id.in_(phase_user_ids)
                )
            )
            db.execute(
                delete(StudentAdultLink).where(
                    or_(
                        StudentAdultLink.student_id.in_(phase_user_ids),
                        StudentAdultLink.adult_id.in_(phase_user_ids),
                        StudentAdultLink.created_by.in_(phase_user_ids),
                    )
                )
            )
            db.execute(delete(AuditEvent).where(AuditEvent.actor_id.in_(phase_user_ids)))
            db.execute(delete(UserSession).where(UserSession.user_id.in_(phase_user_ids)))
            db.execute(
                delete(ExternalIdentity).where(ExternalIdentity.linked_user_id.in_(phase_user_ids))
            )
        db.execute(delete(AuditEvent).where(AuditEvent.resource_id.like("phase25%")))
        db.execute(delete(ExternalIdentity).where(ExternalIdentity.provider_key.like("phase30_%")))
        db.execute(
            delete(SchoolPrivacyPolicyDefault).where(
                SchoolPrivacyPolicyDefault.school_scope == "default"
            )
        )
        if phase_user_ids:
            db.execute(delete(User).where(User.id.in_(phase_user_ids)))
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
        full_name=f"{role.title()} Phase25",
        school="THPT Phase25" if role == UserRole.STUDENT.value else None,
        class_name="10A1" if role == UserRole.STUDENT.value else None,
        is_demo=is_demo,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client: TestClient, email: str) -> None:
    client.cookies.clear()
    response = client.post(
        "/api/auth/login", json={"email": email, "password": PASSWORD}, headers=ORIGIN_HEADERS
    )
    assert response.status_code == 200


def _safe_policy_payload(**overrides: object) -> dict:
    payload = {
        "default_in_app_reminders_enabled": True,
        "default_quiet_hours_start": "21:00",
        "default_quiet_hours_end": "06:00",
        "default_timezone": "Asia/Ho_Chi_Minh",
        "allowed_channels": ["in_app"],
        "external_channels_enabled": False,
        "note_sharing_enabled": True,
        "reason_required_for_adult_summaries": True,
        "reason_required_for_shared_mood_notes": True,
        "allowed_reason_codes": ["support_plan_context", "routine_care_conversation"],
    }
    payload.update(overrides)
    return payload


def _seed_demo_v1_4_state(db: OrmSession) -> User:
    admin = _user(db, email=DEMO_ADMIN_EMAIL, role=UserRole.ADMIN.value)
    student = _user(db, email=DEMO_STUDENT_EMAIL, role=UserRole.STUDENT.value)
    teacher = _user(db, email=DEMO_TEACHER_EMAIL, role=UserRole.TEACHER.value)
    _user(db, email=DEMO_PARENT_EMAIL, role=UserRole.PARENT.value)
    db.add(
        StudentAdultLink(
            student_id=student.id,
            adult_id=teacher.id,
            relationship_type=UserRole.TEACHER.value,
            status=LinkStatus.ACTIVE.value,
            created_by=admin.id,
            is_demo=True,
        )
    )
    db.add(
        SchoolPrivacyPolicyDefault(
            school_scope="default",
            allowed_channels=["in_app"],
            external_channels_enabled=False,
            note_sharing_enabled=True,
            reason_required_for_adult_summaries=True,
            reason_required_for_shared_mood_notes=True,
            allowed_reason_codes=["support_plan_context", "routine_care_conversation"],
            is_demo=True,
        )
    )
    db.add(
        StudentNotificationPreference(
            student_id=student.id,
            in_app_reminders_enabled=True,
            mood_checkin_reminders_enabled=True,
            reminder_cadence="weekly",
            allowed_channels=["in_app"],
            timezone="Asia/Ho_Chi_Minh",
            is_demo=True,
        )
    )
    db.add(
        MoodCheckinReminderState(student_id=student.id, reminder_type="mood_check_in", is_demo=True)
    )
    db.flush()
    checkin = MoodCheckIn(
        student_id=student.id,
        mood_label="steady",
        energy_level=4,
        stress_level=2,
        context_tags=["school"],
        private_note=None,
        trend_label="Ổn định",
        supportive_message="Dữ liệu demo hỗ trợ học sinh.",
        suggested_next_action="Tiếp tục trò chuyện chăm sóc.",
        suggest_support_plan=False,
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
            share_scope="student_summary",
            student_summary="Dữ liệu demo: em muốn được hỏi thăm nhẹ nhàng.",
            is_demo=True,
        )
    )
    for resource_type in (
        "notification_preferences",
        "mood_checkin_reminder",
        "mood_note_share",
        "shared_mood_note",
        "adult_support_summary",
        "privacy_policy",
    ):
        db.add(
            AuditEvent(
                actor_id=admin.id,
                actor_role=UserRole.ADMIN.value,
                action=f"{resource_type}_phase25_checked",
                resource_type=resource_type,
                resource_id=f"phase25-{resource_type}",
                status="success",
                reason=RAW_REASON,
                metadata_summary={
                    "safe_count": 1,
                    "private_note": PRIVATE_MARKER,
                    "access_reason_text": RAW_REASON,
                    "student_email": student.email,
                    "safe_value": "student@example.edu",
                    "details": "access_token=secret",
                    "nested": {"safe_label": "login.school.edu"},
                    "items": [{"safe_label": "raw_claims groups school class_name"}],
                },
                is_demo=True,
            )
        )
    db.commit()
    return admin


def test_admin_reads_and_updates_privacy_policy_with_metadata_only_audit(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin = _user(db, email="admin-phase25-policy@example.test", role=UserRole.ADMIN.value)
    student = _user(db, email="student-phase25-policy@example.test", role=UserRole.STUDENT.value)

    _login(client, student.email)
    denied = client.get("/api/admin/privacy-policy")
    assert denied.status_code == 403

    _login(client, admin.email)
    default_response = client.get("/api/admin/privacy-policy")
    assert default_response.status_code == 200
    assert default_response.json()["allowed_channels"] == ["in_app"]

    update_response = client.put(
        "/api/admin/privacy-policy",
        json=_safe_policy_payload(default_in_app_reminders_enabled=True),
        headers=ORIGIN_HEADERS,
    )
    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["default_in_app_reminders_enabled"] is True
    assert payload["allowed_reason_codes"] == ["support_plan_context", "routine_care_conversation"]

    event = db.scalar(select(AuditEvent).where(AuditEvent.action == "privacy_policy_updated"))
    assert event is not None
    assert event.resource_type == "privacy_policy"
    assert event.metadata_summary["allowed_channel_count"] == 1
    assert event.metadata_summary["allowed_reason_count"] == 2
    rendered = str(event.metadata_summary)
    assert PRIVATE_MARKER not in rendered
    assert "raw" not in rendered.lower()
    assert "email" not in rendered.lower()


@pytest.mark.parametrize(
    "bad_payload",
    [
        _safe_policy_payload(external_channels_enabled=True),
        _safe_policy_payload(allowed_channels=["in_app", "sms"]),
        _safe_policy_payload(default_raw_private_note_access_enabled=True),
    ],
)
def test_admin_policy_rejects_external_channels_and_raw_note_defaults(
    db: OrmSession,
    client: TestClient,
    bad_payload: dict,
) -> None:
    admin = _user(
        db, email=f"admin-{uuid.uuid4()}-phase25-invalid@example.test", role=UserRole.ADMIN.value
    )
    _login(client, admin.email)

    response = client.put("/api/admin/privacy-policy", json=bad_payload, headers=ORIGIN_HEADERS)

    assert response.status_code == 422
    assert "privacy_policy_updated" not in response.text
    assert (
        db.scalar(select(AuditEvent).where(AuditEvent.action == "privacy_policy_updated")) is None
    )


def test_operations_dashboard_exposes_v1_4_counts_and_sanitizes_reason_content(
    db: OrmSession,
    client: TestClient,
) -> None:
    admin = _seed_demo_v1_4_state(db)
    _login(client, admin.email)

    response = client.get("/api/admin/operations/dashboard", params={"limit": 20})

    assert response.status_code == 200
    payload = response.json()
    buckets = {bucket["key"]: bucket["count"] for bucket in payload["v1_4_audit"]}
    assert buckets["notification_preferences"] >= 1
    assert buckets["mood_checkin_reminder"] >= 1
    assert buckets["mood_note_share"] >= 1
    assert buckets["shared_mood_note"] >= 1
    assert buckets["adult_support_summary"] >= 1
    assert buckets["privacy_policy"] >= 1
    assert payload["demo_seed"]["v1_4_policy_count"] == 1
    assert payload["demo_seed"]["v1_4_preference_count"] == 1
    assert payload["demo_seed"]["v1_4_reminder_state_count"] == 1
    assert payload["demo_seed"]["v1_4_share_count"] == 1

    rendered = response.text
    assert PRIVATE_MARKER not in rendered
    assert RAW_REASON not in rendered
    assert "student.demo@beyou.local" not in rendered
    assert "access_reason_text" not in rendered
    assert "private_note" not in rendered
    assert "student@example.edu" not in rendered
    assert "access_token=secret" not in rendered
    assert "login.school.edu" not in rendered
    assert "raw_claims" not in rendered
    assert "metadata_an_toan" in rendered


def test_operations_dashboard_exposes_identity_auth_metadata_only(db: OrmSession) -> None:
    admin = _user(db, email="admin-phase25-identity@example.test", role=UserRole.ADMIN.value)
    now = datetime.now(timezone.utc)
    db.add_all(
        [
            ExternalIdentity(
                provider_key="phase30_provider",
                provider_subject_hash="raw_subject_should_never_render",
                linked_user_id=admin.id,
                status=ExternalIdentityStatus.LINKED.value,
                provider_label="school.example",
                display_label="student-phase25-identity@example.test",
            ),
            ExternalIdentity(
                provider_key="phase30_provider",
                provider_subject_hash="provider_subject_should_never_render",
                linked_user_id=None,
                status=ExternalIdentityStatus.PENDING_REVIEW.value,
                provider_label="login.school.edu",
                display_label="raw_claims groups school class_name",
            ),
            ExternalIdentity(
                provider_key="phase30_provider",
                provider_subject_hash="client_secret_should_never_render",
                linked_user_id=None,
                status=ExternalIdentityStatus.DISABLED.value,
            ),
            ExternalIdentity(
                provider_key="phase30_provider",
                provider_subject_hash="access_token_should_never_render",
                linked_user_id=None,
                status=ExternalIdentityStatus.DEPROVISIONED.value,
            ),
            UserSession(
                token_hash="phase30-token-hash-password",
                user_id=admin.id,
                expires_at=now + timedelta(hours=1),
                is_demo=True,
                auth_method=AuthSessionMethod.PASSWORD.value,
                auth_provider_key="local",
            ),
            UserSession(
                token_hash="phase30-token-hash-sso",
                user_id=admin.id,
                expires_at=now + timedelta(hours=1),
                is_demo=True,
                auth_method=AuthSessionMethod.SSO.value,
                auth_provider_key="phase30_provider",
            ),
        ]
    )
    db.commit()
    settings = Settings(
        AUTH_PROVIDER_ENABLED=True,
        AUTH_PROVIDER_KEY="pilot_sso",
        AUTH_PROVIDER_LABEL="Dang nhap pilot",
        AUTH_PROVIDER_MODE="pilot",
        AUTH_PROVIDER_LAST_CHECK_STATUS="san sang",
    )
    checks = evaluate_static_readiness_checks(settings)
    report = ReadinessReport(status="degraded", generated_at=now, checks=checks)

    dashboard = build_operations_dashboard(db, readiness_report=report, settings=settings)

    assert dashboard.auth_provider is not None
    assert dashboard.auth_provider.enabled is True
    assert dashboard.auth_provider.provider_key == "pilot_sso"
    assert dashboard.identity_mappings is not None
    assert dashboard.identity_mappings.pending_review_count == 1
    assert dashboard.identity_mappings.disabled_count == 1
    assert dashboard.identity_mappings.deprovisioned_count == 1
    assert {bucket.key: bucket.count for bucket in dashboard.identity_mappings.by_status} == {
        "deprovisioned": 1,
        "disabled": 1,
        "linked": 1,
        "pending_review": 1,
    }
    assert dashboard.session_auth is not None
    assert {bucket.key: bucket.count for bucket in dashboard.session_auth.by_auth_method}[
        "password"
    ] >= 1
    assert {bucket.key: bucket.count for bucket in dashboard.session_auth.by_auth_method}[
        "sso"
    ] == 1
    assert {bucket.key: bucket.count for bucket in dashboard.session_auth.by_provider}[
        "phase30_provider"
    ] == 1
    assert (
        "Danh tính ngoài chỉ được hiển thị bằng metadata tổng hợp. Quyền xem học sinh vẫn do vai trò trong ứng dụng, "
        "liên kết đang hoạt động và SOS của học sinh quyết định." in dashboard.privacy_notes
    )

    rendered = dashboard.model_dump_json()
    for forbidden in (
        "raw_subject",
        "provider_subject",
        "raw_email",
        "raw_claims",
        "groups",
        "school.example",
        "login.school.edu",
        "student-phase25-identity@example.test",
        "client_id",
        "client_secret",
        "issuer_url",
        "callback_url",
        "tenant_url",
        "access_token",
        "refresh_token",
        "id_token",
        "password_hash",
        "eyJhbGciOi",
    ):
        assert forbidden not in rendered
