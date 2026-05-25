# Peerlight AI

Peerlight AI is a privacy-first Vietnamese high-school wellbeing web app. It helps students reflect on mood, take short psychological self-checks, practice real school situations, chat with a supportive AI companion, prepare trusted-adult support plans, and send in-app SOS signals while keeping adult/admin access privacy-limited.

## Live demo

- Frontend: https://beyou-frontend.vercel.app
- Backend health: https://beyou-backend.onrender.com/health/live

Seeded demo roles are available from the public entry page without manually copying credentials. If manual login is needed, use password `BeYouDemo!2026` with:

| Role | Email |
|---|---|
| Student | `student.demo@beyou.local` |
| Teacher | `teacher.demo@beyou.local` |
| Parent | `parent.demo@beyou.local` |
| Admin | `admin.demo@beyou.local` |

Demo data is fictional and marked in the UI. Do not enter real student data into the demo deployment.

## Runtime modes and readiness

Peerlight AI uses explicit runtime modes: `local_demo`, `public_demo`, and `production_pilot`. The hosted public demo is configured as `public_demo`, so `/health/ready` may report `degraded` or `not_ready` while demo seeding is intentionally enabled.

A real `production_pilot` must use `ALLOW_DEMO_SEED=false`, `ALLOW_DEMO_LOGIN=false`, secure cookies, exact HTTPS frontend origins, a reachable database, current migrations, and no placeholder secrets. Public `/health/ready` remains status/time only; admin readiness and operations details are authorization-gated and metadata-only.

## Deployment guardrails & smoke profiles

Expected deployment shape:

| Surface | Required setting |
|---|---|
| Vercel root directory | `frontend` |
| Vercel build command | `npm run build` |
| Vercel install command | `npm install` |
| Render root directory | `backend` |
| Render build command | `pip install -e .` |
| Render start command | Includes `alembic upgrade head` and `uvicorn app.main:app` |
| Render health path | `/health/live` |

Run the config-only deployment guardrail before or after deploy:

```powershell
Set-Location D:\BeYou
$env:BEYOU_DEPLOY_PROFILE="public_demo" # or production_pilot
$env:BEYOU_EXPECTED_FRONTEND_URL="<deployed frontend origin>"
$env:BEYOU_EXPECTED_BACKEND_URL="<deployed backend origin>"
$env:BEYOU_VERCEL_ROOT="frontend"
$env:NEXT_PUBLIC_API_BASE_URL="<deployed backend origin>"
npm --prefix frontend run guard:deploy
```

Guardrail inputs are env var keys only: `BEYOU_DEPLOY_PROFILE`, `BEYOU_EXPECTED_FRONTEND_URL`, `BEYOU_EXPECTED_BACKEND_URL`, `BEYOU_VERCEL_ROOT`, `NEXT_PUBLIC_API_BASE_URL`, `RUNTIME_MODE`, `ALLOW_DEMO_SEED`, `ALLOW_DEMO_LOGIN`, `FRONTEND_ORIGIN`, `FRONTEND_ORIGINS`, `SESSION_COOKIE_SECURE`, and `SESSION_COOKIE_SAMESITE`. Do not paste secret values, cookie values, connection strings, provider credentials, or raw student data into guardrail logs.

Smoke profiles are intentionally separate:

```powershell
npm --prefix frontend run smoke:demo
npm --prefix frontend run smoke:pilot
```

- `smoke:demo` validates the public demo and may use seeded demo role accounts. It can run while `/health/ready` is `degraded` or `not_ready` because public demo seed/login can be intentionally enabled.
- `smoke:pilot` validates production pilot readiness. It requires `/health/ready` status `ready`, `ALLOW_DEMO_SEED=false`, `ALLOW_DEMO_LOGIN=false`, exact HTTPS origins, secure cookies, current migrations, no placeholder secrets, and must not depend on demo users.
- `smoke:production` remains a compatibility alias that delegates to demo smoke; do not treat it as production-pilot proof.

Safe rollback for deployment incidents:

1. Redeploy the last known good Vercel frontend and Render backend build.
2. Revert deployment environment variables to the last known good values.
3. Re-run `/health/ready`, `npm --prefix frontend run guard:deploy`, and the relevant smoke command.
4. Contact the school or pilot owner if real users are affected.
5. Do not use destructive database reset or raw data export as the default rollback path.

## v1.4 privacy boundaries

Peerlight AI v1.4 adds consent-based reminders, SOS-only adult visibility, and access transparency without expanding raw student data access:

- Students control in-app mood check-in reminders, quiet hours, and pause/resume state.
- Reminder delivery is in-app only. Zalo, SMS, push, and email reminders are deferred until consent governance, provider operations, retries, and message privacy review exist.
- Mood-note sharing is student-granted per check-in and revocable; private notes remain student-only by default.
- Teacher/parent student lists and protected support summaries are limited to linked students who have sent SOS, and protected views can require a controlled support-oriented reason before content is shown.
- Admins can configure safe default policy controls and inspect operations/readiness as metadata only.

Adult/admin views must stay support-oriented: no raw exports, no per-student risk leaderboards, no private chatbot transcripts, no raw self-check answers, no raw reason text, no unsafe identifiers in operations audit responses, and no drilldowns that turn support into surveillance.

## Verification

Run the core local gates from the repository root:

```powershell
Set-Location D:\BeYou\backend; python -m pytest; python -m ruff check .
Set-Location D:\BeYou\frontend; npm test; npm run lint; npm run build
Set-Location D:\BeYou; npm --prefix frontend run guard:deploy
Set-Location D:\BeYou; npm --prefix frontend run smoke:demo
```

`/health/ready` may report `not_ready` on the public demo while demo seeding is intentionally enabled; use `smoke:pilot` only for production-pilot readiness.

