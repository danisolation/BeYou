---
phase: 28-runtime-mode-production-readiness-foundation
plan: 01
subsystem: backend
tags: [runtime-mode, readiness, admin-operations, metadata, nextjs]

# Dependency graph
requires:
  - phase: 27-peerlight-ai-rebrand-and-audit-closure
    provides: metadata-only operations dashboard and public demo readiness baseline
provides:
  - explicit runtime mode settings contract for local_demo, public_demo, and production_pilot
  - mode-aware readiness checks for demo seed/login, environment, cookie, origin, provider, and identity safety
  - admin-only runtime and connectivity metadata that avoids raw origins, cookie names, connection strings, and credentials
affects: [phase-28, phase-29, deployment-guardrails, production-pilot, admin-operations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Settings runtime intent remains explicit and separate from ENVIRONMENT platform semantics
    - Operations connectivity exposes counts, booleans, and kind labels instead of raw deployment values

key-files:
  created:
    - .planning/phases/28-runtime-mode-production-readiness-foundation/28-01-SUMMARY.md
  modified:
    - backend/app/core/config.py
    - backend/app/services/readiness.py
    - backend/app/schemas/admin_operations.py
    - backend/app/services/admin_operations.py
    - backend/tests/test_phase7_readiness.py
    - backend/tests/test_demo_seed.py
    - frontend/lib/admin-operations-api.ts
    - frontend/app/(authenticated)/admin/operations/page.tsx
    - frontend/tests/phase11-operations-ui.test.tsx
    - frontend/tests/phase15-admin-metadata-closure-ui.test.tsx
    - frontend/tests/phase25-admin-policy-operations-ui.test.tsx

key-decisions:
  - "Keep RUNTIME_MODE as product/runtime intent and ENVIRONMENT as deployment platform semantics."
  - "Treat frontend admin operations types and UI as part of the backend response contract when removing sensitive fields."

patterns-established:
  - "Production-pilot readiness fails unsafe demo/login/cookie/origin/provider/identity states while public demo can remain intentionally degraded."
  - "Admin operations exposes runtime/connectivity metadata without raw origins, cookie names, secret names with values, connection strings, demo emails, or student content."

requirements-completed:
  - RUNTIME-01
  - RUNTIME-02
  - RUNTIME-03
  - RUNTIME-05

# Metrics
duration: 13 min
completed: 2026-05-25
---

# Phase 28 Plan 01: Runtime Mode & Readiness Metadata Summary

**Explicit runtime-mode readiness with admin-only metadata summaries and frontend-safe operations contract.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-25T07:45:00Z
- **Completed:** 2026-05-25T07:58:34Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added `RUNTIME_MODE` and `ALLOW_DEMO_LOGIN` settings with exact runtime modes: `local_demo`, `public_demo`, and `production_pilot`.
- Added mode-aware readiness keys for runtime compatibility, demo seed/login policy, cookie/origin safety, provider secrets, and identity configuration.
- Added safe admin operations runtime/connectivity metadata and removed raw origin and cookie-name exposure from backend schema, frontend API types, UI, and tests.
- Preserved public `/health/ready` as status plus generated timestamp only.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add explicit runtime-mode configuration contract** - `0183181` (feat)
2. **Task 2: Add mode-aware readiness checks and safe admin operations metadata** - `8e61c2a` (feat)

**Plan metadata:** pending commit

## Files Created/Modified

- `backend/app/core/config.py` - Runtime mode type, env aliases, and helper predicates.
- `backend/app/services/readiness.py` - Production-pilot/public-demo aware static readiness checks and renamed demo seed policy key.
- `backend/app/schemas/admin_operations.py` - Runtime summary schema and metadata-only connectivity schema.
- `backend/app/services/admin_operations.py` - Runtime summary and raw-origin/cookie-name-free connectivity summary.
- `backend/tests/test_phase7_readiness.py` - Runtime validation, production-pilot pass/fail, public readiness, and sensitive-output regression coverage.
- `backend/tests/test_demo_seed.py` - Metadata-only connectivity assertions for operations dashboard.
- `frontend/lib/admin-operations-api.ts` - Frontend contract aligned to the new operations response schema.
- `frontend/app/(authenticated)/admin/operations/page.tsx` - Runtime panel and metadata-only connectivity display.
- `frontend/tests/phase11-operations-ui.test.tsx` - Operations fixture updated to safe runtime/connectivity metadata.
- `frontend/tests/phase15-admin-metadata-closure-ui.test.tsx` - Operations fixture updated to safe runtime/connectivity metadata.
- `frontend/tests/phase25-admin-policy-operations-ui.test.tsx` - Operations fixture updated to safe runtime/connectivity metadata.

## Decisions Made

- Kept production-pilot static database URL checking from blocking the safe direct `Settings(...)` static readiness test, while preserving real database connectivity and Alembic checks for full readiness reports.
- Updated frontend API/UI/tests even though the original plan listed backend files only, because backend schema removal would otherwise break the typed admin operations surface and leave stale unsafe field expectations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated frontend admin operations contract after backend schema change**
- **Found during:** Task 2 (mode-aware readiness checks and safe admin operations metadata)
- **Issue:** The plan removed `frontend_origin` and `session_cookie_name` from the backend operations response, but the frontend API type, operations page, and operations UI fixtures still required those fields.
- **Fix:** Updated the frontend type, runtime/connectivity UI, and operations fixtures to use `runtime`, `frontend_origin_kind`, `has_local_origin`, and `all_origins_https`, with no cookie-name display.
- **Files modified:** `frontend/lib/admin-operations-api.ts`, `frontend/app/(authenticated)/admin/operations/page.tsx`, `frontend/tests/phase11-operations-ui.test.tsx`, `frontend/tests/phase15-admin-metadata-closure-ui.test.tsx`, `frontend/tests/phase25-admin-policy-operations-ui.test.tsx`
- **Verification:** `npm run lint`, targeted operations Vitest files, and `npm run build`
- **Committed in:** `8e61c2a`

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Required for schema correctness and privacy; no scope creep beyond the operations API contract.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `28-02-PLAN.md`: seed/auth production-pilot safety can now depend on explicit runtime mode and the renamed readiness keys.

---
*Phase: 28-runtime-mode-production-readiness-foundation*
*Completed: 2026-05-25*
