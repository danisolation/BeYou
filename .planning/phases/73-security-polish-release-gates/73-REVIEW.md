---
phase: 73-security-polish-release-gates
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - backend/tests/test_phase73_release_gates.py
  - frontend/tests/phase73-release-gates-ui.test.tsx
  - frontend/scripts/release-gates.test.mjs
  - README.md
  - backend/app/services/admin_operations.py
  - frontend/app/(authenticated)/admin/operations/page.tsx
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 73: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 6
**Status:** clean (2 informational notes)

## Summary

Phase 73 changes are scoped exactly as the D3 contract requires: zero new product surfaces, only sanitizer redlines (5 new forbidden markers in `OPERATIONS_FORBIDDEN_METADATA_KEYS`: `smtp_username`, `smtp_password`, `changeme`, `tenant_id`, `tenant_url`), one defense-in-depth frontend regex extension, three new release-gate test modules, and a README v2.4 section. No new routers, schemas, services, or UI components. No persistence changes. No router-level behavior changes.

The Peerlight AI privacy boundary is preserved end-to-end:

- Backend sanitizer drops the new markers at both the key level (`OPERATIONS_FORBIDDEN_METADATA_KEYS` membership at admin_operations.py:322) and the value level (substring check in `_unsafe_operation_text` at admin_operations.py:188).
- Frontend `forbiddenMetadataKeyPattern` and `unsafeMetadataValuePattern` (page.tsx:50-52) are extended to redact `tenant_id`/`tenant_url`/`smtp_password`/`smtp_username` keys and `changeme`/`smtp.{gmail,outlook,hotmail,office365}.com` values — defense-in-depth on top of backend redaction.
- Tests poison both the backend AuditEvent metadata and the frontend dashboard payload with raw credentials, recipient emails, SMTP hostnames, and synthetic tenant UUIDs, then assert these markers never reach the serialized JSON or the rendered DOM. Phase 32 invariants (`private_note`, `sos_note`, `transcript`, `risk_leaderboard`, `student.demo@beyou.local`, etc.) are explicitly re-asserted (`test_phase32_invariants_still_hold`, the `private_note|sos_note` DOM check) to prove zero regression.
- Nyquist-style coverage: each requirement (SECURE-01, NOTIFY-01/02, TENANT-01) is checked from multiple angles — backend serializer output, frontend DOM render, Node deploy/smoke gate sources, and README command matrix documentation.

No bugs, security issues, or privacy-boundary violations were identified. The defensive use of `any(marker in compact for marker in ...)` with the new markers is consistent with the Phase 32 pattern and correctly redacts both standalone `"changeme"` values and embedded occurrences. No raw student content, raw exports, risk leaderboards, per-student drilldowns, surveillance surfaces, or browser-token storage are introduced.

## Info

### IN-01: Test name does not match assertion

**File:** `backend/tests/test_phase73_release_gates.py:262`
**Issue:** The test `test_phase73_forbidden_markers_present_in_operations_sanitizer_source` is named as if it parsed the sanitizer source file, but its body only checks set membership against the imported `OPERATIONS_FORBIDDEN_METADATA_KEYS`. The docstring ("Forward-compat assertion: sanitizer key set covers Phase 73 markers") is accurate; the function name is mildly misleading.
**Fix:** Rename to `test_phase73_forbidden_markers_present_in_operations_sanitizer_set` (or similar) for clarity. Non-blocking — assertion behavior is correct.

### IN-02: Self-referential regex assertion has low signal

**File:** `frontend/scripts/release-gates.test.mjs:296-302` (the `LIVE_PILOT_CONSTRAINT_V24` test)
**Issue:** The test asserts `LIVE_PILOT_CONSTRAINT_V24` matches a regex that mirrors its own literal substring. This always passes as long as the constant is unchanged and provides little additional regression signal beyond the constant declaration itself.
**Fix:** Either drop the test or, preferably, assert that this exact constraint string appears in the Phase 73 README section and/or in `pilot-smoke.mjs` output guidance (parallel to how `LIVE_PILOT_CONSTRAINT` is searched in the test script source itself). Non-blocking.

---

_Reviewed: 2026-06-04_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
