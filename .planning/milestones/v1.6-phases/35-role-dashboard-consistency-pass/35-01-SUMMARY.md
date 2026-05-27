---
phase: 35-role-dashboard-consistency-pass
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, role-dashboards, privacy-redlines, sos]
requires:
  - phase: 34-shared-ui-primitives-role-shell-harmonization
    provides: shared UI primitives, role shell behavior, and final dashboard regression baseline
provides:
  - Phase 35 role dashboard consistency and privacy/safety regression harness
  - Student SOS/privacy, Teacher SOS handling, Parent read-only, and Admin metadata-only coverage
  - Static redlines for browser token storage, cross-role imports, unsafe Admin labels, and raw adult/admin labels
affects: [phase35-dashboard-edits, role-dashboard-tests, privacy-redlines]
tech-stack:
  added: []
  patterns: [Vitest component render checks, readFileSync static source assertions, pathname-based fetch mocks]
key-files:
  created:
    - frontend/tests/phase35-role-dashboard-consistency.test.tsx
  modified: []
key-decisions:
  - "Phase 35 gets a dedicated regression harness instead of overloading Phase 34 tests."
  - "Shared presentation scan excludes intentionally auth-owned demo-role-entry.tsx while still enforcing dashboard presentation redlines."
patterns-established:
  - "Role dashboard tests combine rendered copy/CTA checks with static source redlines."
  - "Adult/Admin privacy tests reject raw labels and unsafe controls before presentation edits."
requirements-completed: [ROLE-01, ROLE-02, ROLE-03, ROLE-04]
duration: 8min
completed: 2026-05-26T10:41:41Z
---

# Phase 35 Plan 01: Safety Test Harness Summary

**Vitest safety harness for Student privacy/SOS, Teacher SOS handling, Parent read-only posture, and Admin metadata-only dashboard redlines**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-26T10:33:29Z
- **Completed:** 2026-05-26T10:41:41Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `frontend/tests/phase35-role-dashboard-consistency.test.tsx` with rendered regression coverage for all four role dashboards.
- Added source-level guards for required API paths, no browser token storage, no Parent→Teacher route import, no shared presentation route/auth imports, and no raw adult/admin labels.
- Verified the Phase 35 harness alongside Phase 34 final regression, role dashboard, and auth portal suites.

## Task Commits

1. **Task 1: Create Phase 35 cross-role dashboard regression harness** - `0bf52cf` (test RED), `3f025d5` (test GREEN)
2. **Task 2: Add static import and redline coverage for shared presentation safety** - `068d64b` (test)

## Files Created/Modified

- `frontend/tests/phase35-role-dashboard-consistency.test.tsx` - New Phase 35 dashboard consistency harness with render and static source assertions.

## Verification

- `npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx` — passed, 2 files / 12 tests.
- `npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/role-dashboards.test.tsx tests/auth-portals.test.tsx` — passed, 3 files / 23 tests.
- `npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/auth-portals.test.tsx` — passed, 4 files / 28 tests.
- Acceptance grep checks found `describe("Phase 35`, `localStorage.setItem`, `Xem và cập nhật SOS`, `Xem trạng thái SOS`, `metadata-only`, `@/app/(authenticated)/teacher/page`, `provider claims`, and `@/lib/auth`.

## Decisions Made

- Used a dedicated Phase 35 test file for traceability to ROLE-01 through ROLE-04.
- Kept the Admin unsafe-label assertion focused on action/control labels so existing safe denial copy such as “không xuất dữ liệu thô” remains allowed while unsafe controls remain blocked.
- Scoped the full `frontend/components/` import scan to shared presentation components and excluded `components/demo-role-entry.tsx` because it is an intentionally auth-owned demo entry component, not a dashboard presentation primitive.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test bug] Adjusted Admin unsafe-control matcher**
- **Found during:** Task 1 (Create Phase 35 cross-role dashboard regression harness)
- **Issue:** The first RED harness matched existing safety denial copy (`không xuất dữ liệu thô`) as if it were an unsafe export control.
- **Fix:** Kept the unsafe-control regex case-sensitive for the planned labels and verified controls still reject `Export`, `Xuất`, `Download`, `Tải xuống`, `reset`, `drilldown`, `risk leaderboard`, `xếp hạng nguy cơ`, `Chi tiết học sinh`, and `raw audit`.
- **Files modified:** `frontend/tests/phase35-role-dashboard-consistency.test.tsx`
- **Verification:** Phase 35 + Phase 34 targeted suite passed.
- **Committed in:** `3f025d5`

**2. [Rule 2 - Missing Critical Scope Guard] Excluded intentionally auth-owned demo component from presentation scan**
- **Found during:** Task 2 (Add static import and redline coverage for shared presentation safety)
- **Issue:** A blanket `frontend/components/` scan flagged `components/demo-role-entry.tsx` for importing `@/lib/auth`; this component is intentionally auth-owned and outside the dashboard presentation primitive scope.
- **Fix:** Added a small allowlist for intentionally route/auth-owned components while scanning the remaining shared presentation components for route imports, `@/lib/auth`, token strings, and raw labels.
- **Files modified:** `frontend/tests/phase35-role-dashboard-consistency.test.tsx`
- **Verification:** Phase 35 + role dashboards + auth portals suite passed, then full plan verification passed.
- **Committed in:** `068d64b`

---

**Total deviations:** 2 auto-fixed (Rule 1: 1, Rule 2: 1)  
**Impact on plan:** No production scope creep; deviations kept the harness accurate while preserving Phase 35 privacy/security intent.

## Issues Encountered

- Initial RED test failed as expected on the Admin unsafe-control matcher; resolved in the GREEN test commit.
- Task 2 first attempt found an existing auth-owned demo component in `frontend/components/`; resolved by limiting the scan to shared presentation components.

## Known Stubs

None - mock dashboard fixtures are test data only and do not create UI/runtime stubs.

## Threat Flags

None - the plan added tests only and introduced no new network endpoints, auth paths, file-access runtime surface, or schema trust boundary.

## Auth Gates

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 35 dashboard presentation edits can proceed with automated redline coverage in place for ROLE-01 through ROLE-04.

## Self-Check: PASSED

- FOUND: `frontend/tests/phase35-role-dashboard-consistency.test.tsx`
- FOUND: `.planning/phases/35-role-dashboard-consistency-pass/35-01-SUMMARY.md`
- FOUND commits: `0bf52cf`, `3f025d5`, `068d64b`

---
*Phase: 35-role-dashboard-consistency-pass*
*Completed: 2026-05-26T10:41:41Z*
