# Phase 37: Frontend Data Loading & Render Optimization - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Autonomous smart discuss; recommended frontend performance decisions accepted by the agent per user preference.

<domain>
## Phase Boundary

Phase 37 optimizes Student, Teacher, Parent, and Admin dashboard data loading, perceived responsiveness, route rendering, and build/bundle evidence. The phase may refactor frontend dashboard loaders, add small route-local/shared data-loading helpers, make credentialed API reads explicitly no-store, add presentation-only skeleton/placeholder states, update frontend performance measurement helpers, and add frontend tests/build evidence. It must preserve backend-owned HttpOnly cookie auth, privacy acknowledgement routing, wrong-role routing, role-specific dashboard paths, SOS-only adult visibility, controlled reason behavior on protected routes, safe internal navigation, no browser token storage, metadata-only Admin posture, and Phase 34/35 UI rhythm. It must not add raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, destructive reset controls, broad analytics/APM, service-worker/PWA caching, production runtime logging, external load testing, provider SSO, multi-school tenancy, or backend/database optimization scope already completed in Phase 36.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Request Topology
- **D-01:** Keep `frontend/app/(authenticated)/layout.tsx` as the single owner of `getCurrentUser`, privacy acknowledgement redirects, wrong-role handling, logout, role shell, and no-token auth behavior. Phase 37 must not move auth/role routing into dashboard pages or a browser storage cache.
- **D-02:** Replace repeated page-local ad hoc `Promise.all` dashboard loading with small typed route-local or neutral `frontend/lib/` dashboard loader helpers where this reduces duplication and makes request counts testable. Student, Teacher, Parent, and Admin pages keep their separate role-owned API paths and copy.
- **D-03:** Primary dashboard data that gates whether the page can be trusted must still fail to an explicit `ErrorState`. Supplemental data such as reminders or notifications may degrade independently, but failures must be surfaced through scoped unavailable/error copy rather than silently becoming a successful empty state.
- **D-04:** Teacher and Parent dashboards should avoid a false empty state while support-overview or notification data is still loading or unavailable. The adult list should distinguish "no SOS-visible students" from "overview panel unavailable" instead of filtering visible students away because supplemental data failed.
- **D-05:** Admin dashboard must stop treating broad `/api/admin/users` and `/api/admin/links` array lengths as precise total counts. Use Phase 36 bounded query parameters for previews or safe existing metadata; if exact totals require a backend metadata contract, planner should either route that as a minimal explicit dependency or use honest bounded/preview wording. Do not fetch broad lists only to count cards.

### Cache and Credential Boundaries
- **D-06:** Credentialed API reads used by role dashboards should be explicit no-store by default through `apiFetch` or dashboard-specific helpers while preserving `credentials: "include"`. Existing email/password and cookie-session behavior stays unchanged.
- **D-07:** Do not store access tokens, refresh tokens, ID tokens, role data, support summaries, notifications, raw payloads, or API responses in `localStorage`, `sessionStorage`, IndexedDB, service workers, or unscoped global caches.
- **D-08:** If any in-memory dedupe is introduced, cache keys must include the effective user/role boundary and request path/query. Reason-gated, relationship-gated, policy-sensitive, runtime-sensitive, or logout-sensitive data should default to no-store unless the planner proves a narrowly scoped key and invalidation rule.
- **D-09:** Preserve `safeInternalHref` for API-provided navigation targets. Do not cache or reuse unsafe href decisions across roles, users, relationships, or notification resources.

### Scoped Loading, Skeletons, and Partial Rendering
- **D-10:** Improve perceived responsiveness with scoped skeletons/placeholders built from Phase 34 presentation primitives rather than a new UI framework. Loading states should remain Vietnamese, supportive, and accessible with `role="status"` where appropriate.
- **D-11:** Static dashboard structure such as role headers, privacy/data-boundary cards, and demo guide rhythm may render before all supplemental data when the copy is not sensitive to the pending response. Sensitive values from API responses must not be guessed or shown before they load.
- **D-12:** Error states must stay explicit and accessible with `role="alert"` for primary failures. Optional panel failures should show local scoped error/unavailable copy; do not convert errors into misleading "0 items" or "no data" success UI.
- **D-13:** SOS/high-risk semantics remain visually distinct. Skeleton or loading refactors must not neutralize Student SOS red actions, Teacher SOS update posture, Parent read-only SOS posture, or Admin metadata-only warnings.

### Bundle, Imports, and Shared Code
- **D-14:** Do not introduce a broad React Query/global data provider by default, even though `@tanstack/react-query` is installed. Prefer small dashboard-specific helpers first; only use a library/provider if research shows it reduces duplication without route bundle bloat or cache-boundary risk.
- **D-15:** Shared loading helpers may live under neutral `frontend/lib/` or `frontend/components/` paths. Shared presentation primitives must remain presentation-only and must not import route pages, API clients, auth helpers, role services, or business-rule logic.
- **D-16:** Parent must not import Teacher route pages, and no role page should import another role page to share loading logic. Cross-role reusable code belongs in neutral component/lib modules.
- **D-17:** Review Next build output for affected `/student`, `/teacher`, `/parent`, `/admin`, and touched subroutes. Phase 37 should record aggregate route/build evidence and avoid adding runtime APM, analytics, or production logging.

### Measurement and Verification
- **D-18:** Update or supplement the Phase 33 frontend baseline helper so it counts generic `apiFetch<T>(...)` calls and imported helper calls accurately enough for Phase 37 route/waterfall evidence. Evidence remains aggregate-only: route labels, source files, request counts, build asset counts/bytes, command names, and pass/fail status only.
- **D-19:** Add Phase 37 frontend tests that prove reduced/intentional dashboard request topology, credentialed no-store behavior, scoped loading/skeleton states, optional failure handling, no browser token storage, safe internal navigation, cross-role import boundaries, and Admin metadata-only/no-unsafe-control redlines.
- **D-20:** Verification should include focused Vitest coverage, frontend lint, frontend production build, and a build-output or route-baseline evidence artifact. Final baseline-to-post-optimization threshold decisions and release matrix documentation belong to Phase 38.

### the agent's Discretion
- Choose exact helper names and placement (`frontend/lib/dashboard-loading.ts`, route-local helpers, or similarly neutral modules) based on smallest safe diff and testability.
- Choose exact skeleton/placeholder wording and card density as long as Phase 34 UI-SPEC semantics, Vietnamese support tone, responsive behavior, and accessibility semantics are preserved.
- Choose whether `apiFetch` gets a global no-store default or whether dashboard loaders pass no-store per request, provided existing mutation behavior and tests remain safe.
- Choose exact Admin dashboard count/preview wording when exact totals are unavailable without fetching broad lists.
- Choose whether Phase 37 evidence is recorded by updating `phase33-frontend-baseline.mjs`, adding a Phase 37-specific helper, or both, provided downstream Phase 38 can compare aggregate-only results.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and milestone constraints
- `.planning/ROADMAP.md` - Phase 37 goal, dependencies, requirements, UI hint, and success criteria.
- `.planning/REQUIREMENTS.md` - FEPERF-01 through FEPERF-05 acceptance criteria plus v1.6 privacy/performance redlines.
- `.planning/PROJECT.md` - product vision, role boundaries, privacy-by-default, support-not-surveillance principles, and current v1.6 status.
- `.planning/STATE.md` - Phase 36 completion state, Phase 37 next action, verification metrics, and production-pilot constraint notes.

### Prior phase context and evidence
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-CONTEXT.md` - baseline scope, frontend route evidence rules, aggregate-only evidence decisions, and Phase 37 routing.
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md` - frontend role fetch waterfall candidates, build evidence follow-up, and privacy-safe evidence labels for Phase 37.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-CONTEXT.md` - presentation-only primitive rules, role shell ownership, privacy/SOS semantics, and Phase 37 deferrals.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-UI-SPEC.md` - design contract for spacing, typography, color, loading/error copy, primitive contract, role shell contract, and privacy/safety redlines.
- `.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md` - locked role-dashboard structure, route-owned data fetching, dashboard copy, accessibility, and Phase 37 deferrals.
- `.planning/phases/35-role-dashboard-consistency-pass/35-VERIFICATION.md` - verified dashboard privacy boundaries, frontend test/build evidence, and clean review status.
- `.planning/phases/36-backend-db-hot-path-optimization/36-CONTEXT.md` - completed backend/DB scope boundary and explicit deferral of frontend loading/cache/bundle work to Phase 37.
- `.planning/phases/36-backend-db-hot-path-optimization/36-VERIFICATION.md` - Phase 36 backend hot-path verification and no-new-index/schema evidence that Phase 37 should build on without redoing DB work.

### Existing frontend implementation references
- `frontend/app/(authenticated)/layout.tsx` - authenticated shell, `getCurrentUser`, privacy redirect, wrong-role handling, logout, role nav, skip link, and no-token behavior.
- `frontend/app/(authenticated)/student/page.tsx` - Student dashboard load topology, SOS state, mood reminder, profile dependency, scoped actions, and SOS red semantics.
- `frontend/app/(authenticated)/teacher/page.tsx` - Teacher dashboard load topology for linked students, support overview, notifications, and Teacher-specific copy.
- `frontend/app/(authenticated)/parent/page.tsx` - Parent dashboard load topology for linked students, support overview, notifications, and read-only copy.
- `frontend/app/(authenticated)/admin/page.tsx` - Admin dashboard count-card load topology and metadata-only entry cards.
- `frontend/components/ui-primitives.tsx` - presentation primitives for headers, cards, status badges, loading, error, tables, and privacy boundary cards.
- `frontend/components/adult-student-list.tsx` - shared Teacher/Parent presentation that currently merges students, support overview, notifications, safe hrefs, and scoped empty states.
- `frontend/components/empty-state.tsx` - reusable empty state component for role-specific copy.
- `frontend/lib/api.ts` - `apiFetch` credentialed fetch wrapper and safest place to enforce no-store defaults if chosen.
- `frontend/lib/auth.ts` - auth user/capabilities helpers and no-token frontend contract.
- `frontend/lib/sos-api.ts` - Student SOS, Teacher/Parent support overview, notification helpers, and adult dashboard API wrappers.
- `frontend/lib/notification-preferences-api.ts` - Student mood reminder helper and reminder mutation paths.
- `frontend/lib/admin-api.ts` - Admin users/links helpers that still call unparameterized list endpoints.
- `frontend/lib/safe-navigation.ts` - internal href sanitizer for API-provided links.
- `frontend/package.json` - Next/Vitest/lint/build scripts and installed dependencies, including currently unused `@tanstack/react-query`.

### Existing tests and measurement references
- `frontend/scripts/phase33-frontend-baseline.mjs` - static frontend route/request/build evidence helper to update or supplement for Phase 37.
- `frontend/scripts/phase33-frontend-baseline.test.mjs` - aggregate-only frontend evidence gate and route-file existence checks.
- `frontend/tests/phase35-role-dashboard-consistency.test.tsx` - dashboard rendering, privacy boundaries, safe hrefs, no-token storage, cross-role import, and loading/error regression patterns.
- `frontend/tests/phase34-final-regression.test.tsx` - accessible loading/error primitives, dashboard error behavior, Admin metadata-only redlines, and no-token static checks.
- `frontend/tests/role-dashboards.test.tsx` - role shell, privacy redirect, wrong-role, logout, and dashboard rendering tests.
- `frontend/tests/auth-portals.test.tsx` - auth/capabilities and privacy portal test patterns.
- `frontend/tests/phase32-release-gates-ui.test.tsx` - no-token and metadata-only operations UI release-gate patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoadingState`, `ErrorState`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `PrivacyBoundaryCard`, and `ResponsiveTable` in `frontend/components/ui-primitives.tsx` can support skeleton/placeholder and scoped state work without a new design system.
- `AdultStudentList` already centralizes Teacher/Parent presentation and is the right integration point for distinguishing linked-student, support-overview, notification, loading, and optional failure states.
- `apiFetch` centralizes all credentialed frontend API calls and already enforces `credentials: "include"`.
- `safeInternalHref` already protects API-provided notification/reminder navigation and should remain the only path for rendering such links.
- Phase 35 dashboard tests already render all four dashboards and can be extended for request counts, scoped loading, and no-store behavior.

### Established Patterns
- Role dashboards are client components using `useEffect`, `useState`, `Promise.all`, `isActive` guards, `LoadingState`, and `ErrorState`.
- Student dashboard already treats SOS alerts and mood reminders as supplemental by catching those requests separately, while profile failure gates the whole page.
- Teacher and Parent dashboards currently fetch linked students, support overview, and notifications in parallel; notification failure is optional, but support overview failure currently causes the whole dashboard to fail.
- Admin dashboard currently fetches users and links arrays only to display counts, which is no longer a good fit after Phase 36 bounded default list behavior.
- Shared primitives are intentionally presentation-only; frontend shared data logic should be in `frontend/lib/`, not in `frontend/components/ui-primitives.tsx`.
- `@tanstack/react-query` is installed but unused. Introducing it would be a new app-wide pattern and should not be the default Phase 37 move.

### Integration Points
- Student dashboard loading changes connect through `frontend/app/(authenticated)/student/page.tsx`, `frontend/lib/sos-api.ts`, and `frontend/lib/notification-preferences-api.ts`.
- Teacher/Parent loading changes connect through `frontend/app/(authenticated)/teacher/page.tsx`, `frontend/app/(authenticated)/parent/page.tsx`, `frontend/components/adult-student-list.tsx`, and `frontend/lib/sos-api.ts`.
- Admin loading changes connect through `frontend/app/(authenticated)/admin/page.tsx`, `frontend/lib/admin-api.ts`, and Phase 36 bounded Admin API query parameters.
- Credential/no-store changes connect through `frontend/lib/api.ts` and must be verified by tests that inspect fetch options.
- Build/request evidence connects through `frontend/scripts/phase33-frontend-baseline.mjs`, `frontend/scripts/phase33-frontend-baseline.test.mjs`, `npm --prefix frontend run build`, and affected route output.

</code_context>

<specifics>
## Specific Ideas

- Add or reuse a small `DashboardSkeleton`/section skeleton built from `SurfaceCard` and `LoadingState` so the role page rhythm stays visible while data loads.
- Add a dashboard loading helper pattern that returns `{data, optionalErrors}` or similarly explicit state so optional failures do not masquerade as empty data.
- For Student, keep `/api/student/profile` as the primary gate and keep SOS/reminder failures scoped to their cards or hidden only with explicit unavailable copy.
- For Teacher/Parent, keep `/api/teacher/students` and `/api/parent/students` as role-owned primary list calls, and let support overview/notifications produce scoped states in `AdultStudentList`.
- For Admin, use honest "preview/bounded" labels or a safe metadata source rather than counting broad users/links arrays on the dashboard.
- Add tests that assert `fetch` calls include `credentials: "include"` and explicit no-store/cache-safe options for dashboard reads.
- Update frontend static baseline counting to match generic calls such as `apiFetch<Type>(...)`, not only non-generic `apiFetch(...)`.
- Record Phase 37 evidence with only route names, source files, request counts, build asset counts/bytes, command names, and pass/fail status.

</specifics>

<deferred>
## Deferred Ideas

- A broad React Query migration, app-wide data cache provider, offline/PWA/service-worker cache, and global request persistence are deferred unless a future phase explicitly scopes cache governance.
- New backend aggregation/count endpoints should be avoided in Phase 37 unless the planner proves exact Admin counts cannot be represented honestly with existing bounded APIs; broad backend/database optimization remains completed Phase 36 scope.
- Final baseline-to-post-optimization comparisons, hard thresholds, release matrix documentation, public demo/deployed warm evidence, and live production-pilot constraints belong to Phase 38.
- Analytics/APM, runtime production logging, external load testing, CDN/edge caching, prefetching sensitive role routes, provider SSO, external notifications, counselor handoff, multi-school tenancy, raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, and destructive reset controls remain out of scope.

</deferred>

---

*Phase: 37-frontend-data-loading-render-optimization*
*Context gathered: 2026-05-27*
