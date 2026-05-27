---
phase: 03-student-self-checks-scenarios-content-management
plan: 03
subsystem: student-scenario-api
tags: [fastapi, sqlalchemy, pydantic, postgres, privacy, authorization, pytest]

requires:
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 01
    provides: Phase 3 scenario models, schemas, router registration, and permission resources
provides:
  - Student published scenario browse and detail APIs
  - Student scenario attempt submission with supportive feedback
  - Immutable scenario attempt snapshots for private student history
  - Route and service tests for SCEN-01..SCEN-05
affects: [phase-03-student-ui, phase-03-admin-content, phase-03-final-verification]

tech-stack:
  added: []
  patterns:
    - FastAPI student scenario routes delegate content and attempt behavior to a service layer
    - Scenario attempts snapshot mutable content at submission time
    - Student scenario history is permission-gated and scoped to the current student

key-files:
  created:
    - backend/app/services/scenarios.py
    - backend/tests/test_phase3_student_scenarios.py
  modified:
    - backend/app/api/student_scenarios.py
    - backend/app/schemas/scenarios.py

key-decisions:
  - "Scenario history remains student-private through scenario_attempt_private permission checks and current-student filtering."
  - "Scenario attempts snapshot selected choice, signal, feedback, recommended response, lesson, skill tag, title, situation, completed timestamp, and demo flag."
  - "Student scenario POST uses existing same-site mutation protection because cookie-authenticated writes require CSRF-style safeguards."

patterns-established:
  - "Student scenario router order is list, history, detail, then submit so static history is not shadowed by dynamic IDs."
  - "Constructive/risky scenario feedback is validated in the service before returning detail or saving attempts."
  - "History list responses use an items wrapper matching the existing self-check history API pattern."

requirements-completed: [SCEN-01, SCEN-02, SCEN-03, SCEN-04, SCEN-05]
duration: 3min
completed: 2026-05-21
---

# Phase 03 Plan 03: Student Scenario Backend Behavior Summary

**Published school-pressure scenarios with constructive/risky feedback and immutable private student attempt history**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-21T04:14:43Z
- **Completed:** 2026-05-21T04:17:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `scenarios` service functions for published scenario listing/detail, supportive content validation, attempt submission, and student-only history.
- Implemented `/api/student/scenarios` routes for list, history, detail, and attempt submission with privacy acknowledgement and permission gates.
- Persisted immutable scenario attempt snapshots so later content edits do not rewrite a student's historical feedback.
- Added backend tests for published-only visibility, invalid choice rejection, snapshot immutability, route ordering, privacy gate, and cross-student history isolation.

## Task Commits

1. **Task 1 RED:** `3cd3819` (test) add failing scenario service tests.
2. **Task 1 GREEN:** `c21abd4` (feat) implement scenario feedback snapshots.
3. **Task 2 RED:** `0fccfed` (test) add failing student scenario route tests.
4. **Task 2 GREEN:** `ac688e4` (feat) expose student scenario APIs.

## Files Created/Modified

- `backend/app/services/scenarios.py` - Adds scenario browse/detail/attempt/history service functions with content validation and immutable snapshots.
- `backend/app/api/student_scenarios.py` - Adds authenticated student routes for scenario list, history, detail, and attempt submission.
- `backend/app/schemas/scenarios.py` - Adds the history list wrapper schema used by the student scenario history API.
- `backend/tests/test_phase3_student_scenarios.py` - Covers SCEN service and route behavior, privacy gates, and history isolation.

## Decisions Made

- Used `404` for unpublished/draft/archived scenario detail and submission attempts so students only discover published content.
- Used `400` for a selected choice that does not belong to the requested scenario, directly mitigating untrusted choice IDs.
- Kept scenario attempts student-facing only; no adult scenario visibility, analytics, SOS, or chatbot hooks were added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added same-site mutation protection to scenario submission**
- **Found during:** Task 2 (student route implementation)
- **Issue:** The plan required a cookie-authenticated `POST /api/student/scenarios/{scenario_id}/attempts`; existing repository pattern requires same-site mutation checks for POST routes.
- **Fix:** Reused `require_same_site_mutation` on the scenario attempt route.
- **Files modified:** `backend/app/api/student_scenarios.py`
- **Verification:** `python -m pytest tests/test_phase3_student_scenarios.py -q` passed.
- **Committed in:** `ac688e4`

**2. [Rule 3 - Blocking] Added missing scenario history list schema**
- **Found during:** Task 2 (student route implementation)
- **Issue:** `backend/app/schemas/scenarios.py` did not include a wrapper response model for `GET /api/student/scenarios/history`, while the API needed a Pydantic response schema consistent with existing self-check history routes.
- **Fix:** Added `ScenarioHistoryListResponse` with `items: list[ScenarioHistoryItem]`.
- **Files modified:** `backend/app/schemas/scenarios.py`
- **Verification:** `python -m pytest tests/test_phase3_student_scenarios.py -q` passed.
- **Committed in:** `ac688e4`

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes were required for secure, typed API behavior. No scope expansion beyond Plan 03-03.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. The new route and data surfaces match the plan threat model and include mitigations for untrusted choice IDs, current-student-only history, student role/privacy gates, immutable content snapshots, timestamps, and demo flags.

## Auth Gates

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `cd backend; python -m alembic upgrade head` — passed.
- `cd backend; python -m pytest tests/test_phase3_student_scenarios.py -q` — 4 passed.
- `cd backend; python -m pytest -q` — 53 passed.
- Acceptance greps for `submit_scenario_attempt`, `constructive`, `risky`, `feedback_snapshot`, `skill_tag_snapshot`, route decorators, `scenario_attempt_private`, and `privacy_acknowledgement_required` — passed.

## Next Phase Readiness

- Student frontend can call stable scenario list/detail/submit/history APIs and render Vietnamese supportive feedback labels.
- Admin content work must preserve constructive/risky signal validation and snapshot compatibility for future attempts.
- Seed work in Plan 03-05 can populate the four locked scenario themes without changing student-facing backend behavior.

## Self-Check: PASSED

Verified from disk:
- Created summary, service, and test files exist.
- Modified router and schema files exist.
- Task commits `3cd3819`, `c21abd4`, `0fccfed`, and `ac688e4` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
