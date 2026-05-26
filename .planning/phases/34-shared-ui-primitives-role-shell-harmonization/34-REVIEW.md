---
phase: 34-shared-ui-primitives-role-shell-harmonization
review_type: code
status: findings
files_reviewed: 13
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
created: 2026-05-26
---

# Phase 34: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 13
**Status:** findings

## Summary

Reviewed the Phase 34 source and test files covering shared UI primitives, authenticated role shell harmonization, adult shared presentation, Student/Admin primitive adoption, and regression tests.

The shared primitives remain presentation-only, Parent no longer imports shared presentation through the Teacher route, role shell ownership remains in `AuthenticatedLayout`, Student SOS red semantics and confirmation copy are preserved, and Admin dashboard additions stay metadata-oriented.

One meaningful reliability issue was found: several dashboards suppress or mishandle primary load failures, causing rejected promises and misleading empty/default UI instead of an explicit error state.

## Warnings

### WR-01: Dashboard initial-load failures are not caught and can render misleading empty/default UI

**Files:**

- `frontend/app/(authenticated)/admin/page.tsx:18-24`
- `frontend/app/(authenticated)/student/page.tsx:59-70`
- `frontend/app/(authenticated)/teacher/page.tsx:21-32`
- `frontend/app/(authenticated)/parent/page.tsx:21-32`

**Issue:**
Each dashboard starts a `Promise.all(...)` in `useEffect()` and only attaches `.then(...).finally(...)`, without a `.catch(...)` for the primary route-owned API request. If `/api/student/profile`, `/api/teacher/students`, `/api/parent/students`, or either Admin count request fails, the promise rejects, the page exits loading, and the UI can show an empty/default state such as "no linked students" or zero Admin counts. This also risks an unhandled promise rejection in the browser.

**Impact:**
Users may see false "no data" or zero-count states during backend/session/network failures, which is especially risky for privacy/safety surfaces where absence of SOS/support data has meaning.

**Fix:**
Track load failure explicitly and render the shared `ErrorState` instead of falling through to empty/default UI. Apply the same pattern to Student, Parent, Teacher, and Admin dashboards. For Student specifically, avoid treating a failed profile load as `profile === null` empty state.

---

_Reviewed: 2026-05-26_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
