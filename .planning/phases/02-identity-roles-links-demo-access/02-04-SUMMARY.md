---
phase: 02-identity-roles-links-demo-access
plan: 04
subsystem: frontend-auth-foundation
tags: [nextjs, react, tailwind, auth-ui, privacy-ui, demo-indicators]

requires:
  - phase: 02-identity-roles-links-demo-access
    plan: 02
    provides: backend auth/session/privacy APIs
  - phase: 02-identity-roles-links-demo-access
    plan: 03
    provides: seeded demo accounts
provides:
  - Next.js App Router frontend scaffold
  - Cookie-auth API client using credentials include
  - Vietnamese login screen
  - Vietnamese privacy acknowledgement screen
  - Backend role route mapping
  - Demo banner and Demo badge components
affects: [phase-02-role-dashboards, phase-02-admin-ui, phase-02-final-verification]

tech-stack:
  added: [Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library]
  patterns: [cookie-auth-fetch-client, backend-returned-dashboard-route, privacy-gate-routing, demo-indicator-components]

key-files:
  created:
    - frontend/package.json
    - frontend/package-lock.json
    - frontend/app/layout.tsx
    - frontend/app/login/page.tsx
    - frontend/app/privacy/page.tsx
    - frontend/app/globals.css
    - frontend/lib/api.ts
    - frontend/lib/auth.ts
    - frontend/lib/routes.ts
    - frontend/components/demo-banner.tsx
    - frontend/components/demo-badge.tsx
    - frontend/tests/auth-portals.test.tsx

key-decisions:
  - "Frontend uses fetch credentials: include and never stores session tokens in localStorage or sessionStorage."
  - "Login redirects using backend-returned dashboard_route, with student privacy gate routed to /privacy?next=/student."
  - "Pinned Tailwind CSS to 3.x because the scaffold uses the stable PostCSS/Tailwind 3 config shape."

patterns-established:
  - "Authenticated UI consumes backend session truth instead of duplicating authorization assumptions."
  - "Demo separation is text-based through a persistent banner and Demo badge, not color-only."
  - "Next.js pages using useSearchParams are wrapped in Suspense for production build compatibility."

requirements-supported: [AUTH-01, AUTH-02, AUTH-03]

duration: 35 min
completed: 2026-05-20
---

# Phase 02 Plan 04: Frontend Auth Foundation Summary

**Next.js frontend scaffold, login, privacy gate, API client, and demo indicators are complete.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-20T12:01:00Z
- **Completed:** 2026-05-20T12:36:00Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments

- Created the `frontend/` Next.js App Router project with TypeScript, Tailwind, Vitest, Testing Library, and supporting config.
- Added `apiFetch` with `credentials: "include"` and no token storage.
- Added role route mapping for student, teacher, parent, and admin.
- Added Vietnamese login page with required copy, disabled submit behavior, generic error copy, and accessible show/hide password toggle.
- Added Vietnamese privacy acknowledgement page with required checkbox and continue copy.
- Added exact demo banner and Demo badge copy.
- Added tests for role routes, credentialed fetch, no local/session storage token writes, demo copy, login disabled state, and privacy acknowledgement disabled state.

## Task Commits

1. **Tasks 1-2: Frontend foundation, login, privacy gate, and tests** - `4a3f6e5` (feat)

## Files Created/Modified

- `frontend/package.json` and `frontend/package-lock.json` - Frontend dependencies and scripts.
- `frontend/app/login/page.tsx` - Login screen and backend-auth submit flow.
- `frontend/app/privacy/page.tsx` - Privacy notice and acknowledgement gate.
- `frontend/lib/api.ts` - Cookie-auth fetch client.
- `frontend/lib/auth.ts` - Auth API helpers and user/error types.
- `frontend/lib/routes.ts` - Exact role-to-route mapping.
- `frontend/components/demo-banner.tsx` and `frontend/components/demo-badge.tsx` - Demo indicators.
- `frontend/tests/auth-portals.test.tsx` - Auth foundation tests.

## Decisions Made

- Used direct Tailwind-compatible components rather than generated shadcn files for this first scaffold, while preserving the shadcn-compatible app/components/lib structure for later official component additions.
- Kept role dashboard pages out of this plan, per plan split; they start in Plan 02-05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Build compatibility] Pinned Tailwind CSS to 3.x**
- **Found during:** `npm run build`
- **Issue:** `tailwindcss@latest` installed Tailwind v4, which requires the separate `@tailwindcss/postcss` plugin and did not match the scaffolded Tailwind 3 PostCSS config.
- **Fix:** Pinned `tailwindcss` to `^3.4.17` and regenerated `package-lock.json`.
- **Verification:** Frontend tests and Next production build pass.
- **Committed in:** `4a3f6e5`

---

**2. [Next.js 16 compatibility] Wrapped privacy search params in Suspense**
- **Found during:** `npm run build`
- **Issue:** Next.js 16 requires client usage of `useSearchParams()` to be inside a Suspense boundary for prerendered pages.
- **Fix:** Split privacy page content into `PrivacyContent` and wrapped it with `Suspense`.
- **Verification:** Frontend tests and Next production build pass.
- **Committed in:** `4a3f6e5`

---

**Total deviations:** 2 auto-fixed build compatibility issues
**Impact on plan:** No user-facing behavior change; build reliability improved.

## Issues Encountered

- `npm run test -- --run auth-portals` entered Vitest watch mode under the current npm/Vitest argument behavior; verification uses `npx vitest run auth-portals` for one-shot test execution.

## User Setup Required

None beyond `cd frontend; npm install`.

## Next Phase Readiness

Frontend auth foundation is ready for Plan 02-05 role dashboards.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
