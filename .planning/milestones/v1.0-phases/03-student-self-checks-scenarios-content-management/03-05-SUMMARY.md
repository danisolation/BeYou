---
phase: 03-student-self-checks-scenarios-content-management
plan: 05
subsystem: admin-content-and-demo-seed
tags: [fastapi, sqlalchemy, pydantic, postgres, admin-api, demo-seed, pytest]

requires:
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 01
    provides: Phase 3 content/attempt models, lifecycle enums, router registration, and permission resources
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 02
    provides: self-check scoring and immutable attempt snapshots
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 03
    provides: scenario attempt snapshot behavior and constructive/risky signal contract
provides:
  - Admin self-check and scenario content schemas, lifecycle service, and CSRF-protected APIs
  - Metadata-only admin_safety_content_changed audit events for content mutations
  - Deterministic gated Phase 3 demo self-checks, scenarios, and recent demo attempts
affects: [phase-03-admin-ui, phase-03-final-verification, phase-04-sos-support-portals]

tech-stack:
  added: []
  patterns:
    - Admin content routes delegate all lifecycle validation and audit writes to a service layer
    - Publish validation blocks invalid self-check thresholds and incomplete scenario feedback
    - Demo seed upserts by demo title and regenerates demo attempts deterministically

key-files:
  created:
    - backend/app/schemas/admin_content.py
    - backend/app/services/admin_content.py
    - backend/tests/test_phase3_admin_content_seed.py
  modified:
    - backend/app/api/admin_content.py
    - backend/app/seeds/demo_seed.py
    - backend/tests/test_demo_seed.py
    - backend/tests/test_phase2_security_regression.py

key-decisions:
  - "Admin content lifecycle remains exactly draft, published, archived."
  - "Admin content edits replace mutable current content while preserving historical attempt snapshots and nullable reference safety."
  - "Demo seed is gated by ALLOW_DEMO_SEED and creates only is_demo=True Phase 3 content and attempts."

patterns-established:
  - "Admin content mutations always record admin_safety_content_changed with metadata keys content_type, content_id, change_type, admin_actor_id, and is_demo."
  - "Publish errors return Vietnamese UI-compatible messages from backend validation."
  - "Seeded self-check thresholds cover the full possible score range with the locked labels: On dinh, Can chu y, Nen tim ho tro, Can ho tro som."

requirements-completed: [ADMIN-02, ADMIN-03, TEST-01, SCEN-01]
duration: 10min
completed: 2026-05-21
---

# Phase 03 Plan 05: Admin Content Management and Demo Seed Summary

**Admin lifecycle APIs with audited content changes plus gated Vietnamese demo self-checks, scenarios, and recent attempts**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-21T04:19:21Z
- **Completed:** 2026-05-21T04:28:59Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added admin Pydantic schemas and service functions for self-check tests, questions, choices, thresholds, scenarios, and scenario choices.
- Implemented lifecycle rules for create/edit/publish/archive/delete-unused-draft with backend publish validation and metadata-only audit events.
- Exposed `/api/admin/content/self-checks` and `/api/admin/content/scenarios` routes with existing admin authorization and `require_same_site_mutation` protection for every mutation.
- Extended demo seed to create the locked two published self-checks, four published scenarios, and six recent demo self-check attempts only when demo seed is enabled.
- Added focused backend tests and updated existing seed cleanup helpers for the new Phase 3 seeded rows.

## Task Commits

1. **RED tests:** `6ef92ed` (test) add failing admin content seed tests.
2. **Task 1:** `e14168e` (feat) implement admin content lifecycle service.
3. **Task 2:** `a0d78c8` (feat) expose admin content APIs.
4. **Task 3:** `74b17e5` (feat) seed Phase 3 demo content.
5. **Deviation fix:** `7aa1398` (fix) clean Phase 3 seed records in tests.
6. **Acceptance fix:** `dfac066` (fix) align admin content acceptance literals.

## Files Created/Modified

- `backend/app/schemas/admin_content.py` - Admin request/response DTOs with locked lifecycle statuses, risk labels, and scenario signals.
- `backend/app/services/admin_content.py` - Lifecycle CRUD, publish validation, archive/delete-draft rules, reference-safe edits, and audit writes.
- `backend/app/api/admin_content.py` - Admin content routes under `/api/admin/content` with admin auth and same-site mutation checks.
- `backend/app/seeds/demo_seed.py` - Gated deterministic Phase 3 demo content and recent self-check attempts.
- `backend/tests/test_phase3_admin_content_seed.py` - Tests for admin lifecycle/audit, API auth/CSRF/validation, and demo content.
- `backend/tests/test_demo_seed.py` - Cleanup helper now removes Phase 3 seed records before users.
- `backend/tests/test_phase2_security_regression.py` - Cleanup helper now removes Phase 3 seed records before users.

## Decisions Made

- Used full replacement for admin-edited question/choice/threshold sets because the current schema has no stable nested admin edit IDs; historical snapshots remain preserved.
- Nullified nullable attempt reference IDs before replacing mutable content rows so old attempts retain snapshots without blocking future admin edits.
- Regenerated six demo attempts on each enabled seed run to keep demo history deterministic and within the 30-day adult-summary window.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Preserved edits for used content without foreign-key breakage**
- **Found during:** Task 1 (lifecycle service implementation)
- **Issue:** Replacing mutable current questions/choices could be blocked by historical attempt references even though snapshots preserve the student-visible history.
- **Fix:** Before replacing self-check/scenario child rows, nullable attempt reference fields are set to `NULL`; snapshot fields remain unchanged.
- **Files modified:** `backend/app/services/admin_content.py`, `backend/app/seeds/demo_seed.py`
- **Verification:** `python -m pytest tests/test_phase3_admin_content_seed.py -q` and full backend pytest passed.
- **Committed in:** `e14168e`, `74b17e5`

**2. [Rule 1 - Bug] Updated existing seed test cleanup for new Phase 3 seeded records**
- **Found during:** Overall verification after Task 3
- **Issue:** Existing seed/security tests deleted users without first deleting new self-check/scenario seed rows, causing foreign-key teardown errors.
- **Fix:** Added Phase 3 attempt/content tables to cleanup order in affected existing tests.
- **Files modified:** `backend/tests/test_demo_seed.py`, `backend/tests/test_phase2_security_regression.py`
- **Verification:** `python -m pytest -q` passed.
- **Committed in:** `7aa1398`

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes were required for correctness after adding admin content editing and demo seed records. No scope expansion beyond Plan 03-05.

## Issues Encountered

- Acceptance grep checks required the exact locked label/signal and publish-copy strings to be visible in the planned files; literals were aligned without changing behavior.

## Known Stubs

None. Empty string defaults in `AdminSelfCheck*Upsert` and `AdminScenario*Upsert` are intentional draft-content defaults for admin editing and do not represent placeholder UI data.

## Auth Gates

None.

## Threat Flags

None. New admin route and demo seed surfaces were explicitly covered by this plan's threat model and include the required mitigations.

## User Setup Required

None - no external service configuration required.

## Verification

- `cd backend; python -m alembic upgrade head; $env:ALLOW_DEMO_SEED="true"; python -m app.seeds.demo_seed; python -m pytest tests/test_phase3_admin_content_seed.py -q` — passed, 4 passed.
- `cd backend; python -m pytest -q` — passed, 57 passed.
- Acceptance greps for `validate_self_check_publishable`, `admin_safety_content_changed`, `delete_unused_draft`, `On dinh`, `constructive`, admin route decorators, `require_same_site_mutation`, publish validation copy, seed titles/themes, and `ALLOW_DEMO_SEED` — passed.

## Next Phase Readiness

- Admin UI work can call stable content management APIs for self-checks and scenarios.
- Final Phase 3 verification can rely on deterministic demo content and six recent demo self-check attempts.
- Student/adult privacy boundaries remain intact: admin content APIs do not expose student attempt raw answers.

## Self-Check: PASSED

Verified from disk:
- Created summary, admin schemas, admin service, and plan test file exist.
- Modified admin router, demo seed, and seed cleanup tests exist.
- Task commits `6ef92ed`, `e14168e`, `a0d78c8`, `74b17e5`, `7aa1398`, and `dfac066` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
