# Phase 37: Frontend Data Loading & Render Optimization - Research

**Researched:** 2026-05-27  
**Domain:** Next.js/React frontend dashboard data loading, credentialed fetch behavior, scoped UI loading states, privacy-safe aggregate evidence  
**Confidence:** HIGH for codebase-specific recommendations; MEDIUM for external framework guidance where official docs were cited but Context7 was unavailable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Keep `frontend/app/(authenticated)/layout.tsx` as the single owner of `getCurrentUser`, privacy acknowledgement redirects, wrong-role handling, logout, role shell, and no-token auth behavior. Phase 37 must not move auth/role routing into dashboard pages or a browser storage cache.
- **D-02:** Replace repeated page-local ad hoc `Promise.all` dashboard loading with small typed route-local or neutral `frontend/lib/` dashboard loader helpers where this reduces duplication and makes request counts testable. Student, Teacher, Parent, and Admin pages keep their separate role-owned API paths and copy.
- **D-03:** Primary dashboard data that gates whether the page can be trusted must still fail to an explicit `ErrorState`. Supplemental data such as reminders or notifications may degrade independently, but failures must be surfaced through scoped unavailable/error copy rather than silently becoming a successful empty state.
- **D-04:** Teacher and Parent dashboards should avoid a false empty state while support-overview or notification data is still loading or unavailable. The adult list should distinguish "no SOS-visible students" from "overview panel unavailable" instead of filtering visible students away because supplemental data failed.
- **D-05:** Admin dashboard must stop treating broad `/api/admin/users` and `/api/admin/links` array lengths as precise total counts. Use Phase 36 bounded query parameters for previews or safe existing metadata; if exact totals require a backend metadata contract, planner should either route that as a minimal explicit dependency or use honest bounded/preview wording. Do not fetch broad lists only to count cards.
- **D-06:** Credentialed API reads used by role dashboards should be explicit no-store by default through `apiFetch` or dashboard-specific helpers while preserving `credentials: "include"`. Existing email/password and cookie-session behavior stays unchanged.
- **D-07:** Do not store access tokens, refresh tokens, ID tokens, role data, support summaries, notifications, raw payloads, or API responses in `localStorage`, `sessionStorage`, IndexedDB, service workers, or unscoped global caches.
- **D-08:** If any in-memory dedupe is introduced, cache keys must include the effective user/role boundary and request path/query. Reason-gated, relationship-gated, policy-sensitive, runtime-sensitive, or logout-sensitive data should default to no-store unless the planner proves a narrowly scoped key and invalidation rule.
- **D-09:** Preserve `safeInternalHref` for API-provided navigation targets. Do not cache or reuse unsafe href decisions across roles, users, relationships, or notification resources.
- **D-10:** Improve perceived responsiveness with scoped skeletons/placeholders built from Phase 34 presentation primitives rather than a new UI framework. Loading states should remain Vietnamese, supportive, and accessible with `role="status"` where appropriate.
- **D-11:** Static dashboard structure such as role headers, privacy/data-boundary cards, and demo guide rhythm may render before all supplemental data when the copy is not sensitive to the pending response. Sensitive values from API responses must not be guessed or shown before they load.
- **D-12:** Error states must stay explicit and accessible with `role="alert"` for primary failures. Optional panel failures should show local scoped error/unavailable copy; do not convert errors into misleading "0 items" or "no data" success UI.
- **D-13:** SOS/high-risk semantics remain visually distinct. Skeleton or loading refactors must not neutralize Student SOS red actions, Teacher SOS update posture, Parent read-only SOS posture, or Admin metadata-only warnings.
- **D-14:** Do not introduce a broad React Query/global data provider by default, even though `@tanstack/react-query` is installed. Prefer small dashboard-specific helpers first; only use a library/provider if research shows it reduces duplication without route bundle bloat or cache-boundary risk.
- **D-15:** Shared loading helpers may live under neutral `frontend/lib/` or `frontend/components/` paths. Shared presentation primitives must remain presentation-only and must not import route pages, API clients, auth helpers, role services, or business-rule logic.
- **D-16:** Parent must not import Teacher route pages, and no role page should import another role page to share loading logic. Cross-role reusable code belongs in neutral component/lib modules.
- **D-17:** Review Next build output for affected `/student`, `/teacher`, `/parent`, `/admin`, and touched subroutes. Phase 37 should record aggregate route/build evidence and avoid adding runtime APM, analytics, or production logging.
- **D-18:** Update or supplement the Phase 33 frontend baseline helper so it counts generic `apiFetch<T>(...)` calls and imported helper calls accurately enough for Phase 37 route/waterfall evidence. Evidence remains aggregate-only: route labels, source files, request counts, build asset counts/bytes, command names, and pass/fail status only.
- **D-19:** Add Phase 37 frontend tests that prove reduced/intentional dashboard request topology, credentialed no-store behavior, scoped loading/skeleton states, optional failure handling, no browser token storage, safe internal navigation, cross-role import boundaries, and Admin metadata-only/no-unsafe-control redlines.
- **D-20:** Verification should include focused Vitest coverage, frontend lint, frontend production build, and a build-output or route-baseline evidence artifact. Final baseline-to-post-optimization threshold decisions and release matrix documentation belong to Phase 38.

### the agent's Discretion

- Choose exact helper names and placement (`frontend/lib/dashboard-loading.ts`, route-local helpers, or similarly neutral modules) based on smallest safe diff and testability.
- Choose exact skeleton/placeholder wording and card density as long as Phase 34 UI-SPEC semantics, Vietnamese support tone, responsive behavior, and accessibility semantics are preserved.
- Choose whether `apiFetch` gets a global no-store default or whether dashboard loaders pass no-store per request, provided existing mutation behavior and tests remain safe.
- Choose exact Admin dashboard count/preview wording when exact totals are unavailable without fetching broad lists.
- Choose whether Phase 37 evidence is recorded by updating `phase33-frontend-baseline.mjs`, adding a Phase 37-specific helper, or both, provided downstream Phase 38 can compare aggregate-only results.

### Deferred Ideas (OUT OF SCOPE)

- A broad React Query migration, app-wide data cache provider, offline/PWA/service-worker cache, and global request persistence are deferred unless a future phase explicitly scopes cache governance.
- New backend aggregation/count endpoints should be avoided in Phase 37 unless the planner proves exact Admin counts cannot be represented honestly with existing bounded APIs; broad backend/database optimization remains completed Phase 36 scope.
- Final baseline-to-post-optimization comparisons, hard thresholds, release matrix documentation, public demo/deployed warm evidence, and live production-pilot constraints belong to Phase 38.
- Analytics/APM, runtime production logging, external load testing, CDN/edge caching, prefetching sensitive role routes, provider SSO, external notifications, counselor handoff, multi-school tenancy, raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, and destructive reset controls remain out of scope.
</user_constraints>

## Project Constraints (from copilot-instructions.md)

- Communicate in Vietnamese with the user. [VERIFIED: copilot-instructions.md]
- Preserve backend-owned cookie-authenticated frontend calls and no browser token storage. [VERIFIED: copilot-instructions.md]
- Protected layouts should block child rendering before redirecting privacy-blocked or wrong-role users. [VERIFIED: copilot-instructions.md]
- Admin operations surfaces must remain metadata-only and must not add raw exports, risk leaderboards, or per-student risk drilldowns. [VERIFIED: copilot-instructions.md]
- Student-facing screens must remain supportive, calm, mobile-friendly, Vietnamese-first, and avoid heavy medicalized language. [VERIFIED: copilot-instructions.md]
- No project skills directories were present at `.github/skills/` or `.agents/skills/`. [VERIFIED: filesystem]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEPERF-01 | Role dashboards reduce avoidable fetch waterfalls and duplicate requests while keeping credentialed API calls cookie-based. | Use small typed dashboard loaders around existing role-owned endpoints; preserve `apiFetch` `credentials: "include"`. [VERIFIED: REQUIREMENTS.md, frontend/lib/api.ts] |
| FEPERF-02 | Role dashboards provide consistent perceived responsiveness through scoped loading states, skeletons/placeholders, and clear error/empty states. | Reuse Phase 34 primitives and add scoped loading/error props instead of new UI framework. [VERIFIED: 34-UI-SPEC.md, ui-primitives.tsx] |
| FEPERF-03 | Sensitive role data remains no-store or uses explicitly scoped cache keys/invalidation. | Default dashboard reads to explicit no-store; do not add broad global cache. [VERIFIED: 37-CONTEXT.md, api.ts] |
| FEPERF-04 | Shared UI primitives do not cause route bundle bloat or cross-role page imports; Next build output reviewed. | Keep shared business/data helpers under `frontend/lib/`; keep components presentation-only; update aggregate route/build helper. [VERIFIED: 37-CONTEXT.md, phase33-frontend-baseline.mjs] |
| FEPERF-05 | Frontend work preserves privacy acknowledgement routing, no browser token storage, role dashboard routing, and auth capabilities behavior. | Leave `(authenticated)/layout.tsx` ownership unchanged and add regression tests around static redlines. [VERIFIED: 37-CONTEXT.md, phase35-role-dashboard-consistency.test.tsx] |
</phase_requirements>

## Summary

Phase 37 should be planned as a targeted client-dashboard refactor, not as a new caching architecture. [VERIFIED: 37-CONTEXT.md] The existing dashboards are client components that use `useEffect`, `useState`, `Promise.all`, and `apiFetch`; the main planning opportunity is to centralize repeated request orchestration into small typed helpers while preserving role-specific endpoints and page copy. [VERIFIED: student/page.tsx, teacher/page.tsx, parent/page.tsx, admin/page.tsx]

The safest default is to make dashboard reads explicit no-store while preserving `credentials: "include"` in `apiFetch`. [VERIFIED: 37-CONTEXT.md, frontend/lib/api.ts] A broad React Query provider is not recommended because it would introduce an app-wide server-state cache pattern while Phase 37 decisions explicitly prefer small helpers and no unscoped cache. [VERIFIED: 37-CONTEXT.md]

**Primary recommendation:** Plan three implementation tracks: `(1)` add/adjust credentialed no-store dashboard loading helpers, `(2)` add scoped skeleton/optional-error presentation states using existing primitives, and `(3)` update aggregate-only request/build evidence plus focused Vitest redline tests. [VERIFIED: 37-CONTEXT.md, 34-UI-SPEC.md, phase33-frontend-baseline.mjs]

## Standard Stack

### Core

| Library/Module | Version | Purpose | Why Standard |
|---|---:|---|---|
| Next.js | 16.2.6 | App Router build/runtime and route bundle output | Existing frontend framework; production build output is Phase 37 evidence. [VERIFIED: npm registry, package.json] |
| React | 19.2.6 | Client dashboard rendering and `useEffect` data loading | Existing dashboard components are React client components. [VERIFIED: npm registry, dashboard source] |
| TypeScript | 6.0.3 | Typed dashboard helper contracts | Existing frontend uses strict TypeScript config. [VERIFIED: npm registry, tsconfig.json] |
| Existing `apiFetch` | local module | Credentialed API wrapper | Centralizes `credentials: "include"`; best insertion point for no-store defaults or per-request no-store. [VERIFIED: frontend/lib/api.ts] |
| Existing UI primitives | local module | Loading, error, cards, privacy surfaces | Phase 34 requires presentation-only primitives and accessible status/error semantics. [VERIFIED: 34-UI-SPEC.md, ui-primitives.tsx] |
| Vitest + Testing Library | Vitest 4.1.7; RTL 16.3.2 | Component/static regression tests | Existing Phase 35 tests already render role dashboards and inspect redlines. [VERIFIED: npm registry, package.json, phase35 test] |

### Supporting

| Library/Module | Version | Purpose | When to Use |
|---|---:|---|---|
| `@tanstack/react-query` | 5.100.14 | Server-state cache library | Do not use by default; only consider for a narrowly scoped route-local proof with explicit role/user/resource keys and logout invalidation. [VERIFIED: npm registry, 37-CONTEXT.md] |
| `safeInternalHref` | local module | Sanitizes API-provided internal navigation | Must remain the path for notification/reminder links. [VERIFIED: safe-navigation.ts, 37-CONTEXT.md] |
| `phase33-frontend-baseline.mjs` | local script | Aggregate route/request/build evidence | Update/supplement because current regex undercounts generic `apiFetch<T>(...)` and imported helper calls. [VERIFIED: script source, manual scan] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Small dashboard helpers | Broad React Query provider | React Query adds cache lifecycle/default refetch behavior that must be governed; Phase 37 explicitly avoids broad global cache by default. [VERIFIED: 37-CONTEXT.md; CITED: tanstack.com/query/latest/docs/framework/react/guides/important-defaults] |
| Existing primitives | New skeleton/UI framework | New UI framework risks bundle and visual-rhythm drift; Phase 34 requires manual Tailwind primitives. [VERIFIED: 34-UI-SPEC.md] |
| Bounded preview wording for Admin | New exact-count backend endpoint | New endpoint is out of scope unless planner proves exact totals cannot be represented honestly. [VERIFIED: 37-CONTEXT.md] |

**Installation:** No new package installation is recommended. [VERIFIED: package.json, 37-CONTEXT.md]

**Version verification:** `npm view` verified current registry versions and modified timestamps on 2026-05-27. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
frontend/
├── lib/
│   ├── api.ts                         # credentialed fetch wrapper; candidate no-store default
│   └── dashboard-loading.ts            # optional neutral typed loaders/result helpers
├── components/
│   ├── ui-primitives.tsx               # presentation-only primitives
│   └── adult-student-list.tsx          # Teacher/Parent presentation with scoped optional states
├── app/(authenticated)/
│   ├── student/page.tsx                # role-owned dashboard copy and state wiring
│   ├── teacher/page.tsx
│   ├── parent/page.tsx
│   └── admin/page.tsx
└── scripts/
    └── phase33-frontend-baseline.mjs   # update/supplement aggregate request/build evidence
```

[VERIFIED: repository source tree]

### Pattern 1: Typed dashboard result with primary vs optional failures

**What:** Model primary data separately from optional panel data so a failed reminder/notification/support overview does not become a misleading empty success state. [VERIFIED: 37-CONTEXT.md]  
**When to use:** Student profile and adult linked-student lists are primary; reminders, notifications, and some overview panels are supplemental. [VERIFIED: 37-CONTEXT.md, dashboard source]

```ts
type OptionalResult<T> =
  | { status: "ready"; data: T }
  | { status: "unavailable"; message: string };

type TeacherDashboardData = {
  students: AdultLinkedStudent[];
  supportOverview: OptionalResult<AdultSupportOverviewItem[]>;
  notifications: OptionalResult<InAppNotification[]>;
};
```

[VERIFIED: frontend dashboard types and Phase 37 decisions]

### Pattern 2: Explicit no-store credentialed reads

**What:** Dashboard GET/read calls should pass explicit cache-safe options while `apiFetch` continues to force `credentials: "include"`. [VERIFIED: frontend/lib/api.ts, 37-CONTEXT.md]  
**When to use:** Role dashboards, support overview, notifications, student profile, SOS lists, and Admin preview reads. [VERIFIED: dashboard source]

```ts
apiFetch<StudentProfile>("/api/student/profile", {
  cache: "no-store",
});
```

[CITED: nextjs.org/docs/app/getting-started/caching-and-revalidating; VERIFIED: frontend/lib/api.ts]

### Pattern 3: Static shell first; sensitive values only after load

**What:** Render non-sensitive dashboard structure early if useful, but do not guess names, counts, reminders, support status, SOS state, or notification bodies before responses load. [VERIFIED: 37-CONTEXT.md]  
**When to use:** Admin static entry cards and privacy-boundary cards can render while bounded preview labels load; Student profile-specific greeting must wait for profile. [VERIFIED: admin/page.tsx, student/page.tsx]

### Anti-Patterns to Avoid

- **Broad global cache/provider:** Conflicts with Phase 37 cache-boundary decisions unless narrowly justified. [VERIFIED: 37-CONTEXT.md]
- **Silent optional failure as empty array:** Creates false "no students/no notifications" states. [VERIFIED: 37-CONTEXT.md, adult-student-list.tsx]
- **Admin broad list count cards:** `/api/admin/users` and `/api/admin/links` are bounded by default; their array lengths are previews, not exact totals. [VERIFIED: backend admin routers, 37-CONTEXT.md]
- **Shared component importing API/business logic:** Violates Phase 34 primitive contract. [VERIFIED: 34-UI-SPEC.md]
- **Caching sanitized href decisions:** `safeInternalHref` decisions must be recalculated per API-provided href and boundary. [VERIFIED: safe-navigation.ts, 37-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Credentialed API calls | Ad hoc `fetch` wrappers in pages | Existing `apiFetch` | Preserves `credentials: "include"` and central error handling. [VERIFIED: api.ts] |
| Unsafe link filtering | Page-local URL parsing | `safeInternalHref` | Existing sanitizer rejects non-internal and protocol-relative hrefs. [VERIFIED: safe-navigation.ts] |
| Loading/error UI | New UI framework | `LoadingState`, `ErrorState`, `SurfaceCard`, `EntryCard` | Phase 34 established primitives and accessibility semantics. [VERIFIED: ui-primitives.tsx, 34-UI-SPEC.md] |
| Global sensitive cache | localStorage/sessionStorage/IndexedDB/service worker | No-store reads or narrowly scoped in-memory request helper | Browser storage of role/support/API data is forbidden. [VERIFIED: 37-CONTEXT.md] |
| Admin exact totals from previews | Counting bounded arrays as totals | Bounded preview wording or explicit metadata dependency | Phase 36 bounded list defaults mean list length is not necessarily total count. [VERIFIED: admin routers, 37-CONTEXT.md] |

**Key insight:** The optimization is mostly about request topology, state modeling, and perceived rendering; not about persistent caching or new frontend infrastructure. [VERIFIED: 37-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Under-counting dashboard requests

**What goes wrong:** The Phase 33 helper currently counts `apiFetch(` but misses generic `apiFetch<T>(...)` and indirect imported helper calls. [VERIFIED: phase33-frontend-baseline.mjs, manual scan]  
**How to avoid:** Update static scan patterns to include generic calls and route-local imported helper calls, or add Phase 37-specific evidence. [VERIFIED: 37-CONTEXT.md]

### Pitfall 2: Optional failure becomes false empty state

**What goes wrong:** Teacher/Parent visible students are derived from `supportOverview`; if overview fails or is empty, linked students can disappear as "no linked students." [VERIFIED: adult-student-list.tsx, 37-CONTEXT.md]  
**How to avoid:** Pass explicit `supportOverviewStatus` and distinguish "no SOS-visible students" from "overview unavailable." [VERIFIED: 37-CONTEXT.md]

### Pitfall 3: Admin bounded previews shown as exact totals

**What goes wrong:** Admin dashboard currently fetches `/api/admin/users` and `/api/admin/links` and displays array lengths. [VERIFIED: admin/page.tsx]  
**How to avoid:** Use `/api/admin/users?limit=...` and `/api/admin/links?limit=...` only as previews, or avoid count labels when exact metadata is unavailable. [VERIFIED: admin routers, 37-CONTEXT.md]

### Pitfall 4: No-store accidentally applied to mutations incorrectly

**What goes wrong:** A global `apiFetch` default could affect all requests, including POST/PATCH/DELETE. [VERIFIED: api.ts, sos-api.ts, notification-preferences-api.ts]  
**How to avoid:** If changing `apiFetch`, preserve mutation behavior and test both read and mutation options; otherwise apply `cache: "no-store"` only from dashboard loaders. [VERIFIED: 37-CONTEXT.md]

### Pitfall 5: React Strict Mode effects can double-expose test assumptions

**What goes wrong:** `next.config.ts` enables `reactStrictMode: true`, so tests should not assume one effect invocation unless intentionally controlled. [VERIFIED: next.config.ts]  
**How to avoid:** Write request-topology tests around final helper/static source evidence or controlled mocks rather than brittle render-only call counts. [VERIFIED: existing Vitest patterns]

## Code Examples

### Scoped optional result pattern

```ts
async function optional<T>(
  read: () => Promise<T>,
  unavailableMessage: string,
): Promise<OptionalResult<T>> {
  try {
    return { status: "ready", data: await read() };
  } catch {
    return { status: "unavailable", message: unavailableMessage };
  }
}
```

[VERIFIED: Phase 37 optional failure decision]

### Dashboard loader preserves role-owned paths

```ts
export async function loadTeacherDashboard() {
  const [students, supportOverview, notifications] = await Promise.all([
    apiFetch<AdultLinkedStudent[]>("/api/teacher/students", { cache: "no-store" }),
    optional(() => getTeacherSupportOverview(), "Tạm thời chưa tải được tóm tắt hỗ trợ."),
    optional(() => getNotifications(), "Tạm thời chưa tải được thông báo hỗ trợ."),
  ]);

  return { students, supportOverview, notifications };
}
```

[VERIFIED: teacher/page.tsx, sos-api.ts, 37-CONTEXT.md]

### Aggregate-only evidence fields

```js
{
  route: "/teacher",
  sourceFile: "app/(authenticated)/teacher/page.tsx",
  fetchCandidateCount: 3,
  waterfallCount: 3,
  waterfallCountSource: "static-fetch-proxy",
  buildEvidence: { status: "available", routeAssetCount: 0, routeAssetBytes: 0 },
  commandSource: "node scripts/phase37-frontend-baseline.mjs"
}
```

[VERIFIED: phase33-frontend-baseline.mjs, 37-CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Broad sensitive client caching | No-store or scoped cache keys with explicit invalidation | Phase 37 decision | Avoids cross-user/role/relationship leakage. [VERIFIED: 37-CONTEXT.md] |
| Loading entire page until every request resolves | Static non-sensitive shell plus scoped panel loading/unavailable states | Phase 37 decision | Improves perceived responsiveness without guessing sensitive data. [VERIFIED: 37-CONTEXT.md] |
| Counting Admin bounded list arrays as totals | Preview/bounded wording or explicit metadata contract | After Phase 36 bounded backend paths | Avoids misleading Admin dashboard totals. [VERIFIED: backend admin routers, 37-CONTEXT.md] |
| Static request helper counts only direct non-generic `apiFetch(` | Count generic `apiFetch<T>(...)` and imported helper calls | Phase 37 task | Makes route/waterfall evidence accurate enough for Phase 38. [VERIFIED: phase33-frontend-baseline.mjs, 37-CONTEXT.md] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| - | No unverified assumptions intentionally used. | - | - |

## Open Questions (RESOLVED)

1. **Should `apiFetch` default all GET-like reads to no-store or should dashboard loaders pass no-store?**  
   - What we know: Phase 37 allows either approach if mutations remain safe. [VERIFIED: 37-CONTEXT.md]  
   - RESOLVED: Use neutral dashboard-loader helpers and per-dashboard read wrappers with `cache: "no-store"` first, rather than making every `apiFetch` call no-store globally. Mutations remain on `apiFetch` with existing methods.

2. **Does Admin need exact total counts?**  
   - What we know: Existing endpoints are bounded with `limit` default 100 and max 200. [VERIFIED: backend admin routers]  
   - RESOLVED: Phase 37 will not add backend count endpoints. Admin dashboard uses bounded `limit=10` previews and honest copy such as `Preview ... tài khoản demo`, `Preview ... liên kết được phân trang`, and `Preview metadata tạm thời chưa tải được.`

3. **Should Phase 37 update Phase 33 helper or add a Phase 37 helper?**  
   - What we know: Context permits either if Phase 38 can compare aggregate-only results. [VERIFIED: 37-CONTEXT.md]  
   - RESOLVED: Update the existing Phase 33 frontend baseline helper and tests so Phase 38 can compare the same aggregate-only schema while counting generic and imported dashboard helper calls.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | frontend tests/build/scripts | yes | v22.17.0 | - |
| npm | package scripts/version verification | yes | 10.9.2 | - |
| git | source evidence/history | yes | 2.52.0.windows.1 | - |
| curl | optional docs/env checks | yes | 8.13.0 | - |
| Vitest config | focused frontend tests | yes | `vitest.config.ts` present | - |
| Next config | production build | yes | `next.config.ts` present | - |

**Missing dependencies with no fallback:** None found. [VERIFIED: environment probes]  
**Missing dependencies with fallback:** None found. [VERIFIED: environment probes]

## Validation Architecture

Skipped because `.planning/config.json` sets `workflow.nyquist_validation` to `false`. [VERIFIED: .planning/config.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---:|---|
| V2 Authentication | yes | Keep backend-owned HttpOnly cookie session; no browser token storage. [VERIFIED: copilot-instructions.md, 37-CONTEXT.md] |
| V3 Session Management | yes | Preserve `apiFetch` `credentials: "include"` and do not cache logout-sensitive role data. [VERIFIED: api.ts, 37-CONTEXT.md] |
| V4 Access Control | yes | Keep `(authenticated)/layout.tsx` as auth/privacy/wrong-role owner; preserve role-owned endpoints. [VERIFIED: 37-CONTEXT.md] |
| V5 Input Validation | yes | Use existing typed API payloads and safe href sanitizer for API-provided navigation. [VERIFIED: sos-api.ts, notification-preferences-api.ts, safe-navigation.ts] |
| V6 Cryptography | limited | No new crypto in scope; do not introduce token storage. [VERIFIED: 37-CONTEXT.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Cross-role cached sensitive data | Information Disclosure | No-store reads or scoped cache keys including effective user/role/path/query and invalidation. [VERIFIED: 37-CONTEXT.md] |
| Unsafe API-provided navigation | Spoofing/Tampering | Use `safeInternalHref` per href render. [VERIFIED: safe-navigation.ts] |
| Misleading empty state after supplemental failure | Information Integrity/Safety UX | Explicit scoped unavailable/error copy. [VERIFIED: 37-CONTEXT.md] |
| Browser token leakage | Information Disclosure/Elevation | No localStorage/sessionStorage/IndexedDB/service worker token/API response storage. [VERIFIED: 37-CONTEXT.md] |
| Runtime APM/logging data leakage | Information Disclosure | Aggregate-only evidence; no runtime analytics/APM/logging. [VERIFIED: 37-CONTEXT.md, phase33 baseline] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/37-frontend-data-loading-render-optimization/37-CONTEXT.md` - locked Phase 37 decisions D-01 through D-20. [VERIFIED: filesystem]
- `.planning/REQUIREMENTS.md` - FEPERF-01 through FEPERF-05 acceptance criteria. [VERIFIED: filesystem]
- `.planning/ROADMAP.md` - Phase 37 goal, dependencies, success criteria. [VERIFIED: filesystem]
- `frontend/lib/api.ts` - `apiFetch` credentials behavior. [VERIFIED: filesystem]
- Dashboard pages and `adult-student-list.tsx` - current request/state/presentation topology. [VERIFIED: filesystem]
- `frontend/scripts/phase33-frontend-baseline.mjs` and test - current aggregate evidence helper. [VERIFIED: filesystem]
- `backend/app/api/admin_users.py`, `backend/app/api/admin_links.py` - bounded Admin list params. [VERIFIED: filesystem]
- npm registry - package versions and publish timestamps. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Next.js docs, caching and revalidating - fetch cache/no-store guidance. [CITED: https://nextjs.org/docs/app/getting-started/caching-and-revalidating]
- React docs, `useEffect` - effect cleanup/loading patterns. [CITED: https://react.dev/reference/react/useEffect]
- TanStack Query docs, important defaults - cache/stale/refetch behavior. [CITED: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults]

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json, npm registry, and repository code.  
- Architecture: HIGH - constrained by Phase 37 decisions and existing source.  
- Pitfalls: HIGH - derived from current code and locked decisions.  
- External framework details: MEDIUM - official docs cited; Context7 was unavailable in this environment.

**Research date:** 2026-05-27  
**Valid until:** 2026-06-26 for repository-specific findings; re-check npm/framework versions if planning after 7 days.

## RESEARCH COMPLETE

**Phase:** 37 - Frontend Data Loading & Render Optimization  
**Confidence:** HIGH

### Key Findings

- Use small typed dashboard loaders/helpers, not broad React Query/global cache by default.
- Make dashboard credentialed reads explicit no-store while preserving `credentials: "include"`.
- Teacher/Parent optional support overview and notifications need scoped unavailable states to avoid false empty dashboards.
- Admin dashboard must stop showing bounded list lengths as exact totals.
- Phase 33 helper undercounts generic `apiFetch<T>(...)` and imported helper calls; update/supplement it for Phase 37 aggregate evidence.
