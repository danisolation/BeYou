import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"
    ADMIN = "admin"


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DELETED = "deleted"


class AuthSessionMethod(str, enum.Enum):
    PASSWORD = "password"
    DEMO_PASSWORD = "demo_password"
    SSO = "sso"


class ExternalIdentityStatus(str, enum.Enum):
    LINKED = "linked"
    PENDING_REVIEW = "pending_review"
    DISABLED = "disabled"
    DEPROVISIONED = "deprovisioned"


class RelationshipType(str, enum.Enum):
    TEACHER = "teacher"
    PARENT = "parent"


class LinkStatus(str, enum.Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class ContentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class RiskStateLabel(str, enum.Enum):
    STABLE = "On dinh"
    ATTENTION = "Can chu y"
    SUPPORT = "Nen tim ho tro"
    EARLY_SUPPORT = "Can ho tro som"


class ScenarioSignal(str, enum.Enum):
    CONSTRUCTIVE = "constructive"
    RISKY = "risky"


class SosSeverity(str, enum.Enum):
    SUPPORT = "support"
    URGENT = "urgent"


class SosSource(str, enum.Enum):
    STUDENT_DASHBOARD = "student_dashboard"
    SELF_CHECK_RESULT = "self_check_result"
    CHATBOT = "chatbot"
    DEMO_SEED = "demo_seed"


class SosAlertStatus(str, enum.Enum):
    SENT = "sent"
    RECEIVED = "received"
    SUPPORTING = "supporting"
    COMPLETED = "completed"


class SosNotificationDeliveryStatus(str, enum.Enum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"


class SupportPlanStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DEACTIVATED = "deactivated"


class ReminderCadence(str, enum.Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"


class MoodNoteShareScope(str, enum.Enum):
    PRIVATE_NOTE = "private_note"
    STUDENT_SUMMARY = "student_summary"


class V14Channel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    ZALO = "zalo"
    PUSH = "push"


class ChatMessageRole(str, enum.Enum):
    STUDENT = "student"
    ASSISTANT = "assistant"


class ChatSafetyStage(str, enum.Enum):
    INPUT = "input"
    OUTPUT = "output"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default=AccountStatus.ACTIVE.value, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    school: Mapped[str | None] = mapped_column(String(255), nullable=True)
    class_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    user_agent_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ip_prefix_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auth_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    auth_provider_key: Mapped[str | None] = mapped_column(String(96), nullable=True)
    external_identity_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("external_identities.id"), nullable=True, index=True
    )

    user: Mapped[User] = relationship(back_populates="sessions")


class ExternalIdentity(Base):
    __tablename__ = "external_identities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_key: Mapped[str] = mapped_column(String(96), nullable=False, index=True)
    provider_subject_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    linked_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(
        String(32), default=ExternalIdentityStatus.PENDING_REVIEW.value, nullable=False
    )
    provider_label: Mapped[str | None] = mapped_column(String(160), nullable=True)
    email_verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    email_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    display_label: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "provider_key", "provider_subject_hash", name="uq_external_identities_provider_subject"
        ),
        Index("ix_external_identities_status", "status"),
        Index("ix_external_identities_linked_user_id", "linked_user_id"),
    )


class PrivacyAcknowledgement(Base):
    __tablename__ = "privacy_acknowledgements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    notice_version: Mapped[str] = mapped_column(String(32), nullable=False)
    acknowledged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "notice_version", name="uq_privacy_user_notice"),)


class StudentAdultLink(Base):
    __tablename__ = "student_adult_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    adult_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default=LinkStatus.ACTIVE.value, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    revoked_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index(
            "ix_student_adult_active_unique",
            "student_id",
            "adult_id",
            "relationship_type",
            unique=True,
            postgresql_where=(status == LinkStatus.ACTIVE.value),
        ),
    )


class StudentSupportPlan(Base):
    __tablename__ = "student_support_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(32), default=SupportPlanStatus.ACTIVE.value, nullable=False
    )
    what_helps: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_does_not_help: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_contact_method: Mapped[str | None] = mapped_column(Text, nullable=True)
    safe_contact_times: Mapped[str | None] = mapped_column(Text, nullable=True)
    shareable_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    selected_adults: Mapped[list["StudentSupportPlanAdult"]] = relationship(
        back_populates="support_plan", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("student_id", name="uq_student_support_plans_student_id"),
        Index("ix_student_support_plans_status", "status"),
        Index("ix_student_support_plans_is_demo", "is_demo"),
    )


class StudentSupportPlanAdult(Base):
    __tablename__ = "student_support_plan_adults"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    support_plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("student_support_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    adult_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    relationship_type_snapshot: Mapped[str] = mapped_column(String(32), nullable=False)
    adult_full_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    support_plan: Mapped[StudentSupportPlan] = relationship(back_populates="selected_adults")

    __table_args__ = (
        UniqueConstraint("support_plan_id", "adult_id", name="uq_student_support_plan_adult"),
        Index("ix_student_support_plan_adults_is_demo", "is_demo"),
    )


class MoodCheckIn(Base):
    __tablename__ = "mood_check_ins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    mood_label: Mapped[str] = mapped_column(String(64), nullable=False)
    energy_level: Mapped[int] = mapped_column(Integer, nullable=False)
    stress_level: Mapped[int] = mapped_column(Integer, nullable=False)
    context_tags: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    private_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    trend_label: Mapped[str] = mapped_column(String(64), nullable=False)
    supportive_message: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_next_action: Mapped[str] = mapped_column(Text, nullable=False)
    suggest_support_plan: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    suggest_sos: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_mood_check_ins_student_created", "student_id", "created_at"),
        Index("ix_mood_check_ins_trend_label", "trend_label"),
        Index("ix_mood_check_ins_is_demo", "is_demo"),
    )


class MoodCheckInConfig(Base):
    __tablename__ = "mood_checkin_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(96), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=ContentStatus.DRAFT.value
    )
    student_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    adult_guidance: Mapped[str] = mapped_column(Text, nullable=False)
    mood_options: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
    context_tags: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_mood_checkin_configs_status_sort", "status", "sort_order"),
        Index("ix_mood_checkin_configs_is_demo", "is_demo"),
    )


class StudentNotificationPreference(Base):
    __tablename__ = "student_notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    in_app_reminders_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mood_checkin_reminders_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    reminder_cadence: Mapped[str] = mapped_column(
        String(32), default=ReminderCadence.WEEKLY.value, nullable=False
    )
    allowed_channels: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    consent_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    quiet_hours_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    quiet_hours_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Ho_Chi_Minh", nullable=False)
    paused_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pause_reason_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("student_id", name="uq_student_notification_preferences_student_id"),
        Index("ix_student_notification_preferences_student_id", "student_id"),
        Index("ix_student_notification_preferences_is_demo", "is_demo"),
        Index("ix_student_notification_preferences_paused_until", "paused_until"),
    )


class MoodCheckinReminderState(Base):
    __tablename__ = "mood_checkin_reminder_states"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    reminder_type: Mapped[str] = mapped_column(String(64), default="mood_check_in", nullable=False)
    last_shown_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_dismissed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    snoozed_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id", "reminder_type", name="uq_mood_checkin_reminder_state_student_type"
        ),
        Index("ix_mood_checkin_reminder_states_due", "next_due_at"),
        Index("ix_mood_checkin_reminder_states_is_demo", "is_demo"),
    )


class MoodNoteShare(Base):
    __tablename__ = "mood_note_shares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mood_checkin_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("mood_check_ins.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    adult_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    relationship_type_snapshot: Mapped[str] = mapped_column(String(32), nullable=False)
    share_scope: Mapped[str] = mapped_column(String(32), nullable=False)
    student_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        Index(
            "ix_mood_note_shares_active_unique",
            "mood_checkin_id",
            "adult_id",
            unique=True,
            postgresql_where=(revoked_at.is_(None)),
        ),
        Index("ix_mood_note_shares_student_created", "student_id", "created_at"),
        Index("ix_mood_note_shares_adult_created", "adult_id", "created_at"),
        Index("ix_mood_note_shares_is_demo", "is_demo"),
    )


class SchoolPrivacyPolicyDefault(Base):
    __tablename__ = "school_privacy_policy_defaults"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_scope: Mapped[str] = mapped_column(
        String(96), default="default", nullable=False, unique=True
    )
    default_in_app_reminders_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    default_quiet_hours_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    default_quiet_hours_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
    default_timezone: Mapped[str] = mapped_column(
        String(64), default="Asia/Ho_Chi_Minh", nullable=False
    )
    allowed_channels: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    external_channels_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    note_sharing_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reason_required_for_adult_summaries: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    reason_required_for_shared_mood_notes: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    allowed_reason_codes: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_school_privacy_policy_defaults_is_demo", "is_demo"),
        Index("ix_school_privacy_policy_defaults_updated", "updated_at"),
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    actor_role: Mapped[str] = mapped_column(String(32), nullable=False)
    action: Mapped[str] = mapped_column(String(96), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(96), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(128), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    reason: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    metadata_summary: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class SelfCheckTest(Base):
    __tablename__ = "self_check_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default=ContentStatus.DRAFT.value, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    questions: Mapped[list["SelfCheckQuestion"]] = relationship(
        back_populates="test", cascade="all, delete-orphan"
    )
    thresholds: Mapped[list["SelfCheckThreshold"]] = relationship(
        back_populates="test", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_self_check_tests_status_is_active", "status", "is_active"),
        Index("ix_self_check_tests_is_demo", "is_demo"),
    )


class SelfCheckQuestion(Base):
    __tablename__ = "self_check_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("self_check_tests.id"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    test: Mapped[SelfCheckTest] = relationship(back_populates="questions")
    choices: Mapped[list["SelfCheckChoice"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class SelfCheckChoice(Base):
    __tablename__ = "self_check_choices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("self_check_questions.id"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    score_value: Mapped[int] = mapped_column(Integer, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    question: Mapped[SelfCheckQuestion] = relationship(back_populates="choices")


class SelfCheckThreshold(Base):
    __tablename__ = "self_check_thresholds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("self_check_tests.id"), nullable=False, index=True
    )
    state_label: Mapped[str] = mapped_column(String(64), nullable=False)
    min_score: Mapped[int] = mapped_column(Integer, nullable=False)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    advice: Mapped[str | None] = mapped_column(Text, nullable=True)
    positive_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_next_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    test: Mapped[SelfCheckTest] = relationship(back_populates="thresholds")


class SelfCheckAttempt(Base):
    __tablename__ = "self_check_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    test_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("self_check_tests.id"), nullable=False, index=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    state_label: Mapped[str] = mapped_column(String(64), nullable=False)
    supportive_headline: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    advice_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    positive_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_next_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_title_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    test_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    answers: Mapped[list["SelfCheckAttemptAnswer"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan"
    )
    test: Mapped["SelfCheckTest"] = relationship()

    __table_args__ = (
        Index("ix_self_check_attempts_student_completed", "student_id", "completed_at"),
        Index("ix_self_check_attempts_is_demo", "is_demo"),
    )


class SelfCheckAttemptAnswer(Base):
    __tablename__ = "self_check_attempt_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("self_check_attempts.id"), nullable=False, index=True
    )
    question_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("self_check_questions.id"), nullable=True
    )
    choice_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("self_check_choices.id"), nullable=True
    )
    question_text_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    choice_text_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    score_value_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    attempt: Mapped[SelfCheckAttempt] = relationship(back_populates="answers")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    situation: Mapped[str] = mapped_column(Text, nullable=False)
    skill_tag: Mapped[str] = mapped_column(String(96), nullable=False)
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default=ContentStatus.DRAFT.value, nullable=False
    )
    recommended_response: Mapped[str] = mapped_column(Text, nullable=False)
    lesson: Mapped[str] = mapped_column(Text, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    choices: Mapped[list["ScenarioChoice"]] = relationship(
        back_populates="scenario", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_scenarios_status", "status"),
        Index("ix_scenarios_is_demo", "is_demo"),
    )


class ScenarioChoice(Base):
    __tablename__ = "scenario_choices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scenarios.id"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    signal: Mapped[str] = mapped_column(String(32), nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    scenario: Mapped[Scenario] = relationship(back_populates="choices")


class ScenarioAttempt(Base):
    __tablename__ = "scenario_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scenarios.id"), nullable=False, index=True
    )
    selected_choice_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("scenario_choices.id"), nullable=True
    )
    scenario_title_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    situation_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    selected_choice_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    signal_snapshot: Mapped[str | None] = mapped_column(String(32), nullable=True)
    feedback_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_response_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    lesson_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    skill_tag_snapshot: Mapped[str] = mapped_column(String(96), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_scenario_attempts_student_completed", "student_id", "completed_at"),
        Index("ix_scenario_attempts_is_demo", "is_demo"),
    )


class SosAlert(Base):
    __tablename__ = "sos_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    student_full_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    student_school_snapshot: Mapped[str | None] = mapped_column(String(255), nullable=True)
    student_class_name_snapshot: Mapped[str | None] = mapped_column(String(64), nullable=True)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_status: Mapped[str] = mapped_column(
        String(32), default=SosAlertStatus.SENT.value, nullable=False
    )
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status_events: Mapped[list["SosStatusEvent"]] = relationship(
        back_populates="alert", cascade="all, delete-orphan"
    )
    notification_deliveries: Mapped[list["SosNotificationDelivery"]] = relationship(
        back_populates="alert", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_sos_alerts_student_created", "student_id", "created_at"),
        Index("ix_sos_alerts_current_status", "current_status"),
        Index("ix_sos_alerts_is_demo", "is_demo"),
    )


class SosStatusEvent(Base):
    __tablename__ = "sos_status_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sos_alerts.id"), nullable=False, index=True
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    actor_role: Mapped[str] = mapped_column(String(32), nullable=False)
    previous_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    alert: Mapped[SosAlert] = relationship(back_populates="status_events")

    __table_args__ = (
        Index("ix_sos_status_events_alert_created", "alert_id", "created_at"),
        Index("ix_sos_status_events_is_demo", "is_demo"),
    )


class SosNotificationDelivery(Base):
    __tablename__ = "sos_notification_deliveries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sos_alerts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    recipient_role_snapshot: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(96), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    alert: Mapped[SosAlert] = relationship(back_populates="notification_deliveries")

    __table_args__ = (
        Index("ix_sos_notification_deliveries_alert_created", "alert_id", "created_at"),
        Index("ix_sos_notification_deliveries_status", "status"),
        Index("ix_sos_notification_deliveries_is_demo", "is_demo"),
    )


class InAppNotification(Base):
    __tablename__ = "in_app_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    resource_type: Mapped[str] = mapped_column(String(96), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    href: Mapped[str | None] = mapped_column(String(512), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_in_app_notifications_recipient_created", "recipient_id", "created_at"),
        Index("ix_in_app_notifications_resource", "resource_type", "resource_id"),
        Index("ix_in_app_notifications_is_demo", "is_demo"),
    )


class ChatThread(Base):
    __tablename__ = "chat_threads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(
        String(255), default="Cuộc trò chuyện với Peerlight AI", nullable=False
    )
    safety_state: Mapped[str] = mapped_column(String(32), default="supportive", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="thread", cascade="all, delete-orphan"
    )
    safety_signals: Mapped[list["ChatSafetySignal"]] = relationship(
        back_populates="thread", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_chat_threads_student_last_message", "student_id", "last_message_at"),
        Index("ix_chat_threads_is_demo", "is_demo"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_threads.id"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    safety_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    thread: Mapped[ChatThread] = relationship(back_populates="messages")

    __table_args__ = (
        Index("ix_chat_messages_thread_created", "thread_id", "created_at"),
        Index("ix_chat_messages_is_demo", "is_demo"),
    )


class ChatSafetySignal(Base):
    __tablename__ = "chat_safety_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_threads.id"), nullable=False, index=True
    )
    message_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("chat_messages.id"), nullable=True, index=True
    )
    stage: Mapped[str] = mapped_column(String(32), nullable=False)
    categories: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    summary: Mapped[str] = mapped_column(String(128), nullable=False)
    escalation_suggestion: Mapped[str] = mapped_column(String(128), nullable=False)
    sos_suggested: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    thread: Mapped[ChatThread] = relationship(back_populates="safety_signals")

    __table_args__ = (
        Index("ix_chat_safety_signals_thread_created", "thread_id", "created_at"),
        Index("ix_chat_safety_signals_stage", "stage"),
        Index("ix_chat_safety_signals_is_demo", "is_demo"),
    )


class ChatbotSafetyConfig(Base):
    __tablename__ = "chatbot_safety_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), default="default", nullable=False, unique=True)
    high_risk_keywords: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    escalation_message: Mapped[str] = mapped_column(Text, nullable=False)
    trusted_adult_message: Mapped[str] = mapped_column(Text, nullable=False)
    first_response_disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        Index("ix_chatbot_safety_configs_name", "name"),
        Index("ix_chatbot_safety_configs_is_demo", "is_demo"),
    )
