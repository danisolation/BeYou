---
phase: 03-student-self-checks-scenarios-content-management
plan: 01
subsystem: backend-domain-foundation
tags: [fastapi, sqlalchemy, alembic, postgres, authorization, pydantic, privacy]

requires:
  - phase: 01-safety-privacy-policy-foundation
    provides: privacy-by-default, data classification, audit metadata boundaries
  - phase: 02-identity-roles-links-demo-access
    provides: users, roles, student-adult links, sessions, admin patterns
provides:
  - Phase 3 self-check and scenario content/attempt storage models
  - Alembic migration for self-check/scenario durable tables and history snapshots
  - Explicit Phase 3 permission resource keys and schema contracts
  - Stable FastAPI router entry points for downstream Phase 3 plans
affects: [phase-03-student-apis, phase-03-adult-summaries, phase-03-admin-content]

tech-stack:
  added: []
  patterns:
    - SQLAlchemy 2 mapped models with UUID primary keys, timestamps, JSONB snapshots, and is_demo flags
    - Deny-by-default resource permissions for student-private raw answers
    - Pydantic v2 DTO modules split by self-check and scenario domains

key-files:
  created:
    - backend/alembic/versions/20260521_0003_self_checks_scenarios.py
    - backend/app/schemas/self_checks.py
    - backend/app/schemas/scenarios.py
    - backend/app/api/student_self_checks.py
    - backend/app/api/student_scenarios.py
    - backend/app/api/adult_summaries.py
    - backend/app/api/admin_content.py
    - backend/tests/test_phase3_domain_migration.py
  modified:
    - backend/app/db/models.py
    - backend/app/core/authorization.py
    - backend/app/main.py

key-decisions:
  - "Preserved exact locked labels: On dinh, Can chu y, Nen tim ho tro, Can ho tro som."
  - "Kept adult/admin raw self-check answer access denied by default while allowing linked adults summary-only reads."
  - "Restricted admin Phase 3 content management to self_check_content and scenario_content resource keys."

patterns-established:
  - "Attempt history stores immutable snapshots so later content edits do not mutate completed student history."
  - "All Phase 3 content and attempt records carry is_demo for demo/real-data separation."
  - "Router modules are registered once in main.py; later plans add behavior inside dedicated files."

requirements-completed: [TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, SCEN-01, SCEN-02, SCEN-03, SCEN-04, SCEN-05, ADMIN-02, ADMIN-03]
duration: 4min
completed: 2026-05-21
---

# Phase 03 Plan 01: Backend Domain Foundation Summary

**Self-check and scenario backend foundation with privacy-preserving attempt snapshots and deny-by-default Phase 3 permissions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-21T04:01:47Z
- **Completed:** 2026-05-21T04:05:46Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added Phase 3 SQLAlchemy models and Alembic migration for self-check tests, questions, choices, thresholds, attempts, raw student answer snapshots, scenarios, scenario choices, and scenario attempts.
- Added locked enum/resource contracts for content lifecycle (`draft`, `published`, `archived`), risk labels, and scenario signals.
- Extended authorization so students can read/write their own private attempts, linked adults can read summary-only self-check data, and adult/admin raw answers remain denied by default.
- Added Pydantic self-check and scenario DTO contracts without adult/admin raw-answer DTO fields.
- Registered stable FastAPI router modules for student self-checks, student scenarios, adult summaries, and admin content.

## Task Commits

1. **Task 1 RED:** `21ac344` (test) add failing Phase 3 migration/domain tests.
2. **Task 1 GREEN:** `79bd9be` (feat) add Phase 3 domain models and migration.
3. **Task 2 RED:** `d7d8509` (test) add failing authorization/schema tests.
4. **Task 2 GREEN:** `758c206` (feat) add Phase 3 permissions and schema contracts.
5. **Task 3:** `d44a8cd` (feat) register Phase 3 router entry points.

## Files Created/Modified

- `backend/app/db/models.py` - Added Phase 3 enums, self-check content/attempt models, and scenario content/attempt models.
- `backend/alembic/versions/20260521_0003_self_checks_scenarios.py` - Creates/drops all Phase 3 tables and indexes.
- `backend/app/core/authorization.py` - Adds explicit Phase 3 permission cases and prevents blanket admin raw-answer access.
- `backend/app/schemas/self_checks.py` - Adds student self-check request/response DTOs and fixed state label validation.
- `backend/app/schemas/scenarios.py` - Adds scenario list/detail/attempt/feedback/history DTOs and signal validation.
- `backend/app/api/student_self_checks.py` - Dedicated router integration point for later student self-check endpoints.
- `backend/app/api/student_scenarios.py` - Dedicated router integration point for later student scenario endpoints.
- `backend/app/api/adult_summaries.py` - Dedicated router integration point for later teacher/parent summary endpoints.
- `backend/app/api/admin_content.py` - Dedicated router integration point for later admin content endpoints.
- `backend/app/main.py` - Registers Phase 3 routers under required prefixes.
- `backend/tests/test_phase3_domain_migration.py` - Tests migration tables, snapshots, enum values, permissions, and DTO imports.

## Decisions Made

- Used string enums backed by existing SQLAlchemy string columns so locked labels remain exact and easy to compare across API, DB, and UI contracts.
- Kept adult summary access limited to `self_check_summary` and `support_not_surveillance`; raw answers require `student_reflection` and the student’s own ID.
- Registered routers without endpoints because Plan 03-01 only establishes importable integration points; downstream plans implement behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Restricted blanket admin permission**
- **Found during:** Task 2 (authorization tests)
- **Issue:** Existing `require_permission` allowed any admin with `purpose="admin_operations"` to access any resource, which would have allowed `self_check_raw_answers` contrary to the Phase 3 privacy boundary.
- **Fix:** Replaced the blanket admin allow with an explicit admin resource allowlist that includes account/link/audit/demo operations plus `self_check_content` and `scenario_content`, but not raw answers.
- **Files modified:** `backend/app/core/authorization.py`
- **Verification:** `python -m pytest tests/test_phase3_domain_migration.py -q` and full backend pytest passed.
- **Committed in:** `758c206`

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Security-correctness adjustment required to satisfy the locked privacy decision; no scope creep.

## Issues Encountered

None.

## Known Stubs

None blocking this plan. The four new router modules intentionally contain no behavioral endpoints because Plan 03-01 only creates stable integration points; endpoint behavior is owned by later Phase 3 plans.

## Threat Flags

None. New backend tables, authorization resources, and route entry points match the plan threat model.

## User Setup Required

None - no external service configuration required.

## Verification

- `cd backend; python -m alembic upgrade head` — passed.
- `cd backend; python -m pytest tests/test_phase3_domain_migration.py -q` — 6 passed.
- `cd backend; python -c "from app.main import app; paths=[r.path for r in app.routes]; print('router-import-ok', len(paths))"` — passed, printed `router-import-ok 19`.
- `cd backend; python -m pytest -q` — 43 passed.

## Next Phase Readiness

- Downstream student API plans can build on durable tables, immutable snapshots, DTOs, and router prefixes without editing `main.py`.
- Adult summary plans must record metadata-only `sensitive_resource_read` audit events when implementing summary read endpoints.
- Admin content plans can use the `draft`/`published`/`archived` lifecycle and `self_check_content`/`scenario_content` permission keys.

## Self-Check: PASSED

Verified from disk:
- Created summary, migration, schema modules, and router modules exist.
- Task commits `21ac344`, `79bd9be`, `d7d8509`, `758c206`, and `d44a8cd` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
