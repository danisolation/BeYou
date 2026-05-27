---
phase: 29-deployment-guardrails-smoke-profiles
plan: 02
subsystem: infra
tags: [node, smoke-tests, public-demo, production-pilot, cors, readiness]

requires:
  - phase: 29-01-deployment-guardrails
    provides: Safe URL/profile validation conventions and deployment guardrail command
provides:
  - Separate seeded public demo smoke command
  - Separate production pilot smoke command without demo-account dependency
  - Shared smoke helper module for URL, readiness, health, CORS, and cookie handling
  - Compatibility `smoke:production` runner that declares demo delegation
affects: [29-03-admin-operations-metadata, 29-04-operations-ui-docs]

tech-stack:
  added: []
  patterns:
    - Shared Node `.mjs` smoke helper module with pure validation functions
    - Demo smoke can tolerate seeded public demo readiness drift while pilot smoke requires `ready`

key-files:
  created:
    - frontend/scripts/smoke-utils.mjs
    - frontend/scripts/smoke-profiles.test.mjs
    - frontend/scripts/demo-smoke.mjs
    - frontend/scripts/pilot-smoke.mjs
  modified:
    - frontend/scripts/production-smoke.mjs
    - frontend/package.json

key-decisions:
  - "smoke:demo preserves seeded demo login/session/dashboard coverage."
  - "smoke:pilot validates frontend/backend/API URL safety, live/readiness/CORS, and never logs in with demo users."
  - "smoke:production remains a compatibility runner but explicitly says it delegates to smoke:demo."

patterns-established:
  - "Smoke URL validation returns pass/warn/fail records without live network calls."
  - "Production pilot smoke fails unless /health/ready returns JSON status exactly ready."

requirements-completed: [DEPLOY-02, DEPLOY-04]

duration: 12 min
completed: 2026-05-25
---

# Phase 29 Plan 02: Smoke Profile Split Summary

**Separate demo and production-pilot smoke commands with pilot readiness and no demo-user dependency**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-25T09:28:00Z
- **Completed:** 2026-05-25T09:40:04Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `smoke:demo` for seeded public demo validation using role demo accounts.
- Added `smoke:pilot` for production pilot validation requiring safe deployed URLs and readiness `ready`.
- Extracted shared health, readiness, CORS, URL, fetch, record, and cookie helpers into `smoke-utils.mjs`.
- Replaced `smoke:production` with a compatibility runner that announces demo delegation and points operators to `smoke:pilot`.

## Task Commits

1. **Task 1: Add smoke profile regression tests** - `3aff0e7` (test)
2. **Task 2: Implement shared smoke helpers and explicit demo/pilot scripts** - `cc33412` (feat)

**Plan metadata:** pending docs commit

_Note: TDD task used separate RED and GREEN commits._

## Files Created/Modified

- `frontend/scripts/smoke-utils.mjs` - Shared smoke URL validation, readiness evaluation, health checks, CORS preflight, fetch, record, and cookie helpers.
- `frontend/scripts/smoke-profiles.test.mjs` - Node regression tests for pilot URL validation, readiness rules, public demo tolerance, and pilot source forbidden strings.
- `frontend/scripts/demo-smoke.mjs` - Seeded public demo smoke flow preserving role login/session/dashboard checks.
- `frontend/scripts/pilot-smoke.mjs` - Production pilot smoke flow with safe URL validation, live/readiness/CORS checks, and no demo login path.
- `frontend/scripts/production-smoke.mjs` - Compatibility runner that delegates to `smoke:demo`.
- `frontend/package.json` - Adds `test:smoke-profiles`, `smoke:demo`, and `smoke:pilot`.

## Decisions Made

- Kept public demo readiness tolerant of `not_ready`/`degraded` because seeded demo mode can intentionally fail production-pilot readiness.
- Required production pilot smoke to fail when readiness JSON status is anything other than `ready`.
- Kept live smoke commands operator-invoked only; regression tests call pure helpers and read source files without hitting Vercel or Render.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

Operators should set `BEYOU_FRONTEND_URL`, `BEYOU_BACKEND_URL`, and optionally `NEXT_PUBLIC_API_BASE_URL` before running `smoke:pilot`.

## Next Phase Readiness

Ready for `29-03-PLAN.md`: backend/admin operations metadata can now reference distinct `smoke:demo`, `smoke:pilot`, and guardrail commands.

---
*Phase: 29-deployment-guardrails-smoke-profiles*
*Completed: 2026-05-25*
