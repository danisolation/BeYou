# Phase 36: Backend & DB Hot Path Optimization - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Autonomous smart discuss; recommended backend/DB performance decisions accepted by the agent per user preference.

<domain>
## Phase Boundary

Phase 36 optimizes bounded backend and database hot paths identified by the Phase 33 baseline: Admin users/links, Teacher/Parent linked-student and SOS visibility, adult support overview/summary paths, and Admin operations dashboard sections. The phase may add backend query helpers, pagination/bounds, SQL-side filtering, batching, indexes, migrations, and backend regression tests. It must preserve existing authorization, active relationship checks, SOS-only adult visibility, controlled reason gates, metadata-only audit, operations sanitizers, cookie-session auth, and schema alignment. It must not change frontend dashboard presentation, browser caching/loading strategy, UI primitives, public demo behavior, production-pilot readiness semantics, raw data visibility, exports, risk leaderboards, per-student drilldowns, raw audit browsers, or destructive admin controls.

</domain>

<decisions>
## Implementation Decisions

### Admin Users and Links
- **D-01:** Make `/api/admin/users` bounded or paginated at the backend service/API layer while preserving the existing list response shape unless a response wrapper is proven necessary by tests. Default bounds should protect the endpoint without forcing frontend behavior changes in Phase 36.
- **D-02:** Make `/api/admin/links` bounded or paginated and remove N+1 user hydration. Link responses should be built from a batched/joined query that returns link, student, and adult data together.
- **D-03:** Preserve Admin authorization through `_require_admin`, `require_role(UserRole.ADMIN)`, and `require_permission(... purpose="admin_operations")`; do not introduce new Admin capabilities or unsafe management controls.
- **D-04:** Preserve existing Admin response fields and password/secret redlines. Optimizations should not add raw exports, raw identifiers beyond existing API contracts, risk rankings, or sensitive student content.

### Teacher/Parent Linked-Student and SOS Visibility
- **D-05:** Batch SOS-signal and active-link checks for `/api/teacher/students` and `/api/parent/students` instead of calling `has_student_sos_signal` and `require_permission` per row when the same safety result can be proven from the same SQL predicates.
- **D-06:** Keep SOS-only adult visibility strict: adults only receive active linked students who have at least one SOS signal, and Teacher/Parent role-specific relationship types remain separate.
- **D-07:** If helper functions are added to authorization or services, they must reuse the same predicates as `has_active_student_link`, `has_student_sos_signal`, and `require_permission`, and tests must prove non-SOS and inactive-link students remain hidden.
- **D-08:** Keep existing bounded linked-student caps conservative. If a limit is exposed, clamp it server-side and preserve stable ordering.

### Adult Support Overview and Summaries
- **D-09:** Optimize `get_support_overview` by batching linked students, SOS-signal eligibility, latest self-check, latest SOS, open SOS counts, and alert event loading where practical. Preserve metadata-only audit events for summary/SOS reads.
- **D-10:** Push recent self-check filtering, ordering, and limits into SQL in `get_adult_self_check_summaries`; do not load an unbounded attempt history and slice in Python.
- **D-11:** Push mood-summary cutoff/limit logic into SQL in adult support summary paths where practical, while keeping private notes hidden unless explicitly student-shared through existing share logic.
- **D-12:** Preserve controlled reason-gate behavior in `get_adult_support_summary`: policy lookup, missing/invalid reason responses, reason audit, authorization-denied audit, and accepted-reason audit semantics must remain intact.

### Admin Operations Dashboard
- **D-13:** Optimize expensive `build_operations_dashboard` sections internally, not by weakening metadata-only output. Existing sanitizers such as `_safe_metadata`, `_safe_operation_text`, safe keys, and forbidden metadata key coverage remain mandatory.
- **D-14:** Keep operations query parameters bounded (`limit` clamped by API), push filters into SQL, and avoid loading raw/broad datasets for recent audit and delivery sections.
- **D-15:** Operations output must remain aggregate/status/checklist metadata only. Do not add raw contact details, raw origins, cookie names/values, emails, provider claims, request/response bodies, private notes, self-check/scenario answers, transcript text, free-text reasons, export URLs, risk leaderboards, per-student drilldowns, or destructive reset controls.

### Indexes, Migrations, and Schema Drift
- **D-16:** Add indexes only when directly tied to Phase 36 query predicates and evidence: e.g., active adult/student relationship lookups, SOS student/status/created queries, audit filter/order predicates, or operations aggregate predicates.
- **D-17:** Any index change must update both `backend/app/db/models.py` metadata and an Alembic migration under `backend/alembic/versions/`, with a downgrade path.
- **D-18:** Phase 36 verification must include backend regressions, backend ruff, an Alembic/schema drift check when available, and privacy redline tests for adult/admin outputs.

### the agent's Discretion
- Choose exact pagination parameter names and default/max limits, prioritizing backwards compatibility for current frontend count usage.
- Choose whether to implement shared backend helpers under `app.services`, `app.core.authorization`, or route-local functions based on existing patterns and testability.
- Choose whether indexes are necessary after query refactors; do not add speculative indexes if existing indexes already cover the optimized predicates.
- Choose exact query-count or boundedness regression assertions that are deterministic in the local TestClient/SQLite/PostgreSQL-compatible test setup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and milestone constraints
- `.planning/ROADMAP.md` - Phase 36 goal, dependencies, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` - DBPERF-01, DBPERF-02, DBPERF-03, DBPERF-04, DBPERF-05 acceptance criteria plus v1.6 release-gate redlines.
- `.planning/PROJECT.md` - product vision, role boundaries, privacy-by-default, and support-not-surveillance principles.
- `.planning/STATE.md` - current milestone state, Phase 35 completion, v1.6 baseline status, and production-pilot constraint notes.

### Prior phase context and evidence
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md` - Phase 36 hotspot queue, aggregate-only evidence rules, and privacy redlines.
- `.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md` - locked deferrals and role-dashboard boundaries; backend/API optimization belongs to Phase 36.
- `.planning/phases/35-role-dashboard-consistency-pass/35-VERIFICATION.md` - verified Teacher/Parent SOS-only dashboard visibility, Admin metadata-only posture, and no Phase 36/37 scope creep.
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-CONTEXT.md` - locked UI/frontend deferrals and no-browser-token/session boundaries.

### Existing backend implementation references
- `backend/app/api/admin_users.py` - Admin user list route and `_require_admin`.
- `backend/app/services/users.py` - `list_users`, create/update/delete user service patterns, and Admin audit behavior.
- `backend/app/api/admin_links.py` - Admin link list route and current per-link `_link_response` hydration.
- `backend/app/services/links.py` - `list_links`, `create_link`, `revoke_link`, relationship validation, and link audit behavior.
- `backend/app/api/teacher.py` - Teacher linked-student route with current per-row SOS/permission checks.
- `backend/app/api/parent.py` - Parent linked-student route with current per-row SOS/permission checks.
- `backend/app/core/authorization.py` - `has_active_student_link`, `has_student_sos_signal`, and `require_permission` predicates that must remain semantically equivalent.
- `backend/app/api/sos.py` - Teacher/Parent support overview and SOS route wiring.
- `backend/app/services/sos.py` - `_linked_students`, `list_adult_sos_alerts`, `get_support_overview`, latest summary/SOS/open-count helpers, and SOS audit events.
- `backend/app/api/adult_summaries.py` - adult self-check/support-summary route wiring and reason query parameter.
- `backend/app/services/adult_summaries.py` - reason gates, summary-only response construction, support-plan summary, mood summary, shared mood note integration, and audit events.
- `backend/app/api/admin_operations.py` - operations dashboard query params and server-side limit clamping.
- `backend/app/services/admin_operations.py` - dashboard section builders, `_delivery_summary`, `_audit_summary`, sanitizer functions, operations redlines, and metadata-only schemas.
- `backend/app/db/models.py` - SQLAlchemy model metadata and indexes for users, links, self-check attempts, mood check-ins, SOS alerts, audit, sessions, and identity.
- `backend/alembic/versions/` - Alembic migration history that must stay aligned with SQLAlchemy metadata if indexes change.

### Existing test references
- `backend/tests/test_phase33_performance_baseline.py` - aggregate-only endpoint measurement pattern and Phase 36 endpoint candidates.
- `backend/tests/test_admin_users_links.py` - Admin user/link authorization, mutation, and audit regressions.
- `backend/tests/test_phase4_sos_backend.py` - SOS workflow, support overview, and privacy regression patterns.
- `backend/tests/test_phase14_adult_support_summaries.py` - adult support-summary privacy and audit coverage.
- `backend/tests/test_phase23_mood_note_shares.py` - student-consented shared mood note boundaries.
- `backend/tests/test_phase24_reason_access.py` - reason-gated adult access behavior.
- `backend/tests/test_phase25_admin_policy_operations.py` - v1.4 operations metadata/sanitizer coverage.
- `backend/tests/test_phase31_school_pilot_operations.py` - pilot operations metadata-only redlines.
- `backend/tests/test_phase32_release_gates.py` - operations sanitizer and backend release-gate redline patterns.
- `backend/tests/test_schema_models.py` - schema/model metadata checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Hotspot Evidence
- Phase 33 routes `/api/teacher/students`, `/api/parent/students`, `/api/teacher/support-overview`, `/api/parent/support-overview`, adult support-summary paths, `/api/admin/users`, `/api/admin/links`, `/api/admin/operations/dashboard`, and `/api/admin/reports/aggregate` to Phase 36 as P1 backend/database candidates.
- Admin users currently return all users via `list_users(db)` ordered by `User.created_at, User.email`.
- Admin links currently return all links and hydrate each response with `db.get(User, link.student_id)` plus `db.get(User, link.adult_id)`.
- Teacher/Parent linked-student routes already join links to users and cap at 200, but they call SOS/permission helpers per student.
- Support overview loops linked students and calls latest self-check, latest SOS, alert events, and open SOS count per visible student.
- Adult self-check summaries load all attempts for a student before Python cutoff/limit slicing.
- Adult support summary preserves reason gates but calls support-plan, mood, and shared-note helpers separately.
- Admin operations dashboard already uses bounded `limit`, SQL filters for audit summary, recent delivery limits, and strict sanitizers; optimization should focus on avoiding avoidable broad work without output changes.

### Reusable Assets and Patterns
- SQLAlchemy `select(...)`, `.where(...)`, `.order_by(...)`, `.limit(...)`, `func.count()`, joined queries, and service-layer response builders are the established backend pattern.
- Metadata-only audit is recorded through `record_audit_event`; read optimizations must not remove required audit events.
- FastAPI route handlers use role checks in route-level functions and service functions for domain-specific enforcement.
- Existing tests prefer deterministic local TestClient/SQLAlchemy assertions over external load testing or production telemetry.

### Schema/Index State
- Existing indexes already cover many individual predicates: `StudentAdultLink.student_id`, `StudentAdultLink.adult_id`, active unique student/adult/relationship partial index, `SelfCheckAttempt(student_id, completed_at)`, `MoodCheckIn(student_id, created_at)`, `SosAlert(student_id, created_at)`, `SosAlert.current_status`, and operations-related delivery/session/identity indexes.
- Potential missing composite coverage should be evaluated against actual optimized predicates before adding migration risk.
- Alembic migrations are in `backend/alembic/versions/`; schema changes must follow existing revision style.

</code_context>

<specifics>
## Specific Ideas

- Add `limit`/`offset` or `page_size`/`page` parameters to Admin users/links with server defaults and caps; keep current frontend usage safe by returning the same list body unless plan research chooses a wrapper and updates all consumers.
- Replace Admin link response hydration with a joined/batched query selecting `StudentAdultLink`, student `User`, and adult `User` aliases.
- Add a helper that returns linked students already filtered to active relationship plus SOS existence with one query for Teacher/Parent dashboards.
- Add a helper that validates a batched adult/student visibility set for list views without recording per-row denied outcomes for rows that should never be visible.
- For support overview, query latest self-check/latest SOS per linked SOS-visible student using subqueries/window functions or a deterministic fallback, then batch status events for displayed latest alerts.
- For self-check summaries, query latest summary and recent summaries separately with SQL `completed_at >= cutoff`, order, and `limit`.
- For mood summaries, include `created_at >= cutoff` in SQL and avoid loading rows that cannot affect recent counts.
- For operations dashboard, ensure recent audit/delivery queries are bounded and filter predicates are pushed into SQL; preserve sanitizer tests unchanged.
- Add a Phase 36 backend test file that seeds multiple linked/non-linked/SOS/non-SOS rows, asserts bounded results, query-count ceilings, privacy redlines, and no raw content exposure.

</specifics>

<deferred>
## Deferred Ideas

- Frontend request waterfalls, route loading UX, cache/no-store policy, skeleton strategy, bundle/build output, and dashboard perceived responsiveness belong to Phase 37.
- Final baseline-to-post-optimization comparison, release threshold decisions, evidence docs, and live public-demo/production-pilot constraints belong to Phase 38.
- New product behavior, new Admin surveillance surfaces, raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, destructive reset controls, analytics/APM, external load testing, OAuth callbacks, external notifications, counselor handoff, and multi-school tenancy remain out of scope.

</deferred>

---

*Phase: 36-backend-db-hot-path-optimization*
*Context gathered: 2026-05-27*
