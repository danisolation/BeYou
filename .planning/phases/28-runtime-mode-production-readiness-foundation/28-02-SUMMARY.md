---
phase: 28-runtime-mode-production-readiness-foundation
plan: 02
subsystem: backend
tags: [runtime-mode, demo-seed, auth, sessions, production-pilot]

# Dependency graph
requires:
  - phase: 28-runtime-mode-production-readiness-foundation
    provides: runtime mode settings and allow_demo_login contract from Plan 28-01
provides:
  - production-pilot no-op guard before demo seed writes
  - demo-account login denial before backend session creation in production pilot or when demo login is disabled
affects: [phase-28, phase-29, phase-30, production-pilot, public-demo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Runtime gates check Settings.is_production_pilot before seed writes or session issuance
    - Demo login denial records a login failure and returns 403 without setting session cookies

key-files:
  created:
    - .planning/phases/28-runtime-mode-production-readiness-foundation/28-02-SUMMARY.md
  modified:
    - backend/app/seeds/demo_seed.py
    - backend/tests/test_demo_seed.py
    - backend/app/api/auth.py
    - backend/tests/test_auth_privacy_portals.py

key-decisions:
  - "Production-pilot seed invocation is a safe no-op rather than a startup exception, preserving public demo startup behavior."
  - "Demo-account login denial occurs after password/active-account checks but before reset_login_failures and create_session."

patterns-established:
  - "Public demo keeps intentional seeded data when ALLOW_DEMO_SEED=true."
  - "Production pilot can allow non-demo email/password sessions while blocking seeded demo accounts."

requirements-completed:
  - RUNTIME-02
  - RUNTIME-04
  - RUNTIME-05

# Metrics
duration: 5 min
completed: 2026-05-25
---

# Phase 28 Plan 02: Seed/Auth Production-Pilot Safety Summary

**Production pilot now no-ops demo seeding and rejects demo-account sessions before cookies are issued.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-25T07:59:00Z
- **Completed:** 2026-05-25T08:03:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added an early `settings.is_production_pilot` guard in `seed_demo_data()` before `ALLOW_DEMO_SEED` handling and before any DB writes.
- Added tests proving production-pilot seed invocation returns `False` and creates no demo users, links, self-check tests, scenarios, or mood configs.
- Added a demo-login guard in `/api/auth/login` that returns HTTP 403 before session creation when runtime is production pilot or `ALLOW_DEMO_LOGIN=false`.
- Added tests proving denied demo login has no `set-cookie` header and creates no `Session` row, while non-demo production-pilot login still creates a backend-owned session.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make production-pilot demo seed invocation a safe no-op before writes** - `080c42a` (feat)
2. **Task 2: Block demo-user login in production pilot before session creation** - `a0c246a` (feat)

**Plan metadata:** pending commit

## Files Created/Modified

- `backend/app/seeds/demo_seed.py` - Added the production-pilot no-op guard before demo seed writes.
- `backend/tests/test_demo_seed.py` - Added production-pilot seed no-op coverage while preserving public-demo seed assertions.
- `backend/app/api/auth.py` - Added `DEMO_LOGIN_DISABLED_DETAIL` and the pre-session demo login denial guard.
- `backend/tests/test_auth_privacy_portals.py` - Added production-pilot and `ALLOW_DEMO_LOGIN=false` demo denial tests plus non-demo pilot login coverage.

## Decisions Made

- Used no-op seed behavior for production pilot so a shared startup command remains safe and public demo behavior is not disrupted.
- Reused existing login failure tracking for denied demo logins so brute-force/rate-limit accounting remains consistent.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `28-03-PLAN.md`: tests/docs/config updates can now document and verify both explicit runtime metadata and production-pilot seed/auth safety.

---
*Phase: 28-runtime-mode-production-readiness-foundation*
*Completed: 2026-05-25*
