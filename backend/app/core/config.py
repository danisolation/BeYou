import re
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

RuntimeMode = Literal["local_demo", "public_demo", "production_pilot"]

SAFE_PROVIDER_VALUE_RE = re.compile(r"^[a-z][a-z0-9_]{0,95}$")
FORBIDDEN_PROVIDER_MARKERS = {
    "access_token",
    "callback",
    "callback_url",
    "class",
    "claim",
    "client",
    "client_id",
    "client_secret",
    "group",
    "groups",
    "http",
    "id_token",
    "issuer",
    "issuer_url",
    "password_hash",
    "provider_subject",
    "raw_claim",
    "raw_subject",
    "refresh_token",
    "school",
    "secret",
    "tenant",
    "tenant_url",
    "token",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql+psycopg://beyou:beyou_dev_password@localhost:15432/beyou",
        validation_alias="DATABASE_URL",
    )
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    session_cookie_name: str = Field(default="beyou_session", validation_alias="SESSION_COOKIE_NAME")
    session_cookie_secure: bool = Field(default=False, validation_alias="SESSION_COOKIE_SECURE")
    session_cookie_samesite: str = Field(default="lax", validation_alias="SESSION_COOKIE_SAMESITE")
    session_max_age_seconds: int = Field(default=86400, validation_alias="SESSION_MAX_AGE_SECONDS")
    frontend_origin: str = Field(default="http://localhost:3000", validation_alias="FRONTEND_ORIGIN")
    frontend_origins: str = Field(default="", validation_alias="FRONTEND_ORIGINS")
    runtime_mode: RuntimeMode = Field(default="local_demo", validation_alias="RUNTIME_MODE")
    allow_demo_seed: bool = Field(default=True, validation_alias="ALLOW_DEMO_SEED")
    allow_demo_login: bool = Field(default=True, validation_alias="ALLOW_DEMO_LOGIN")
    chat_provider: str = Field(default="fallback", validation_alias="CHAT_PROVIDER")
    freemodel_api_key: str = Field(default="", validation_alias="FREEMODEL_API_KEY")
    freemodel_base_url: str = Field(
        default="https://freemodel.dev/api/v1",
        validation_alias="FREEMODEL_BASE_URL",
    )
    freemodel_model: str = Field(default="freemodel-default", validation_alias="FREEMODEL_MODEL")
    freemodel_timeout_seconds: float = Field(default=20.0, validation_alias="FREEMODEL_TIMEOUT_SECONDS")
    sos_email_provider: str = Field(default="disabled", validation_alias="SOS_EMAIL_PROVIDER")
    smtp_host: str = Field(default="", validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str = Field(default="", validation_alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", validation_alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="", validation_alias="SMTP_FROM")
    smtp_use_tls: bool = Field(default=True, validation_alias="SMTP_USE_TLS")
    smtp_timeout_seconds: float = Field(default=10.0, validation_alias="SMTP_TIMEOUT_SECONDS")
    auth_provider_enabled: bool = Field(default=False, validation_alias="AUTH_PROVIDER_ENABLED")
    auth_provider_key: str = Field(default="disabled", validation_alias="AUTH_PROVIDER_KEY")
    auth_provider_label: str = Field(default="Chưa cấu hình", validation_alias="AUTH_PROVIDER_LABEL")
    auth_provider_mode: str = Field(default="disabled", validation_alias="AUTH_PROVIDER_MODE")
    auth_provider_last_check_status: str | None = Field(
        default=None,
        validation_alias="AUTH_PROVIDER_LAST_CHECK_STATUS",
    )

    @field_validator("session_cookie_name")
    @classmethod
    def validate_session_cookie_name(cls, value: str) -> str:
        if not value:
            raise ValueError("SESSION_COOKIE_NAME cannot be empty")
        return value

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return f"postgresql+psycopg://{value.removeprefix('postgres://')}"
        if value.startswith("postgresql://"):
            return f"postgresql+psycopg://{value.removeprefix('postgresql://')}"
        return value

    @field_validator("session_cookie_samesite")
    @classmethod
    def validate_session_cookie_samesite(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("SESSION_COOKIE_SAMESITE must be lax, strict, or none")
        return normalized

    @field_validator("frontend_origin")
    @classmethod
    def validate_frontend_origin(cls, value: str) -> str:
        return cls._validate_origin(value, "FRONTEND_ORIGIN")

    @field_validator("frontend_origins")
    @classmethod
    def validate_frontend_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        for origin in origins:
            cls._validate_origin(origin, "FRONTEND_ORIGINS")
        return ",".join(origins)

    @field_validator("chat_provider")
    @classmethod
    def validate_chat_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"fallback", "freemodel"}:
            raise ValueError("CHAT_PROVIDER must be fallback or freemodel")
        return normalized

    @field_validator("sos_email_provider")
    @classmethod
    def validate_sos_email_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"disabled", "local_outbox", "smtp"}:
            raise ValueError("SOS_EMAIL_PROVIDER must be disabled, local_outbox, or smtp")
        return normalized

    @field_validator("auth_provider_key", "auth_provider_mode")
    @classmethod
    def validate_auth_provider_enum_metadata(cls, value: str) -> str:
        normalized = value.strip().lower().replace("-", "_")
        cls._reject_unsafe_provider_metadata(normalized)
        if not SAFE_PROVIDER_VALUE_RE.fullmatch(normalized):
            raise ValueError("Auth provider key and mode must be safe enum-like metadata")
        return normalized

    @field_validator("auth_provider_label", "auth_provider_last_check_status")
    @classmethod
    def validate_auth_provider_safe_string(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        if not normalized:
            return normalized
        cls._reject_unsafe_provider_metadata(normalized)
        return normalized

    @staticmethod
    def _validate_origin(value: str, field_name: str) -> str:
        if value.endswith("/"):
            raise ValueError(f"{field_name} must contain exact origins without trailing slashes")
        if "*" in value:
            raise ValueError(f"{field_name} cannot contain wildcards when credentials are enabled")
        return value

    @staticmethod
    def _reject_unsafe_provider_metadata(value: str) -> None:
        normalized = value.strip().lower()
        compact = normalized.replace("-", "_").replace(" ", "_")
        if not normalized:
            return
        if any(marker in compact for marker in FORBIDDEN_PROVIDER_MARKERS):
            raise ValueError("Auth provider metadata cannot contain secret, token, claim, or raw identity markers")
        if any(symbol in normalized for symbol in ("://", "/", "\\", "@", "?", "#")):
            raise ValueError("Auth provider metadata cannot contain URLs, emails, or path-like values")
        if re.search(r"\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b", normalized):
            raise ValueError("Auth provider metadata cannot contain raw domains")
        if re.search(r"\$argon2(?:id|i|d)\$", normalized) or re.search(
            r"\beyJ[A-Za-z0-9_-]{10,}\b",
            value,
        ):
            raise ValueError("Auth provider metadata cannot contain password hashes or token-like values")

    @property
    def allowed_frontend_origins(self) -> list[str]:
        origins = [self.frontend_origin]
        origins.extend(origin for origin in self.frontend_origins.split(",") if origin)
        return list(dict.fromkeys(origins))

    @property
    def is_local_demo(self) -> bool:
        return self.runtime_mode == "local_demo"

    @property
    def is_public_demo(self) -> bool:
        return self.runtime_mode == "public_demo"

    @property
    def is_production_pilot(self) -> bool:
        return self.runtime_mode == "production_pilot"

    @property
    def is_demo_runtime(self) -> bool:
        return self.runtime_mode in {"local_demo", "public_demo"}

    def validate_cookie_prefix_rules(self) -> None:
        if self.session_cookie_name.startswith("__Host-") and not self.session_cookie_secure:
            raise ValueError(
                "SESSION_COOKIE_NAME values starting with __Host- require SESSION_COOKIE_SECURE=true"
            )
        if self.session_cookie_samesite == "none" and not self.session_cookie_secure:
            raise ValueError("SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_cookie_prefix_rules()
    return settings
