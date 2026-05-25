# Architecture Research: v1.5 Production Pilot Readiness & Identity

**Project:** Peerlight AI
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Researched:** 2026-05-25
**Confidence:** High for repository integration points.

## Integration Summary

v1.5 should extend the existing architecture rather than replace it:

- Backend owns authentication, authorization, sessions, audit, readiness, and sensitive data access.
- Frontend uses cookie-authenticated requests with `credentials: "include"`.
- No browser token storage.
- Role/relationship/SOS authorization remains backend-owned.
- Operations remain metadata-only.

The primary architectural change is to make runtime intent explicit: public demo and production pilot become validated modes with different seed, readiness, identity, and smoke expectations.

## Existing Surfaces to Modify

| Area | Existing surface | v1.5 change |
|---|---|---|
| Runtime config | `backend\app\core\config.py` | Add explicit runtime mode and mode-specific validation. |
| Readiness | `backend\app\services\readiness.py`, schemas | Production pilot readiness passes only with demo seed disabled and safe required config. |
| Admin operations | admin operations API/service/schema/UI | Add launch checklist, runtime mode, identity readiness, deployment drift, safe rollback/handoff metadata. |
| Demo seeding | `backend\app\seeds\demo_seed.py`, `render.yaml` | Seed only in demo/dev; production pilot boot should not run seed command. |
| Auth contracts | `backend\app\api\auth.py`, schemas, sessions, models | Add provider-ready identity metadata while keeping password login and session cookie flow. |
| Frontend API/auth | `frontend\lib\api.ts`, `frontend\lib\auth.ts` | Keep `credentials: include`; add runtime/auth options if needed. |
| Login/demo UX | login page, demo role entry, demo accounts lib | Hide/disable one-click demo entry in production pilot mode. |
| Smoke | `frontend\scripts\production-smoke.mjs` | Split demo smoke from production pilot smoke. |
| Deploy config | `render.yaml`, `frontend\vercel.json`, env examples | Validate root dirs, origins, cookie flags, seed state, API URL, and mode. |

## Component Model

```text
Next.js Frontend
  Public landing/login
    Demo entry only when demo mode is enabled
    Email/password form remains
  Authenticated role shells
    Cookie-authenticated API calls only
  Admin operations
    Readiness, runtime mode, deployment drift, identity readiness, launch checklist

FastAPI Backend
  Config layer
    Runtime mode, cookie/CORS/origin, seed, identity flags
  Auth layer
    Password provider now; future OAuth/SSO provider contracts
  Authorization layer
    Existing role/relationship/SOS checks remain source of truth
  Readiness layer
    Public minimal status; admin metadata-only detail
  Pilot operations layer
    Launch checklist, smoke evidence, rollback/handoff metadata
  PostgreSQL
    Existing users/sessions/audit plus identity_accounts or equivalent mapping
```

## Data Flow Changes

### Production Pilot Startup

```text
Render starts backend
  -> alembic upgrade head
  -> no demo seed in production pilot profile
  -> FastAPI boots
  -> /health/live ok
  -> /health/ready checks DB, migrations, cookie security, exact origins, seed disabled, identity config, launch checklist
  -> public response remains minimal
  -> admin operations exposes safe metadata-only details
```

### Auth / Identity Contract

```text
Password login or future SSO callback
  -> backend resolves canonical user
  -> account status and provisioning checked
  -> backend creates session row
  -> backend sets HttpOnly Secure SameSite=None cookie in production
  -> frontend receives user/profile metadata only
  -> existing authorization gates all protected APIs
```

### Admin Pilot Operations

```text
Admin opens operations
  -> /api/admin/operations/dashboard
  -> require admin role and existing permissions
  -> aggregate readiness, runtime mode, seed status, deploy drift, identity readiness, launch checklist, audit buckets
  -> response excludes raw notes, emails, secrets, identifiers, risk drilldowns
```

## Build Order

1. Runtime mode and readiness foundation.
2. Deployment guardrails and demo/pilot smoke split.
3. Demo seed and production data safety.
4. Identity contracts and provider-ready metadata.
5. School pilot operations dashboard/checklist.
6. Cross-role privacy/security regression and milestone validation.

## Privacy Preservation Checklist

- Existing cookie-session model remains.
- No OAuth/access/id tokens stored in browser.
- SSO claims identify users but never authorize adult access by school/class alone.
- Adult visibility remains active relationship plus student-sent SOS.
- Admin operations stays metadata-only.
- Public readiness stays minimal.
- Smoke/logs do not print cookies, secrets, private notes, transcripts, emails, or raw reason text.

