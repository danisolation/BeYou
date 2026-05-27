---
phase: 37-frontend-data-loading-render-optimization
reviewed: 2026-05-27T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - frontend/app/(authenticated)/admin/page.tsx
  - frontend/app/(authenticated)/parent/page.tsx
  - frontend/app/(authenticated)/student/page.tsx
  - frontend/app/(authenticated)/teacher/page.tsx
  - frontend/components/adult-student-list.tsx
  - frontend/lib/admin-api.ts
  - frontend/lib/adult-dashboard-loader.ts
  - frontend/lib/dashboard-loading.ts
  - frontend/lib/notification-preferences-api.ts
  - frontend/lib/sos-api.ts
  - frontend/lib/student-dashboard-loader.ts
  - frontend/scripts/phase33-frontend-baseline.mjs
  - frontend/scripts/phase33-frontend-baseline.test.mjs
  - frontend/tests/phase34-final-regression.test.tsx
  - frontend/tests/phase35-role-dashboard-consistency.test.tsx
  - frontend/tests/phase37-admin-dashboard-loading.test.tsx
  - frontend/tests/phase37-adult-dashboard-loading.test.tsx
  - frontend/tests/phase37-dashboard-loading.test.tsx
  - frontend/tests/phase37-frontend-integration.test.tsx
  - frontend/tests/phase37-student-dashboard-loading.test.tsx
  - frontend/tests/role-dashboards.test.tsx
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 37: Code Review Report

**Reviewed:** 2026-05-27T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed the Phase 37 frontend data loading/render optimization changes for dashboard loading boundaries, credentialed/no-store reads, privacy regressions, adult/admin visibility posture, safe internal navigation, role import boundaries, and aggregate-only frontend evidence helpers.

No critical security issues were found. One warning was identified: the shared `dashboardRead` helper defaults to `cache: "no-store"` but still allows callers to override it, weakening the Phase 37 invariant that dashboard reads must always be no-store.

## Warnings

### WR-01: `dashboardRead` does not enforce `no-store` if callers pass a cache option

**File:** `frontend/lib/dashboard-loading.ts:5-6`

**Issue:** `dashboardRead` currently merges `DASHBOARD_READ_INIT` before `init`:

```ts
return apiFetch<T>(path, { ...DASHBOARD_READ_INIT, ...init, headers: init.headers });
```

This means any future caller can pass `{ cache: "force-cache" }` or another cache mode and silently disable the dashboard `no-store` requirement. Because these dashboard reads can include student/adult/admin-sensitive data, the helper should enforce `no-store`, not merely default to it.

**Fix:**

```ts
export async function dashboardRead<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    ...DASHBOARD_READ_INIT,
    headers: init.headers,
  });
}
```

This preserves caller-provided options while making `cache: "no-store"` non-overridable through the dashboard helper. `apiFetch` already enforces `credentials: "include"`.

---

_Reviewed: 2026-05-27T00:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
