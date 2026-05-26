---
phase: 30-identity-foundation-auth-contracts
plan: 01
subsystem: auth
tags: [fastapi, sqlalchemy, alembic, postgres, sessions, identity]

requires:
  - phase: 28-runtime-mode-production-readiness-foundation
    provides: Runtime mode and production-pilot auth safety gates used by the existing login flow.
provides:
  - Backend schema foundation for safe external identity mapping via provider key plus subject hash.
  - Session auth-method/provider metadata for password, demo_password, and future sso sessions.
  - Regression tests proving shared backend-owned HttpOnly session behavior and auth response routing.
affects: [identity, auth, sessions, admin-operations, provider-readiness]

tech-stack:
  added: []
  patterns:
    - Safe auth metadata is stored server-side on the session row, never in browser token storage.
    - External identity records store provider subject hashes and status buckets only.

key-files:
  created:
    - backend/alembic/versions/20260525_0011_identity_foundation.py
    - backend/tests/test_identity_foundation_schema.py
  modified:
    - backend/app/db/models.py
    - backend/app/core/sessions.py
    - backend/app/api/auth.py
    - backend/tests/test_auth_privacy_portals.py

key-decisions:
  - "Kept Phase 30 Plan 01 contract-only: no OAuth/OIDC redirect, callback, token exchange, or browser token storage."
  - "Used auth_method/auth_provider_key as nullable safe session metadata so existing sessions can migrate without backfill risk."
  - "Stored external provider identity as provider_key plus provider_subject_hash with safe status/label/hash fields only."

patterns-established:
  - "All successful auth methods converge on create_session() and _login_response()."
  - "SSO is represented only as safe session metadata until a future provider implementation exists."

requirements-completed: [IDENT-02, IDENT-03, IDENT-04, IDENT-05]

duration: 3min
completed: 2026-05-26
---

# Phase 30 Plan 01: Backend identity/session schema and safe session metadata Summary

**Provider-subject-hash identity mapping plus backend-owned session auth metadata for password, demo_password, and future SSO contracts.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-26T02:15:49Z
- **Completed:** 2026-05-26T02:18:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `AuthSessionMethod`, `ExternalIdentityStatus`, `ExternalIdentity`, and nullable safe auth metadata fields on `sessions`.
- Added Alembic migration `20260525_0011_identity_foundation` for `external_identities` and session metadata columns/indexes/FK.
- Updated `create_session()` and password/demo login to persist `password`, `demo_password`, or future `sso` metadata while preserving HttpOnly cookies.
- Added backend tests for schema safety, migration contract, session metadata, shared `/api/auth/me` routing, revocation, inactive/deleted users, and privacy acknowledgement behavior.

## Task Commits

_TDD tasks include RED test commits followed by GREEN implementation commits._

1. **Task 1: Add identity/session schema and Alembic migration**
   - `8cab836` test: add failing identity schema contract tests
   - `402bf45` feat: add identity schema foundation
2. **Task 2: Store safe auth method/provider metadata through existing session contract**
   - `d8e665e` test: add failing auth session metadata tests
   - `eb9ea41` feat: store auth method session metadata

## Files Created/Modified

- `backend/app/db/models.py` - Adds auth/session enums, session metadata columns, and safe `ExternalIdentity` model.
- `backend/alembic/versions/20260525_0011_identity_foundation.py` - Migrates `external_identities` and session metadata.
- `backend/app/core/sessions.py` - Extends `create_session()` with keyword-only safe auth metadata parameters.
- `backend/app/api/auth.py` - Marks demo users as `demo_password` and non-demo users as `password` when creating sessions.
- `backend/tests/test_auth_privacy_portals.py` - Covers metadata, shared session contract, revocation, account status, and privacy routing.
- `backend/tests/test_identity_foundation_schema.py` - Covers schema/migration safety and forbidden raw identity fields.

## Decisions Made

- Followed the planned contract-only boundary: no OAuth/OIDC redirect/callback and no provider token storage.
- Kept session metadata nullable to avoid breaking existing sessions and to allow gradual migration/backfill later if needed.
- Kept external identity review metadata limited to labels/hashes/statuses; raw subject, raw email, raw claims, groups, and tokens are absent.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Verification

- `python -m pytest tests\test_identity_foundation_schema.py tests\test_auth_privacy_portals.py -q` — 24 passed.
- `python -m alembic upgrade head` — passed.
- `python -m ruff check .` — passed.

## Auth Gates

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 30-02 can build the external identity resolver contract on top of `ExternalIdentity`.
- Plan 30-03 can report provider/mapping/session metadata in readiness and admin operations without raw identifiers.

## Self-Check: PASSED

- Found all created/modified files listed in this summary.
- Found task commits `8cab836`, `402bf45`, `d8e665e`, and `eb9ea41` in git history.

---
*Phase: 30-identity-foundation-auth-contracts*
*Completed: 2026-05-26*
