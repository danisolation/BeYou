---
phase: 03-student-self-checks-scenarios-content-management
plan: 02
subsystem: student-self-check-api
tags: [fastapi, sqlalchemy, pydantic, postgres, privacy, authorization, pytest]

requires:
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 01
    provides: Phase 3 self-check models, schemas, router registration, and permission resources
provides:
  - Backend-owned self-check scoring with inclusive threshold matching
  - Immutable student attempt and raw answer snapshots
  - Student self-check list, detail, submit, history, and own-detail APIs
  - Route-regression and privacy/IDOR tests for TEST-01..TEST-05
affects: [phase-03-student-ui, phase-03-adult-summaries, phase-03-admin-content]

tech-stack:
  added: []
  patterns:
    - FastAPI student routes delegate scoring/history to a service layer
    - SQLAlchemy transactions persist result and answer snapshots together
    - Student routes enforce role, privacy acknowledgement, and purpose-scoped permissions

key-files:
  created:
    - backend/app/services/self_checks.py
    - backend/tests/test_phase3_student_self_checks.py
  modified:
    - backend/app/api/student_self_checks.py
    - backend/app/schemas/self_checks.py

key-decisions:
  - "Score remains backend-owned: selected choice score_value values are summed and mapped to exactly one inclusive per-test threshold."
  - "Student-facing detail/list endpoints omit thresholds and choice score values before submission."
  - "Raw answer snapshots are only returned through the student's own history detail route after self_check_raw_answers permission checks."

patterns-established:
  - "Student self-check router order is fixed as list, history list, history detail, test detail, then submit."
  - "Attempt snapshots capture test title, questions, choices, thresholds, copy fields, and per-answer text/score snapshots."
  - "Supportive Vietnamese result copy is derived from locked state labels when threshold copy is incomplete."

requirements-completed: [TEST-01, TEST-02, TEST-03, TEST-04, TEST-05]
duration: 4min
completed: 2026-05-21
---

# Phase 03 Plan 02: Student Self-Check Backend Behavior Summary

**Backend-scored student self-check submissions with private raw-answer history and immutable result snapshots**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-21T04:08:37Z
- **Completed:** 2026-05-21T04:12:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `self_checks` service functions for published-test listing/detail, threshold-based scoring, immutable attempt snapshots, history, and student-owned detail lookup.
- Implemented `/api/student/self-checks` routes in the required declaration order: list, history, history detail, test detail, submit.
- Enforced active student role, privacy acknowledgement gate, purpose-scoped `require_permission`, same-site mutation protection on submit, and own-attempt checks.
- Added backend tests for scoring, validation failures, immutable snapshots, route-order regression, privacy gate, and cross-student raw-answer protection.

## Task Commits

1. **Task 1 RED:** `5834d8f` (test) add failing student self-check backend tests.
2. **Task 1 GREEN:** `fc4a31e` (feat) implement self-check scoring snapshots.
3. **Task 2 GREEN:** `7cf4519` (feat) expose student self-check APIs.

_Note: The RED test commit included the plan's shared test file coverage for both service and route behavior; route tests were satisfied by Task 2._

## Files Created/Modified

- `backend/app/services/self_checks.py` - Adds self-check scoring, threshold matching, snapshot creation, history list, and own-attempt detail service functions.
- `backend/app/api/student_self_checks.py` - Adds authenticated student routes for list, history, history detail, test detail, and submit.
- `backend/app/schemas/self_checks.py` - Adds student-safe test detail and history list DTOs needed by the new routes.
- `backend/tests/test_phase3_student_self_checks.py` - Covers TEST-01..TEST-05 backend behavior and regressions.

## Decisions Made

- Used service-level `HTTPException` errors to match existing FastAPI service patterns for invalid content, bad answers, and missing attempts.
- Used `404` for cross-student attempt detail to avoid confirming another student's attempt ID exists.
- Preserved score as result metadata while supportive headline, state label, and next action are returned as primary copy fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added same-site mutation protection to self-check submission**
- **Found during:** Task 2 (student route implementation)
- **Issue:** The plan required cookie-authenticated POST submission but did not explicitly mention CSRF/same-site mutation checks for the new mutating route.
- **Fix:** Reused existing `require_same_site_mutation` on `POST /api/student/self-checks/{test_id}/attempts`.
- **Files modified:** `backend/app/api/student_self_checks.py`
- **Verification:** `python -m pytest tests/test_phase3_student_self_checks.py -q` passed.
- **Committed in:** `7cf4519`

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Security-correctness adjustment only; no scope expansion.

## Issues Encountered

- Initial RED test cleanup had to account for existing student-adult link foreign keys from prior tests; the test fixture now deletes dependent records before users.

## Known Stubs

None.

## Threat Flags

None. The new route surface matches the plan threat model and includes mitigations for untrusted answer IDs, raw-answer privacy, student role/privacy gates, immutable snapshots, and non-diagnostic result copy.

## User Setup Required

None - no external service configuration required.

## Verification

- `cd backend; python -m alembic upgrade head` — passed.
- `cd backend; python -m pytest tests/test_phase3_student_self_checks.py -q` — 6 passed.
- `cd backend; python -m pytest -q` — 49 passed.
- Acceptance greps for `submit_self_check_attempt`, `min_score`, `max_score`, `SelfCheckAttemptAnswer`, `test_snapshot`, required route decorators, `privacy_acknowledgement_required`, and `student_reflection` — passed.

## Next Phase Readiness

- Student frontend can call stable self-check list/detail/submit/history APIs without receiving scoring values or thresholds before submission.
- Adult summary work can reuse `SelfCheckAttempt` result fields without exposing `SelfCheckAttemptAnswer`.
- Admin content work must preserve threshold labels and snapshot compatibility for future submitted attempts.

## Self-Check: PASSED

Verified from disk:
- Created summary, service, and test files exist.
- Modified router and schema files exist.
- Task commits `5834d8f`, `fc4a31e`, and `7cf4519` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
