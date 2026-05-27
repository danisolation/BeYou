# Phase 34: Shared UI Primitives & Role Shell Harmonization - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Autonomous smart discuss; recommended decisions accepted by the agent per user preference.

<domain>
## Phase Boundary

Phase 34 creates lightweight shared UI primitives and harmonizes the authenticated role shell/navigation rhythm across Student, Teacher, Parent, and Admin surfaces. It should make builders reuse consistent Peerlight AI page headers, sections, cards, status badges, responsive table wrappers, loading states, error states, empty states, and role-boundary guidance without importing role-specific business logic across roles or changing dashboard data behavior. Dashboard content consistency belongs to Phase 35, backend/database optimization belongs to Phase 36, frontend data loading/render optimization belongs to Phase 37, and final release gates belong to Phase 38.

</domain>

<decisions>
## Implementation Decisions

### Shared Primitive Scope
- Create small, composable primitives rather than a broad design-system rewrite: page header, section/card shell, entry card, status badge, responsive table wrapper, loading state, error state, empty state, and privacy/role boundary card.
- Keep primitives presentation-only. They may receive labels, tone, hrefs, and children, but must not import route pages, API clients, auth helpers, role-specific service modules, or business-rule logic.
- Reuse existing Peerlight AI visual tokens and class patterns (`rounded-3xl`, `bg-white`, `bg-secondary`, `text-display`, `text-heading`, `text-body`, `text-label`, `text-accent`) instead of introducing a new CSS framework or runtime theming layer.
- Preserve existing components where useful: extend or wrap `EmptyState`, align `DemoGuideCard` and dashboard cards with the new primitives, and avoid duplicating card/table/loading/error styles across route pages.

### Role Shell and Navigation
- Harmonize the authenticated shell by extracting role metadata, role navigation, student navigation, skip-link, loading, wrong-role, and privacy-redirect surfaces into reusable helpers/components while keeping the shell as the single owner of auth/role routing.
- Keep the Student sidebar richer because it has more student-owned self-support routes; Teacher, Parent, and Admin should use a consistent compact role shell and active-role indicator without exposing other roles' links.
- Role-entry and navigation copy must always identify the active role and explain the data boundary in Vietnamese support tone.
- Do not create shared imports from Student pages into Teacher/Parent/Admin pages or from role pages into shared primitives. Shared code must live under neutral `components` or `lib` paths.

### Privacy, Safety, and Copy Boundaries
- Preserve Student-first privacy copy, adult support-not-surveillance copy, Parent read-only posture, Teacher SOS handling posture, and Admin metadata-only posture.
- Do not weaken privacy acknowledgement redirects, wrong-role handling, active relationship checks, SOS-only adult visibility, controlled reason gates, or metadata-only operations boundaries.
- SOS/high-risk visual semantics stay distinct and cannot be normalized into neutral status colors; red/danger styling remains reserved for SOS or high-risk safety communication.
- UI copy should remain Vietnamese-first, supportive, concise, and non-diagnostic. Shared primitives can standardize structure, but role pages supply role-specific privacy meaning.

### Accessibility and Responsive Behavior
- Preserve the skip link, keyboard-focusable controls, active-page `aria-current`, minimum 44px-ish touch targets via `min-h-11`, accessible loading/status/error announcements, and responsive overflow for tables/nav.
- Loading, error, empty, and status primitives should expose the right semantics (`role="status"` or `role="alert"` where appropriate) without forcing raw data into the DOM.
- Responsive table wrappers should use horizontal overflow and keep table semantics intact rather than converting sensitive tabular data into custom div grids.
- Tests must cover the new primitives and at least the authenticated shell behavior that Phase 34 changes.

### Delivery and Verification Strategy
- Implement Phase 34 in small plans: first shared primitives, then shell/navigation harmonization, then route adoption/tests/docs.
- Prioritize routes/components identified by Phase 33: `AuthenticatedLayout`, Student dashboard shell/cards, Teacher/Parent `RoleStudentList`, Admin dashboard entry cards, and existing empty/demo guide components.
- Avoid production runtime logging, analytics, APM, new data fetching, new API contracts, or schema changes in this phase.
- Validate with targeted Vitest coverage plus lint/build if touched TypeScript/Next surfaces require it.

### the agent's Discretion
- Choose exact component/file names and prop shapes as long as they remain presentation-only and reusable.
- Choose the smallest route adoption set that proves the primitives and shell harmonization without accidentally moving Phase 35 dashboard-consistency work into Phase 34.
- Choose whether to update existing tests or add a Phase 34-specific test file for clearer traceability.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and milestone constraints
- `.planning/ROADMAP.md` - Phase 34 goal, dependencies, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` - UIC-02, UIC-03, UIC-04, and ROLE-05 acceptance criteria plus v1.6 redlines.
- `.planning/PROJECT.md` - product vision, role boundaries, support-not-surveillance principles, and v1.6 milestone context.
- `.planning/STATE.md` - current milestone state, Phase 33 decisions, and production-pilot constraint notes.
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md` - source route-state matrix and Phase 34 candidate routing.
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md` - baseline context for avoiding bundle/performance regressions.

### Prior locked decisions
- `.planning/milestones/v1.1-phases/09-role-privacy-ux-polish/09-CONTEXT.md` - role navigation, privacy redirect, wrong-role copy, adult boundary copy, and small-component preference.
- `.planning/milestones/v1.3-phases/17-responsive-accessibility-baseline/17-CONTEXT.md` - responsive/a11y safety rails, table overflow, status/error semantics, and smoke coverage.
- `.planning/milestones/v1.3-phases/18-supportive-copy-critical-interaction-polish/18-CONTEXT.md` - role=status, role=alert, critical action outcomes, and Vietnamese support tone.
- `.planning/milestones/v1.4-phases/24-reason-for-access-adult-support-transparency/24-CONTEXT.md` - controlled reason gate and adult support-summary privacy rules.
- `.planning/milestones/v1.5-phases/30-identity-foundation-auth-contracts/30-CONTEXT.md` - backend-owned HttpOnly sessions and no browser token storage.
- `.planning/milestones/v1.5-phases/32-privacy-security-release-gates/32-CONTEXT.md` - release-gate strategy, privacy redlines, and evidence documentation rules.

### Existing implementation references
- `frontend/app/(authenticated)/layout.tsx` - authenticated shell, role navigation, student sidebar, skip link, privacy redirect, wrong-role handling, and logout.
- `frontend/app/(authenticated)/student/page.tsx` - Student dashboard cards, SOS state, mood reminder, quick table, linked-adult cards, loading/error/status patterns.
- `frontend/app/(authenticated)/teacher/page.tsx` - Teacher dashboard and shared `RoleStudentList` used by Parent.
- `frontend/app/(authenticated)/parent/page.tsx` - Parent dashboard importing the Teacher shared list component; refactor risk for cross-role page imports.
- `frontend/app/(authenticated)/admin/page.tsx` - Admin dashboard entry cards and counts from users/links APIs.
- `frontend/components/empty-state.tsx` - existing reusable empty state component.
- `frontend/components/demo-guide-card.tsx` - existing reusable guide card component.
- `frontend/components/demo-badge.tsx` and `frontend/components/demo-banner.tsx` - demo-safe UI affordances.
- `frontend/tests/role-dashboards.test.tsx` - shell/dashboard privacy and no-token coverage.
- `frontend/tests/phase20-responsive-smoke-ui.test.tsx` - responsive smoke pattern.
- `frontend/tests/auth-portals.test.tsx` - auth/role/privacy portal test patterns.
- `frontend/tests/phase32-release-gates-ui.test.tsx` - metadata-only operations and privacy redline test patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EmptyState` already provides a reusable empty state but lacks explicit semantic variants and action slots.
- `DemoGuideCard` already encodes Peerlight AI card rhythm, steps, and actions, but its card/action classes are duplicated elsewhere.
- `DemoBadge` and `DemoBanner` should remain separate demo-safety affordances and can be used inside shared page/header/card primitives.
- `AuthenticatedLayout` owns the correct auth, privacy acknowledgement, wrong-role, logout, and student-navigation behavior.
- `RoleStudentList` is shared by Teacher and Parent today but lives inside the Teacher page file, creating a Phase 34 opportunity to move neutral adult dashboard presentation to a component path without changing data behavior.

### Established Patterns
- Frontend routes are mostly client components with page-local `isLoading` booleans and `Promise.all` data fetching; Phase 34 should not change fetch timing or caching.
- Dashboard cards consistently use rounded white surfaces, secondary backgrounds, accent links, and `min-h-11` controls, but the styles are duplicated across role pages.
- Student shell has desktop sidebar plus mobile horizontal nav; non-student roles have compact role nav in the header.
- Adult pages intentionally repeat boundary copy: no raw self-check answers or chat transcripts at adult portals; support-not-surveillance tone must stay visible.
- Admin pages emphasize metadata-only operations and aggregate reports; shared components must not introduce raw export, raw audit, risk leaderboard, or destructive reset affordances.

### Integration Points
- Shared primitives should live under `frontend/components/` and be imported by route pages and tests without importing route pages back into components.
- Shell/navigation helpers should stay inside `frontend/app/(authenticated)/layout.tsx` or move to neutral component modules while preserving auth flow ownership.
- Adult shared dashboard presentation can move from `frontend/app/(authenticated)/teacher/page.tsx` into a neutral component module so Parent no longer imports from a Teacher route page.
- Tests should assert primitive semantics, no cross-role page imports, role-boundary copy, shell navigation, loading/status/error accessibility, and no browser token storage.

</code_context>

<specifics>
## Specific Ideas

- Create a neutral `frontend/components/ui-primitives.tsx` or small set of files for `PageHeader`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `LoadingState`, `ErrorState`, `ResponsiveTable`, and an enhanced `EmptyState`.
- Move Teacher/Parent shared list presentation from the Teacher page into `frontend/components/adult-student-list.tsx` or a similarly neutral name; keep data fetching in role pages.
- Refactor the authenticated shell enough to remove duplicated nav styling and expose consistent role boundary copy, but do not redesign the full Student dashboard.
- Add a Phase 34 Vitest file that imports the primitives and representative routes, checks semantics/copy/classes, and statically rejects cross-role route-page imports such as Parent importing from the Teacher route.
- Keep Phase 34 adoption intentionally narrow: shell, existing empty/loading/status/error surfaces, Teacher/Parent shared presentation, and Admin/Student entry-card alignment only where low risk.

</specifics>

<deferred>
## Deferred Ideas

- Full Student/Teacher/Parent/Admin dashboard content redesign belongs to Phase 35.
- Backend pagination, batching, query/index changes, and admin/users link count optimization belong to Phase 36.
- Data loading, request waterfall reduction, caching, and route render optimization belong to Phase 37.
- Final performance thresholds, post-optimization comparison, and release documentation belong to Phase 38.
- New UI framework, theming system, raw analytics/APM, provider SSO, multi-school tenancy, external notifications, raw exports, risk leaderboards, per-student drilldowns, and destructive reset controls remain out of v1.6 Phase 34 scope.

</deferred>

---

*Phase: 34-shared-ui-primitives-role-shell-harmonization*
*Context gathered: 2026-05-26*
