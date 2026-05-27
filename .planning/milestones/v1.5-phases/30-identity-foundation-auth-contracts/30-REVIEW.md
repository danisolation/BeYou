---
phase: 30-identity-foundation-auth-contracts
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 23
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
fixed_findings:
  critical: 1
  warning: 1
status: clean
---

# Phase 30: Code Review Report

**Reviewed:** 2026-05-26T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** clean after fixes

## Summary

Reviewed Phase 30 identity/auth contract changes across backend session/auth models, readiness/admin operations metadata, external identity resolution, frontend login/admin operations UI, and tests.

Backend-owned HttpOnly sessions remain the auth contract, and no browser token storage was introduced. External identity resolution does not auto-create users or auto-merge email-based accounts. The two review findings below were fixed before phase verification.

## Fixed Critical Issues

### CR-01: Admin operations sanitizer can leak sensitive values inside allowed metadata keys

**File:** `backend/app/services/admin_operations.py`

**Issue:** `_safe_metadata()` removes forbidden metadata keys, but it returns string values unchanged. If an audit event stores sensitive content under an allowed-looking key, such as `{"safe_value": "student@example.edu"}` or `{"details": "access_token=..."}`, the operations dashboard can expose it. This violates the Phase 30 invariant that admin operations metadata must not expose raw emails, raw claims/groups, tokens, cookie values, provider domains, or raw identity data.

**Resolution:** `_safe_metadata()` now recursively sanitizes string and non-primitive values with `_unsafe_operation_text()` and drops unsafe-looking keys. Backend regression coverage now seeds sensitive values under safe-looking keys and confirms they are replaced with `metadata_an_toan` instead of being rendered.

## Fixed Warnings

### WR-01: Login page fails open and shows demo shortcuts when capabilities are unknown

**File:** `frontend/app/login/page.tsx`

**Issue:** `publicDemoEntryEnabled` defaults to enabled while `/api/auth/capabilities` is loading or if the request fails. In production pilot, a transient capabilities failure still shows public demo role shortcuts and prefill controls. Backend login remains blocked, so this is not an auth bypass, but it weakens the Phase 30 safety invariant that production pilot can disable public demo entry safely.

**Resolution:** Login demo shortcuts now render only after capabilities explicitly return `public_demo_entry_enabled: true`. Loading and unavailable states hide shortcuts while preserving email/password login. Frontend regression coverage verifies failure keeps demo shortcuts hidden and does not introduce token storage.

---

_Reviewed: 2026-05-26T00:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_

## REVIEW COMPLETE
