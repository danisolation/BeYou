# Phase 7: Production Readiness & Safe Operations Foundation - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 7 establishes backend production-readiness foundations only: liveness vs readiness endpoints, admin-only detailed readiness checks, safe configuration/database/migration/cookie/origin/secret hygiene reporting, and tests that prove sensitive values are not exposed. It does not add SOS email delivery, the full operations dashboard, role-nav polish, or nested content editors; those remain later v1.1 phases.

</domain>

<decisions>
## Implementation Decisions

### Readiness Surface
- Keep existing `/health` behavior for backwards compatibility.
- Add `/health/live` as a cheap liveness endpoint with no database/config detail.
- Add `/health/ready` as a public non-sensitive readiness endpoint that only returns overall status.
- Add `/api/admin/operations/readiness` for detailed readiness checks requiring an authenticated admin.

### Check Semantics
- Use `pass`, `warn`, and `fail` check statuses.
- Use overall `ready`, `degraded`, and `not_ready` states where any failure makes the system not ready and warnings make it degraded.
- In development/test, dev-only values should be warnings unless they would break operation; in production, unsafe cookie/CORS/demo/secret/provider values should fail.
- Include remediation hints, but never raw secret, database URL, or credential values.

### Integration Scope
- Reuse existing FastAPI, SQLAlchemy, Alembic, Pydantic settings, and admin authorization patterns.
- Keep liveness cheap; do not overload `/health`.
- Make Alembic drift checking robust but safe when the database or migration metadata is unavailable.
- Avoid adding dependencies for Phase 7.

### the agent's Discretion
- Choose exact schema names and service function boundaries to fit current backend conventions.
- Decide whether public readiness returns HTTP 503 on `not_ready`; prefer standard readiness semantics.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/core/config.py` defines `Settings` and frontend origin validation.
- `backend/app/db/session.py` exposes SQLAlchemy `engine`, `SessionLocal`, and `get_db`.
- `backend/app/api/admin_users.py` has the current admin gate pattern.
- `backend/app/main.py` defines the FastAPI app, CORS middleware, and `/health`.

### Established Patterns
- API routers are small and delegate to services.
- Pydantic response models live under `backend/app/schemas`.
- Admin endpoints use cookie sessions through `get_current_user`.
- Tests use `fastapi.testclient.TestClient` and repository-local pytest.

### Integration Points
- Add `app.services.readiness` and `app.schemas.readiness`.
- Add `app.api.admin_operations` and include it in `create_app`.
- Extend config with safe readiness/email-placeholder fields only where needed for checks.
- Add Phase 7 backend tests for public readiness, admin auth, unsafe config detection, migration/DB reporting, and secret masking.

</code_context>

<specifics>
## Specific Ideas

Use Vietnamese-safe user-facing text where exposed to admin/operator users, but internal status keys should stay stable English tokens for tests and API consumers.

</specifics>

<deferred>
## Deferred Ideas

- SOS email delivery/outbox and provider attempts are Phase 8.
- Full admin operations dashboard and audit/delivery metadata browsing are Phase 11.
- Frontend role/privacy polish is Phase 9.

</deferred>

