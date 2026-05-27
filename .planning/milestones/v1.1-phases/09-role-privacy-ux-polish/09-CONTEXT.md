# Phase 9: Role & Privacy UX Polish - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 9 polishes frontend role/privacy experience: student privacy redirect for direct sensitive routes, role-specific navigation, clearer wrong-role/privacy-blocked states, adult summary-only boundary copy, and teacher-vs-parent SOS action clarity. It does not add new backend authorization or operations dashboards.

</domain>

<decisions>
## Implementation Decisions

### Navigation and Redirects
- Authenticated layout should render navigation only for the current role, not all role portals.
- If a student session still needs privacy acknowledgement and navigates directly to `/student`, redirect to `/privacy?next=...`.
- While redirecting, show safe supportive copy instead of rendering sensitive student content.

### Error and Boundary Copy
- Wrong-role copy should explain that backend permissions remain in place and link only to the correct dashboard.
- Adult pages should state that teachers/parents see summaries/status to support the student, not raw self-check answers or chatbot transcripts.
- Parent SOS detail should be visibly read-only; teacher SOS detail should identify teacher status controls.

### Test Scope
- Add/update frontend tests for nav filtering, privacy redirect, wrong-role safe copy, adult boundary copy, and parent read-only SOS detail.

### the agent's Discretion
- Keep UI copy concise and aligned with existing Vietnamese supportive tone.
- Prefer small component edits over layout rewrites.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/app/(authenticated)/layout.tsx` already fetches `getCurrentUser`, has role route detection, wrong-role copy, demo banner, and logout.
- `frontend/app/privacy/page.tsx` already accepts `next` and acknowledges privacy.
- `frontend/app/(authenticated)/teacher/page.tsx` exports shared `RoleStudentList` used by parent dashboard.
- `frontend/components/sos-alert-detail.tsx` already switches behavior by `mode`.

### Established Patterns
- Frontend tests use Vitest + Testing Library with mocked `fetch` and `next/navigation`.
- API calls use cookie-authenticated `apiFetch`.

### Integration Points
- Update `AuthenticatedLayout` for role nav filtering and privacy redirect.
- Update `RoleStudentList` copy/card for teacher/parent boundaries.
- Update `SosAlertDetail` copy/sections for teacher vs parent role clarity.
- Update Phase 4/role dashboard tests and add a Phase 9-specific test file if clearer.

</code_context>

<specifics>
## Specific Ideas

Keep red/SOS emphasis unchanged. This phase is clarity and trust polish, not visual redesign.

</specifics>

<deferred>
## Deferred Ideas

- Admin operations dashboard remains Phase 11.
- Nested admin content editing remains Phase 10.

</deferred>

