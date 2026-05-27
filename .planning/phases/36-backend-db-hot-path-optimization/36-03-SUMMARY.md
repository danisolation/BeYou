---
phase: 36-backend-db-hot-path-optimization
plan: 03
subsystem: backend-api
tags: [fastapi, sqlalchemy, adult-visibility, sos, support-overview]
requires:
  - phase: 36-01
    provides: Phase 36 query-count and aggregate redline helpers
provides:
  - Shared SOS-visible adult linked-student query helper
  - Batched Teacher and Parent student list visibility
  - Batched support overview latest self-check, SOS alert, open count, and alert event loading
affects: [teacher-dashboard, parent-dashboard, support-overview, sos]
tech-stack:
  added: []
  patterns:
    - SQL EXISTS predicate for SOS-only adult visibility
    - SQLAlchemy row_number window queries for latest-per-student loading
key-files:
  created:
    - backend/app/services/adult_visibility.py
    - backend/tests/test_phase36_adult_visibility_hot_paths.py
  modified:
    - backend/app/api/teacher.py
    - backend/app/api/parent.py
    - backend/app/services/sos.py
key-decisions:
  - "Centralize adult list visibility in `list_sos_visible_linked_student_rows` so Teacher and Parent share identical active-link + SOS predicates."
  - "Preserve metadata-only audit events in support overview while batching the read-side data loading."
patterns-established:
  - "Use `exists(select(SosAlert.id).where(SosAlert.student_id == User.id))` for SOS-visible list predicates."
  - "Use `func.row_number().over(partition_by=..., order_by=...)` for latest-per-student backend hot paths."
requirements-completed:
  - DBPERF-02
  - DBPERF-03
duration: 4 min
completed: 2026-05-27
---

# Phase 36 Plan 03: Adult Visibility and Support Overview Summary

**Batched SOS-only adult visibility and support overview latest-signal loading**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-27T02:24:49Z
- **Completed:** 2026-05-27T02:29:05Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added regression tests proving Teacher/Parent lists hide no-SOS, revoked-link, wrong-relationship, and outsider rows.
- Replaced Teacher/Parent per-row SOS and permission checks with one shared SQL predicate that preserves active relationship and SOS-only rules.
- Batched support overview latest self-checks, latest SOS alerts, open SOS counts, and latest-alert status events while keeping audit events and redlines.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add adult visibility batching regression tests** - `0e6f50c` (test)
2. **Task 2: Add shared SOS-visible adult linked-student service** - `4ce0055` (perf)
3. **Task 3: Batch support overview latest signals** - `92dbdb5` (perf)

**Plan metadata:** pending in docs commit.

## Files Created/Modified

- `backend/tests/test_phase36_adult_visibility_hot_paths.py` - DBPERF-02/overview DBPERF-03 query-count and privacy regressions.
- `backend/app/services/adult_visibility.py` - Shared adult visibility query helper.
- `backend/app/api/teacher.py` - Uses batched visibility helper for linked students.
- `backend/app/api/parent.py` - Uses batched visibility helper for linked students.
- `backend/app/services/sos.py` - Batches support overview latest signals and status events.

## Decisions Made

- Adult list routes trust the shared SQL predicate after `require_role`; this is equivalent to the previous active-link + SOS checks but avoids per-row authorization queries.
- Support overview still records per-visible-student summary/SOS audit metadata, but all read-side data selection is batched.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- RED tests confirmed original query growth: `/api/teacher/students` used 42 queries and `/api/teacher/support-overview` used 91 queries with 12 visible students. Both query ceilings now pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

DBPERF-02 and support-overview DBPERF-03 are ready for phase verification. Wave 2 can continue with adult summary SQL-side filtering.

---
*Phase: 36-backend-db-hot-path-optimization*
*Completed: 2026-05-27*
