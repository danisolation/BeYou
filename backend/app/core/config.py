from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql+psycopg://beyou:beyou_dev_password@localhost:15432/beyou",
        validation_alias="DATABASE_URL",
    )
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    session_cookie_name: str = Field(default="beyou_session", validation_alias="SESSION_COOKIE_NAME")
    session_cookie_secure: bool = Field(default=False, validation_alias="SESSION_COOKIE_SECURE")
    session_max_age_seconds: int = Field(default=86400, validation_alias="SESSION_MAX_AGE_SECONDS")
    frontend_origin: str = Field(default="http://localhost:3000", validation_alias="FRONTEND_ORIGIN")
    frontend_origins: str = Field(default="", validation_alias="FRONTEND_ORIGINS")
    allow_demo_seed: bool = Field(default=True, validation_alias="ALLOW_DEMO_SEED")

    @field_validator("session_cookie_name")
    @classmethod
    def validate_session_cookie_name(cls, value: str) -> str:
        if not value:
            raise ValueError("SESSION_COOKIE_NAME cannot be empty")
        return value

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

    @staticmethod
    def _validate_origin(value: str, field_name: str) -> str:
        if value.endswith("/"):
            raise ValueError(f"{field_name} must contain exact origins without trailing slashes")
        if "*" in value:
            raise ValueError(f"{field_name} cannot contain wildcards when credentials are enabled")
        return value

    @property
    def allowed_frontend_origins(self) -> list[str]:
        origins = [self.frontend_origin]
        origins.extend(origin for origin in self.frontend_origins.split(",") if origin)
        return list(dict.fromkeys(origins))

    def validate_cookie_prefix_rules(self) -> None:
        if self.session_cookie_name.startswith("__Host-") and not self.session_cookie_secure:
            raise ValueError(
                "SESSION_COOKIE_NAME values starting with __Host- require SESSION_COOKIE_SECURE=true"
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_cookie_prefix_rules()
    return settings
