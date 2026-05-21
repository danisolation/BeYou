---
phase: 02-identity-roles-links-demo-access
plan: 05
subsystem: frontend-role-dashboards
tags: [nextjs, dashboards, role-routing, student-profile, adult-portals, admin-landing]

requires:
  - phase: 02-identity-roles-links-demo-access
    plan: 04
    provides: frontend auth foundation
provides:
  - Authenticated layout using backend session truth
  - Student dashboard with profile, school, class, linked adults, privacy link, and Demo badge
  - Teacher dashboard showing linked students only
  - Parent dashboard showing linked students only
  - Admin landing dashboard with safe management entry points
affects: [phase-02-admin-ui, phase-02-final-verification]

tech-stack:
  added: [Next.js grouped routes, client dashboards, Testing Library dashboard tests]
  patterns: [backend-session-layout, wrong-role-safe-state, linked-student-card, empty-state, no-token-browser-storage]

key-files:
  created:
    - frontend/app/(authenticated)/layout.tsx
    - frontend/app/(authenticated)/student/page.tsx
    - frontend/app/(authenticated)/teacher/page.tsx
    - frontend/app/(authenticated)/parent/page.tsx
    - frontend/app/(authenticated)/admin/page.tsx
    - frontend/components/empty-state.tsx
    - frontend/tests/role-dashboards.test.tsx

key-decisions:
  - "Authenticated layout shows a safe wrong-role state with a link to the backend-returned correct dashboard instead of treating frontend checks as authorization."
  - "Adult dashboards render only linked student identity/school/class/link status data already authorized by the backend."
  - "Admin dashboard remains limited to user/link management entry points and does not include reports or wellbeing surveillance features."

patterns-established:
  - "All role pages use apiFetch with cookie credentials."
  - "Loading state uses exact copy: Đang tải thông tin..."
  - "Empty states use calm Vietnamese copy and avoid blame or punitive language."

requirements-supported: [AUTH-03, AUTH-04]

duration: 30 min
completed: 2026-05-20
---

# Phase 02 Plan 05: Role Dashboards Summary

**Authenticated role dashboards for student, teacher, parent, and admin are complete.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-20T12:37:00Z
- **Completed:** 2026-05-20T13:07:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added authenticated layout that calls `/api/auth/me`, shows demo banner for demo sessions, supports logout, and handles wrong-role portal access safely.
- Added student dashboard with name, email, school, class, linked teacher/parent adults, Demo badge, and privacy notice review link.
- Added teacher and parent dashboards that display linked students only.
- Added admin landing with safe entry cards for account and student-adult link management.
- Added dashboard tests for loading state, demo banner, wrong-role state, logout, no token storage, student profile data, adult dashboards, and admin entry cards.

## Task Commits

1. **Tasks 1-2: Authenticated layout and role dashboards** - `dbfc6fb` (feat)

## Files Created/Modified

- `frontend/app/(authenticated)/layout.tsx` - Shared authenticated shell and role guard state.
- `frontend/app/(authenticated)/student/page.tsx` - Student profile dashboard.
- `frontend/app/(authenticated)/teacher/page.tsx` - Teacher linked-students dashboard.
- `frontend/app/(authenticated)/parent/page.tsx` - Parent linked-students dashboard.
- `frontend/app/(authenticated)/admin/page.tsx` - Admin landing dashboard.
- `frontend/components/empty-state.tsx` - Calm reusable empty state.
- `frontend/tests/role-dashboards.test.tsx` - Role dashboard tests.

## Decisions Made

- Used grouped Next route folder `(authenticated)` so `/student`, `/teacher`, `/parent`, and `/admin` remain clean route paths.
- Kept `/admin/users` and `/admin/links` pages for Plan 02-06 instead of stubbing them here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Shell command compatibility] Quoted PowerShell path containing parentheses before commit**
- **Found during:** Git add for `frontend/app/(authenticated)`
- **Issue:** PowerShell interpreted `(authenticated)` as command syntax when unquoted.
- **Fix:** Re-ran `git add` with the grouped route path quoted.
- **Impact:** No source behavior change.

---

**Total deviations:** 1 environment command adjustment
**Impact on plan:** None.

## Issues Encountered

- No implementation blockers.

## User Setup Required

None.

## Next Phase Readiness

Role dashboards are ready for Plan 02-06 admin user and link management UI.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
