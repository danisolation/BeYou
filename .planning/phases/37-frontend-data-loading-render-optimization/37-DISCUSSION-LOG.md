# Phase 37: Frontend Data Loading & Render Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `37-CONTEXT.md` - this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 37 - Frontend Data Loading & Render Optimization
**Mode:** `--auto`; user unavailable, autonomous safe defaults selected per project preference.
**Areas discussed:** Dashboard request topology, cache and credential boundaries, scoped loading and skeletons, bundle/import boundaries, measurement and verification

---

## Dashboard Request Topology

| Option | Description | Selected |
|---|---|---|
| Small route-local or neutral dashboard loaders | Keep role-owned API paths while centralizing request orchestration enough to reduce duplication and make request counts testable. | yes |
| Broad app-wide data layer/provider | Add a new global data provider and migrate dashboards into it. Higher bundle/cache-boundary risk. | |
| Leave page-local `Promise.all` as-is | Lowest code churn but does not satisfy the Phase 37 duplicate/waterfall and scoped-state goal. | |

**Auto choice:** Small route-local or neutral dashboard loaders.
**Notes:** Preserves Phase 34/35 route ownership and avoids new global cache semantics. Admin dashboard must stop counting broad users/links arrays as exact totals after Phase 36 bounded defaults.

---

## Cache and Credential Boundaries

| Option | Description | Selected |
|---|---|---|
| Explicit no-store credentialed dashboard reads | Keep `credentials: "include"` and make dashboard API reads fail-closed against browser/Next caching by default. | yes |
| Scoped in-memory dedupe only where proven safe | Possible for exact duplicate reads, but only with role/user/path/query/reason/policy/relationship/runtime/logout boundaries. | partial |
| Generic client cache for role data | Faster repeat navigation but high privacy-leak and invalidation risk for this product. | |

**Auto choice:** Explicit no-store by default; allow only tightly scoped in-memory dedupe if the planner proves it safe.
**Notes:** No browser token storage, no persistent role-data cache, and safe internal href checks remain mandatory.

---

## Scoped Loading and Skeletons

| Option | Description | Selected |
|---|---|---|
| Presentation-only skeletons/placeholders with scoped failures | Improves perceived speed while preserving Phase 34 UI rhythm and explicit error semantics. | yes |
| Keep single full-page loading state | Simple but does not satisfy Phase 37 perceived responsiveness criteria. | |
| Render optimistic sensitive data | Fast-looking but unsafe; could imply data before authorization/data response. | |

**Auto choice:** Presentation-only skeletons/placeholders with scoped failures.
**Notes:** Static role copy may render early; sensitive API-derived values must wait for data. Optional failures must not become silent empty states.

---

## Bundle and Import Boundaries

| Option | Description | Selected |
|---|---|---|
| Minimal helpers and build review | Preserve neutral `frontend/lib/` and presentation-only `frontend/components/` boundaries, then review affected Next build output. | yes |
| Introduce React Query globally | Dependency exists but is unused; adds provider/cache semantics and possible bundle cost. | |
| Share route code across role pages | Would risk cross-role imports and violates Phase 34/35 boundaries. | |

**Auto choice:** Minimal helpers and build review.
**Notes:** React Query remains deferred unless research proves it necessary. Parent must not import Teacher route pages; shared logic belongs in neutral modules.

---

## Measurement and Verification

| Option | Description | Selected |
|---|---|---|
| Update/supplement aggregate frontend baseline and focused tests | Gives Phase 37 measurable request/build evidence without raw payloads or production logging. | yes |
| Use external APM/analytics or live load tests | More realistic but out of v1.6 Phase 37 scope and higher privacy risk. | |
| Rely only on manual visual judgment | Does not prove FEPERF request/cache/build requirements. | |

**Auto choice:** Update/supplement aggregate frontend baseline and focused tests.
**Notes:** Evidence must remain aggregate-only. Final threshold comparison and release docs belong to Phase 38.

---

## the agent's Discretion

- Exact helper names and file placement.
- Exact skeleton copy and card layout within Phase 34 UI-SPEC.
- Whether no-store is enforced globally in `apiFetch` or per dashboard helper.
- Exact Admin bounded/preview wording if exact totals are unavailable.
- Whether Phase 37 evidence updates the Phase 33 baseline helper, adds a Phase 37 helper, or both.

## Deferred Ideas

- Broad React Query migration or global cache provider.
- Service worker, offline/PWA, persistent client cache, CDN/edge caching, or sensitive route prefetching.
- New backend aggregation/count endpoint unless planning proves it is the only honest minimal way to avoid broad Admin list counts.
- Final release thresholds and baseline-to-post-optimization matrix for Phase 38.
