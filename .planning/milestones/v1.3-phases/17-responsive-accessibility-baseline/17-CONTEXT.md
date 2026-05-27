# Phase 17: Responsive Accessibility Baseline - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Autonomous defaults selected by agent

<domain>
## Phase Boundary

Establish a responsive and accessibility baseline for BeYou's key production surfaces without redesigning every page. Focus on global overflow prevention, keyboard focus, touch-friendly interaction defaults, semantic status/error states, and representative smoke coverage for mobile/tablet/desktop.

</domain>

<decisions>
## Implementation Decisions

- Use global CSS safety rails for `min-width: 0`, table overflow, word wrapping, and touch manipulation.
- Preserve the Phase 16 public landing and role-entry UX.
- Add ARIA state improvements where Phase 16 introduced async role entry and login error display.
- Verify responsive behavior through a Playwright smoke script against a local production build with mocked API responses.

</decisions>

<code_context>
## Existing Code Insights

- `frontend/app/globals.css` already owns global typography, focus-visible, reduced-motion, and overflow defaults.
- `DemoRoleEntry` is the new async role-entry component that benefits from `aria-busy` and `role=alert`.
- Local direct Render API calls from arbitrary ports can be blocked by CORS, so local responsive smoke should mock API responses for layout checks.

</code_context>

<specifics>
## Specific Ideas

- Add global `min-width: 0` for layout containers to reduce flex/grid overflow risks.
- Add small-screen table overflow behavior for any table-like content.
- Add `overflow-wrap: break-word` for text-heavy content.
- Add ARIA live/alert semantics to error states introduced or touched in Phase 16.

</specifics>

<deferred>
## Deferred Ideas

- Full axe accessibility integration.
- Screenshot diffing.
- Complete per-page component refactor.

</deferred>
