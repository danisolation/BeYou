---
phase: 02-identity-roles-links-demo-access
plan: 03
subsystem: backend-admin-demo
tags: [fastapi, admin, users, links, seed-data, audit]

requires:
  - phase: 02-identity-roles-links-demo-access
    plan: 02
    provides: authenticated admin session and authorization helpers
provides:
  - Admin user list/create/update/delete APIs
  - Admin student-adult link list/create/revoke APIs
  - Metadata-only audit events for role/status/link mutations
  - Deterministic idempotent demo seed for student, teacher, parent, admin, and links
affects: [phase-02-frontend-admin-ui, phase-02-final-verification, phase-03-student-features]

tech-stack:
  added: [FastAPI admin routers, admin schemas, admin services, seed module]
  patterns: [soft-delete-real-users, physical-delete-demo-users, admin-only-mutations, relationship-role-validation, idempotent-demo-seed]

key-files:
  created:
    - backend/app/schemas/admin.py
    - backend/app/services/users.py
    - backend/app/services/links.py
    - backend/app/api/admin_users.py
    - backend/app/api/admin_links.py
    - backend/app/seeds/demo_seed.py
    - backend/tests/test_admin_users_links.py
    - backend/tests/test_demo_seed.py
  modified:
    - backend/app/main.py

key-decisions:
  - "Real users are soft-deleted with status=deleted; demo users can be physically deleted after dependent identity rows are removed."
  - "Admin link creation requires exact role pairing: student+teacher with relationship_type=teacher, or student+parent with relationship_type=parent."
  - "Demo seed is gated by ALLOW_DEMO_SEED and never prints the demo password."

patterns-established:
  - "Admin mutation routes authenticate existing session, require admin role, require admin_operations purpose, then apply CSRF checks before writes."
  - "Admin mutation audit events record metadata IDs/statuses only and avoid passwords/tokens/session cookies/raw sensitive content."
  - "Demo seed upserts users by email and active links by student/adult/relationship."

requirements-completed: [AUTH-02, AUTH-05, AUTH-06, ADMIN-01]

duration: 47 min
completed: 2026-05-20
---

# Phase 02 Plan 03: Admin APIs and Demo Seed Summary

**Admin-managed users, student-adult links, and deterministic demo accounts are complete.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-05-20T11:13:00Z
- **Completed:** 2026-05-20T12:00:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added admin user APIs for listing, creating, updating, disabling, soft deleting real users, and physically deleting demo users.
- Added admin link APIs for listing, creating validated student-teacher/student-parent links, and revoking links.
- Added role/status/link audit events using metadata-only payloads.
- Added deterministic demo seed with exact student, teacher, parent, and admin demo accounts and active linked group.
- Added tests covering non-admin denial, admin CSRF rejection, real vs demo delete behavior, audit events, invalid link pairings, link revoke, and idempotent seed behavior.

## Task Commits

1. **Tasks 1-2: Admin user and student-adult link APIs** - `0591df7` (feat)
2. **Task 3: Deterministic demo seed** - `c04b6fb` (feat)

## Files Created/Modified

- `backend/app/schemas/admin.py` - Admin user/link request and response schemas.
- `backend/app/services/users.py` - User CRUD, status changes, role-change audit, real/demo delete handling.
- `backend/app/services/links.py` - Link validation, creation, revoke, and audit.
- `backend/app/api/admin_users.py` - `/api/admin/users` endpoints.
- `backend/app/api/admin_links.py` - `/api/admin/links` endpoints.
- `backend/app/seeds/demo_seed.py` - `python -m app.seeds.demo_seed` seed command.
- `backend/tests/test_admin_users_links.py` - Admin user/link behavior tests.
- `backend/tests/test_demo_seed.py` - Demo seed idempotency and gating tests.
- `backend/app/main.py` - Admin routers registered under `/api/admin`.

## Decisions Made

- Kept invite codes, self-claim links, email invitations, OAuth linking, and multi-role assumptions out of scope for this phase.
- Used admin-authenticated API creation for real accounts and deterministic local seed for demo fixtures.
- Allowed Pydantic request validation to reject invalid relationship enum values before service-level role-pair validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Implementation coherence] Committed admin user and link APIs together**
- **Reason:** `main.py` imports both admin routers; splitting the commit would leave an intermediate commit with unresolved imports or incomplete collected tests.
- **Impact:** No behavior deviation. The two planned API tasks are still tested independently inside `test_admin_users_links.py`.

---

**Total deviations:** 1 commit-structure adjustment
**Impact on plan:** None; all planned endpoints and seed behavior were implemented.

## Issues Encountered

- No blockers.

## User Setup Required

To seed demo accounts locally:

```text
cd backend
python -m app.seeds.demo_seed
```

The seed only runs when `ALLOW_DEMO_SEED=true`.

## Next Phase Readiness

Backend auth/admin/demo APIs are ready for Plan 02-04 frontend foundation and auth shell.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
