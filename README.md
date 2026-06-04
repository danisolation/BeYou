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

## School pilot launch checklist

Before opening Peerlight AI to a real school pilot, verify all launch items through admin-gated, metadata-only readiness and operations surfaces:

- `RUNTIME_MODE=production_pilot`.
- `ALLOW_DEMO_SEED=false`.
- `ALLOW_DEMO_LOGIN=false`.
- `/health/ready` returns `ready`.
- Database migrations are at Alembic head.
- Frontend origins are exact HTTPS origins with no wildcard or local origin in pilot config.
- Session cookies are Secure with SameSite=None.
- Auth provider readiness metadata is safe and does not expose provider subjects, claims, issuer URLs, callback URLs, client secrets, or tokens.
- `npm --prefix frontend run guard:deploy` passes.
- `npm --prefix frontend run smoke:pilot` passes.
- Phase 31 admin operations shows no active demo-user dependency for pilot launch.

The admin operations dashboard is authorization-gated and metadata-only: it shows statuses, counts, commands, and safe guidance, not raw student records, private notes, answers, transcripts, provider claims, exports, or per-student drilldowns. Public demo smoke is not production-pilot proof.

### Baseline setup for a real pilot

A real pilot should start from non-demo baseline self-check content, non-demo scenario content, mood/check-in configuration, school privacy policy defaults, in-app-only reminder channels, and a school handoff/support path documented outside raw operations metadata.

Production pilot launch must not create or rely on public demo accounts, demo student-adult links, demo walkthrough content, demo mood configs, or demo note-sharing state. Broad active real-user counts can be reviewed as metadata, but zero real active users does not by itself prove launch unsafe because onboarding may happen after configuration approval.

### Pilot rollback and handoff

- Redeploy the last known good Vercel frontend and Render backend build.
- Revert deployment environment variables to the last known good values.
- Run /health/ready, npm --prefix frontend run guard:deploy, and npm --prefix frontend run smoke:pilot.
- Notify the school or pilot owner if real users are affected.
- Escalate incidents through the agreed school support path.
- Do not use destructive database reset as the default rollback path.
- Do not use raw data export as the default rollback path.

The operations dashboard shows handoff metadata and static guidance only, not contact details or incident free text.

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

## Privacy, security, and release gates

Phase 32 release must map every QA requirement to an executable local gate or an explicit constrained live-smoke note.

| Requirement | Gate | Command |
|---|---|---|
| QA-01 | Backend runtime/readiness, seed blocking, and secret masking | `Set-Location D:\BeYou\backend; python -m pytest tests\test_phase32_release_gates.py tests\test_phase7_readiness.py tests\test_demo_seed.py -q` |
| QA-02 | Deploy guardrails, smoke profiles, and deterministic Node release gates | `Set-Location D:\BeYou\frontend; npm run test:deploy-guardrails; npm run test:smoke-profiles; npm run test:release-gates` |
| QA-03 | Backend auth/privacy plus frontend no-token auth gates | `Set-Location D:\BeYou\backend; python -m pytest tests\test_auth_privacy_portals.py tests\test_authorization_security.py tests\test_phase32_release_gates.py -q; Set-Location D:\BeYou\frontend; npm test -- tests\phase32-release-gates-ui.test.tsx tests\auth-portals.test.tsx` |
| QA-04 | Cross-role privacy, reason gates, selective sharing, and privacy routing | `Set-Location D:\BeYou\backend; python -m pytest tests\test_phase24_reason_access.py tests\test_authorization_security.py tests\test_phase32_release_gates.py -q; Set-Location D:\BeYou\frontend; npm test -- tests\phase32-release-gates-ui.test.tsx tests\phase23-mood-note-sharing-ui.test.tsx tests\phase24-reason-access-ui.test.tsx` |
| QA-05 | Operations/readiness metadata-only redlines and README privacy grep gates | `Set-Location D:\BeYou\backend; python -m pytest tests\test_phase32_release_gates.py tests\test_phase31_school_pilot_operations.py tests\test_phase25_admin_policy_operations.py -q; Set-Location D:\BeYou\frontend; npm test -- tests\phase32-release-gates-ui.test.tsx tests\phase31-school-pilot-operations-ui.test.tsx tests\phase25-admin-policy-operations-ui.test.tsx tests\phase11-operations-ui.test.tsx; Set-Location D:\BeYou; Select-String -Path README.md -Pattern "metadata-only","support-not-surveillance","no raw exports","no destructive database reset","no risk leaderboards","no per-student drilldowns"` |
| QA-06 | Full backend/frontend quality gates plus Node guard/smoke release gates | `Set-Location D:\BeYou\backend; python -m pytest; python -m ruff check .; Set-Location D:\BeYou\frontend; npm test; npm run lint; npm run build; npm run test:deploy-guardrails; npm run test:smoke-profiles; npm run test:release-gates` |

### Live smoke constraints

smoke:pilot is constrained unless BEYOU_FRONTEND_URL, BEYOU_BACKEND_URL, NEXT_PUBLIC_API_BASE_URL, and a production_pilot deployment with /health/ready status ready are available.

When those inputs are absent, Phase 32 verification records live pilot smoke as constrained instead of passed. Deterministic local substitutes are `npm run test:smoke-profiles`, `npm run test:release-gates`, backend readiness/admin metadata tests, and `npm --prefix frontend run guard:deploy`.

Phase 32 verification does not require real student accounts, school domains, IdP credentials, or secrets. Never paste secrets, real student records, provider claims, or raw identifiers into release logs.

### Privacy grep gates

Use grep gates to keep release docs and operations guidance metadata-only and support-not-surveillance:

```powershell
Set-Location D:\BeYou
Select-String -Path README.md -Pattern "metadata-only","support-not-surveillance","no raw exports","no destructive database reset","no risk leaderboards","no per-student drilldowns"
```

Also search app and docs surfaces for forbidden operational markers. Investigate any match outside explicit rejection/warning copy:

```powershell
Set-Location D:\BeYou
Select-String -Path README.md,backend\app\**\*.py,frontend\app\**\*.tsx,frontend\lib\**\*.ts,frontend\tests\**\*.tsx -Pattern "raw export","destructive reset","risk leaderboard","xếp hạng nguy cơ","per-student drilldown","provider_subject","raw_claims","private_note","sos_note","transcript","self_check_answer","scenario_answer","access_token","refresh_token","id_token"
```

Release guidance must preserve metadata-only operations, support-not-surveillance framing, no raw exports, no destructive database reset, no risk leaderboards, and no per-student drilldowns.

### v2.4 (SECURE-01)

Phase 73 is the v2.4 final release-gate phase. It adds zero new product surfaces — only verification, sanitizer redlines, doc updates, and release-gate runs that prove zero regression against the v1.5 Phase 32 invariants after Phase 71 (external notification helpers) and Phase 72 (multi-school tenant schema scaffolding).

Run the v2.4 gate command matrix from the repository root:

```powershell
Set-Location D:\BeYou\backend; python -m pytest
Set-Location D:\BeYou\backend; python -m ruff check .
Set-Location D:\BeYou\frontend; npm run lint
Set-Location D:\BeYou\frontend; npm run build
Set-Location D:\BeYou\frontend; npm test
Set-Location D:\BeYou\frontend; npm run test:release-gates
Set-Location D:\BeYou\frontend; npm run smoke:demo
Set-Location D:\BeYou\frontend; npm run smoke:pilot
Set-Location D:\BeYou\frontend; npm run guard:deploy
```

#### smoke:pilot constraint policy (v2.4)

If `BEYOU_FRONTEND_URL`, `BEYOU_BACKEND_URL`, `NEXT_PUBLIC_API_BASE_URL` are not safe HTTPS pilot URLs OR `/health/ready` does not return `ready`, mark `smoke:pilot` **constrained** with the deterministic substitute `npm --prefix frontend run smoke:demo` and record the disposition in `.planning/phases/73-security-polish-release-gates/73-VERIFICATION.md`. Do NOT mark the gate as failed solely due to live-environment unavailability. This mirrors the Phase 32 live-smoke constraint policy.

#### v2.4 privacy grep gates

Three deterministic grep gates protect the v2.4 surfaces (SMTP helpers and tenant scaffolding). Run from the repo root; all three MUST return zero matches in production code paths (test fixtures excluded):

```powershell
Set-Location D:\BeYou
git grep -nE "smtp_password|smtp_username|changeme" -- backend/app frontend/app frontend/components
git grep -nE "@(gmail|outlook|hotmail)\.com" -- backend/app frontend/app frontend/components
git grep -nE "tenant_id" -- frontend/app frontend/components
```

The first two MUST return zero matches **other than** defensive references in `backend/app/core/config.py` (SMTP field declarations), `backend/app/services/readiness.py` and `backend/app/services/sos_email.py` (placeholder detection + login call), `backend/app/services/admin_operations.py` (forbidden-marker sanitizer set), and `frontend/app/(authenticated)/admin/operations/page.tsx` (defense-in-depth sanitizer pattern). No hard-coded credential **values** or real recipient addresses may appear. The third MUST return zero matches in any rendered surface other than the sanitizer pattern itself — raw `tenant_id` UUIDs must not surface in admin operations payloads or DOM until multi-tenant runtime separation ships (v2.6+).

