---
phase: 02-identity-roles-links-demo-access
plan: 06
subsystem: frontend-admin-management
tags: [nextjs, admin-ui, user-management, link-management, destructive-confirmations]

requires:
  - phase: 02-identity-roles-links-demo-access
    plan: 03
    provides: admin user/link APIs
  - phase: 02-identity-roles-links-demo-access
    plan: 05
    provides: admin authenticated dashboard shell
provides:
  - Admin user management screen
  - Admin student-adult link management screen
  - Admin API client functions for users and links
  - User and link creation forms
  - Destructive confirmation dialog with exact Vietnamese copy
affects: [phase-02-final-verification]

tech-stack:
  added: [admin-api-client, admin-forms, admin-management-tests]
  patterns: [demo-only-physical-delete-control, exact-destructive-copy, role-filtered-link-form, credentialed-admin-mutations]

key-files:
  created:
    - frontend/lib/admin-api.ts
    - frontend/components/admin/user-form.tsx
    - frontend/components/admin/link-form.tsx
    - frontend/components/admin/destructive-confirm-dialog.tsx
    - frontend/app/(authenticated)/admin/users/page.tsx
    - frontend/app/(authenticated)/admin/links/page.tsx
    - frontend/tests/admin-management.test.tsx

key-decisions:
  - "Physical delete action is only rendered as Xóa tài khoản demo for demo accounts."
  - "Link form adult selector includes only teacher and parent accounts; student and admin accounts are excluded."
  - "Admin pages use frontend validation for clarity, while backend remains the enforcement and audit source."

patterns-established:
  - "Admin mutations use apiFetch, preserving credentials: include."
  - "Destructive operations require explicit Vietnamese confirmation before API mutation."
  - "Relationship type options remain exactly teacher and parent."

requirements-supported: [AUTH-05, AUTH-06, ADMIN-01]

duration: 34 min
completed: 2026-05-20
---

# Phase 02 Plan 06: Admin Management UI Summary

**Admin user and student-adult link management UI is complete.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-05-20T13:08:00Z
- **Completed:** 2026-05-20T13:42:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added admin API client functions for listing, creating, updating, disabling/deleting users, and creating/revoking links.
- Added admin user management page with create form, role/status controls, demo badge, disable action, and demo-only delete action.
- Added admin link management page with relationship creation form, role-filtered selectors, link list, Demo badge, and revoke action.
- Added reusable destructive confirmation dialog containing all exact required Vietnamese confirmation strings.
- Added admin management tests for student form validation, non-demo delete hiding, exact confirmation copy, adult selector filtering, demo link display, revoke copy, and credentialed admin mutations.

## Task Commits

1. **Tasks 1-2: Admin user and link management UI** - `edf3f79` (feat)

## Files Created/Modified

- `frontend/lib/admin-api.ts` - Admin user/link API client.
- `frontend/components/admin/user-form.tsx` - Admin user creation form.
- `frontend/components/admin/link-form.tsx` - Admin link creation form.
- `frontend/components/admin/destructive-confirm-dialog.tsx` - Shared confirmation dialog and exact copy constants.
- `frontend/app/(authenticated)/admin/users/page.tsx` - Admin users screen.
- `frontend/app/(authenticated)/admin/links/page.tsx` - Admin links screen.
- `frontend/tests/admin-management.test.tsx` - Admin UI tests.

## Decisions Made

- Kept real-account physical delete unavailable in UI; backend still soft-deletes real accounts if DELETE is called.
- Kept link creation admin-managed only; no invite/self-claim flows were introduced.
- Rendered role/status values in backend enum form (`student`, `teacher`, `parent`, `admin`; `active`, `disabled`, `deleted`) to match API contracts exactly.

## Deviations from Plan

None.

## Issues Encountered

- No blockers.

## User Setup Required

None.

## Next Phase Readiness

Admin UI is ready for Plan 02-07 final E2E/security verification and phase completion.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
