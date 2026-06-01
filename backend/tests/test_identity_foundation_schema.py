from pathlib import Path

from app.db.models import (
    AuthSessionMethod,
    ExternalIdentity,
    ExternalIdentityStatus,
    Session as UserSession,
)


def test_identity_foundation_enums_and_models_expose_safe_metadata_only() -> None:
    assert AuthSessionMethod.PASSWORD.value == "password"
    assert AuthSessionMethod.DEMO_PASSWORD.value == "demo_password"
    assert AuthSessionMethod.SSO.value == "sso"

    assert ExternalIdentityStatus.LINKED.value == "linked"
    assert ExternalIdentityStatus.PENDING_REVIEW.value == "pending_review"
    assert ExternalIdentityStatus.DISABLED.value == "disabled"
    assert ExternalIdentityStatus.DEPROVISIONED.value == "deprovisioned"

    session_columns = UserSession.__table__.columns
    assert "auth_method" in session_columns
    assert "auth_provider_key" in session_columns
    assert "external_identity_id" in session_columns

    external_columns = ExternalIdentity.__table__.columns
    assert "provider_key" in external_columns
    assert "provider_subject_hash" in external_columns
    assert "linked_user_id" in external_columns
    assert "status" in external_columns
    assert "provider_label" in external_columns
    assert "email_verified" in external_columns
    assert "email_hash" in external_columns
    assert "display_label" in external_columns
    assert "last_seen_at" in external_columns

    forbidden_columns = {
        "raw_subject",
        "raw_email",
        "raw_claims",
        "access_token",
        "refresh_token",
        "id_token",
    }
    assert forbidden_columns.isdisjoint(external_columns.keys())


def test_identity_foundation_migration_contract() -> None:
    migration = Path("alembic/versions/20260525_0011_identity_foundation.py").read_text(
        encoding="utf-8"
    )

    assert 'revision: str = "20260525_0011"' in migration
    assert 'down_revision: str | None = "20260522_0010"' in migration
    assert 'op.create_table(\n        "external_identities"' in migration
    assert "uq_external_identities_provider_subject" in migration
    assert "auth_method" in migration
    assert "auth_provider_key" in migration
    assert "external_identity_id" in migration
