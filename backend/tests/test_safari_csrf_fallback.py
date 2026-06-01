"""Tests for Safari/iOS CSRF fallback in require_same_site_mutation.

Safari on iOS/macOS may omit both Origin and Sec-Fetch-Site headers on
same-site POST requests. The Referer-based fallback ensures these users
can still authenticate while maintaining CSRF protection.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.sessions import require_same_site_mutation

ALLOWED_ORIGINS = ["http://localhost:3000", "https://beyou-frontend.vercel.app"]


def _mock_settings():
    settings = MagicMock()
    settings.allowed_frontend_origins = ALLOWED_ORIGINS
    return settings


def _mock_request(method: str = "POST", headers: dict | None = None):
    request = MagicMock()
    request.method = method
    request.headers = headers or {}
    return request


class TestSafeMethods:
    """GET/HEAD/OPTIONS/TRACE always pass regardless of headers."""

    @pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS", "TRACE"])
    def test_safe_methods_always_pass(self, method: str):
        request = _mock_request(method=method, headers={})
        require_same_site_mutation(request, _mock_settings())


class TestOriginHeader:
    """When Origin is present, validate against allowlist."""

    def test_valid_origin_passes(self):
        request = _mock_request(headers={"origin": "http://localhost:3000"})
        require_same_site_mutation(request, _mock_settings())

    def test_evil_origin_blocked(self):
        request = _mock_request(headers={"origin": "https://evil.com"})
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403


class TestSecFetchSite:
    """When Origin is absent but Sec-Fetch-Site is present."""

    def test_same_origin_passes(self):
        request = _mock_request(headers={"sec-fetch-site": "same-origin"})
        require_same_site_mutation(request, _mock_settings())

    def test_same_site_passes(self):
        request = _mock_request(headers={"sec-fetch-site": "same-site"})
        require_same_site_mutation(request, _mock_settings())

    def test_cross_site_blocked(self):
        request = _mock_request(headers={"sec-fetch-site": "cross-site"})
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403

    def test_none_value_blocked(self):
        request = _mock_request(headers={"sec-fetch-site": "none"})
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403


class TestRefererFallback:
    """Safari fallback: no Origin, no Sec-Fetch-Site, use Referer."""

    def test_valid_referer_passes(self):
        request = _mock_request(headers={
            "referer": "https://beyou-frontend.vercel.app/student/dashboard"
        })
        require_same_site_mutation(request, _mock_settings())

    def test_valid_referer_localhost_passes(self):
        request = _mock_request(headers={
            "referer": "http://localhost:3000/login"
        })
        require_same_site_mutation(request, _mock_settings())

    def test_evil_referer_blocked(self):
        request = _mock_request(headers={
            "referer": "https://evil.com/phishing"
        })
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403

    def test_no_headers_at_all_blocked(self):
        """All signals missing → block (defense in depth)."""
        request = _mock_request(headers={})
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403

    def test_referer_with_port_mismatch_blocked(self):
        request = _mock_request(headers={
            "referer": "http://localhost:9999/page"
        })
        with pytest.raises(HTTPException) as exc_info:
            require_same_site_mutation(request, _mock_settings())
        assert exc_info.value.status_code == 403
