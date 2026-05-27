# Phase 36: Backend & DB Hot Path Optimization - Research

**Researched:** 2026-05-27  
**Domain:** FastAPI + SQLAlchemy 2.x backend/database hot-path optimization  
**Confidence:** HIGH for codebase findings; MEDIUM for implementation patterns that need planner/test confirmation

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Admin Users and Links
- **D-01:** Make `/api/admin/users` bounded or paginated at the backend service/API layer while preserving the existing list response shape unless a response wrapper is proven necessary by tests. Default bounds should protect the endpoint without forcing frontend behavior changes in Phase 36.
- **D-02:** Make `/api/admin/links` bounded or paginated and remove N+1 user hydration. Link responses should be built from a batched/joined query that returns link, student, and adult data together.
- **D-03:** Preserve Admin authorization through `_require_admin`, `require_role(UserRole.ADMIN)`, and `require_permission(... purpose="admin_operations")`; do not introduce new Admin capabilities or unsafe management controls.
- **D-04:** Preserve existing Admin response fields and password/secret redlines. Optimizations should not add raw exports, raw identifiers beyond existing API contracts, risk rankings, or sensitive student content.

#### Teacher/Parent Linked-Student and SOS Visibility
- **D-05:** Batch SOS-signal and active-link checks for `/api/teacher/students` and `/api/parent/students` instead of calling `has_student_sos_signal` and `require_permission` per row when the same safety result can be proven from the same SQL predicates.
- **D-06:** Keep SOS-only adult visibility strict: adults only receive active linked students who have at least one SOS signal, and Teacher/Parent role-specific relationship types remain separate.
- **D-07:** If helper functions are added to authorization or services, they must reuse the same predicates as `has_active_student_link`, `has_student_sos_signal`, and `require_permission`, and tests must prove non-SOS and inactive-link students remain hidden.
- **D-08:** Keep existing bounded linked-student caps conservative. If a limit is exposed, clamp it server-side and preserve stable ordering.

#### Adult Support Overview and Summaries
- **D-09:** Optimize `get_support_overview` by batching linked students, SOS-signal eligibility, latest self-check, latest SOS, open SOS counts, and alert event loading where practical. Preserve metadata-only audit events for summary/SOS reads.
- **D-10:** Push recent self-check filtering, ordering, and limits into SQL in `get_adult_self_check_summaries`; do not load an unbounded attempt history and slice in Python.
- **D-11:** Push mood-summary cutoff/limit logic into SQL in adult support summary paths where practical, while keeping private notes hidden unless explicitly student-shared through existing share logic.
- **D-12:** Preserve controlled reason-gate behavior in `get_adult_support_summary`: policy lookup, missing/invalid reason responses, reason audit, authorization-denied audit, and accepted-reason audit semantics must remain intact.

#### Admin Operations Dashboard
- **D-13:** Optimize expensive `build_operations_dashboard` sections internally, not by weakening metadata-only output. Existing sanitizers such as `_safe_metadata`, `_safe_operation_text`, safe keys, and forbidden metadata key coverage remain mandatory.
- **D-14:** Keep operations query parameters bounded (`limit` clamped by API), push filters into SQL, and avoid loading raw/broad datasets for recent audit and delivery sections.
- **D-15:** Operations output must remain aggregate/status/checklist metadata only. Do not add raw contact details, raw origins, cookie names/values, emails, provider claims, request/response bodies, private notes, self-check/scenario answers, transcript text, free-text reasons, export URLs, risk leaderboards, per-student drilldowns, or destructive reset controls.

#### Indexes, Migrations, and Schema Drift
- **D-16:** Add indexes only when directly tied to Phase 36 query predicates and evidence: e.g., active adult/student relationship lookups, SOS student/status/created queries, audit filter/order predicates, or operations aggregate predicates.
- **D-17:** Any index change must update both `backend/app/db/models.py` metadata and an Alembic migration under `backend/alembic/versions/`, with a downgrade path.
- **D-18:** Phase 36 verification must include backend regressions, backend ruff, an Alembic/schema drift check when available, and privacy redline tests for adult/admin outputs.

### the agent's Discretion
- Choose exact pagination parameter names and default/max limits, prioritizing backwards compatibility for current frontend count usage.
- Choose whether to implement shared backend helpers under `app.services`, `app.core.authorization`, or route-local functions based on existing patterns and testability.
- Choose whether indexes are necessary after query refactors; do not add speculative indexes if existing indexes already cover the optimized predicates.
- Choose exact query-count or boundedness regression assertions that are deterministic in the local TestClient/SQLite/PostgreSQL-compatible test setup.

### Deferred Ideas (OUT OF SCOPE)
- Frontend request waterfalls, route loading UX, cache/no-store policy, skeleton strategy, bundle/build output, and dashboard perceived responsiveness belong to Phase 37.
- Final baseline-to-post-optimization comparison, release threshold decisions, evidence docs, and live public-demo/production-pilot constraints belong to Phase 38.
- New product behavior, new Admin surveillance surfaces, raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, destructive reset controls, analytics/APM, external load testing, OAuth callbacks, external notifications, counselor handoff, and multi-school tenancy remain out of scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| DBPERF-01 | Admin user and student-adult link list paths are bounded or paginated and avoid N+1 user/link hydration. | Admin list currently returns all users; links currently hydrate student/adult with `db.get()` per row. [VERIFIED: backend/app/api/admin_users.py:45-51; backend/app/services/users.py:43-44; backend/app/api/admin_links.py:19-50] |
| DBPERF-02 | Teacher and Parent linked-student/SOS visibility paths batch relationship, user, and SOS-signal checks. | Teacher/Parent routes already join active links to students and cap 200, but call `has_student_sos_signal` and `require_permission` in the loop. [VERIFIED: backend/app/api/teacher.py:22-56; backend/app/api/parent.py:22-56] |
| DBPERF-03 | Adult summary/history/dashboard endpoints push filtering, ordering, limits into SQL. | Self-check summaries load all attempts and then filter/slice in Python; mood summary limits before applying cutoff in Python. [VERIFIED: backend/app/services/adult_summaries.py:231-244,334-345] |
| DBPERF-04 | Admin operations expensive dashboard sections optimized/bounded while preserving metadata-only serialization and sanitizer redlines. | Dashboard already clamps API `limit` 1..100 and uses sanitizers; several aggregate sections run separate counts/buckets. [VERIFIED: backend/app/api/admin_operations.py:44-72; backend/app/services/admin_operations.py:82-129,272-287,325-363,1407-1459] |
| DBPERF-05 | New indexes/migrations tied to observed predicates, metadata aligned, drift/privacy checks pass. | Existing metadata includes indexes for many Phase 36 predicates; Alembic is configured to compare against `Base.metadata`. [VERIFIED: backend/app/db/models.py:213-239,546-572,661-693,696-714; backend/alembic/env.py:15-36] |

</phase_requirements>

## Summary

Phase 36 should be planned as backend-only query shaping, batching, and boundedness work across four hot-path clusters: Admin users/links, adult linked-student visibility, adult support overview/summaries, and Admin operations dashboard. [VERIFIED: .planning/phases/36-backend-db-hot-path-optimization/36-CONTEXT.md:8-43]

Primary recommendation: keep existing response shapes where possible, add conservative server-side default/max bounds, batch SQL predicates with existing authorization semantics, and add deterministic query-count/privacy/schema regression tests before considering indexes. [VERIFIED: CONTEXT.md decisions D-01..D-18]

Do not treat performance as permission to weaken privacy. Adult visibility remains active-link + SOS-signal only, support summaries keep reason gates, Admin operations remain metadata-only, and evidence must remain aggregate-only. [VERIFIED: .planning/REQUIREMENTS.md:31-37,47-53; 33-PERFORMANCE-BASELINE.md:85-105]

## Project Constraints from `copilot-instructions.md`

- Communicate in Vietnamese. [VERIFIED: copilot-instructions.md:12-17]
- Backend stack is Python/FastAPI with PostgreSQL, SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, metadata-only audit, readiness checks, and demo-data separation. [VERIFIED: copilot-instructions.md:26-32]
- No browser token storage; frontend auth remains backend-owned HttpOnly cookie based. [VERIFIED: copilot-instructions.md:28-29,172-175]
- Teacher/Parent visibility is SOS-only for linked students who have sent SOS. [VERIFIED: copilot-instructions.md:8,31]
- Admin operations must stay metadata-only; no raw exports, risk leaderboards, per-student drilldowns. [VERIFIED: copilot-instructions.md:34-43,160-167]
- Do not edit repo files outside GSD workflow unless explicitly bypassed. [VERIFIED: copilot-instructions.md:184-194]
- Project skills: none found. [VERIFIED: copilot-instructions.md:178-182; powershell skill-dir probe returned empty]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---:|---|---|
| Python | 3.12.7 | Backend runtime | Project requires Python backend. [VERIFIED: copilot-instructions.md:34-43; local `python --version`] |
| FastAPI | 0.136.1 | API routing/dependency injection | Existing routers use FastAPI `APIRouter`, `Depends`, `Query`. [VERIFIED: local importlib.metadata; backend/app/api/admin_operations.py:1-72] |
| SQLAlchemy | 2.0.49 | ORM/query construction | Existing code uses SQLAlchemy 2-style `select()`, `func.count()`, joins, `.limit()`. [VERIFIED: local importlib.metadata; codebase grep via viewed files] |
| Alembic | 1.18.4 | DB migrations/schema drift | Alembic env targets `Base.metadata`. [VERIFIED: local importlib.metadata; backend/alembic/env.py:15-36] |
| Pydantic | 2.13.4 | Response/request schemas | Schemas are Pydantic `BaseModel` with `field_validator`. [VERIFIED: local importlib.metadata; backend/app/schemas/admin.py:1-127] |
| pytest | 9.0.3 | Backend regression tests | Existing backend tests use pytest fixtures/TestClient. [VERIFIED: local importlib.metadata; backend/tests/test_phase33_performance_baseline.py:1-387] |
| Ruff | 0.15.13 | Backend lint | Project uses ruff in `pyproject.toml`. [VERIFIED: local importlib.metadata; backend/pyproject.toml:23-40] |

### Supporting

| Library/Tool | Version | Purpose | When to Use |
|---|---:|---|---|
| psycopg | 3.3.4 | PostgreSQL DB driver | Required by configured `postgresql+psycopg` URLs. [VERIFIED: local importlib.metadata; backend/app/core/config.py:42-45] |
| SQLAlchemy event listener | built-in | Query-count tests | Phase 33 already uses `before_cursor_execute` query counting. [VERIFIED: backend/tests/test_phase33_performance_baseline.py:256-270] |
| Alembic CLI | 1.18.4 | Schema drift check | Use if indexes/migrations change. [VERIFIED: local `alembic --version`; backend/alembic/env.py:15-36] |

**Installation:** no new runtime library is needed for Phase 36. [VERIFIED: backend/pyproject.toml:10-28]

## Exact Hot Paths and Current Anti-Patterns

| Area | Current Function/Route | Anti-pattern | Planning Fix |
|---|---|---|---|
| Admin users | `get_admin_users()` -> `list_users()` | Unbounded `select(User).order_by(...).all()`. [VERIFIED: backend/app/services/users.py:43-44] | Add `limit` and optional `offset`/cursor query params at route/service; clamp server-side; preserve list body unless tests force wrapper. |
| Admin links | `get_admin_links()` -> `list_links()` -> `_link_response()` | Unbounded links plus N+1 `db.get(User, link.student_id/adult_id)`. [VERIFIED: backend/app/api/admin_links.py:19-50; backend/app/services/links.py:20-21] | Use one joined query selecting link + student user + adult user aliases; add bounds. |
| Teacher students | `get_teacher_students()` | Per-row `has_student_sos_signal()` and `require_permission()`. [VERIFIED: backend/app/api/teacher.py:33-43] | Query active teacher links joined to students and SOS existence in SQL; preserve same predicates. |
| Parent students | `get_parent_students()` | Same as teacher, parent relationship. [VERIFIED: backend/app/api/parent.py:33-43] | Same helper, relationship-specific. |
| Support overview | `get_support_overview()` | Loops linked students, then per visible student loads latest self-check, latest SOS, alert events, open SOS count. [VERIFIED: backend/app/services/sos.py:535-599] | Batch visible students, latest summaries/alerts, open counts, and status events for latest alerts. |
| Adult self-check summaries | `get_adult_self_check_summaries()` | Loads all attempts, filters recent cutoff and slices in Python. [VERIFIED: backend/app/services/adult_summaries.py:231-244] | Query latest attempt and recent attempts separately with SQL `where completed_at >= cutoff`, order, limit. |
| Adult mood summary | `_mood_summary()` | Limits rows first then applies cutoff in Python, so counts can be inaccurate if latest 5 include old rows. [VERIFIED: backend/app/services/adult_summaries.py:334-345] | Query latest row separately; query recent rows/counts with SQL cutoff. |
| Admin operations | `build_operations_dashboard()` | Many separate aggregate queries; audit/delivery are bounded, but bucket/count sections can be reviewed for predicate/index coverage. [VERIFIED: backend/app/services/admin_operations.py:272-287,325-391,394-449,621-657,1125-1235,1407-1459] | Keep metadata-only schemas; optimize by reusing counts where safe, ensuring limits and filters stay SQL-side. |

## Architecture Patterns

### Recommended Project Structure

```text
backend/app/
├── api/
│   ├── admin_users.py        # route-level auth + query params
│   ├── admin_links.py        # route-level auth + response mapping
│   ├── teacher.py            # role-specific wrapper around shared helper
│   └── parent.py             # role-specific wrapper around shared helper
├── services/
│   ├── users.py              # bounded list_users
│   ├── links.py              # bounded joined list_links
│   ├── sos.py                # batched support overview helpers
│   ├── adult_summaries.py    # SQL-side cutoff/limit
│   └── admin_operations.py   # bounded aggregate metadata
├── core/
│   └── authorization.py      # optional shared predicate helpers only
└── db/
    └── models.py             # index metadata if evidence requires
```

### Pattern 1: Clamp Bounds at API Boundary

Use `Query(default=..., ge=..., le=...)` like Admin operations already does for `limit`. [VERIFIED: backend/app/api/admin_operations.py:44-72]

Recommended defaults:
- Admin users: `limit=100`, `offset=0`, max `200`. [ASSUMED]
- Admin links: `limit=100`, `offset=0`, max `200`. [ASSUMED]
- Linked-student adult endpoints: keep cap `200` unless exposing params. [VERIFIED: teacher.py:30; parent.py:30; CONTEXT.md D-08]

### Pattern 2: Batch Adult Visibility with Equivalent Predicates

The equivalent visibility predicate is:
- adult active/authenticated by route session,
- role is teacher or parent,
- active `StudentAdultLink` matching `student_id`, `adult_id`, `relationship_type`, `status='active'`,
- at least one `SosAlert` for the student. [VERIFIED: backend/app/core/authorization.py:156-170]

Plan a helper such as:

```python
# Source: codebase pattern + SQLAlchemy select usage [VERIFIED: teacher.py, parent.py, authorization.py]
def list_sos_visible_linked_students(db, adult, relationship_type, limit):
    ...
```

This helper should be tested against `has_active_student_link`, `has_student_sos_signal`, and `require_permission` semantics. [VERIFIED: CONTEXT.md D-07]

### Pattern 3: Separate "latest" and "recent bounded" Queries

For adult self-check summaries:
- latest query: order by `completed_at desc, id desc`, limit 1.
- recent query: `completed_at >= cutoff`, same ordering, limit `RECENT_SUMMARY_LIMIT`. [VERIFIED: current constants and ordering in adult_summaries.py:36-37,231-244]

For mood summary:
- latest query: order by `created_at desc, id desc`, limit 1.
- recent query: `created_at >= cutoff`, limit or aggregate counts in SQL. [VERIFIED: adult_summaries.py:334-345]

### Pattern 4: Preserve Audit Events Even When Reads Are Batched

`get_support_overview()` currently records `sensitive_resource_read` audit events for summary and SOS reads. [VERIFIED: backend/app/services/sos.py:558-585]  
Plan tasks must retain equivalent metadata-only audit records; batching data retrieval must not remove required audit semantics. [VERIFIED: CONTEXT.md D-09]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Pagination bounds | custom ad hoc parsing | FastAPI `Query(ge=..., le=...)` | Existing code already clamps `limit` this way. [VERIFIED: admin_operations.py:44-72] |
| Query counting | custom timers/logs with payload dumps | SQLAlchemy `before_cursor_execute` event pattern in tests | Existing Phase 33 pattern is aggregate-only and in-memory. [VERIFIED: test_phase33_performance_baseline.py:256-296] |
| Authorization shortcuts | new bypass flags | Same SQL predicates as `has_active_student_link`, `has_student_sos_signal`, `require_permission` | Required by D-07 and safety boundaries. [VERIFIED: CONTEXT.md:23-28; authorization.py:44-197] |
| Admin output sanitization | new serializer | Existing `_safe_metadata`, `_safe_operation_text`, forbidden key sets | Existing operations sanitizers encode redlines. [VERIFIED: admin_operations.py:82-129,290-322] |
| Schema drift detection | manual eyeballing only | Alembic metadata + migration + schema tests | Required by D-17/D-18. [VERIFIED: CONTEXT.md:40-43; alembic/env.py:15-36] |

## Index and Migration Decision Points

Existing useful indexes:
- `users.email` unique indexed. [VERIFIED: models.py:130-145]
- `student_adult_links.student_id`, `adult_id` single-column indexes via `mapped_column(index=True)`, plus partial unique index on `(student_id, adult_id, relationship_type)` for active links. [VERIFIED: models.py:213-239]
- `self_check_attempts(student_id, completed_at)`. [VERIFIED: models.py:546-572]
- `mood_check_ins(student_id, created_at)`. [VERIFIED: models.py:293-315]
- `sos_alerts(student_id, created_at)` and `current_status`. [VERIFIED: models.py:661-693]
- `sos_status_events(alert_id, created_at)`. [VERIFIED: models.py:696-714]
- `sos_notification_deliveries(alert_id, created_at)`, `status`. [VERIFIED: models.py:717-745]

Likely index candidates only if query-count/planner evidence shows need:
- `student_adult_links(adult_id, relationship_type, status, student_id)` for adult list paths. [ASSUMED]
- `sos_alerts(student_id, current_status, created_at)` for open count/latest filtered queries. [ASSUMED]
- `audit_events(timestamp, actor_role, action, resource_type, status)` or narrower combinations if Admin operations filtering is slow. [ASSUMED]
- `sos_notification_deliveries(created_at)` if recent delivery ordering becomes costly. [ASSUMED]

Do not add speculative indexes if refactors pass query-count and existing indexes cover predicates. [VERIFIED: CONTEXT.md D-16]

## Common Pitfalls

1. **Changing list response shape accidentally**  
   Existing Admin users/links response models are `list[...]`. [VERIFIED: admin_users.py:45; admin_links.py:44]  
   Preserve list response unless tests require a wrapper. [VERIFIED: CONTEXT.md D-01]

2. **Batching authorization but dropping SOS-only visibility**  
   `require_permission(... support_not_surveillance ...)` requires both active link and SOS signal. [VERIFIED: authorization.py:156-170]  
   Tests must include active link without SOS, inactive/revoked link with SOS, wrong relationship type, and outsider adult. [VERIFIED: CONTEXT.md D-06/D-07]

3. **Optimizing support overview but losing audit events**  
   Current support overview records metadata-only audit reads for latest summary/SOS. [VERIFIED: sos.py:558-585]  
   Keep equivalent audits after batch retrieval. [VERIFIED: CONTEXT.md D-09]

4. **SQL limit before cutoff causing wrong recent mood counts**  
   `_mood_summary()` currently limits to 5 before applying 14-day cutoff. [VERIFIED: adult_summaries.py:334-345]  
   Plan should push cutoff into SQL for counts and recent labels. [VERIFIED: CONTEXT.md D-11]

5. **Admin operations sanitizer regression**  
   Operations forbidden metadata keys include emails, raw IDs, notes, transcripts, provider claims, tokens, exports, risk leaderboards. [VERIFIED: admin_operations.py:82-129]  
   Keep existing privacy regression tests and add Phase 36-specific redline checks. [VERIFIED: tests/test_phase25_admin_policy_operations.py; tests/test_phase31_school_pilot_operations.py; tests/test_phase32_release_gates.py]

## Recommended Tests

| Requirement | Test File | Assertions |
|---|---|---|
| DBPERF-01 | Add `backend/tests/test_phase36_backend_db_hot_paths.py` | `/api/admin/users` and `/api/admin/links` bounded by default/max; admin auth unchanged; link route query count does not grow per link. |
| DBPERF-02 | Same | Teacher/Parent students hide non-SOS, revoked-link, wrong-relationship, outsider cases; query count bounded for many students. |
| DBPERF-03 | Same + existing adult summary tests | Self-check recent query returns latest + 5 recent after cutoff; no raw answers/private notes; audit exists. |
| DBPERF-04 | Same + existing operations tests | `/api/admin/operations/dashboard` still clamps `limit`; no forbidden markers; audit/delivery recent sections bounded. |
| DBPERF-05 | `test_schema_models.py` + Alembic check | If indexes added, model metadata and migration align; downgrade exists. |

Run commands:
```powershell
cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_phase36_backend_db_hot_paths.py -q
cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_admin_users_links.py tests/test_phase4_sos_backend.py tests/test_phase14_adult_support_summaries.py tests/test_phase24_reason_access.py tests/test_phase25_admin_policy_operations.py tests/test_phase31_school_pilot_operations.py tests/test_phase32_release_gates.py tests/test_schema_models.py -q
cd backend; .\.venv\Scripts\ruff.exe check .
cd backend; .\.venv\Scripts\alembic.exe check
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Python | backend tests/scripts | yes | 3.12.7 | - |
| backend venv Python | backend pytest/ruff/alembic | yes | 3.12.7 | system Python if dependencies installed |
| pytest | regression tests | yes | 9.0.3 | install dev deps |
| ruff | lint | yes | 0.15.13 | install dev deps |
| Alembic | migration/schema drift | yes | 1.18.4 | no safe fallback if indexes change |
| SQLAlchemy | ORM | yes | 2.0.49 | - |
| psycopg | PostgreSQL driver | yes | 3.3.4 | - |
| git | version control | yes | 2.52.0.windows.1 | - |
| curl | health checks | yes | 8.13.0 | PowerShell web cmdlets |

`workflow.nyquist_validation` is explicitly `false`, so the formal Validation Architecture section is omitted. [VERIFIED: .planning/config.json:15-20]

## Security Domain

| ASVS Category | Applies | Standard Control |
|---|---:|---|
| V2 Authentication | yes | Preserve `get_current_user`, cookie session, role checks. [VERIFIED: codebase routes use `Depends(get_current_user)`] |
| V3 Session Management | yes | No browser token storage; backend HttpOnly cookie session contract remains. [VERIFIED: copilot-instructions.md:28-29,172-175] |
| V4 Access Control | yes | Preserve `require_role`, `_require_admin`, `require_permission`, active link + SOS predicates. [VERIFIED: authorization.py:21-197] |
| V5 Input Validation | yes | Use FastAPI `Query` constraints for new bounds. [VERIFIED: admin_operations.py:44-72] |
| V6 Cryptography | no direct Phase 36 changes | Do not change password/session hashing. [VERIFIED: Phase scope in CONTEXT.md:8-10] |

Threat patterns:
- Broken object-level authorization through batched queries: mitigate by proving equivalent predicates with outsider/wrong-role/revoked/no-SOS tests. [VERIFIED: authorization.py:156-197]
- Sensitive data leakage through operations metadata: mitigate by preserving `_safe_metadata` and redline tests. [VERIFIED: admin_operations.py:82-129,290-322]
- Excessive data exposure from unbounded lists: mitigate with server clamped bounds. [VERIFIED: DBPERF-01; CONTEXT.md D-01/D-02]

## Sources

### Primary
- `.planning/phases/36-backend-db-hot-path-optimization/36-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md`
- `.planning/phases/35-role-dashboard-consistency-pass/35-VERIFICATION.md`
- `copilot-instructions.md`
- `backend/app/api/*.py`, `backend/app/services/*.py`, `backend/app/core/authorization.py`, `backend/app/db/models.py`
- backend tests listed above

### Secondary
- Local package/version probes via `importlib.metadata`, `python --version`, `pytest --version`, `ruff --version`, `alembic --version`.

### Assumptions Log

| # | Claim | Risk if Wrong |
|---|---|---|
| A1 | Suggested default Admin bounds `limit=100`, max `200`. | Planner may choose different values after frontend count usage review. |
| A2 | SQLAlchemy `aliased(User)` is the preferred way to join student/adult users in one query. | Planner may use Core aliases or explicit select columns instead. |
| A3 | Candidate composite indexes may help listed predicates. | Planner must only add after observed need; speculative indexes violate D-16. |

## Open Questions

1. Should Admin list endpoints expose `offset` now or only clamp default `limit` silently?
   - Recommendation: add optional `limit`/`offset` with list body preserved.

2. Should Phase 36 include index migrations?
   - Recommendation: refactor queries/tests first; add indexes only if query predicates remain uncovered.

3. What deterministic query-count ceilings should tests assert?
   - Recommendation: assert relative boundedness using many seeded rows and "does not grow linearly," not production latency thresholds.

## RESEARCH COMPLETE

**Phase:** 36 - Backend & DB Hot Path Optimization  
**Confidence:** HIGH for current anti-pattern inventory and safety constraints; MEDIUM for exact bounds/index choices.

### Key Findings
- Admin users/links are the clearest DBPERF-01 targets: users are unbounded; links are unbounded plus N+1 user hydration.
- Teacher/Parent student lists and support overview must batch without weakening active-link + SOS-only visibility.
- Adult self-check and mood summaries have concrete Python-side filtering/slicing to move into SQL.
- Admin operations already has strong sanitizers and bounded API limit; optimize internally without changing metadata-only schemas.
- Existing indexes cover many predicates; add migrations only after evidence.

### Ready for Planning

Planner can create executable PLAN.md tasks from the route/function map, regression matrix, and schema/index decision points above.
