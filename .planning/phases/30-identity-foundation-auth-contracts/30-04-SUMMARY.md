---
phase: 30-identity-foundation-auth-contracts
plan: 04
subsystem: auth
tags: [fastapi, pydantic, nextjs, react, auth-capabilities, privacy]

requires:
  - phase: 30-identity-foundation-auth-contracts
    provides: Plan 30-01 backend-owned session metadata and Plan 30-03 safe provider readiness settings.
provides:
  - Public-safe `/api/auth/capabilities` contract for demo/provider login metadata.
  - Login UI demo shortcut gating for production pilot without browser token storage.
  - Backend and frontend regression tests for capability privacy, demo entry visibility, and cookie-auth behavior.
affects: [identity, auth, login, production-pilot, frontend]

tech-stack:
  added: []
  patterns:
    - Public auth capability responses expose booleans, labels, and modes only.
    - Login UI treats capability fetch failures as backward-compatible demo-enabled behavior.

key-files:
  created:
    - .planning/phases/30-identity-foundation-auth-contracts/30-04-SUMMARY.md
  modified:
    - backend/app/schemas/auth.py
    - backend/app/api/auth.py
    - backend/tests/test_auth_privacy_portals.py
    - frontend/lib/auth.ts
    - frontend/app/login/page.tsx
    - frontend/tests/auth-portals.test.tsx
    - frontend/tests/no-token-storage.test.ts

key-decisions:
  - "Kept `/api/auth/capabilities` public-safe by returning only demo/email/provider booleans plus optional provider label/mode."
  - "Preserved email/password login and backend-owned cookie session behavior; no OAuth redirect/callback or browser token storage was added."
  - "Made login capability fetch fail-open for demo shortcuts to preserve local/demo compatibility with older backends."

patterns-established:
  - "Production-pilot demo shortcut visibility is controlled by `public_demo_entry_enabled` from backend capability metadata."
  - "Provider-disabled production pilot copy is informational only and does not add OAuth/provider actions."

requirements-completed: [IDENT-03, IDENT-04, IDENT-05]

duration: 8min
completed: 2026-05-26
---

# Phase 30 Plan 04: Public-safe auth capabilities and login demo gating Summary

**Public-safe auth capability endpoint plus production-pilot login demo shortcut suppression with cookie-only frontend auth.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-26T02:34:45Z
- **Completed:** 2026-05-26T02:42:13Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `AuthCapabilitiesResponse` and `GET /api/auth/capabilities` with safe booleans, provider label/mode, and production-pilot metadata only.
- Added backend tests for demo-enabled, production-pilot demo-disabled, provider-enabled, and provider-disabled capability responses.
- Added `AuthCapabilities` and `getAuthCapabilities()` in the frontend auth client while keeping `apiFetch(..., credentials: "include")`.
- Updated the login page to hide demo role shortcuts when `public_demo_entry_enabled` is false and show the required production-pilot Vietnamese copy.
- Extended frontend regression tests to prove demo shortcuts are hidden only for disabled production-pilot metadata and no token storage is introduced.

## Task Commits

_TDD tasks include RED test commits followed by GREEN implementation commits._

1. **Task 1: Add backend auth capabilities response without secrets**
   - `fb752d8` test: add failing auth capability contract tests
   - `4a84b00` feat: expose public-safe auth capabilities
2. **Task 2: Hide production-pilot demo entry in login UI without token storage**
   - `f20fb67` test: add failing frontend auth capability tests
   - `50ab007` feat: gate login demo entry by auth capabilities

## Files Created/Modified

- `backend/app/schemas/auth.py` - Adds `AuthCapabilitiesResponse` for the safe public contract.
- `backend/app/api/auth.py` - Adds `GET /api/auth/capabilities` derived from safe `Settings` fields.
- `backend/tests/test_auth_privacy_portals.py` - Adds capability privacy tests for demo, production-pilot, provider-enabled, and provider-disabled modes.
- `frontend/lib/auth.ts` - Adds `AuthCapabilities` type and `getAuthCapabilities()` helper.
- `frontend/app/login/page.tsx` - Fetches capability metadata and hides demo shortcuts with required production-pilot copy.
- `frontend/tests/auth-portals.test.tsx` - Covers capability-driven demo shortcut visibility.
- `frontend/tests/no-token-storage.test.ts` - Covers capability fetch credential behavior and no browser token writes.

## Decisions Made

- Used `public_demo_entry_enabled` as the frontend gate so backend demo-login denial and public UI visibility stay aligned.
- Returned `provider_label` and `provider_mode` only when provider login is enabled; disabled providers return `null` metadata.
- Preserved current demo shortcut behavior while capability metadata is loading or fetch fails for backward compatibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TDD RED tests failed as expected before implementation: backend returned 404 for `/api/auth/capabilities`, frontend lacked `getAuthCapabilities()`, and login demo shortcuts were still visible for disabled pilot metadata.
- No authentication gates or human checkpoints.

## Verification

- `Set-Location D:\BeYou\backend; python -m pytest tests\test_auth_privacy_portals.py -q` — 26 passed.
- `Set-Location D:\BeYou\frontend; npm run test -- --run tests\auth-portals.test.tsx` — 8 passed.
- `Set-Location D:\BeYou\frontend; npm run test -- --run tests\no-token-storage.test.ts` — 2 passed.
- `Set-Location D:\BeYou\frontend; npm run lint` — passed.
- Acceptance grep confirmed `backend/app/api/auth.py` and `frontend/app/login/page.tsx` do not contain forbidden provider/token markers from the plan.

## Auth Gates

None.

## Known Stubs

None. Stub scan only found an existing test assertion for an intentionally empty session list, not UI-rendered placeholder data or unwired capability metadata.

## Threat Flags

None. The new unauthenticated auth capabilities endpoint and login UI behavior were explicitly covered by the plan threat model and mitigated with public-safe response fields plus no-token frontend tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 30-05 can consume the safe auth capability and provider readiness patterns without adding OAuth/OIDC redirect or callback behavior.
- Production-pilot UI can now suppress public demo entry while local/public demo modes remain compatible.

## Self-Check: PASSED

- Found all created/modified files listed in this summary.
- Found task commits `fb752d8`, `4a84b00`, `f20fb67`, and `50ab007` in git history.
- Confirmed `.planning/STATE.md` still uses `milestone_name: Production Pilot Readiness & Identity`.

---
*Phase: 30-identity-foundation-auth-contracts*
*Completed: 2026-05-26*
