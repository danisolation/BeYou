# Technology Stack Research: v1.5 Production Pilot Readiness & Identity

**Project:** Peerlight AI
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Researched:** 2026-05-25
**Confidence:** High for repo-specific findings; medium for future identity provider recommendations.

## Executive Recommendation

Do not replace the current FastAPI, PostgreSQL, SQLAlchemy/Alembic, cookie-session, and Next.js stack. v1.5 should harden the existing stack with explicit runtime modes, reproducible dependency/config validation, deployment guardrails, demo/production separation, and OAuth/SSO-ready identity contracts.

The main stack gap is configuration ambiguity: public demo and real school pilot currently share too many deployment assumptions. Identity work should prepare contracts and data models now, while deferring a full OAuth/OIDC implementation until a pilot school chooses an identity provider.

## Current Stack Observed

| Area | Current state |
|---|---|
| Backend | FastAPI, Python 3.12, PostgreSQL, SQLAlchemy, Alembic, pydantic-settings |
| Auth | Email/password, Argon2 hashes, DB-backed opaque cookie sessions |
| Frontend | Next.js 16, React 19, TypeScript, cookie-authenticated API calls |
| Deploy | Vercel frontend, Render backend, credentialed CORS, Secure/SameSite=None production cookie |
| Verification | backend pytest/ruff, frontend Vitest/lint/build, production smoke |

## Recommended Stack Changes

| Recommendation | Integration points | Why |
|---|---|---|
| Add explicit `RUNTIME_MODE` (`local_demo`, `public_demo`, `production_pilot`) | `backend\app\core\config.py`, readiness, Render env | `ENVIRONMENT=production` is too broad; public demo and production pilot need different safety gates. |
| Make demo seed subordinate to runtime mode | `backend\app\seeds\demo_seed.py`, `render.yaml`, readiness | Production pilot should fail or no-op if demo seeding is enabled. |
| Split demo and pilot smoke profiles | `frontend\scripts\production-smoke.mjs`, package scripts | Demo smoke can require seeded roles; pilot smoke must not depend on demo users. |
| Add deployment guard script | `render.yaml`, `frontend\vercel.json`, env examples, smoke URLs | Prevent Vercel root-dir, Render start command, CORS, cookie, and API URL drift. |
| Add frontend env validation with existing `zod` | `frontend\lib\api.ts`, new validation script | A deployed frontend should not silently fall back to localhost or an unsafe backend URL. |
| Add identity-provider-ready contracts | backend models/migration, auth schemas, auth API | Prepare OAuth/SSO without storing browser tokens or replacing current sessions. |
| Pin dependency versions or add constraints | `backend\pyproject.toml`, `frontend\package.json` | Production pilot and rollback need reproducible installs. |

## Identity Stack Direction

v1.5 should keep backend-owned sessions and add provider-ready identity metadata:

```text
identity_accounts
  user_id
  provider
  provider_subject
  issuer
  email_snapshot
  email_verified
  last_login_at
  is_demo
```

Do not add NextAuth/Auth.js, Auth0, Keycloak, Clerk, Firebase Auth, SAML, SCIM, or a full OAuth callback flow in v1.5 unless a pilot school provides provider requirements. Future OAuth/OIDC should be backend-owned: exchange tokens server-side, resolve a `User`, then issue the existing HttpOnly session cookie.

## Deployment Stack Direction

| Surface | Current risk | v1.5 target |
|---|---|---|
| Render start command | Demo seed command runs during boot | Production pilot boot does not run demo seed; public demo may seed intentionally. |
| `ALLOW_DEMO_SEED` | True in public demo deployment | False in production pilot. |
| Vercel root | Recent root-dir drift caused 404 | Guard and document root directory = `frontend`. |
| Smoke | Accepts `ready` or `not_ready` for demo | Add pilot smoke that requires `/health/ready` to be ready. |
| Env examples | Must be sanitized | Examples contain placeholders only; no tokens, secrets, or real URLs beyond public service URLs. |

## Non-Goals

- Full OAuth/OIDC/SAML/SCIM implementation before a real provider is selected.
- Browser token storage.
- Redis/session infrastructure unless scaling requires it.
- Kubernetes/Terraform/multi-school infrastructure.
- Raw student exports, risk leaderboards, or surveillance analytics.

## Sources

- `.planning\PROJECT.md`
- `.planning\MILESTONES.md`
- `.planning\STATE.md`
- `render.yaml`
- `frontend\vercel.json`
- `backend\app\core\config.py`
- `backend\app\core\sessions.py`
- `backend\app\api\auth.py`
- `backend\app\services\readiness.py`
- `backend\app\db\models.py`
- `frontend\package.json`
- `frontend\package-lock.json`
- `frontend\lib\api.ts`
- `frontend\scripts\production-smoke.mjs`

