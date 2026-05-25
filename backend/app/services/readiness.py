from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.orm import Session as OrmSession

from app.core.config import Settings
from app.schemas.readiness import (
    PublicReadinessResponse,
    ReadinessCheck,
    ReadinessCheckStatus,
    ReadinessOverallStatus,
    ReadinessReport,
)

PRODUCTION_ENVIRONMENTS = {"production", "prod"}
PLACEHOLDER_TOKENS = {"", "changeme", "change-me", "replace-me", "placeholder", "secret", "test"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_production(settings: Settings) -> bool:
    return settings.environment.strip().lower() in PRODUCTION_ENVIRONMENTS


def _safe_check(
    *,
    key: str,
    category: str,
    status: ReadinessCheckStatus,
    summary: str,
    remediation: str | None = None,
) -> ReadinessCheck:
    return ReadinessCheck(
        key=key,
        category=category,
        status=status,
        summary=summary,
        remediation=remediation,
    )


def _has_placeholder_value(value: str) -> bool:
    normalized = value.strip().lower()
    return normalized in PLACEHOLDER_TOKENS or normalized.startswith("changeme")


def _origin_is_local(origin: str) -> bool:
    return (
        origin.startswith("http://localhost")
        or origin.startswith("https://localhost")
        or origin.startswith("http://127.0.0.1")
        or origin.startswith("https://127.0.0.1")
    )


def _origin_is_https(origin: str) -> bool:
    return origin.startswith("https://")


def evaluate_static_readiness_checks(settings: Settings) -> list[ReadinessCheck]:
    is_production = _is_production(settings)
    checks: list[ReadinessCheck] = []

    if is_production:
        checks.append(
            _safe_check(
                key="config_environment",
                category="configuration",
                status="pass",
                summary="Environment is set for production readiness checks.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="config_environment",
                category="configuration",
                status="warn",
                summary="Environment is not production.",
                remediation="Set production environment mode before using Peerlight AI with real student data.",
            )
        )

    database_url_lower = settings.database_url.lower()
    database_looks_development = (
        "localhost" in database_url_lower
        or "127.0.0.1" in database_url_lower
        or "beyou_dev_password" in database_url_lower
    )
    if is_production and database_looks_development:
        checks.append(
            _safe_check(
                key="config_database_url",
                category="configuration",
                status="fail",
                summary="Database configuration appears to use local or demo defaults.",
                remediation="Use a production database URL and rotate any default development password.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="config_database_url",
                category="configuration",
                status="pass",
                summary="Database configuration does not expose unsafe details in readiness output.",
            )
        )

    if is_production and settings.allow_demo_seed:
        checks.append(
            _safe_check(
                key="config_demo_seed",
                category="configuration",
                status="fail",
                summary="Demo seeding is enabled in production.",
                remediation="Disable demo seeding before production launch.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="config_demo_seed",
                category="configuration",
                status="pass",
                summary="Demo seeding is not enabled unsafely for this environment.",
            )
        )

    allowed_origins = settings.allowed_frontend_origins
    wildcard_origins = [origin for origin in allowed_origins if "*" in origin]
    local_origins = [origin for origin in allowed_origins if _origin_is_local(origin)]
    non_https_origins = [origin for origin in allowed_origins if not _origin_is_https(origin)]
    if wildcard_origins:
        checks.append(
            _safe_check(
                key="origin_security",
                category="security",
                status="fail",
                summary="Credentialed CORS origins include a wildcard.",
                remediation="Use exact frontend origins only when credentials are enabled.",
            )
        )
    elif is_production and (local_origins or non_https_origins):
        checks.append(
            _safe_check(
                key="origin_security",
                category="security",
                status="fail",
                summary="Production frontend origins include local or non-HTTPS values.",
                remediation="Configure explicit HTTPS production frontend origins.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="origin_security",
                category="security",
                status="pass",
                summary="Credentialed CORS origins are explicit and appropriate for this environment.",
            )
        )

    if settings.session_max_age_seconds <= 0:
        checks.append(
            _safe_check(
                key="cookie_session_lifetime",
                category="security",
                status="fail",
                summary="Session lifetime is not positive.",
                remediation="Set the session lifetime to a positive value.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="cookie_session_lifetime",
                category="security",
                status="pass",
                summary="Session lifetime is positive.",
            )
        )

    if is_production and not settings.session_cookie_secure:
        checks.append(
            _safe_check(
                key="cookie_security",
                category="security",
                status="fail",
                summary="Production session cookies are not marked Secure.",
                remediation="Enable Secure on production session cookies behind HTTPS.",
            )
        )
    elif not is_production and not settings.session_cookie_secure:
        checks.append(
            _safe_check(
                key="cookie_security",
                category="security",
                status="warn",
                summary="Session cookies are not Secure in this non-production environment.",
                remediation="Enable Secure on production session cookies for HTTPS deployments.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="cookie_security",
                category="security",
                status="pass",
                summary="Session cookie Secure setting matches the environment.",
            )
        )

    if settings.chat_provider == "freemodel" and _has_placeholder_value(settings.freemodel_api_key):
        checks.append(
            _safe_check(
                key="provider_secrets",
                category="configuration",
                status="fail" if is_production else "warn",
                summary="Configured chatbot provider is missing a usable backend API key.",
                remediation="Configure the backend provider API key and never expose it in frontend code.",
            )
        )
    elif is_production and settings.chat_provider == "fallback":
        checks.append(
            _safe_check(
                key="provider_secrets",
                category="configuration",
                status="warn",
                summary="Production is using the fallback chatbot provider.",
                remediation="Confirm this is intentional or configure the production LLM provider.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="provider_secrets",
                category="configuration",
                status="pass",
                summary="Provider secret requirements are satisfied for the configured mode.",
            )
        )

    if settings.sos_email_provider == "smtp":
        missing_smtp_config = not settings.smtp_host.strip() or not settings.smtp_from.strip()
        if missing_smtp_config:
            checks.append(
                _safe_check(
                    key="sos_email_readiness",
                    category="configuration",
                    status="fail" if is_production else "warn",
                    summary="SOS email SMTP mode is missing required backend sender configuration.",
                    remediation="Configure backend SMTP host and sender before enabling production email delivery.",
                )
            )
        else:
            checks.append(
                _safe_check(
                    key="sos_email_readiness",
                    category="configuration",
                    status="pass",
                    summary="SOS email SMTP configuration has required backend sender fields.",
                )
            )
    elif settings.sos_email_provider == "local_outbox" and is_production:
        checks.append(
            _safe_check(
                key="sos_email_readiness",
                category="configuration",
                status="warn",
                summary="SOS email is configured for local outbox in production.",
                remediation="Use SMTP mode for real external email delivery, or confirm email is intentionally simulated.",
            )
        )
    else:
        checks.append(
            _safe_check(
                key="sos_email_readiness",
                category="configuration",
                status="pass",
                summary="SOS email provider mode is safe for this environment.",
            )
        )

    return checks


def _database_connectivity_check(db: OrmSession) -> ReadinessCheck:
    try:
        db.execute(text("SELECT 1")).scalar_one()
    except Exception:
        return _safe_check(
            key="database_connectivity",
            category="database",
            status="fail",
            summary="Database connectivity check failed.",
            remediation="Verify DATABASE_URL, network access, credentials, and database availability.",
        )

    return _safe_check(
        key="database_connectivity",
        category="database",
        status="pass",
        summary="Database connectivity check succeeded.",
    )


def _alembic_config(settings: Settings) -> Config:
    backend_dir = Path(__file__).resolve().parents[2]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", settings.database_url)
    return config


def _migration_check(db: OrmSession, settings: Settings) -> ReadinessCheck:
    try:
        script = ScriptDirectory.from_config(_alembic_config(settings))
        head_revision = script.get_current_head()
        current_revision = MigrationContext.configure(db.connection()).get_current_revision()
    except Exception:
        return _safe_check(
            key="alembic_migration",
            category="database",
            status="fail",
            summary="Migration readiness check could not be completed.",
            remediation="Verify Alembic configuration and the database migration version table.",
        )

    if current_revision is None:
        return _safe_check(
            key="alembic_migration",
            category="database",
            status="fail",
            summary="Database has no recorded Alembic revision.",
            remediation="Run alembic upgrade head before launch.",
        )
    if current_revision != head_revision:
        return _safe_check(
            key="alembic_migration",
            category="database",
            status="fail",
            summary="Database migration revision is not at head.",
            remediation="Run alembic upgrade head and re-check readiness.",
        )

    return _safe_check(
        key="alembic_migration",
        category="database",
        status="pass",
        summary="Database migration revision is at Alembic head.",
    )


def _overall_status(checks: list[ReadinessCheck]) -> ReadinessOverallStatus:
    statuses = {check.status for check in checks}
    if "fail" in statuses:
        return "not_ready"
    if "warn" in statuses:
        return "degraded"
    return "ready"


def build_readiness_report(db: OrmSession, settings: Settings) -> ReadinessReport:
    checks = [
        *evaluate_static_readiness_checks(settings),
        _database_connectivity_check(db),
        _migration_check(db, settings),
    ]
    return ReadinessReport(
        status=_overall_status(checks),
        generated_at=_now(),
        checks=checks,
    )


def public_readiness_from_report(report: ReadinessReport) -> PublicReadinessResponse:
    return PublicReadinessResponse(status=report.status, generated_at=report.generated_at)


def readiness_http_status(report: ReadinessReport) -> int:
    return 503 if report.status == "not_ready" else 200

