---
phase: 30-identity-foundation-auth-contracts
plan: 02
subsystem: auth
tags: [fastapi, sqlalchemy, pytest, identity, authorization]

requires:
  - phase: 30-identity-foundation-auth-contracts
    provides: Plan 30-01 ExternalIdentity schema and backend-owned session/account status boundaries.
provides:
  - Safe external identity resolver contract using provider key plus subject hash.
  - Regression tests proving unknown/review/disabled/deprovisioned identities do not auto-create or privilege users.
  - Regression tests proving IdP claims/groups/school/class metadata do not grant adult visibility.
affects: [identity, auth, authorization, future-sso]

tech-stack:
  added: []
  patterns:
    - Provider subjects are resolved through normalized provider key plus SHA-256 subject hash only.
    - Future SSO resolution returns safe status buckets and never mutates identity/user state.
    - Adult visibility remains app-owned through role, active relationship, and student SOS.

key-files:
  created:
    - backend/app/services/external_identity.py
    - backend/tests/test_identity_contracts.py
  modified:
    - backend/tests/test_authorization_security.py

key-decisions:
  - "Kept Plan 30-02 contract-only: no OAuth/OIDC redirect, callback, token exchange, claim mapping, or provider login path was added."
  - "Resolved external identities only by provider_key plus provider_subject_hash; no email lookup, auto-provisioning, or unverified email merge was introduced."
  - "Kept require_permission unchanged so adult visibility remains role + active link + student SOS, not provider claims."

patterns-established:
  - "resolve_external_identity() is deny/review-by-default and returns explicit statuses for future SSO orchestration."
  - "Authorization regressions model provider claims as ignored test data rather than adding claim-aware authorization code."

requirements-completed: [IDENT-02, IDENT-05, IDENT-06, IDENT-07]

duration: 2min
completed: 2026-05-26
---

# Phase 30 Plan 02: External identity resolver contract and authorization boundary regressions Summary

**Provider-subject-hash resolver with safe identity statuses and regression proof that external claims cannot widen adult student visibility.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-26T02:22:36Z
- **Completed:** 2026-05-26T02:24:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `hash_external_subject()` and `resolve_external_identity()` with the exact safe resolver statuses required by Plan 30-02.
- Covered unknown, pending-review, disabled, deprovisioned, linked-inactive, and linked-active identities with pytest regression tests.
- Added authorization regression tests proving fake provider `groups`, `school`, `class_name`, and `email_domain` metadata are not inputs to `require_permission()`.
- Proved active adult relationship alone still receives HTTP 403 for `adult_support_summary`; active relationship plus student SOS is still required.

## Task Commits

_TDD Task 1 includes RED and GREEN commits. Task 2 was regression-only because existing authorization code already satisfied the planned boundary._

1. **Task 1: Implement external identity resolver contract**
   - `7239cb6` test: add failing external identity resolver tests
   - `56d5a27` feat: implement external identity resolver contract
2. **Task 2: Lock authorization boundary against provider claims**
   - `e468528` test: lock provider claims out of authorization

## Files Created/Modified

- `backend/app/services/external_identity.py` - Adds SHA-256 subject hashing and safe resolver status mapping without user creation or mutation.
- `backend/tests/test_identity_contracts.py` - Verifies resolver statuses, hash behavior, and unchanged user counts for unknown/review identities.
- `backend/tests/test_authorization_security.py` - Adds provider-claim and active-link-without-SOS adult visibility regression tests.

## Decisions Made

- Preserved the no-OAuth boundary; the resolver is a backend service contract only.
- Used existing `ExternalIdentityStatus` values from Plan 30-01 and mapped them to explicit resolver statuses for future auth orchestration.
- Left `backend/app/core/authorization.py` unchanged because it already enforced app-owned adult visibility boundaries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 2 RED tests passed immediately because the existing authorization implementation already ignored external claims and required active link + SOS. No production code change was needed; the task was completed as regression coverage.

## Verification

- `Set-Location D:\BeYou\backend; python -m pytest tests\test_identity_contracts.py -q` — 7 passed.
- `Set-Location D:\BeYou\backend; python -m pytest tests\test_authorization_security.py -q` — 13 passed.
- `Set-Location D:\BeYou\backend; python -m pytest tests\test_identity_contracts.py tests\test_authorization_security.py -q` — 20 passed.
- `Set-Location D:\BeYou\backend; python -m ruff check .` — passed.

## Auth Gates

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 30-03 can safely build provider readiness and admin operations metadata on top of the resolver/status contract.
- Future OAuth/SSO work must still explicitly link existing users and must not add claim/group authorization shortcuts.

## Self-Check: PASSED

- Found all created/modified files listed in this summary.
- Found task commits `7239cb6`, `56d5a27`, and `e468528` in git history.

---
*Phase: 30-identity-foundation-auth-contracts*
*Completed: 2026-05-26*
