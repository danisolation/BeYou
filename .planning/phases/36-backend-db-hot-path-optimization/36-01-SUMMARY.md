---
phase: 36-backend-db-hot-path-optimization
plan: 01
subsystem: testing
tags: [pytest, sqlalchemy, fastapi, query-counts, privacy-redlines]
requires:
  - phase: 33-cross-role-ui-performance-baseline-audit
    provides: Aggregate-only query-count evidence pattern
provides:
  - Reusable SQLAlchemy query-count helper for Phase 36 hot-path tests
  - Demo-safe user/login/link/SOS seed helpers
  - Aggregate-only sensitive marker assertions
affects: [phase-36-hot-path-tests, backend-performance-regressions]
tech-stack:
  added: []
  patterns:
    - SQLAlchemy before_cursor_execute query counting in tests
    - Aggregate-only response text redline assertions
key-files:
  created:
    - backend/tests/phase36_hot_path_utils.py
    - backend/tests/test_phase36_hot_path_utils.py
  modified: []
key-decisions:
  - "Keep query-count evidence aggregate-only: helpers count statements without storing request or response bodies."
  - "Use pytest direct helper imports because backend/tests is not a Python package."
patterns-established:
  - "Use measure_queries(lambda: client.get(...)) for bounded hot-path regression checks."
  - "Use assert_aggregate_only_text before accepting serialized adult/admin evidence."
requirements-completed:
  - DBPERF-01
  - DBPERF-02
  - DBPERF-03
  - DBPERF-04
  - DBPERF-05
duration: 7 min
completed: 2026-05-27
---

# Phase 36 Plan 01: Test Harness Summary

**Aggregate-only SQLAlchemy query-count helpers and self-tests for backend hot-path optimization**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-27T02:12:45Z
- **Completed:** 2026-05-27T02:19:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `QueryCounter` and `measure_queries` so later Phase 36 tests can assert bounded query counts deterministically.
- Added demo-safe helpers for users, TestClient login, active/revoked student-adult links, and SOS alerts.
- Added aggregate-only redline assertions and self-tests covering sensitive markers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add aggregate-only Phase 36 query-count helpers** - `6caeb5d` (test)
2. **Task 2: Self-test Phase 36 helpers** - `d7b99b4` (test)

**Plan metadata:** pending in docs commit.

## Files Created/Modified

- `backend/tests/phase36_hot_path_utils.py` - Reusable Phase 36 backend query-count and seed helpers.
- `backend/tests/test_phase36_hot_path_utils.py` - Self-tests for query counting and aggregate-only redlines.

## Decisions Made

- Query measurement returns only the callable result and statement count; it does not store payload bodies or raw evidence.
- Helper self-tests define their own minimal cleanup fixture to avoid depending on non-shared fixtures from older test modules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed helper test import style**
- **Found during:** Task 2 (Self-test Phase 36 helpers)
- **Issue:** A relative import failed because `backend/tests` is not a package.
- **Fix:** Switched to the direct pytest helper import style used by this test layout.
- **Files modified:** `backend/tests/test_phase36_hot_path_utils.py`
- **Verification:** `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_phase36_hot_path_utils.py -q`
- **Committed in:** `d7b99b4`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import correction only; no scope creep or behavior change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Wave 2 plans can use `measure_queries`, `make_user`, `login_client`, `seed_student_link`, `seed_sos_alert`, and `assert_aggregate_only_text` for bounded admin, adult visibility, and summary regression tests.

---
*Phase: 36-backend-db-hot-path-optimization*
*Completed: 2026-05-27*
