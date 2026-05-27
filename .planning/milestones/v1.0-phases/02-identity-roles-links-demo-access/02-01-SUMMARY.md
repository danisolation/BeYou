---
phase: 02-identity-roles-links-demo-access
plan: 01
subsystem: database
tags: [fastapi, postgresql, sqlalchemy, alembic, docker]

requires:
  - phase: 01-safety-privacy-policy-foundation
    provides: privacy, authorization, audit, and demo-data contracts
provides:
  - FastAPI backend scaffold with health endpoint
  - PostgreSQL Docker Compose service for local development
  - SQLAlchemy identity schema models for users, sessions, privacy acknowledgements, links, and audit events
  - Alembic initial migration applied successfully
affects: [phase-02-auth-apis, phase-02-admin-apis, phase-03-student-features]

tech-stack:
  added: [FastAPI, SQLAlchemy, Alembic, PostgreSQL, psycopg, pytest, ruff]
  patterns: [backend-settings, sqlachemy-models, alembic-migrations, metadata-only-audit-schema]

key-files:
  created:
    - backend/pyproject.toml
    - backend/docker-compose.yml
    - backend/app/main.py
    - backend/app/core/config.py
    - backend/app/db/models.py
    - backend/alembic/versions/20260520_0001_identity_roles_links.py
  modified:
    - .gitignore

key-decisions:
  - "Used localhost host port 15432 for BeYou PostgreSQL to avoid a pre-existing local Postgres listener on 5432."
  - "Kept production-ready cookie prefix validation in backend settings while defaulting dev/E2E to non-prefixed beyou_session."

patterns-established:
  - "Backend app factory exposes FastAPI app through app.main:create_app and app.main:app."
  - "SQLAlchemy models include is_demo across demo-sensitive identity, session, link, acknowledgement, and audit tables."
  - "Alembic reads DATABASE_URL through the same pydantic-settings configuration as the app."

requirements-completed: [AUTH-01, AUTH-02, AUTH-04, AUTH-05, AUTH-06, ADMIN-01]

duration: 31 min
completed: 2026-05-20
---

# Phase 02 Plan 01: Backend Scaffold and Identity Schema Summary

**FastAPI backend foundation with PostgreSQL, SQLAlchemy identity models, Alembic migration, and metadata-only audit schema**

## Performance

- **Duration:** 31 min
- **Started:** 2026-05-20T09:46:00Z
- **Completed:** 2026-05-20T10:17:00Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments

- Created the `backend/` FastAPI project scaffold with typed settings, health endpoint, pytest configuration, and Python dependency metadata.
- Added identity database models and initial Alembic migration for `users`, `sessions`, `privacy_acknowledgements`, `student_adult_links`, and `audit_events`.
- Applied the migration against a local PostgreSQL Compose service and verified the schema model tests.

## Task Commits

1. **Task 1: Scaffold FastAPI backend, config, and PostgreSQL Compose service** - `2c584f6` (chore)
2. **Task 2: Define SQLAlchemy identity models and initial Alembic migration** - `9c0d689` (feat)
3. **Task 3: Apply database migration with a blocking schema command** - `95aa97d` (fix)

## Files Created/Modified

- `backend/pyproject.toml` - Python project metadata and backend dependencies.
- `backend/docker-compose.yml` - Local PostgreSQL service for BeYou development on host port `15432`.
- `backend/.env.example` - Backend environment template including database URL and session cookie settings.
- `backend/app/main.py` - FastAPI app factory and `/health` endpoint.
- `backend/app/core/config.py` - Pydantic settings and `__Host-` cookie prefix guard.
- `backend/app/db/base.py` - SQLAlchemy declarative base.
- `backend/app/db/session.py` - SQLAlchemy engine/session factory.
- `backend/app/db/models.py` - Identity, session, privacy acknowledgement, relationship link, and audit event models.
- `backend/alembic.ini` and `backend/alembic/env.py` - Alembic migration configuration.
- `backend/alembic/versions/20260520_0001_identity_roles_links.py` - Initial identity schema migration.
- `backend/tests/test_backend_scaffold.py` - Health endpoint scaffold smoke test.
- `backend/tests/test_schema_models.py` - Schema and enum contract tests.

## Decisions Made

- Used host port `15432` instead of `5432` because Windows already had a local PostgreSQL listener on IPv4 port `5432`; Compose still exposes container port `5432`.
- Added `.gitignore` for Python, Node, and build artifacts after pytest/pip generated cache and egg-info files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided local PostgreSQL port conflict**
- **Found during:** Task 3 (Apply database migration)
- **Issue:** `python -m alembic upgrade head` connected to an existing host PostgreSQL on `127.0.0.1:5432`, which did not have the `beyou` role.
- **Fix:** Changed BeYou Compose host port and default `DATABASE_URL` from `5432` to `15432`.
- **Files modified:** `backend/docker-compose.yml`, `backend/.env.example`, `backend/app/core/config.py`, `backend/alembic.ini`
- **Verification:** `docker compose up -d postgres; python -m alembic upgrade head; python -m pytest tests/test_backend_scaffold.py tests/test_schema_models.py -q`
- **Committed in:** `95aa97d`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The change preserves the planned PostgreSQL service and migration behavior while avoiding a local environment conflict.

## Issues Encountered

- Initial migration attempt hit a pre-existing local PostgreSQL listener on port `5432`; resolved by switching BeYou dev host port to `15432`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Backend schema and migration foundation are ready for Plan 02-02 auth/session/privacy APIs.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
