# Phase 16: Guided Demo Entry & Role Onboarding - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Autonomous defaults selected by agent

<domain>
## Phase Boundary

Build a pilot/demo entry experience for BeYou without expanding sensitive data access. The phase should make the deployed app easier for first-time evaluators to understand and navigate across student, teacher, parent, and admin roles.

</domain>

<decisions>
## Implementation Decisions

- Add a public entry page at `/` instead of redirecting directly to `/login`.
- Keep existing manual `/login` flow intact for browser autofill and direct credential entry.
- Provide one-step demo role entry using the existing seeded demo accounts and cookie-authenticated login API.
- Add role-specific demo guidance cards to dashboards rather than building a new tour framework.
- Keep all demo guidance privacy-preserving: no raw private notes, chatbot transcripts, raw self-check answers, or risk leaderboards.
- Update README with live URLs, demo accounts, and constraints.

</decisions>

<code_context>
## Existing Code Insights

- `frontend/app/login/page.tsx` already contains demo role shortcuts and demo password.
- `frontend/lib/auth.ts` exposes `login()` and `loginErrorCopy()`.
- `frontend/app/(authenticated)/student/page.tsx`, `teacher/page.tsx`, `parent/page.tsx`, and `admin/page.tsx` are the role dashboard entry points.
- `DemoBanner` and `DemoBadge` already communicate demo data boundaries.

</code_context>

<specifics>
## Specific Ideas

- Share demo account metadata through `frontend/lib/demo-accounts.ts`.
- Add reusable `DemoRoleEntry` and `DemoGuideCard` components.
- Add a test for the public demo entry page.
- Preserve the existing manual login test expectations.

</specifics>

<deferred>
## Deferred Ideas

- Full interactive product tour overlay.
- Analytics for demo funnel usage.
- Production identity/OAuth, native mobile, external notification channels.

</deferred>
