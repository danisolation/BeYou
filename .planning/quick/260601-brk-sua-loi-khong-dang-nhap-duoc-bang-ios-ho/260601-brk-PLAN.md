---
phase: quick
plan: 260601-brk
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/app/core/sessions.py
  - backend/tests/test_safari_csrf_fallback.py
autonomous: true
must_haves:
  truths:
    - "iOS/macOS Safari users can log in successfully"
    - "Requests with valid Referer but no Origin/Sec-Fetch-Site pass CSRF check"
    - "Requests with no Origin, no Sec-Fetch-Site, AND no Referer are still blocked (403)"
    - "Requests with evil Origin are still blocked (403)"
    - "Existing behavior for Chrome/Firefox (Origin header present) is unchanged"
  artifacts:
    - path: "backend/app/core/sessions.py"
      provides: "Referer-based fallback in require_same_site_mutation"
      contains: "referer"
    - path: "backend/tests/test_safari_csrf_fallback.py"
      provides: "Unit tests covering Safari fallback scenarios"
  key_links:
    - from: "backend/app/core/sessions.py"
      to: "settings.allowed_frontend_origins"
      via: "Referer URL parsed to origin and checked against allowed list"
---

<objective>
Fix iOS/macOS Safari login failure caused by `require_same_site_mutation` blocking requests
when Safari omits both `Origin` and `Sec-Fetch-Site` headers.

Purpose: Safari (especially WKWebView and older versions) sometimes doesn't send Origin or
Sec-Fetch-Site on same-site POST requests. The current CSRF check rejects these as invalid,
preventing login on iOS devices.

Output: Patched `require_same_site_mutation` with Referer-based fallback + comprehensive tests.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@backend/app/core/sessions.py (lines 127-141 — the function to fix)
@backend/app/core/config.py (allowed_frontend_origins property)
@backend/tests/test_phase2_security_regression.py (existing CSRF test patterns)
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add Referer-based fallback to require_same_site_mutation</name>
  <files>backend/app/core/sessions.py, backend/tests/test_safari_csrf_fallback.py</files>
  <behavior>
    - Test: POST with valid Origin header → passes (existing behavior preserved)
    - Test: POST with evil Origin header → 403 (existing behavior preserved)
    - Test: POST with no Origin but sec-fetch-site=same-origin → passes (existing)
    - Test: POST with no Origin, no sec-fetch-site, but valid Referer (starts with allowed origin) → passes (NEW)
    - Test: POST with no Origin, no sec-fetch-site, Referer from evil domain → 403 (NEW)
    - Test: POST with no Origin, no sec-fetch-site, no Referer → 403 (NEW - all signals missing = block)
    - Test: GET requests always pass regardless of headers (existing)
  </behavior>
  <action>
1. Create `backend/tests/test_safari_csrf_fallback.py` with unit tests for `require_same_site_mutation`.
   Use `unittest.mock` to create a mock `Request` object and a mock `Settings` with
   `allowed_frontend_origins = ["http://localhost:3000", "https://beyou.example.com"]`.
   Test all scenarios in the behavior block above.

2. Modify `require_same_site_mutation` in `backend/app/core/sessions.py` (lines 127-141).
   After the existing `sec-fetch-site` check fails, add a Referer fallback:

   ```python
   from urllib.parse import urlparse
   ```

   Updated logic (replace lines 127-141):
   ```python
   def require_same_site_mutation(request: Request, settings: Settings) -> None:
       if request.method in {"GET", "HEAD", "OPTIONS", "TRACE"}:
           return

       origin = request.headers.get("origin")
       fetch_site = request.headers.get("sec-fetch-site")

       # Check 1: Origin header present → validate against allowlist
       if origin is not None:
           if origin not in settings.allowed_frontend_origins:
               raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")
           return

       # Check 2: Sec-Fetch-Site header present → validate same-origin/same-site
       if fetch_site is not None:
           if fetch_site in {"same-origin", "same-site"}:
               return
           raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")

       # Check 3: Referer fallback (Safari compatibility — may omit Origin and Sec-Fetch-Site)
       referer = request.headers.get("referer")
       if referer is not None:
           parsed = urlparse(referer)
           referer_origin = f"{parsed.scheme}://{parsed.netloc}"
           if referer_origin in settings.allowed_frontend_origins:
               return
           raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")

       # No Origin, no Sec-Fetch-Site, no Referer → block
       raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yêu cầu không hợp lệ.")
   ```

   Add `from urllib.parse import urlparse` to the imports at the top of the file.

   **Key behavioral change:** When `sec-fetch-site` is present but NOT same-origin/same-site,
   we now explicitly reject (previously it would fall through). When `sec-fetch-site` is None
   (absent), we now fall through to Referer check instead of rejecting.

   **Security note:** This maintains CSRF protection. The Referer header is sent by Safari on
   same-site navigations and is a well-established OWASP-recommended fallback. If ALL three
   headers are missing, we still block (defense in depth).
  </action>
  <verify>
    <automated>cd backend && python -m pytest tests/test_safari_csrf_fallback.py -v</automated>
  </verify>
  <done>
    - All 7+ test cases pass
    - Existing test suite still passes (no regression): `python -m pytest tests/test_phase2_security_regression.py -v`
    - Safari users with valid Referer can now authenticate
    - Malicious cross-site requests are still blocked
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | Browser sends mutation requests; CSRF protection validates origin |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-brk-01 | Spoofing | require_same_site_mutation | mitigate | Referer can be spoofed by attackers but NOT by cross-origin browser requests (browsers enforce Referer policy). Combined with SameSite=Lax cookie, CSRF remains mitigated. |
| T-brk-02 | Elevation | require_same_site_mutation | mitigate | Block when ALL signals (Origin, Sec-Fetch-Site, Referer) are absent — no silent pass-through |
| T-brk-03 | Tampering | Referer header | accept | Referer stripping (Referrer-Policy: no-referrer) would cause 403 — acceptable as this is an edge case and user can configure policy. Origin header takes priority when present. |
</threat_model>

<verification>
1. Run new tests: `cd backend && python -m pytest tests/test_safari_csrf_fallback.py -v`
2. Run existing security regression: `cd backend && python -m pytest tests/test_phase2_security_regression.py -v`
3. Full test suite passes: `cd backend && python -m pytest --tb=short`
</verification>

<success_criteria>
- iOS/macOS Safari login works (Referer fallback activates when Origin/Sec-Fetch-Site missing)
- Cross-site attacks still blocked (evil Referer → 403, no headers at all → 403)
- All existing tests pass without modification
- New test file covers all edge cases
</success_criteria>

<output>
After completion, create `.planning/quick/260601-brk-sua-loi-khong-dang-nhap-duoc-bang-ios-ho/260601-brk-SUMMARY.md`
</output>
