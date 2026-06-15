import os
import pytest
from app.core.config import get_settings


os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("RUNTIME_MODE", "public_demo")
os.environ.setdefault("SESSION_COOKIE_NAME", "beyou_session")
os.environ.setdefault("SESSION_COOKIE_SECURE", "false")


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
