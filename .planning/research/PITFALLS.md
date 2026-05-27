# Domain Pitfalls: v1.6 Cross-Role UI Consistency & Production Performance

**Project:** Peerlight AI
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Researched:** 2026-05-26

## Critical Pitfalls

### 1. Homogenizing UI by erasing role-specific privacy boundaries

**Warning signs**
- Shared cards remove support-not-surveillance copy.
- Teacher and Parent screens become identical even though Teacher can update SOS handling and Parent is read-only.
- Admin operations starts looking like a student monitoring dashboard.

**Prevention**
- Share layout primitives, not privacy meaning.
- Keep role-specific boundary panels and copy.
- Add tests/grep gates for forbidden raw-data and surveillance patterns.

**Phase:** 33, 34, 38.

### 2. Shared components leaking sensitive fields

**Warning signs**
- Components accept broad `user`, `student`, `metadata`, or `auditEvent` objects.
- Components dynamically render all object keys.
- Adult/admin views show raw IDs, emails, notes, answers, transcripts, reasons, provider subjects, or raw claims.

**Prevention**
- Use explicit role-safe DTOs and allowlisted props.
- Keep backend sanitization and frontend DOM filtering.
- Add redline tests for shared components.

**Phase:** 34, 38.

### 3. Measuring only local/demo speed

**Warning signs**
- Performance pass is based only on localhost tests.
- Public demo smoke is counted as production-pilot proof.
- No baseline for endpoint duration, query count, payload size, or route loading.

**Prevention**
- Record baseline before optimization.
- Separate local deterministic evidence, public demo evidence, and live pilot constraints.
- Capture cold vs warm behavior where possible.

**Phase:** 33, 35, 38.

### 4. Unsafe DB indexes or migrations

**Warning signs**
- Indexes are speculative instead of tied to query predicates.
- Alembic and SQLAlchemy model metadata drift.
- Wide text/JSON fields or sensitive content fields are indexed without need.

**Prevention**
- Match indexes to observed slow queries.
- Keep migration/model metadata synchronized.
- Run schema drift checks and targeted regression tests.

**Phase:** 36, 38.

### 5. Caching sensitive role data with unsafe keys

**Warning signs**
- Cache keys are generic such as `students`, `dashboard`, or `support-summary`.
- Adult summaries remain visible after link/share/policy changes.
- Credentialed API data is stored in browser storage.

**Prevention**
- Prefer no-store for sensitive credentialed fetches unless invalidation is explicitly designed.
- Scope any cache to user, role, resource, reason, policy, and runtime.
- Never store tokens or sensitive payloads in local/session storage.

**Phase:** 37, 38.

### 6. Underfetching safety-critical context

**Warning signs**
- Dashboards load faster but lose privacy notices, reason-required state, SOS explanation, or consent indicators.
- Empty states hide whether access is blocked, missing reason, or truly empty.

**Prevention**
- Define minimal safe payload contracts.
- Keep permission, reason, privacy acknowledgement, and safety-copy state in optimized responses.
- Test blocked, empty, loading, error, and reason-required states.

**Phase:** 37, 38.

### 7. Leaving N+1 and unbounded lists in backend paths

**Warning signs**
- Admin users/links and teacher/parent student lists slow down with data growth.
- Services load all attempts/check-ins and slice in Python.
- Endpoint speed is "fixed" only by UI spinners.

**Prevention**
- Add pagination/limits.
- Batch relationship/SOS/user lookups.
- Push limit/order/filter into SQL.

**Phase:** 36.

### 8. Bundle bloat from over-shared client components

**Warning signs**
- Student routes import admin operations/chart/table utilities.
- Shared role page components import heavy dependencies for all roles.
- Next build route bundle output grows without review.

**Prevention**
- Keep primitives small and presentation-only.
- Avoid cross-role page imports.
- Use build output and route smoke tests before/after.

**Phase:** 34, 37, 38.

## Phase-Specific Warning Matrix

| Phase | Main risk | Mitigation |
|---|---|---|
| 33 | Baseline misses production-only slowness | Capture local/demo constraints and route/API/DB candidates separately. |
| 34 | Shared UI leaks role data | Use safe DTOs and role-specific copy. |
| 35 | Observability exposes sensitive data | Aggregate timings only; no raw payloads or IDs. |
| 36 | Query optimization weakens authorization | Pair performance tests with privacy/authorization tests. |
| 37 | Caching leaks data or removes safety state | Use scoped/no-store fetches and explicit invalidation. |
| 38 | Speed gates incentivize unsafe shortcuts | Pair every performance gate with privacy redlines. |
