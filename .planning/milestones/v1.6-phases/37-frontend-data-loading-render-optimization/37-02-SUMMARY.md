---
phase: 37-frontend-data-loading-render-optimization
plan: 02
subsystem: frontend
tags: [nextjs, student-dashboard, no-store, optional-state, vitest]
requires:
  - phase: 37-frontend-data-loading-render-optimization
    provides: Plan 37-01 dashboardRead and optionalDashboardRead helpers
provides:
  - Typed Student dashboard loader with primary profile trust gate
  - Student dashboard skeleton and scoped unavailable UI
  - Student no-store and privacy redline regression tests
affects: [student-dashboard, phase-37-integration, phase-38-performance-evidence]
tech-stack:
  added: []
  patterns:
    - Primary dashboard reads fail loudly through ErrorState
    - Supplemental dashboard reads render local unavailable cards
    - Existing regression mocks track current reminder endpoint paths
key-files:
  created:
    - frontend/lib/student-dashboard-loader.ts
    - frontend/tests/phase37-student-dashboard-loading.test.tsx
  modified:
    - frontend/app/(authenticated)/student/page.tsx
    - frontend/tests/phase34-final-regression.test.tsx
    - frontend/tests/phase35-role-dashboard-consistency.test.tsx
key-decisions:
  - "Keep Student profile as the only primary load gate; SOS and reminder reads can fail locally."
  - "Use a non-sensitive Student skeleton that preserves legacy loading affordances while adding Phase 37 role-specific copy."
  - "Keep SOS confirmation copy and safeInternalHref reminder navigation unchanged."
patterns-established:
  - "Student route pages consume typed loader results rather than embedding dashboard Promise.all calls."
  - "Optional Student panels show explicit unavailable copy before rendering fallback empty data."
requirements-completed:
  - FEPERF-01
  - FEPERF-02
  - FEPERF-03
  - FEPERF-05
duration: 10 min
completed: 2026-05-27
---

# Phase 37 Plan 02: Student Dashboard Loading Summary

**Student dashboard loader with primary profile gating, scoped optional failure states, and no-store regression coverage**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-27T04:31:00Z
- **Completed:** 2026-05-27T04:41:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added `loadStudentDashboard` so Student profile remains the primary trust gate while SOS history and mood reminders return typed optional results.
- Reworked Student dashboard loading to show a non-sensitive skeleton and scoped unavailable cards for SOS/reminder failures.
- Preserved SOS confirmation, destructive red styling, and `safeInternalHref(moodReminder.href)` navigation behavior.
- Added focused Student tests for loading, optional failures, primary profile errors, no-store fetch options, and storage/token redlines.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add typed Student dashboard loader** - `a45c47a` (feat)
2. **Task 2: Render Student skeleton and scoped unavailable panels** - `d574b5c` (perf)
3. **Task 3: Add Student Phase 37 dashboard tests** - `274143e` (test)

**Plan metadata:** pending in docs commit.

## Files Created/Modified

- `frontend/lib/student-dashboard-loader.ts` - Student profile/SOS/reminder dashboard loader.
- `frontend/app/(authenticated)/student/page.tsx` - Student skeleton and optional unavailable rendering.
- `frontend/tests/phase37-student-dashboard-loading.test.tsx` - Student Phase 37 loading and no-store tests.
- `frontend/tests/phase34-final-regression.test.tsx` - Regression mock updated to the current reminder endpoint.
- `frontend/tests/phase35-role-dashboard-consistency.test.tsx` - Regression wait updated for the new Student skeleton-to-loaded flow.

## Decisions Made

- Do not catch the Student profile read in `loadStudentDashboard`; failed profile loads continue to render the primary `ErrorState`.
- Render SOS/reminder unavailable cards before their existing panels so users see scoped failure copy without hiding the rest of the dashboard.
- Preserve earlier loading regression compatibility by keeping generic `Đang tải thông tin...` copy inside the accessible loading status.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated prior dashboard regression mocks for the current reminder endpoint**
- **Found during:** Task 3 (Add Student Phase 37 dashboard tests)
- **Issue:** Older regression mocks still used a legacy mood reminder URL and could race against the new loader flow.
- **Fix:** Updated Phase 34/35 regression mocks to use `/api/student/reminders/mood-check-in` and waited for the loaded Student heading before asserting dashboard copy.
- **Files modified:** `frontend/tests/phase34-final-regression.test.tsx`, `frontend/tests/phase35-role-dashboard-consistency.test.tsx`
- **Verification:** `npm --prefix frontend run test -- tests/phase37-student-dashboard-loading.test.tsx tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx`
- **Committed in:** `274143e`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Regression test compatibility only; no product scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Teacher/Parent and Admin loaders can follow the same primary-vs-optional pattern while preserving role boundaries and no-store dashboard reads.

---
*Phase: 37-frontend-data-loading-render-optimization*
*Completed: 2026-05-27*
