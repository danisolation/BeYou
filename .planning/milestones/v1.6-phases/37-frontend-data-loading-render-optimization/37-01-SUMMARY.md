---
phase: 37-frontend-data-loading-render-optimization
plan: 01
subsystem: frontend
tags: [nextjs, vitest, dashboard-loading, no-store, aggregate-evidence]
requires:
  - phase: 33-cross-role-ui-performance-baseline-audit
    provides: Aggregate-only frontend route/build evidence helper
  - phase: 34-shared-ui-primitives-role-shell-harmonization
    provides: Shared authenticated shell and UI primitive guardrails
provides:
  - Neutral no-store dashboard read helper
  - Optional dashboard result pattern for scoped supplemental failures
  - Dashboard GET wrappers routed through explicit no-store reads
  - Phase 37 aggregate request counting for generic and imported helper calls
affects: [phase-37-role-dashboard-loaders, phase-38-performance-evidence]
tech-stack:
  added: []
  patterns:
    - Credentialed dashboard reads delegate to apiFetch while setting cache no-store
    - Optional dashboard failures return typed unavailable states
    - Frontend evidence follows bounded local imports for aggregate request counts
key-files:
  created:
    - frontend/lib/dashboard-loading.ts
    - frontend/tests/phase37-dashboard-loading.test.tsx
  modified:
    - frontend/lib/sos-api.ts
    - frontend/lib/notification-preferences-api.ts
    - frontend/lib/admin-api.ts
    - frontend/scripts/phase33-frontend-baseline.mjs
    - frontend/scripts/phase33-frontend-baseline.test.mjs
key-decisions:
  - "Keep credentials owned by apiFetch while dashboardRead adds cache: no-store for dashboard reads."
  - "Represent supplemental dashboard failures as typed unavailable states instead of empty success values."
  - "Keep route evidence aggregate-only while counting imported neutral helper request calls."
patterns-established:
  - "Use dashboardRead<T>(path) for dashboard GET helpers that need explicit no-store semantics."
  - "Use optionalDashboardRead for non-primary dashboard panels that can fail independently."
requirements-completed:
  - FEPERF-01
  - FEPERF-03
  - FEPERF-04
  - FEPERF-05
duration: 8 min
completed: 2026-05-27
---

# Phase 37 Plan 01: Dashboard Loading Foundation Summary

**Credentialed no-store dashboard read helpers with typed optional states and aggregate request evidence counting**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-27T04:22:00Z
- **Completed:** 2026-05-27T04:30:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added `dashboardRead` and optional dashboard result helpers so role dashboards can separate primary data failures from supplemental unavailable panels.
- Routed existing SOS, notification preference, notification, and Admin read wrappers through `dashboardRead` while leaving mutations on `apiFetch`.
- Updated Phase 33 frontend baseline evidence to count generic `apiFetch<T>`, `dashboardRead<T>`, direct `fetch`, and bounded imported helper calls without adding unsafe output keys.
- Added Phase 37 helper tests covering no-store credentials, optional unavailable results, browser-storage/token redlines, and aggregate-only route evidence.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add neutral no-store dashboard read helpers and tests** - `956a509` (feat)
2. **Task 2: Route existing dashboard GET helpers through dashboardRead** - `19c0429` (perf)
3. **Task 3: Update aggregate frontend route evidence counting** - `0c9c88d` (test)

**Plan metadata:** pending in docs commit.

## Files Created/Modified

- `frontend/lib/dashboard-loading.ts` - Neutral dashboard read and optional-result helper foundation.
- `frontend/tests/phase37-dashboard-loading.test.tsx` - Focused helper/no-store/privacy redline tests.
- `frontend/lib/sos-api.ts` - Dashboard SOS/support/notification reads now use `dashboardRead`.
- `frontend/lib/notification-preferences-api.ts` - Student preference/reminder reads now use `dashboardRead`.
- `frontend/lib/admin-api.ts` - Admin user/link reads now use `dashboardRead`.
- `frontend/scripts/phase33-frontend-baseline.mjs` - Aggregate route evidence counts generic and imported helper calls.
- `frontend/scripts/phase33-frontend-baseline.test.mjs` - Phase 37 evidence-counting regression coverage.

## Decisions Made

- `dashboardRead` keeps no-store localized to dashboard reads and does not take over credential handling from `apiFetch`.
- Supplemental dashboard reads use a typed unavailable state so later role pages do not confuse failed optional panels with empty success.
- The frontend baseline helper follows only local `@/` and relative imports with bounded recursion and a visited set.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Wave 2 can build Student, Teacher/Parent, and Admin loaders on top of `dashboardRead`, `optionalDashboardRead`, and the updated aggregate evidence helper.

---
*Phase: 37-frontend-data-loading-render-optimization*
*Completed: 2026-05-27*
