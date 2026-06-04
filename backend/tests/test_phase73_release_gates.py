"""Phase 73 v2.4 release-gate matrix for SECURE-01 + NOTIFY-01/02 + TENANT-01.

Mirrors the Phase 32 pattern (`backend/tests/test_phase32_release_gates.py`).
This file adds zero new product surfaces — it only re-asserts metadata-only
serialization invariants against the v2.4 surfaces introduced in Phases 71-72.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.db.models import (
    AccountStatus,
    AuditEvent,
    SosAlert,
    SosNotificationDelivery,
    SosNotificationDeliveryStatus,
    User,
    UserRole,
)
from app.db.session import SessionLocal
from app.services.admin_operations import (
    OPERATIONS_FORBIDDEN_METADATA_KEYS,
    build_operations_dashboard,
)
from tests.test_phase32_release_gates import (
    PHASE32_FORBIDDEN_BACKEND_MARKERS,
    _clean_phase32_database,
    _pilot_settings,
    _readiness,
    _user,
)

PHASE73_BACKEND_REQUIREMENT_IDS = ("SECURE-01", "NOTIFY-01", "NOTIFY-02", "TENANT-01")

PHASE73_FORBIDDEN_BACKEND_MARKERS = PHASE32_FORBIDDEN_BACKEND_MARKERS + (
    "smtp_password",
    "smtp_username",
    "changeme",
    "@gmail.com",
    "@outlook.com",
    "smtp.gmail.com",
    "tenant_id",
    "tenant_url",
)


@pytest.fixture()
def db() -> OrmSession:
    _clean_phase32_database()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        _clean_phase32_database()


def _assert_phase73_markers_absent(rendered: str) -> None:
    for marker in PHASE73_FORBIDDEN_BACKEND_MARKERS:
        assert marker not in rendered, f"Phase 73 forbidden marker leaked: {marker!r}"


def test_phase73_requirement_ids_explicit() -> None:
    assert PHASE73_BACKEND_REQUIREMENT_IDS == (
        "SECURE-01",
        "NOTIFY-01",
        "NOTIFY-02",
        "TENANT-01",
    )


def test_phase73_forbidden_markers_extend_phase32() -> None:
    phase32_set = set(PHASE32_FORBIDDEN_BACKEND_MARKERS)
    phase73_set = set(PHASE73_FORBIDDEN_BACKEND_MARKERS)
    assert phase32_set.issubset(phase73_set)
    new_markers = phase73_set - phase32_set
    for required in (
        "smtp_password",
        "smtp_username",
        "changeme",
        "@gmail.com",
        "@outlook.com",
        "smtp.gmail.com",
        "tenant_id",
        "tenant_url",
    ):
        assert required in new_markers


def test_smtp_configuration_validation_does_not_leak_credentials(
    caplog: pytest.LogCaptureFixture, capsys: pytest.CaptureFixture
) -> None:
    caplog.set_level(logging.WARNING, logger="beyou.config")
    settings = _pilot_settings(
        SOS_EMAIL_PROVIDER="smtp",
        SMTP_HOST="smtp.gmail.com",
        SMTP_FROM="ops@pilot.example",
        SMTP_USERNAME="changeme",
        SMTP_PASSWORD="changeme",
    )

    settings.validate_smtp_configuration_rules()

    # Falls back to local_outbox safely instead of attempting unsafe SMTP.
    assert settings.sos_email_provider == "local_outbox"

    captured = capsys.readouterr()
    log_output = "\n".join(record.getMessage() for record in caplog.records)
    combined = "\n".join([captured.out, captured.err, log_output])

    _assert_phase73_markers_absent(combined)
    assert "local_outbox" in log_output or "Falling back" in log_output


def test_operations_dashboard_redacts_v24_smtp_dispatch_metadata(db: OrmSession) -> None:
    student = _user(
        db,
        email="student-phase73-smtp@example.test",
        role=UserRole.STUDENT.value,
    )
    teacher = _user(
        db,
        email="teacher-phase73-smtp@example.test",
        role=UserRole.TEACHER.value,
    )
    admin = _user(
        db,
        email="admin-phase73-smtp@example.test",
        role=UserRole.ADMIN.value,
    )

    alert = SosAlert(
        student_id=student.id,
        student_full_name_snapshot=student.full_name,
        student_school_snapshot=student.school,
        student_class_name_snapshot=student.class_name,
        severity="support",
        source="phase73",
        current_status="sent",
        is_demo=True,
    )
    db.add(alert)
    db.flush()

    db.add(
        SosNotificationDelivery(
            alert_id=alert.id,
            recipient_id=teacher.id,
            channel="email",
            provider="smtp",
            recipient_role_snapshot=UserRole.TEACHER.value,
            status=SosNotificationDeliveryStatus.FAILED.value
            if hasattr(SosNotificationDeliveryStatus, "FAILED")
            else "failed",
            attempt_count=1,
            error_code="smtp_dispatch_failed",
            is_demo=True,
        )
    )
    # Synthetic audit event simulating Phase 71 SMTP dispatch metadata that, if
    # the sanitizer regresses, would leak credentials, recipient addresses, or
    # provider hostnames into the admin operations payload.
    db.add(
        AuditEvent(
            actor_id=admin.id,
            actor_role=UserRole.ADMIN.value,
            action="phase73_smtp_dispatch_observed",
            resource_type="sos_notification_delivery",
            resource_id="phase73",
            reason="admin_operations",
            status="failed",
            metadata_summary={
                "safe_status": "fail",
                "smtp_password": "changeme",
                "smtp_username": "changeme",
                "recipient_email": "parent@example.com",
                "smtp_host": "smtp.gmail.com",
                "fallback_provider": "local_outbox",
                "credential_placeholder": "changeme",
                "tenant_id": str(uuid.uuid4()),
                "tenant_url": "https://tenant.example.com/admin",
            },
            is_demo=True,
        )
    )
    db.commit()

    dashboard = build_operations_dashboard(
        db, readiness_report=_readiness(), settings=_pilot_settings()
    )
    rendered = dashboard.model_dump_json()

    assert "phase73_smtp_dispatch_observed" in rendered
    assert "safe_status" in rendered
    assert "local_outbox" in rendered  # fallback_provider value is safe to keep
    _assert_phase73_markers_absent(rendered)


def test_operations_dashboard_does_not_expose_raw_tenant_id(db: OrmSession) -> None:
    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()

    student = _user(
        db,
        email="student-phase73-tenant@example.test",
        role=UserRole.STUDENT.value,
    )
    admin = _user(
        db,
        email="admin-phase73-tenant@example.test",
        role=UserRole.ADMIN.value,
    )
    student.tenant_id = tenant_a
    admin.tenant_id = tenant_b
    db.commit()

    dashboard = build_operations_dashboard(
        db, readiness_report=_readiness(), settings=_pilot_settings()
    )
    rendered = dashboard.model_dump_json()

    assert str(tenant_a) not in rendered
    assert str(tenant_b) not in rendered


def test_phase32_invariants_still_hold(db: OrmSession) -> None:
    admin = _user(
        db,
        email="admin-phase73-regression@example.test",
        role=UserRole.ADMIN.value,
    )
    db.add(
        AuditEvent(
            actor_id=admin.id,
            actor_role=UserRole.ADMIN.value,
            action="phase73_zero_regression_check",
            resource_type="operations_readiness",
            resource_id="phase73",
            reason="admin_operations",
            status="ok",
            metadata_summary={
                "safe_status": "pass",
                "student_email": "student.demo@beyou.local",
                "student_id": "student-id-raw",
                "provider_subject": "provider-subject-raw",
                "raw_claims": {"groups": ["teacher"]},
                "private_note": "private_note",
                "sos_note": "sos_note",
                "transcript": "transcript",
                "export_url": "https://unsafe.example/export",
                "risk_leaderboard": "xếp hạng nguy cơ",
            },
            is_demo=True,
        )
    )
    db.commit()

    dashboard = build_operations_dashboard(
        db, readiness_report=_readiness(), settings=_pilot_settings()
    )
    rendered = dashboard.model_dump_json()

    for marker in PHASE32_FORBIDDEN_BACKEND_MARKERS:
        assert marker not in rendered, f"Phase 32 invariant regressed: {marker!r}"
    assert "phase73_zero_regression_check" in rendered


def test_phase73_forbidden_markers_present_in_operations_sanitizer_source() -> None:
    """Forward-compat assertion: sanitizer key set covers Phase 73 markers."""
    for required in ("smtp_username", "smtp_password", "changeme", "tenant_id"):
        assert required in OPERATIONS_FORBIDDEN_METADATA_KEYS
