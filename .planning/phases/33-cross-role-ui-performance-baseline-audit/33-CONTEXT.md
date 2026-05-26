# Phase 33: Cross-Role UI & Performance Baseline Audit - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 33 establishes the evidence baseline for v1.6 before UI harmonization or performance optimization work begins. It delivers a cross-role UI inventory and privacy-safe performance baseline for selected Student, Teacher, Parent, and Admin routes. It should identify drift, hotspots, and follow-up routing for later phases, but it must not perform broad UI refactors, DB/backend optimization, frontend data-loading rewrites, production-pilot launch work, or new product capabilities.

</domain>

<decisions>
## Implementation Decisions

### UI Inventory Scope
- **D-01:** Inventory must cover role dashboards plus critical subroutes: Student dashboard, SOS, mood check-ins, self-checks, chat, and support plan; Teacher and Parent dashboards, support summaries, and SOS detail routes; Admin dashboard, operations, users, links, and reports.
- **D-02:** Each selected route should be audited across the full state matrix: happy, loading, error, empty, blocked/privacy, responsive mobile/tablet/desktop, keyboard/focus, and accessible status/alert announcements.
- **D-03:** UI evidence should be recorded as a matrix artifact with route, state, pattern, drift, severity, and file references. Screenshot or manual visual notes are optional and only used when they clarify a finding.
- **D-04:** UI drift severity is privacy/a11y-first: P0 for privacy, SOS, or accessibility regression risk; P1 for cross-role consistency drift or important loading/error/empty state gaps; P2 for polish, spacing, or copy drift.

### Performance Baseline Scope
- **D-05:** Performance baseline must cover selected frontend role routes and backend hot paths: `/api/auth/me`, Student profile/SOS/reminders, Teacher/Parent students, support overview, support summary, Admin users, Admin links, Admin operations, and Admin reports.
- **D-06:** Evidence must distinguish local deterministic/build evidence, safe public demo Vercel/Render evidence where available, and explicit live production-pilot constraints when a ready pilot environment is unavailable.
- **D-07:** Required metrics are balanced rather than deep profiling: route/build evidence, request waterfall count, endpoint duration, payload byte size, query-count or hotspot candidates, cold/warm label, and command/source of evidence.
- **D-08:** Phase 33 should not set arbitrary hard performance pass/fail thresholds. It should create a baseline and rank hotspots P0/P1/P2 by privacy risk, unbounded/N+1 evidence, payload/waterfall size, and production-visible slowness.

### Privacy-Safe Evidence
- **D-09:** Artifacts and logs may contain aggregate/safe metadata only: route and endpoint names, status categories, counts, durations, payload byte sizes, query-count candidates, cold/warm labels, and command names.
- **D-10:** Artifacts and logs must not contain raw request or response bodies, raw IDs, emails, names, private notes, transcripts, self-check/scenario answers, provider claims, secrets, token-like values, free-text reasons, exports, risk leaderboards, drilldowns, or browser tokens.
- **D-11:** When an app route legitimately returns sensitive display fields, Phase 33 artifacts should classify fields and privacy boundaries rather than copying values, such as `student_display_name present in UI response`.
- **D-12:** Baseline measurement should be ephemeral/test-side only in Phase 33: scripts, tests, helpers, or manual commands that produce artifacts. Do not add new production runtime logging or external APM in this phase unless later planning explicitly justifies it.
- **D-13:** Phase 33 should include an artifact/script redline gate that rejects forbidden sensitive strings, raw identifiers, browser tokens, export/risk-leaderboard/drilldown language, and raw-body evidence in generated baseline artifacts.

### Baseline Artifact Format
- **D-14:** Phase 33 execution should create two primary artifacts in the phase directory: `33-UI-INVENTORY.md` and `33-PERFORMANCE-BASELINE.md`. Plan summaries or verification artifacts may reference them where the GSD workflow requires.
- **D-15:** `33-UI-INVENTORY.md` should use a route-state matrix with role, route, state, current pattern/component, drift observed, privacy/a11y note, severity P0/P1/P2, and candidate follow-up phase.
- **D-16:** `33-PERFORMANCE-BASELINE.md` should use an evidence table plus hotspot queue with environment, route/API, command/source, duration or cold/warm note, payload bytes, waterfall count, query-count/candidate, privacy check, severity, and candidate follow-up phase.
- **D-17:** The hotspot queue should seed current codebase candidates as candidates only, not must-fix conclusions: Admin users/links full-list and link hydration, Teacher/Parent linked students and SOS checks, support overview per-student queries, support summary broad loads, operations dashboard buckets, and frontend role fetch waterfalls.
- **D-18:** Every finding should be routed as a candidate for Phase 34 UI primitives, Phase 35 dashboard consistency, Phase 36 backend/DB optimization, Phase 37 frontend performance, or Phase 38 release gates. Phase 33 records evidence and routing but does not implement the fixes.

### the agent's Discretion
- Choose exact command names, helper names, test placement, and artifact table formatting as long as they satisfy the decisions above.
- Choose whether screenshots are useful for specific UI findings; they are not required for every route/state.
- Choose exact P0/P1/P2 wording in artifacts while preserving privacy/a11y-first priority.
- Choose the lightest measurement mechanism that produces repeatable evidence without introducing production runtime logging.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and milestone constraints
- `.planning/ROADMAP.md` - Phase 33 goal, success criteria, dependencies, and v1.6 phase routing.
- `.planning/REQUIREMENTS.md` - UIC-01 and BASE-01 through BASE-03 acceptance criteria plus v1.6 privacy/performance redlines.
- `.planning/PROJECT.md` - product vision, role boundaries, support-not-surveillance decisions, and active v1.6 milestone context.
- `.planning/STATE.md` - current milestone state, v1.6 decisions, and live pilot constraint notes.

### v1.6 research
- `.planning/research/SUMMARY.md` - recommended v1.6 sequence, stack additions, and Phase 33 baseline purpose.
- `.planning/research/ARCHITECTURE.md` - Phase 33 artifact expectations, code areas to inspect, and architecture rules for safe UI/performance work.
- `.planning/research/PITFALLS.md` - critical pitfalls for UI homogenization, sensitive shared components, local-only performance evidence, unsafe indexes, and caching leakage.

### Prior locked decisions
- `.planning/milestones/v1.1-phases/09-role-privacy-ux-polish/09-CONTEXT.md` - role navigation, privacy redirect, wrong-role copy, adult boundary copy, and small-component preference.
- `.planning/milestones/v1.1-phases/11-metadata-only-operational-visibility/11-CONTEXT.md` - metadata-only operations surfaces and forbidden raw-data boundaries.
- `.planning/milestones/v1.3-phases/16-guided-demo-entry-role-onboarding/16-CONTEXT.md` - public role entry, role dashboard guidance cards, and demo privacy boundaries.
- `.planning/milestones/v1.3-phases/17-responsive-accessibility-baseline/17-CONTEXT.md` - responsive/a11y safety rails, table overflow, status/error semantics, and smoke coverage.
- `.planning/milestones/v1.3-phases/18-supportive-copy-critical-interaction-polish/18-CONTEXT.md` - role=status, role=alert, critical action outcomes, and Vietnamese support tone.
- `.planning/milestones/v1.3-phases/19-demo-pilot-operations-readiness/19-CONTEXT.md` - public demo readiness, production smoke boundaries, CORS/session checks, and metadata-only operations.
- `.planning/milestones/v1.3-phases/20-frontend-quality-regression-closure/20-CONTEXT.md` - Next 16 lint, Vitest/jsdom responsive smoke, and existing fast frontend regression patterns.
- `.planning/milestones/v1.4-phases/24-reason-for-access-adult-support-transparency/24-CONTEXT.md` - controlled reason gate and adult support-summary privacy rules.
- `.planning/milestones/v1.4-phases/25-admin-privacy-policy-operations-visibility/25-CONTEXT.md` - admin policy/operations metadata-only surfaces and no raw reason/note/export constraints.
- `.planning/milestones/v1.4-phases/26-cross-role-privacy-regression-demo-readiness/26-CONTEXT.md` - cross-role privacy regression and demo readiness evidence strategy.
- `.planning/milestones/v1.5-phases/28-runtime-mode-production-readiness-foundation/28-CONTEXT.md` - local/public-demo/production-pilot mode distinctions and readiness semantics.
- `.planning/milestones/v1.5-phases/30-identity-foundation-auth-contracts/30-CONTEXT.md` - backend-owned HttpOnly sessions, no browser token storage, and identity metadata boundaries.
- `.planning/milestones/v1.5-phases/31-school-pilot-operations-safe-launch/31-CONTEXT.md` - launch readiness metadata, rollback/handoff, and production-pilot constraints.
- `.planning/milestones/v1.5-phases/32-privacy-security-release-gates/32-CONTEXT.md` - release gate strategy, privacy redlines, constrained live pilot smoke, and evidence documentation rules.

### Existing implementation references
- `frontend/app/(authenticated)/layout.tsx` - role shell, student navigation, skip link, privacy redirect, wrong-role handling, and logout.
- `frontend/app/(authenticated)/student/page.tsx` - Student dashboard cards, SOS state, mood reminder, quick table, linked-adult cards, and loading/error/status patterns.
- `frontend/app/(authenticated)/teacher/page.tsx` - Teacher dashboard and shared `RoleStudentList` used by Parent.
- `frontend/app/(authenticated)/parent/page.tsx` - Parent dashboard importing the Teacher shared list component.
- `frontend/app/(authenticated)/admin/page.tsx` - Admin dashboard entry cards and counts from users/links APIs.
- `frontend/app/(authenticated)/admin/operations/page.tsx` - large metadata-only operations surface and established admin panel patterns.
- `frontend/components/empty-state.tsx` - existing reusable empty state component.
- `frontend/components/demo-guide-card.tsx` - existing reusable guide card component.
- `frontend/lib/api.ts` - cookie-authenticated `apiFetch` with `credentials: include`.
- `frontend/lib/auth.ts` - `/api/auth/me`, capabilities, privacy acknowledgement, and no-token frontend auth contract.
- `frontend/tests/phase20-responsive-smoke-ui.test.tsx` - existing responsive smoke pattern.
- `frontend/tests/role-dashboards.test.tsx` - existing role dashboard coverage.
- `frontend/tests/auth-portals.test.tsx` - auth/role/privacy portal test patterns.
- `frontend/tests/phase32-release-gates-ui.test.tsx` - no-token and metadata-only operations UI gate patterns.
- `backend/app/api/teacher.py` - Teacher linked-student list path with SOS-only visibility and per-student checks.
- `backend/app/api/parent.py` - Parent linked-student list path with SOS-only visibility and per-student checks.
- `backend/app/api/admin_users.py` and `backend/app/services/users.py` - Admin users list path and unbounded `list_users` candidate.
- `backend/app/api/admin_links.py` and `backend/app/services/links.py` - Admin links list path and per-link `db.get` hydration candidate.
- `backend/app/services/sos.py` - support overview, linked-student lookup, latest self-check/SOS queries, and SOS audit behavior.
- `backend/app/services/adult_summaries.py` - support summary, self-check summary, support-plan, and mood-summary query patterns.
- `backend/app/services/admin_operations.py` - operations dashboard builders and existing metadata sanitizer surface.
- `backend/app/services/readiness.py` - readiness evidence and status semantics.
- `backend/app/core/authorization.py` - app-owned role, active relationship, SOS, reason, and privacy permission checks.
- `backend/app/db/models.py` - SQLAlchemy models and likely query/index inspection surface.
- `backend/alembic/versions/` - migration history for later schema/index alignment checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EmptyState` (`frontend/components/empty-state.tsx`) can anchor empty-state inventory and later UI consistency work.
- `DemoGuideCard` and `DemoBadge` provide existing cross-role demo/support copy patterns.
- `RoleStudentList` in `frontend/app/(authenticated)/teacher/page.tsx` is already shared by Teacher and Parent, making it a key cross-role consistency and bundle-coupling audit point.
- `apiFetch` in `frontend/lib/api.ts` centralizes credentialed API calls and preserves cookie-based auth.
- Existing tests in `frontend/tests/phase20-responsive-smoke-ui.test.tsx`, `role-dashboards.test.tsx`, `auth-portals.test.tsx`, and `phase32-release-gates-ui.test.tsx` can inform baseline checks without adding a new frontend framework.
- Backend services for readiness, admin operations, adult summaries, SOS, users, and links provide the main API/performance inspection points.

### Established Patterns
- Frontend dashboard routes are mostly client components using `useEffect` and `Promise.all`, with simple loading strings and page-local error/empty handling.
- Student shell has a richer role-specific sidebar/navigation than other roles; non-student roles use a simpler role nav in `AuthenticatedLayout`.
- Shared UI primitives are currently lightweight and scattered, not a full design system.
- Adult views preserve SOS-only visibility, active relationship checks, controlled reason gates where required, and support-not-surveillance copy.
- Admin operations surfaces are metadata-only and should not become raw monitoring dashboards.
- Backend routers are thin and delegate to services; Pydantic schemas define API response contracts.
- Tests are phase-targeted and additive; Phase 33 should prefer audit/baseline helpers and artifacts over rewrites.

### Integration Points
- UI inventory connects to selected frontend role routes and reusable components, then routes findings to Phases 34, 35, 37, or 38.
- Performance baseline connects to frontend route/build output, `apiFetch` waterfalls, backend API hot paths, services, and SQLAlchemy query candidates, then routes findings to Phases 36, 37, or 38.
- Privacy redline gates should inspect generated Phase 33 artifacts and any measurement scripts/helpers before planning proceeds.
- Live public demo evidence may be recorded only as public demo behavior; it must not be treated as production-pilot proof.

</code_context>

<specifics>
## Specific Ideas

- Produce `33-UI-INVENTORY.md` and `33-PERFORMANCE-BASELINE.md` as the primary Phase 33 outputs.
- Use route-state and performance evidence tables, not vague narrative notes.
- Seed but do not overstate current hotspot candidates:
  - Admin users endpoint lists all users and Admin dashboard fetches the whole array just to count.
  - Admin links endpoint lists all links and hydrates each link with per-link `db.get` calls.
  - Teacher/Parent linked-student lists and support overview loop over students with SOS/permission/latest-summary/latest-alert checks.
  - Adult support summary loads all self-check attempts before slicing recent summaries.
  - Admin operations dashboard builds many aggregate sections in one response.
  - Frontend dashboards use multiple role-specific fetches and page-local loading/error states.

</specifics>

<deferred>
## Deferred Ideas

- Fixing UI drift belongs to Phase 34 or Phase 35.
- Backend/DB optimization, pagination, batching, and indexes belong to Phase 36.
- Frontend data-loading/caching/render optimization belongs to Phase 37.
- Final hard thresholds and release gates belong to Phase 38 after baseline and optimization evidence exist.
- Live production-pilot smoke remains out of scope until safe pilot URLs/configuration and `/health/ready=ready` exist.

</deferred>

---

*Phase: 33-cross-role-ui-performance-baseline-audit*
*Context gathered: 2026-05-26*
