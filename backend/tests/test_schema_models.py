from app.db.base import Base
from app.db.models import (
    AccountStatus,
    AuditEvent,
    MoodCheckinReminderState,
    MoodNoteShare,
    SchoolPrivacyPolicyDefault,
    SosAlert,
    SosStatusEvent,
    InAppNotification,
    LinkStatus,
    PrivacyAcknowledgement,
    RelationshipType,
    StudentNotificationPreference,
    Session,
    SosNotificationDelivery,
    StudentAdultLink,
    User,
    UserRole,
)


def test_role_enum_values_are_locked() -> None:
    assert {role.value for role in UserRole} == {"student", "teacher", "parent", "admin"}


def test_account_and_link_enum_values_are_locked() -> None:
    assert {status.value for status in AccountStatus} == {"active", "disabled", "deleted"}
    assert {rel.value for rel in RelationshipType} == {"teacher", "parent"}
    assert {status.value for status in LinkStatus} == {"active", "revoked"}


def test_identity_tables_are_registered() -> None:
    assert {
        "users",
        "sessions",
        "privacy_acknowledgements",
        "student_adult_links",
        "audit_events",
        "student_notification_preferences",
        "mood_checkin_reminder_states",
        "mood_note_shares",
        "school_privacy_policy_defaults",
    }.issubset(Base.metadata.tables.keys())


def test_user_columns_include_phase_two_identity_fields() -> None:
    columns = set(User.__table__.columns.keys())

    assert {
        "email",
        "password_hash",
        "role",
        "status",
        "full_name",
        "school",
        "class_name",
        "is_demo",
        "created_at",
        "updated_at",
    }.issubset(columns)


def test_all_demo_sensitive_tables_include_is_demo() -> None:
    for model in (
        InAppNotification,
        SosNotificationDelivery,
        SosStatusEvent,
        SosAlert,
        User,
        StudentNotificationPreference,
        MoodCheckinReminderState,
        MoodNoteShare,
        SchoolPrivacyPolicyDefault,
        Session,
        PrivacyAcknowledgement,
        StudentAdultLink,
        AuditEvent,
    ):
        assert "is_demo" in model.__table__.columns


def test_session_uses_hashed_cookie_token() -> None:
    columns = set(Session.__table__.columns.keys())

    assert "token_hash" in columns


def test_audit_event_is_metadata_only_schema() -> None:
    columns = set(AuditEvent.__table__.columns.keys())

    assert {
        "actor_id",
        "actor_role",
        "action",
        "resource_type",
        "resource_id",
        "timestamp",
        "reason",
        "status",
        "metadata_summary",
        "is_demo",
    }.issubset(columns)
    assert not {
        "password",
        "token",
        "session_cookie",
        "api_key",
        "raw_chat_content",
        "self_check_raw_answers",
    }.intersection(columns)


def test_student_adult_link_relationship_fields() -> None:
    columns = set(StudentAdultLink.__table__.columns.keys())

    assert {
        "student_id",
        "adult_id",
        "relationship_type",
        "status",
        "created_by",
        "revoked_by",
        "revoked_at",
        "is_demo",
    }.issubset(columns)
