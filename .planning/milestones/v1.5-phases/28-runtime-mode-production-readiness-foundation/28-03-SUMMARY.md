---
phase: 28-runtime-mode-production-readiness-foundation
plan: 03
subsystem: testing
tags: [runtime-mode, readiness, regression-tests, render, docs]

# Dependency graph
requires:
  - phase: 28-runtime-mode-production-readiness-foundation
    provides: runtime/readiness/admin metadata from Plan 28-01 and seed/auth safety from Plan 28-02
provides:
  - complete Phase 28 regression coverage for runtime, readiness, seed, auth, and masking behavior
  - safe local runtime defaults in backend environment example
  - Render public demo runtime declaration
  - README explanation of public demo versus production-pilot readiness
affects: [phase-29, phase-30, deployment-docs, production-pilot, public-demo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Runtime tests clear cached settings before and after env mutation
    - Hosted demo deployment is explicitly documented as public_demo, not production_pilot

key-files:
  created:
    - .planning/phases/28-runtime-mode-production-readiness-foundation/28-03-SUMMARY.md
  modified:
    - backend/tests/test_phase7_readiness.py
    - backend/tests/test_demo_seed.py
    - backend/tests/test_auth_privacy_portals.py
    - backend/.env.example
    - render.yaml
    - README.md

key-decisions:
  - "Keep the current Render service as public_demo with demo seeding enabled; production_pilot requires separate safer env values."
  - "Do not add deployment guard commands, smoke split, identity models, or pilot checklist UI in Phase 28."

patterns-established:
  - "Tests use exact runtime mode env values to avoid confusing public demo and production-pilot semantics."
  - "Operator docs state public readiness remains status/time only while admin readiness/operations are authorization-gated metadata-only."

requirements-completed:
  - RUNTIME-01
  - RUNTIME-02
  - RUNTIME-03
  - RUNTIME-04
  - RUNTIME-05

# Metrics
duration: 4 min
completed: 2026-05-25
---

# Phase 28 Plan 03: Runtime Regression and Config Docs Summary

**Runtime-mode regression gates, safe env defaults, Render public-demo declaration, and README readiness guidance.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-25T08:02:00Z
- **Completed:** 2026-05-25T08:06:10Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Confirmed runtime/readiness/masking tests exist for default mode, invalid mode, production-pilot pass/fail cases, minimal public readiness, and admin metadata masking.
- Standardized seed/auth regression test names required by the plan and made public-demo seeding explicit in tests.
- Added `RUNTIME_MODE=local_demo` and `ALLOW_DEMO_LOGIN=true` to `backend/.env.example`.
- Declared the current Render service as `RUNTIME_MODE=public_demo` with demo seed/login enabled for the hosted demo.
- Added README guidance distinguishing `public_demo` from `production_pilot` readiness and masking behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add runtime readiness and masking regression tests** - covered by `8e61c2a` (feat from Plan 28-01; re-verified in this plan)
2. **Task 2: Add seed and auth production-pilot regression tests** - `e93cb8c` (test)
3. **Task 3: Update env example, Render public-demo mode, and README runtime note** - `9eef860` (docs)

**Plan metadata:** pending commit

## Files Created/Modified

- `backend/tests/test_phase7_readiness.py` - Runtime/readiness/masking test coverage already present and re-verified.
- `backend/tests/test_demo_seed.py` - Exact production-pilot seed no-op test name and explicit public-demo seed setup.
- `backend/tests/test_auth_privacy_portals.py` - Exact production-pilot demo login denial test name and no-session assertion.
- `backend/.env.example` - Local demo runtime and demo-login defaults.
- `render.yaml` - Public demo runtime and demo-login declaration for the hosted service.
- `README.md` - Runtime modes and readiness behavior note.

## Decisions Made

- Left broader deployment guardrails and demo/pilot smoke split to Phase 29 as planned.
- Documented the hosted demo as intentionally public-demo seeded instead of changing the current Render seed command.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 28 is ready for phase-level review and verification. Phase 29 can consume the explicit runtime mode and public-demo deployment declaration for deploy guardrails and smoke profile split.

---
*Phase: 28-runtime-mode-production-readiness-foundation*
*Completed: 2026-05-25*
