---
phase: 06-aggregate-reports-privacy-hardening
artifact: research
created: 2026-05-21
---

# Phase 06 Research

## Existing implementation patterns

- Backend routers live under `backend\app\api` and are included in `backend\app\main.py` with `/api/...` prefixes.
- Admin authorization uses `_require_admin` plus `require_permission(... purpose="admin_operations")` for sensitive admin operations.
- Audit events are metadata-only through `backend\app\services\audit.py`, which rejects raw answer/chat/token field names.
- Sensitive source tables already have `is_demo`: users, links, self-check attempts, scenario attempts, SOS alerts, chat safety signals.
- Frontend admin pages are client components under `frontend\app\(authenticated)\admin`, use `apiFetch`, and store no tokens.
- Existing Vitest tests mock `fetch` and assert exact endpoint paths and privacy copy.
- Playwright webServer already runs Alembic, demo seed, FastAPI, and Next dev on local ports.

## Implementation approach

1. Add a backend report service with SQL aggregate queries only; do not load child raw answer/message/note collections.
2. Add Pydantic response schemas that contain counts, labels, suppression flags, privacy notes, and generated timestamp only.
3. Add admin route `GET /api/admin/reports/aggregate?demo_scope=all|demo|real`.
4. Add metadata-only audit on each successful report read.
5. Add frontend helper and admin reports page with scope filter and privacy/suppression copy.
6. Add backend, frontend, and E2E regressions for no raw sensitive exposure.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Small sensitive groups can identify students indirectly. | Suppress non-zero sensitive bucket counts below 3. |
| UI creates surveillance behavior. | No per-student links, no leaderboards, supportive copy only. |
| Raw fields leak via schemas. | Response schemas omit IDs/freeform text; tests seed raw strings and assert absence. |
| Demo data is confused with real records. | `demo_scope` filter and labels/counts make demo status explicit. |
| Audit metadata leaks sensitive detail. | Audit includes scope/sections/threshold only, no raw text or student identifiers. |

## Plan-checker self-review

- Goal-backward check: ADMIN-05 is satisfied by all requested aggregate domains; ADMIN-06 is satisfied by schema minimization, suppression, audit, no export/drilldown, and privacy copy.
- Dependency check: Phase 05 tables and admin auth exist; no migrations required.
- Testability check: backend and frontend can be tested with existing pytest/Vitest; Playwright can verify the admin page after demo seed.
- Safety check: no CORS/auth weakening and no external telemetry.
