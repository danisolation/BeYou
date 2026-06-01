# Quick Task 260601-brk: Fix iOS/macOS Safari Login - Summary

**Completed:** 2026-06-01
**Commit:** a39c28b

## Problem

Safari on iOS/macOS sometimes omits both `Origin` and `Sec-Fetch-Site` headers on cross-site POST requests. The `require_same_site_mutation` CSRF check in `backend/app/core/sessions.py` blocked these requests with 403, preventing login.

## Solution

Added a 3-tier CSRF validation with Referer-based fallback:

1. **Origin header** (existing) → validate against allowlist
2. **Sec-Fetch-Site header** (improved) → explicit reject on `cross-site`/`none`, pass on `same-origin`/`same-site`
3. **Referer fallback** (NEW) → parse origin from Referer URL, validate against allowlist
4. **All missing** → block (defense in depth)

## Files Modified

| File | Change |
|------|--------|
| `backend/app/core/sessions.py` | Added `urlparse` import, rewrote `require_same_site_mutation` with Referer fallback |
| `backend/tests/test_safari_csrf_fallback.py` | 15 unit tests covering all CSRF check scenarios |

## Security

- CSRF protection maintained: evil Origin/Referer still blocked (403)
- All-headers-missing still blocked (403)
- Referer cannot be spoofed by cross-origin browser requests (browser enforced)
- Combined with `SameSite=Lax`/`SameSite=None; Secure` cookie, CSRF remains fully mitigated
