---
phase: 29-deployment-guardrails-smoke-profiles
plan: 03
subsystem: api
tags: [fastapi, pydantic, admin-operations, deployment-guardrails, smoke-profiles, cors]

requires:
  - phase: 29-02-smoke-profiles
    provides: Separate demo and production-pilot smoke commands plus helper behavior
provides:
  - Admin operations deployment guardrail metadata
  - Admin operations demo/pilot smoke profile metadata
  - Safe exact CORS/cookie contract evidence using booleans and counts only
  - Backend regression tests for forbidden serialization
affects: [29-04-operations-ui-docs]

tech-stack:
  added: []
  patterns:
    - Pydantic metadata schemas for deployment guardrails and smoke profiles
    - Exact origin/cookie deployment evidence expressed as safe yes/no/count fields

key-files:
  created: []
  modified:
    - backend/app/schemas/admin_operations.py
    - backend/app/services/admin_operations.py
    - backend/tests/test_phase11_operations_visibility.py
    - backend/tests/test_demo_seed.py

key-decisions:
  - "Backend operations is the source of truth for deployment/smoke metadata consumed by the UI."
  - "CORS/cookie evidence exposes only `exact_allowed_origin_match`, counts, and safe booleans, never raw origins or cookie names."
  - "Legacy `production_smoke` remains for compatibility while new `smoke_profiles` separates demo and pilot assumptions."

patterns-established:
  - "Deployment guardrails use keys `vercel_frontend`, `render_backend`, `frontend_api_target`, and `cors_cookie_contract`."
  - "Smoke profiles use keys `demo_smoke` and `pilot_smoke` with explicit demo-account and readiness-ready booleans."

requirements-completed: [DEPLOY-03, DEPLOY-04]

duration: 4 min
completed: 2026-05-25
---

# Phase 29 Plan 03: Backend Operations Metadata Summary

**Admin operations now exposes safe deployment guardrail and separated smoke profile metadata**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-25T09:40:30Z
- **Completed:** 2026-05-25T09:44:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `DeploymentGuardrailItem` and `SmokeProfileItem` schemas.
- Added `deployment_guardrails` and `smoke_profiles` to `AdminOperationsDashboardResponse`.
- Implemented metadata-only guardrail builders for Vercel, Render, frontend API target, and CORS/cookie contract.
- Implemented demo/pilot smoke metadata with explicit command, demo-account, and readiness requirements.
- Added backend regression tests for safe evidence and forbidden serialization.

## Task Commits

1. **Task 1: Add backend tests for deployment/smoke metadata and forbidden serialization** - `1887bf9` (test)
2. **Task 2: Implement metadata-only deployment guardrails and smoke profiles** - `0c72ec1` (feat)

**Plan metadata:** pending docs commit

_Note: TDD task used separate RED and GREEN commits._

## Files Created/Modified

- `backend/app/schemas/admin_operations.py` - Adds deployment guardrail and smoke profile schemas/response fields.
- `backend/app/services/admin_operations.py` - Builds safe guardrail and smoke profile metadata.
- `backend/tests/test_phase11_operations_visibility.py` - Adds API/direct dashboard assertions for metadata-only deployment evidence and forbidden strings.
- `backend/tests/test_demo_seed.py` - Updates smoke command expectations to distinct demo/pilot profiles.

## Decisions Made

- Preserved `production_smoke` compatibility for existing frontend consumers; new UI should prefer `smoke_profiles`.
- Required production-pilot CORS/cookie metadata to fail when exact frontend origin matching, HTTPS, Secure cookie, SameSite=None, or demo flags are unsafe.
- Kept raw origins, cookie names, DB URLs, demo emails, raw IDs, and student private content out of new metadata fields.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `29-04-PLAN.md`: frontend operations UI can render backend-provided `deployment_guardrails` and `smoke_profiles`, and README can document the commands.

---
*Phase: 29-deployment-guardrails-smoke-profiles*
*Completed: 2026-05-25*
