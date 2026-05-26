# Phase 35: Role Dashboard Consistency Pass - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Autonomous smart discuss; recommended decisions accepted by the agent per user preference.

<domain>
## Phase Boundary

Phase 35 harmonizes the Student, Teacher, Parent, and Admin dashboard experiences so they feel like one Peerlight AI product while preserving each role's existing privacy and safety boundaries. This phase may adjust dashboard presentation, card hierarchy, status surfaces, empty/error/loading states, and copy rhythm using the Phase 34 primitives. It must not add new backend APIs, change authorization or data visibility, introduce browser token storage, optimize database/query paths, add caching/data-loading performance behavior, add raw exports, or create new surveillance affordances. Backend and DB optimization belongs to Phase 36; frontend fetch/render optimization belongs to Phase 37; release-gate evidence belongs to Phase 38.

</domain>

<decisions>
## Implementation Decisions

### Cross-Role Dashboard Structure
- **D-01:** Use a consistent dashboard hierarchy across all roles: role-aware `PageHeader`, visible privacy/data-boundary guidance, demo/walkthrough card where applicable, primary role action/status cards, and secondary lists/tables.
- **D-02:** Reuse Phase 34 presentation primitives (`PageHeader`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `ResponsiveTable`, `LoadingState`, `ErrorState`, `PrivacyBoundaryCard`, enhanced `EmptyState`) rather than creating a new design system or UI framework.
- **D-03:** Keep route-owned data fetching and existing API paths unchanged. Dashboard consistency is presentation/content organization only, not a data-loading or backend performance phase.
- **D-04:** Prefer small, route-local refactors and neutral shared components only when they remove duplicated presentation safely. Shared code must live under `frontend/components/` and must not import role route pages, API clients, auth helpers, or business-rule logic unless the module is intentionally route-owned.

### Student Dashboard
- **D-05:** Preserve Student-first privacy and support copy. The dashboard should keep clear ownership language: student data is private by default, adult visibility is permission/SOS bounded, and Peerlight AI is supportive/non-diagnostic.
- **D-06:** Keep SOS as the strongest visual priority and preserve red/destructive styling only for SOS, urgent, high-risk, or true error states. Do not normalize SOS into neutral status cards.
- **D-07:** Harmonize Student cards and linked-adult/status sections with shared primitives, but do not remove the current student-owned flows: privacy review, mood check-in, test tâm lý, scenarios, support plan, chat, notification preferences, SOS confirmation, and SOS history.
- **D-08:** Student dashboard may show a richer set of actions than adult/admin dashboards because it is the primary self-support surface.

### Teacher and Parent Dashboards
- **D-09:** Keep Teacher and Parent dashboards visually sibling-like through the neutral `AdultStudentList`, but preserve distinct role copy: Teacher can coordinate and update SOS status; Parent remains read-only/supportive.
- **D-10:** Preserve SOS-only adult visibility, active relationship checks, summary-only support posture, and controlled reason gates on protected subroutes. Phase 35 must not expose raw self-check answers, private notes, chat transcripts, raw identifiers, or per-student risk drilldowns.
- **D-11:** Adult empty states should remain supportive and bounded: no linked/SOS-eligible students means no student details, not a generic "no data" dashboard.
- **D-12:** Adult notification and support-overview cards should use consistent density and status badges while keeping SOS/high-risk visual semantics red/danger.

### Admin Dashboard and Operations Surfaces
- **D-13:** Admin dashboard consistency should emphasize metadata-only operations. Harmonize entry cards, counts, and operations links without adding raw exports, raw audit browsers, destructive reset controls, risk leaderboards, or per-student drilldowns.
- **D-14:** Preserve existing Admin route destinations and copy for users, links, operations, reports, content, chatbot safety, mood check-ins, and privacy policy controls.
- **D-15:** Admin count/loading/error states may use shared primitives, but admin performance concerns like bounded user/link results or N+1 reduction are deferred to Phase 36.

### States, Accessibility, and Responsive Behavior
- **D-16:** All four dashboards must use clear scoped loading, error, and empty states; primary dashboard load failures should render `ErrorState` with `role="alert"` rather than misleading empty or zero-count UI.
- **D-17:** Preserve keyboard/focus behavior, `min-h-11` targets, responsive grids, horizontal overflow for tables, accessible `role="status"` and `role="alert"` announcements, and the authenticated shell's skip-link behavior.
- **D-18:** Add or extend Phase 35 frontend tests to prove role-specific privacy boundaries, dashboard consistency, no cross-role route imports, no browser token storage, SOS red semantics, and Admin metadata-only redlines.
- **D-19:** Include visual walkthrough acceptance as a Phase 35 verification item because "feels like one product" cannot be fully proven by static tests alone.

### the agent's Discretion
- Choose exact component extraction boundaries and prop names as long as shared components remain presentation-only and role pages keep data ownership.
- Choose the minimum safe dashboard adoption set that satisfies ROLE-01 through ROLE-04 without pulling Phase 36/37 work forward.
- Choose whether to extend Phase 34 tests or add a dedicated `phase35-role-dashboard-consistency.test.tsx` file for traceability.
- Choose exact card ordering and spacing within the Phase 34 UI-SPEC hierarchy, provided Student-first safety, adult support-not-surveillance, Parent read-only, Teacher SOS handling, and Admin metadata-only posture remain visible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and milestone constraints
- `.planning/ROADMAP.md` — Phase 35 goal, dependencies, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` — ROLE-01, ROLE-02, ROLE-03, ROLE-04 acceptance criteria plus v1.6 out-of-scope redlines.
- `.planning/PROJECT.md` — product vision, role boundaries, privacy-by-default, and support-not-surveillance principles.
- `.planning/STATE.md` — current milestone state, Phase 34 decisions, verification status, and production-pilot constraint notes.

### Prior phase context and evidence
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md` — source route-state matrix and Phase 35 candidate findings for dashboard cards, tables, forms, empty states, and role-specific drift.
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md` — baseline context for avoiding unintended performance/bundle regressions.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-CONTEXT.md` — locked decisions for shared primitives, shell ownership, privacy/SOS semantics, and Phase 35 deferrals.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-UI-SPEC.md` — Phase 34 design contract: spacing, typography, colors, copywriting, primitive contract, role shell contract, and privacy redlines.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-VERIFICATION.md` — verified artifacts, data-flow trace, and human visual walkthrough requirement.

### Existing implementation references
- `frontend/components/ui-primitives.tsx` — shared presentation primitives to reuse in Phase 35.
- `frontend/components/empty-state.tsx` — enhanced empty-state component for role-specific empty copy and actions.
- `frontend/components/demo-guide-card.tsx` — existing role walkthrough card rhythm.
- `frontend/components/adult-student-list.tsx` — neutral Teacher/Parent dashboard presentation.
- `frontend/app/(authenticated)/layout.tsx` — authenticated shell, scoped nav, skip link, privacy redirect, wrong-role handling, and role-boundary guidance.
- `frontend/app/(authenticated)/student/page.tsx` — Student dashboard, SOS panel/confirmation/history, linked adults, wellbeing cards, and quick table.
- `frontend/app/(authenticated)/teacher/page.tsx` — Teacher route-owned data fetching and Teacher copy using `AdultStudentList`.
- `frontend/app/(authenticated)/parent/page.tsx` — Parent route-owned data fetching and read-only copy using `AdultStudentList`.
- `frontend/app/(authenticated)/admin/page.tsx` — Admin dashboard entry cards, metadata-only copy, and count loading states.
- `frontend/tests/phase34-final-regression.test.tsx` — current regression coverage for load failures, SOS copy, Admin redlines, cross-role imports, and no-token storage.
- `frontend/tests/role-dashboards.test.tsx` — existing role dashboard and shell privacy tests.
- `frontend/tests/phase20-responsive-smoke-ui.test.tsx` — responsive smoke pattern.
- `frontend/tests/auth-portals.test.tsx` — auth/role/privacy portal tests.
- `frontend/tests/phase32-release-gates-ui.test.tsx` — metadata-only operations and privacy redline test patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/components/ui-primitives.tsx`: ready foundation for harmonized headers, cards, status badges, responsive tables, loading/error states, and privacy boundary cards.
- `frontend/components/adult-student-list.tsx`: neutral adult presentation already aligns Teacher/Parent and should be refined rather than duplicated back into role pages.
- `frontend/components/demo-guide-card.tsx`: reusable demo walkthrough card already aligned to `SurfaceCard`; keep for role-specific demo guidance.
- `frontend/components/empty-state.tsx`: supports route-provided empty copy and can carry role-specific actions/children.
- `frontend/app/(authenticated)/layout.tsx`: already handles active-role shell guidance; Phase 35 should not move auth/privacy ownership out of it.

### Established Patterns
- Role dashboards are client components with route-local `useEffect`, `Promise.all`, `isLoading`, `loadFailed`, and API/service calls. Phase 35 should preserve these data flows.
- Phase 34 fixed primary load failures to render `ErrorState`; Phase 35 should keep that behavior and avoid success-shaped fallbacks.
- Student dashboard has richer self-support action density than other roles by design.
- Teacher and Parent dashboards share adult presentation but must keep separate API calls and distinct role copy.
- Admin dashboard uses entry-card navigation and metadata-only copy; operations detail pages remain separate.
- Red styling is reserved for SOS/high-risk/error semantics; accent/secondary styling is used for safe/supportive navigation.

### Integration Points
- Student work connects mainly through `frontend/app/(authenticated)/student/page.tsx`, preserving `/api/student/profile`, SOS APIs, mood reminder APIs, and route links.
- Teacher/Parent work connects through `frontend/components/adult-student-list.tsx` plus route pages that own `/api/teacher/students`, `/api/parent/students`, `getTeacherSupportOverview`, and `getParentSupportOverview`.
- Admin work connects through `frontend/app/(authenticated)/admin/page.tsx`; deeper admin operations pages may be touched only when necessary to satisfy ROLE-04 metadata-only consistency.
- Tests should statically inspect touched route/component files for forbidden browser token storage, forbidden cross-role route imports, and unsafe Admin controls.

</code_context>

<specifics>
## Specific Ideas

- Use one "dashboard rhythm" across roles: header, boundary copy, demo guide, primary grid, secondary status/list/table, scoped empty/error states.
- Convert remaining local rounded-card sections to primitives where it improves consistency without changing behavior, especially Student SOS status/list and linked-adult groups.
- Keep Student SOS panel visually distinct with red border/button and existing confirmation copy.
- Keep Teacher/Parent support cards visually aligned, but retain Teacher CTA wording for updating SOS and Parent wording for read-only SOS status.
- Keep Admin dashboard centered on metadata-only operations and safe navigation; if operations sub-surfaces are touched, preserve metadata-only redlines and no raw-data controls.
- Add Phase 35 tests that render all four dashboards and assert privacy boundary copy remains role-specific while shared rhythm/classes/primitives are present.

</specifics>

<deferred>
## Deferred Ideas

- Backend pagination, batching, query/index changes, Admin count optimization, and adult summary SQL filtering belong to Phase 36.
- Frontend request waterfall reduction, caching/no-store policy changes, route-level data-loading optimization, skeleton strategy beyond existing states, and bundle review belong to Phase 37.
- Final UI/performance release evidence, post-optimization comparison, docs matrix, and live production-pilot constraints belong to Phase 38.
- New UI framework, shadcn migration, global theming system, analytics/APM, provider SSO, multi-school tenancy, external notifications, raw exports, risk leaderboards, raw audit browsers, per-student drilldowns, and destructive reset controls remain out of scope.
- Phase 34 human visual rhythm walkthrough remains accepted as a human review item; Phase 35 should incorporate a fresh visual dashboard walkthrough rather than blocking code planning on Phase 34.

</deferred>

---

*Phase: 35-role-dashboard-consistency-pass*
*Context gathered: 2026-05-26*
