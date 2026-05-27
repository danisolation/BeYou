# Phase 36: Backend & DB Hot Path Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 36-backend-db-hot-path-optimization
**Areas discussed:** Admin users/links, Teacher/Parent linked-student and SOS visibility, adult support overview and summaries, Admin operations dashboard, indexes/migrations/schema drift
**Mode:** Autonomous `--auto`; the agent selected recommended backend/DB defaults based on Phase 33 evidence and existing code.

---

## Admin Users and Links

| Option | Description | Selected |
|--------|-------------|----------|
| Bounded/paginated admin lists with batched link hydration | Add server-side bounds and remove per-link `db.get` hydration while preserving authorization and current safe fields. | yes |
| Keep existing full-list behavior | Lowest contract risk, but leaves Phase 33 unbounded/N+1 candidates unresolved. | |
| Response-wrapper redesign | Enables richer pagination metadata, but risks frontend/API contract churn in a backend hot-path phase. | |

**User's choice:** Agent-selected recommended default.
**Notes:** Existing `/api/admin/users` and `/api/admin/links` consumers should remain safe. Prefer response-shape compatibility unless planning proves a wrapper is required and all consumers/tests are updated.

---

## Teacher/Parent Linked-Student and SOS Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Batch active-link and SOS-existence predicates | Use equivalent SQL predicates to avoid per-row helper calls while preserving SOS-only visibility. | yes |
| Keep per-row `require_permission` calls | Maximally conservative but likely fails DBPERF-02 query-efficiency goal. | |
| Broaden adult visibility then filter in frontend | Unsafe; violates SOS-only adult visibility and support-not-surveillance boundaries. | |

**User's choice:** Agent-selected recommended default.
**Notes:** Non-SOS students and inactive links must stay hidden. Teacher and Parent relationship types remain separate.

---

## Adult Support Overview and Summaries

| Option | Description | Selected |
|--------|-------------|----------|
| SQL-side latest/recent filtering with batched overview data | Push limits/order/cutoffs into SQL and batch latest/open-count data where practical. | yes |
| Keep broad loads and Python slicing | Simpler, but leaves memory/query cost proportional to full history. | |
| Add caching | Deferred; risks sensitive-data cache scope and belongs outside Phase 36 unless explicitly planned with privacy proof. | |

**User's choice:** Agent-selected recommended default.
**Notes:** Controlled reason gates, summary-only outputs, shared-note consent boundaries, and metadata-only audit events remain mandatory.

---

## Admin Operations Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Optimize/bound internal section queries only | Preserve metadata-only serialization and sanitizer redlines while reducing broad query work. | yes |
| Remove expensive sections | Could hide required operations readiness metadata and regress previous phases. | |
| Add raw drilldowns/export controls | Unsafe; explicitly out of scope. | |

**User's choice:** Agent-selected recommended default.
**Notes:** Existing `limit` clamping, `_safe_metadata`, `_safe_operation_text`, and forbidden metadata key coverage remain required.

---

## Indexes, Migrations, and Schema Drift

| Option | Description | Selected |
|--------|-------------|----------|
| Add only evidence-tied indexes with Alembic + metadata alignment | Match new indexes to observed predicates, update models and migrations together, and verify drift/privacy gates. | yes |
| Add speculative indexes broadly | May add migration risk without improving actual hotspots. | |
| Avoid migrations entirely | Acceptable only if query refactors are sufficient and existing indexes cover predicates. | yes, when justified |

**User's choice:** Agent-selected recommended default.
**Notes:** Planning should decide whether any new index is necessary after query design. Do not add schema changes just to satisfy DBPERF-05 if existing indexes already cover the optimized predicates.

---

## the agent's Discretion

- Exact pagination parameter names, defaults, and max limits.
- Exact helper/module boundaries for shared SQL predicates.
- Exact deterministic query-count/boundedness assertions in backend tests.
- Whether migrations/indexes are necessary after query refactors.

## Deferred Ideas

- Frontend fetch waterfalls, loading UX, cache/no-store policy, skeletons, and build output review are deferred to Phase 37.
- Final baseline-to-post-optimization comparison, release docs, and live environment constraints are deferred to Phase 38.
