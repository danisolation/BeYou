---
phase: 32-privacy-security-release-gates
plan: 01
subsystem: backend
tags: [pytest, readiness, identity, privacy, admin-operations, release-gates]

requires:
  - phase: 28-runtime-mode-production-readiness-foundation
    provides: Production-pilot runtime/readiness and seed blocking contracts.
  - phase: 30-identity-foundation-auth-contracts
    provides: Backend-owned auth/session metadata and external identity boundaries.
  - phase: 31-school-pilot-operations-safe-launch
    provides: Metadata-only pilot operations dashboard and safe launch command metadata.
provides:
  - Backend Phase 32 release-gate matrix for QA-01, QA-03, QA-04, and QA-05.
  - Expanded operations metadata redlines for self-check answers, scenario answers, exports, private notes, and risk leaderboard markers.
affects: [32-02-node-release-gates, 32-03-frontend-privacy-gates, 32-05-verification]

tech-stack:
  added: []
  patterns:
    - Release-gate tests assert forbidden serialized markers against readiness and operations outputs.
    - Source-grep tests guard contract-only identity scope without adding OAuth/OIDC callback behavior.

key-files:
  created:
    - backend/tests/test_phase32_release_gates.py
  modified:
    - backend/app/services/admin_operations.py

key-decisions:
  - "Fixed a real operations sanitizer gap found by the new QA-05 gate instead of weakening the test."
  - "Kept Phase 32 backend work as verification/regression hardening only; no product UI, auth callback, export, reset, or risk drilldown was added."

patterns-established:
  - "Phase 32 backend forbidden markers are centralized in `PHASE32_FORBIDDEN_BACKEND_MARKERS`."
  - "Operations metadata redlines are enforced recursively by the existing sanitizer before dashboard serialization."

requirements-covered: [QA-01, QA-03, QA-04, QA-05]

duration: 18 min
completed: 2026-05-26
---

# Phase 32 Plan 01: Backend release gates Summary

**Backend release gates now prove production-pilot readiness, identity/privacy boundaries, and operations metadata-only output.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-26T04:25:00Z
- **Completed:** 2026-05-26T04:43:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added `backend/tests/test_phase32_release_gates.py` with 8 tests covering QA-01 runtime/readiness/seed blocking, QA-03 identity/session metadata and no-token/no-callback source gates, QA-04 SOS-only adult visibility, and QA-05 operations metadata redlines.
- Expanded `OPERATIONS_FORBIDDEN_METADATA_KEYS` so operations dashboard serialization removes `private_note`, self-check/scenario answer markers, export URL markers, and risk leaderboard markers.
- Confirmed the backend release gate catches real sanitizer regressions while preserving existing Phase 31 operations behavior.

## Task Commits

1. **Task 1: Add QA-01 runtime/readiness and secret-masking backend gate** - pending commit
2. **Task 2: Add QA-03 and QA-04 identity/cross-role privacy backend gate** - pending commit
3. **Task 3: Add QA-05 operations/readiness metadata-only backend gate** - pending commit

## Files Created/Modified

- `backend/tests/test_phase32_release_gates.py` - Adds consolidated Phase 32 backend release-gate tests and helpers.
- `backend/app/services/admin_operations.py` - Extends operations forbidden metadata keys for Phase 32 privacy redlines.

## Decisions Made

- Treated the leaked `self_check_answer` marker as a production sanitizer gap and fixed the shared sanitizer.
- Kept identity checks as source/test release gates only; no OAuth/OIDC/SAML/SCIM implementation was introduced.

## Deviations from Plan

- Production code changed only because the new QA-05 gate exposed a real metadata sanitizer regression.

## Issues Encountered

- Initial `test_qa05_operations_dashboard_serialization_rejects_raw_sensitive_markers` failed because answer and risk leaderboard markers were not blocked by the operations sanitizer.

## Verification

- `python -m pytest tests\test_phase32_release_gates.py -q` - 8 passed.
- `python -m pytest tests\test_phase32_release_gates.py tests\test_phase31_school_pilot_operations.py tests\test_phase7_readiness.py tests\test_demo_seed.py tests\test_auth_privacy_portals.py tests\test_authorization_security.py -q` - 72 passed.
- `python -m ruff check .` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 32-02 Node deployment/smoke release-gate tests and `test:release-gates` script wiring.

---
*Phase: 32-privacy-security-release-gates*
*Completed: 2026-05-26*
