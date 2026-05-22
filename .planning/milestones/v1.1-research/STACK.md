# Stack Research: BeYou v1.1

**Milestone:** v1.1 Production Hardening & Support Polish  
**Researched:** 2026-05-21  
**Confidence:** High for repository-verified stack; medium for ecosystem choices that should be rechecked before production procurement.

## Current Stack

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic and pydantic-settings
- psycopg/PostgreSQL
- pytest and ruff

The backend already has cookie sessions, role/relationship authorization, metadata-only audit events, Alembic migrations, canonical SOS workflow, in-app notifications, and nested content API support.

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- React Hook Form
- Zod
- TanStack Query
- Vitest and Playwright

The frontend already uses cookie-authenticated API calls and does not store browser tokens.

## Required Additions

### Production Readiness

No new dependency is required. Add a backend readiness service using existing FastAPI, SQLAlchemy, Alembic, and Pydantic settings.

Required checks:

- Database connectivity with a cheap query.
- Alembic current revision vs migration head.
- Production config hygiene, including secure cookies, explicit credentialed CORS origins, no placeholder secrets, demo seed disabled, and required provider secrets present only when enabled.
- Safe response shaping that masks all secret values.

Recommended endpoints:

- `/health/live` for cheap liveness.
- `/health/ready` for non-sensitive readiness status.
- `/api/admin/operations/readiness` for admin-only detailed readiness metadata.

### SOS Email Readiness

Use a backend-owned SMTP abstraction first. Do not add a frontend email SDK or expose SMTP/API credentials.

Recommended settings:

- `SOS_EMAIL_PROVIDER=disabled|local_outbox|smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- TLS/STARTTLS flags

Use Python standard library `smtplib` and `email.message` for v1.1 unless a production email provider is selected later. Add a database-backed delivery/outbox table for metadata-only tracking.

### Role and Privacy UX

No stack addition is needed. Reuse existing auth/session helpers and route metadata. Fix role-specific navigation and student privacy acknowledgement redirect in the authenticated layout and related route guards.

### Nested Admin Content Editing

No new frontend dependency is needed. Reuse React Hook Form, Zod, and `useFieldArray` for nested self-check questions, choices, thresholds, and scenario choices.

Avoid rich text or MDX editors in v1.1. Plain text is safer for school wellbeing content and easier to validate.

### Operational Visibility

No observability vendor is required for v1.1. Reuse `audit_events` and add admin operations endpoints with filtering and pagination. Keep all visibility metadata-only.

## Important Hardening Note

Replace loose or `latest` dependency declarations with pinned compatible ranges or a controlled update policy. Lockfiles help reproducibility, but production hardening should avoid broad version drift in declared dependencies.

## Do Not Add in v1.1

- Frontend email SDKs or exposed provider credentials.
- Redis/Celery unless guaranteed high-volume async delivery becomes a real requirement.
- SMS, Zalo, or push notification providers.
- Session replay or analytics tools that may capture student-sensitive content.
- Raw audit export, raw chatbot transcript browsing, or risk leaderboard features.
- OAuth/SSO.

