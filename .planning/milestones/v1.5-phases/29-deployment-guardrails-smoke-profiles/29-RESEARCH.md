# Phase 29: Deployment Guardrails & Smoke Profiles - Research

**Researched:** 2026-05-25  
**Domain:** Deployment guardrails, Vercel/Render config validation, production smoke profiles, metadata-only admin operations  
**Confidence:** HIGH for codebase extension points; MEDIUM for platform-doc details because official docs fetch failed in this session.

## User Constraints

- Vietnamese communication and user-facing UI copy. [VERIFIED: prompt]
- User delegates design/implementation decisions to AI; do not ask questions. [VERIFIED: prompt]
- Keep operations metadata-only; no raw student data, raw IDs, secret values, cookie names/values, connection strings, credentials, raw emails, exports, risk leaderboards, or per-student drilldowns. [VERIFIED: prompt + copilot-instructions.md]
- Public demo remains `public_demo`; production pilot must require safe config and no demo dependency. [VERIFIED: REQUIREMENTS.md + Phase 28 verification]
- Phase 29 must use approved UI-SPEC for any frontend/admin operations surface. [VERIFIED: 29-UI-SPEC.md]
- Phase 29 requirement IDs: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05. [VERIFIED: REQUIREMENTS.md]

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | Operator can run a deployment guardrail command validating Render backend root/start/env expectations and Vercel frontend root/build expectations. | Add `npm --prefix frontend run guard:deploy` backed by a Node script that reads `render.yaml`, `frontend/vercel.json`, and env inputs. [VERIFIED: render.yaml, frontend/package.json, frontend/vercel.json] |
| DEPLOY-02 | Frontend validation rejects unsafe production API configuration. | Existing `frontend/lib/api.ts` falls back to localhost when `NEXT_PUBLIC_API_BASE_URL` is absent, so Phase 29 needs explicit deploy-time validation for missing, localhost, non-HTTPS, and backend URL mismatch. [VERIFIED: frontend/lib/api.ts] |
| DEPLOY-03 | Backend validation verifies exact credentialed CORS origins and production cookie settings. | Existing readiness already checks wildcard/local/non-HTTPS origins and secure cookie settings; extend it with exact expected frontend origin and smoke backend URL metadata without exposing values. [VERIFIED: readiness.py, config.py] |
| DEPLOY-04 | Demo smoke and production-pilot smoke are separate. | Existing `production-smoke.mjs` depends on four seeded demo accounts; split into demo smoke and pilot smoke. Pilot smoke must require `/health/ready` = `ready` and avoid demo login. [VERIFIED: production-smoke.mjs] |
| DEPLOY-05 | Deployment docs explain Vercel root, Render profile, env vars, smoke commands, demo-vs-pilot readiness, rollback. | README currently has runtime/readiness and old `smoke:production`; update docs for guardrail, demo smoke, pilot smoke, and rollback. [VERIFIED: README.md] |

## Project Constraints from copilot-instructions.md

- Communicate in Vietnamese. [VERIFIED: copilot-instructions.md]
- Run autonomously by default; user delegates design/implementation decisions. [VERIFIED: copilot-instructions.md]
- Python/FastAPI backend is required. [VERIFIED: copilot-instructions.md]
- Operations surfaces must be explicit metadata-only support views, not surveillance. [VERIFIED: copilot-instructions.md]
- Public health/readiness exposes only non-sensitive overall status; admin readiness may carry remediation details but must remain masked. [VERIFIED: copilot-instructions.md]
- Backend routes are mounted under `/api`; router paths should not double-prefix `/api`. [VERIFIED: copilot-instructions.md]
- Auth must remain cookie-authenticated with no browser token storage. [VERIFIED: copilot-instructions.md]
- Do not make repo edits outside GSD workflow unless explicitly requested. [VERIFIED: copilot-instructions.md]

## Summary

Phase 29 should not introduce a new deployment system. It should add a small, testable guardrail layer around the existing Vercel frontend, Render backend, Phase 28 runtime readiness, and current production smoke script. [VERIFIED: ROADMAP.md + Phase 28 verification + codebase]

The highest-risk current gap is that the only deployed smoke command is demo-account based and named `smoke:production`; this can create false confidence for a production pilot because it proves seeded demo login works, not that a real pilot is ready without demo users. [VERIFIED: production-smoke.mjs]

**Primary recommendation:** implement one Phase 29 plan with four waves: deploy guardrail CLI, split smoke profiles, backend/admin metadata schema additions, then UI/docs/tests. [ASSUMED]

## Findings Summary

1. Existing runtime/readiness foundation is solid and should be reused, not replaced. [VERIFIED: Phase 28 verification + readiness.py]
2. Existing smoke script checks frontend reachability, backend liveness/readiness, CORS preflight, demo login, session role, and dashboard routes, but it depends on seeded demo users. [VERIFIED: production-smoke.mjs]
3. Current frontend API helper silently defaults to `http://localhost:8000` when `NEXT_PUBLIC_API_BASE_URL` is missing, which is acceptable locally but unsafe for production validation. [VERIFIED: frontend/lib/api.ts]
4. Existing admin operations schema has `production_smoke` as a list of checklist items; Phase 29 should evolve this into explicit deployment guardrails and separate smoke profiles while preserving metadata-only behavior. [VERIFIED: admin_operations.py + schemas/admin_operations.py]
5. `render.yaml` is currently configured as public demo: `rootDir: backend`, demo seed/login enabled, `RUNTIME_MODE=public_demo`, secure cookie with SameSite none, and Render health path `/health/live`. [VERIFIED: render.yaml]

## Current Code Map

| Area | File | Current Behavior | Phase 29 Extension Point |
|------|------|------------------|--------------------------|
| Render config | `render.yaml` | Backend service uses `rootDir: backend`, `buildCommand: pip install -e .`, `startCommand` runs migrations, demo seed, then uvicorn; runtime is `public_demo`. [VERIFIED: render.yaml] | Guardrail validates root/start/env expectations and flags public-demo vs pilot profile drift. |
| Vercel config | `frontend/vercel.json` | Declares Next framework, build command, install command; root directory is not encoded in this file. [VERIFIED: frontend/vercel.json] | Guardrail should document/validate frontend root expectation as operator input or project-setting check. |
| Frontend API target | `frontend/lib/api.ts` | Uses `NEXT_PUBLIC_API_BASE_URL` or defaults to `http://localhost:8000`. [VERIFIED: frontend/lib/api.ts] | Add production/pilot validation that forbids missing/localhost/non-HTTPS/mismatch. |
| Existing smoke | `frontend/scripts/production-smoke.mjs` | Defaults to hosted demo URLs and logs into four demo accounts. [VERIFIED: production-smoke.mjs] | Split into `demo-smoke.mjs` and `pilot-smoke.mjs`; keep compatibility alias if needed. |
| Frontend scripts | `frontend/package.json` | Has `smoke:production`, `build`, `test`, `lint`. [VERIFIED: frontend/package.json] | Add `guard:deploy`, `smoke:demo`, `smoke:pilot`; optionally keep `smoke:production` as demo alias. |
| Backend readiness | `backend/app/services/readiness.py` | Checks runtime mode, env, DB URL safety, demo seed/login policy, origin safety, cookie security, provider secrets, DB, migration. [VERIFIED: readiness.py] | Add exact deployment topology checks or reuse for guardrail metadata. |
| Backend settings | `backend/app/core/config.py` | Defines `local_demo`, `public_demo`, `production_pilot`, origin validators, cookie prefix rules. [VERIFIED: config.py] | Add optional expected deployment host/env settings only if needed, without exposing values. |
| Admin operations schema | `backend/app/schemas/admin_operations.py` | Exposes runtime, connectivity, demo seed, readiness, `production_smoke`, SOS email, audit metadata. [VERIFIED: schemas/admin_operations.py] | Add `deployment_guardrails` and `smoke_profiles` safe schemas. |
| Admin operations service | `backend/app/services/admin_operations.py` | Builds safe runtime/connectivity/smoke checklist and sanitizes audit metadata. [VERIFIED: admin_operations.py] | Build guardrail/smoke profile summaries using safe booleans/counts/statuses. |
| Admin operations UI | `frontend/app/(authenticated)/admin/operations/page.tsx` | Renders readiness, runtime, demo seed, connectivity, production smoke checklist, SOS email, audit. [VERIFIED: operations page] | Insert approved `Deployment guardrails` and `Smoke profiles` panels after privacy boundary and filters. |
| UI tests | `frontend/tests/phase11-operations-ui.test.tsx` | Tests operations rendering, filters, no token storage, no sensitive fields. [VERIFIED: test file] | Extend with Phase 29 UI-SPEC strings and forbidden-label assertions. |
| Backend tests | `backend/tests/test_phase7_readiness.py`, `test_demo_seed.py`, `test_phase11_operations_visibility.py` | Cover readiness masking, production-pilot flags, operations metadata, smoke checklist command. [VERIFIED: tests] | Add deploy guardrail/readiness/smoke-profile regression tests. |

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Node.js | v22.17.0 installed | Run frontend guardrail/smoke scripts. | Existing frontend scripts are Node `.mjs`. [VERIFIED: environment audit] |
| npm | 10.9.2 installed | Run `npm --prefix frontend ...` commands. | Existing workflow uses npm scripts. [VERIFIED: environment audit + package.json] |
| Next.js | 16.2.6 current registry | Frontend app/build. | Existing frontend depends on Next. [VERIFIED: npm registry + package.json] |
| React | 19.2.6 current registry | Admin operations UI. | Existing frontend uses React. [VERIFIED: npm registry + package.json] |
| Vitest | 4.1.7 current registry | Frontend component/unit tests. | Existing tests use Vitest. [VERIFIED: npm registry + vitest.config.ts] |
| FastAPI | 0.135.3 installed | Backend readiness/admin operations APIs. | Existing backend is FastAPI. [VERIFIED: installed package + main.py] |
| Pydantic | 2.13.0 installed | Backend schema validation. | Existing schemas use Pydantic models. [VERIFIED: installed package + schemas] |
| pytest | 8.4.2 installed | Backend tests. | Existing backend test suite uses pytest. [VERIFIED: installed package + pyproject.toml] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.4.3 current registry | Node-side env/config validation. | Use in guardrail/smoke scripts because zod is already a frontend dependency. [VERIFIED: npm registry + package.json] |
| yaml | 2.9.0 current registry | Parse `render.yaml` safely. | Add as devDependency if guardrail needs structured YAML parsing; avoid hand-rolled YAML parsing. [VERIFIED: npm registry] |
| Testing Library React | 16.3.2 current registry | Operations UI tests. | Extend existing operations UI test patterns. [VERIFIED: npm registry + test file] |
| Playwright | 1.60.0 current registry | Optional browser smoke depth. | Do not require for Phase 29 unless planner adds e2e pilot browser checks. [VERIFIED: npm registry + playwright.config.ts] |

**Installation if adding YAML parser:**

```bash
npm --prefix frontend install --save-dev yaml
```

## Recommended Implementation Strategy

### 1. Guardrail command design

Add `frontend/scripts/deployment-guardrails.mjs` and package script:

```json
{
  "guard:deploy": "node scripts/deployment-guardrails.mjs"
}
```

Recommended command:

```bash
BEYOU_DEPLOY_PROFILE=production_pilot `
BEYOU_EXPECTED_FRONTEND_URL=https://<vercel-host> `
BEYOU_EXPECTED_BACKEND_URL=https://<render-host> `
NEXT_PUBLIC_API_BASE_URL=https://<render-host> `
npm --prefix frontend run guard:deploy
```

Guardrail should validate:

| Check | Rule |
|-------|------|
| Render root | `render.yaml` backend service has `rootDir: backend`. [VERIFIED: render.yaml] |
| Render start | Start command includes Alembic migration and uvicorn startup. [VERIFIED: render.yaml] |
| Render health | `healthCheckPath` is `/health/live`. [VERIFIED: render.yaml] |
| Runtime mode | Public demo permits `public_demo`; production pilot requires `production_pilot`. [VERIFIED: config.py + render.yaml] |
| Demo flags | Production pilot requires `ALLOW_DEMO_SEED=false` and `ALLOW_DEMO_LOGIN=false`. [VERIFIED: REQUIREMENTS.md + readiness.py] |
| Frontend API target | `NEXT_PUBLIC_API_BASE_URL` must be present, HTTPS, non-localhost, and equal expected backend URL for pilot. [VERIFIED: REQUIREMENTS.md + frontend/lib/api.ts] |
| Vercel config | `frontend/vercel.json` must declare Next framework/build/install commands; root directory must be documented as `frontend`. [VERIFIED: vercel.json; root setting is operator/project setting] |
| Safe output | Print pass/warn/fail, command names, env var keys, and remediation; never print secret values, cookie names/values, DB URLs, raw emails, or raw IDs. [VERIFIED: UI-SPEC + copilot-instructions.md] |

### 2. Smoke profile split

Recommended scripts:

```json
{
  "smoke:demo": "node scripts/demo-smoke.mjs",
  "smoke:pilot": "node scripts/pilot-smoke.mjs",
  "smoke:production": "npm run smoke:demo"
}
```

Demo smoke:

- May use seeded role accounts. [VERIFIED: DEPLOY-04 + production-smoke.mjs]
- May accept `/health/ready` returning `ready`, `degraded`, or `not_ready` because public demo can intentionally seed demo data. [VERIFIED: README.md + Phase 28 verification]
- Should keep checking frontend, backend live, readiness status, CORS preflight, demo login/session role, and role dashboard route. [VERIFIED: production-smoke.mjs]

Pilot smoke:

- Must require `/health/ready` HTTP 200 and JSON `status === "ready"`. [VERIFIED: DEPLOY-04 + readiness_http_status behavior]
- Must not use demo emails or `BEYOU_DEMO_PASSWORD`. [VERIFIED: DEPLOY-04]
- Should check frontend reachable, backend `/health/live`, backend `/health/ready`, credentialed CORS preflight for expected frontend origin, and safe API target match. [VERIFIED: production-smoke.mjs patterns]
- Should fail if frontend/backend URLs are missing, localhost, non-HTTPS, or mismatched. [VERIFIED: DEPLOY-02]

### 3. Backend/admin operations metadata

Add safe backend schema fields:

```python
class DeploymentGuardrailItem(BaseModel):
    key: str
    category: str
    status: ReadinessCheckStatus
    evidence: str
    remediation: str | None = None
    command: str | None = None

class SmokeProfileItem(BaseModel):
    key: Literal["demo_smoke", "pilot_smoke"]
    label: str
    status: ReadinessCheckStatus
    command: str
    uses_demo_accounts: bool
    requires_readiness_ready: bool
    evidence: str
    remediation: str | None = None
```

Do not expose raw URLs except documented public hostnames already allowed by UI-SPEC. Prefer status and kind fields like `expected_backend_match: true` over raw URL strings. [VERIFIED: 29-UI-SPEC.md]

### 4. Frontend/admin operations UI

Use the approved UI-SPEC exactly:

- Add panel title `Deployment guardrails`. [VERIFIED: 29-UI-SPEC.md]
- Description: `Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn.` [VERIFIED: 29-UI-SPEC.md]
- Add panel title `Smoke profiles`. [VERIFIED: 29-UI-SPEC.md]
- Show separate cards for `Demo smoke` and `Production pilot smoke`. [VERIFIED: 29-UI-SPEC.md]
- Pilot card must include Vietnamese text meaning "không phụ thuộc tài khoản demo". [VERIFIED: 29-UI-SPEC.md]
- Do not add destructive deploy/rollback/reset/export/secret reveal buttons. [VERIFIED: 29-UI-SPEC.md]

## Plan Decomposition Recommendation

Use one Phase 29 plan with these waves:

### Wave 0 — Regression scaffolding

- Add backend tests for deployment guardrail schema/service metadata.
- Add frontend tests for UI-SPEC required strings and forbidden sensitive labels.
- Add script tests for guardrail and smoke modes if feasible with Node subprocess or pure helper functions.

### Wave 1 — Guardrail CLI

- Add `frontend/scripts/deployment-guardrails.mjs`.
- Add `guard:deploy` npm script.
- Validate Render YAML, Vercel config, env inputs, API target, profile-specific flags.
- Use structured pass/warn/fail output and non-secret remediation.

### Wave 2 — Smoke profile split

- Refactor current `production-smoke.mjs` into shared helpers plus `demo-smoke.mjs` and `pilot-smoke.mjs`.
- Keep `smoke:production` as a compatibility alias to demo smoke, or update it to print a deprecation note before running demo smoke.
- Ensure pilot smoke has no demo-account dependency.

### Wave 3 — Backend/admin metadata

- Extend `schemas/admin_operations.py`.
- Extend `services/admin_operations.py`.
- Keep existing `production_smoke` if needed for compatibility, but prefer new `smoke_profiles`.
- Add backend tests proving forbidden fields do not serialize.

### Wave 4 — UI/docs/final gates

- Update operations page per UI-SPEC.
- Update operations UI tests.
- Update README deployment docs.
- Run targeted backend/frontend gates.

## Architecture Patterns

### Pattern 1: Metadata-only deployment evidence

**What:** Represent deployment and smoke state as safe status/evidence/remediation fields, never raw config values. [VERIFIED: existing operations patterns]

**Example:**

```python
DeploymentGuardrailItem(
    key="frontend_api_target",
    category="vercel_frontend",
    status="fail",
    evidence="Frontend API target is missing or unsafe for the selected profile.",
    remediation="Set NEXT_PUBLIC_API_BASE_URL to the deployed HTTPS backend origin before building.",
)
```

### Pattern 2: Script helpers with pure validation functions

**What:** Keep URL/env/config validation in pure functions so tests can call them without real Vercel/Render. [ASSUMED]

**Example:**

```js
export function validateApiTarget({ profile, apiBaseUrl, expectedBackendUrl }) {
  // Return [{ key, status, evidence, remediation }]
}
```

### Pattern 3: Demo smoke and pilot smoke share transport checks but not identity assumptions

**What:** Both profiles can reuse URL, health, readiness, and CORS helpers; only demo smoke performs demo login. [VERIFIED: production-smoke.mjs + DEPLOY-04]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Ad-hoc indentation parser for `render.yaml` | `yaml` package if structured parsing is needed | Avoid brittle parsing of Render blueprint shape. [VERIFIED: npm registry for yaml] |
| Secret masking | Regex-only "remove obvious secrets" after building payload | Backend schemas that never include secrets/cookie names/connection strings | Existing project relies on metadata-only schema boundaries. [VERIFIED: schemas/admin_operations.py + tests] |
| Pilot readiness | A smoke script that logs into seeded demo accounts | `/health/ready` strict `ready` gate plus non-demo transport checks | DEPLOY-04 forbids demo dependency for pilot smoke. [VERIFIED: REQUIREMENTS.md] |
| CORS proof | Assume config is correct from env vars | Actual OPTIONS preflight with expected Origin and credential headers | Existing smoke already verifies credentialed preflight. [VERIFIED: production-smoke.mjs] |
| Frontend production safety | Runtime fallback to localhost | Guardrail that fails missing/localhost/non-HTTPS/mismatch before build/deploy | Current helper defaults to localhost. [VERIFIED: frontend/lib/api.ts] |

## Common Pitfalls

### Pitfall 1: Demo smoke mistaken for pilot readiness

**What goes wrong:** Seeded demo accounts pass, but real production pilot is not ready. [VERIFIED: production-smoke.mjs + Phase 28 verification]  
**How to avoid:** Separate `smoke:demo` and `smoke:pilot`; pilot requires readiness `ready` and no demo login. [VERIFIED: DEPLOY-04]

### Pitfall 2: Missing frontend API env falls back to localhost

**What goes wrong:** Production build or validation can silently target `http://localhost:8000`. [VERIFIED: frontend/lib/api.ts]  
**How to avoid:** Guardrail fails if `NEXT_PUBLIC_API_BASE_URL` is absent or local for production/pilot. [VERIFIED: DEPLOY-02]

### Pitfall 3: Exposing raw deployment values in admin operations

**What goes wrong:** UI or API reveals cookie names, DB URLs, raw origins, emails, IDs, or secrets. [VERIFIED: 29-UI-SPEC.md]  
**How to avoid:** Backend schema should emit booleans, kinds, counts, commands, status, and remediation only. [VERIFIED: existing admin_operations schema pattern]

### Pitfall 4: Platform config lives outside git

**What goes wrong:** Vercel root directory is often a project setting and may not appear in `frontend/vercel.json`. [ASSUMED]  
**How to avoid:** Guardrail should require an explicit operator input or documented manual check for Vercel root directory, and docs must state expected root is `frontend`. [VERIFIED: DEPLOY-05 + frontend/vercel.json lacks root setting]

## Code Examples

### Demo/pilot smoke package scripts

```json
{
  "scripts": {
    "guard:deploy": "node scripts/deployment-guardrails.mjs",
    "smoke:demo": "node scripts/demo-smoke.mjs",
    "smoke:pilot": "node scripts/pilot-smoke.mjs",
    "smoke:production": "npm run smoke:demo"
  }
}
```

Source: existing `frontend/package.json` script pattern. [VERIFIED: frontend/package.json]

### Pilot readiness gate

```js
const response = await fetch(`${backendUrl}/health/ready`);
if (response.status !== 200) {
  throw new Error(`/health/ready must return HTTP 200 for production pilot`);
}
const payload = await response.json();
if (payload.status !== "ready") {
  throw new Error(`production pilot readiness must be ready, got ${payload.status ?? "unknown"}`);
}
```

Source: existing readiness endpoint returns 503 for `not_ready` and 200 otherwise; pilot requirement demands `ready`. [VERIFIED: readiness.py + DEPLOY-04]

### Existing CORS preflight pattern to preserve

```js
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: "OPTIONS",
  headers: {
    Origin: frontendUrl,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  },
});
```

Source: existing production smoke. [VERIFIED: production-smoke.mjs]

## Backend/Admin Operations Changes Needed

| File | Change |
|------|--------|
| `backend/app/schemas/admin_operations.py` | Add `DeploymentGuardrailItem`, `SmokeProfileItem`, and response fields. [VERIFIED: schema extension point] |
| `backend/app/services/admin_operations.py` | Replace/augment `_production_smoke_checklist()` with `_deployment_guardrails()` and `_smoke_profiles()`. [VERIFIED: service extension point] |
| `backend/tests/test_phase7_readiness.py` | Add or extend tests for exact pilot CORS/cookie readiness metadata. [VERIFIED: existing readiness tests] |
| `backend/tests/test_phase11_operations_visibility.py` | Add no-sensitive-fields assertions for new deployment/smoke metadata. [VERIFIED: existing operations tests] |
| `backend/tests/test_demo_seed.py` | Update old assertion that every smoke command is `smoke:production`. [VERIFIED: line 190] |

## Frontend/UI Changes Needed

| File | Change |
|------|--------|
| `frontend/lib/admin-operations-api.ts` | Add TypeScript types for deployment guardrails and smoke profiles. [VERIFIED: existing API types] |
| `frontend/app/(authenticated)/admin/operations/page.tsx` | Add approved UI-SPEC panels and separate demo/pilot smoke cards. [VERIFIED: UI-SPEC + operations page] |
| `frontend/tests/phase11-operations-ui.test.tsx` | Assert `Deployment guardrails`, `Smoke profiles`, `Demo smoke`, `Production pilot smoke`, Vietnamese no-demo-dependency text, and forbidden labels absent. [VERIFIED: UI-SPEC + test pattern] |
| `frontend/scripts/production-smoke.mjs` | Refactor or retain as compatibility alias. [VERIFIED: existing script] |
| `frontend/scripts/demo-smoke.mjs` | New demo smoke using seeded accounts. [VERIFIED: DEPLOY-04] |
| `frontend/scripts/pilot-smoke.mjs` | New pilot smoke requiring readiness `ready`, no demo accounts. [VERIFIED: DEPLOY-04] |
| `frontend/scripts/deployment-guardrails.mjs` | New guardrail command. [VERIFIED: DEPLOY-01] |
| `frontend/package.json` | Add scripts and optional `yaml` dev dependency. [VERIFIED: package.json] |
| `README.md` | Document Vercel root, Render backend profile, env vars, smoke commands, demo-vs-pilot readiness, rollback. [VERIFIED: DEPLOY-05] |

## Docs/Config Updates Required

- README must document Vercel root directory as `frontend`. [VERIFIED: DEPLOY-05]
- README must document Render backend root as `backend`, build command `pip install -e .`, start command migration + uvicorn, and health path `/health/live`. [VERIFIED: render.yaml]
- README must separate public demo smoke from production pilot smoke. [VERIFIED: DEPLOY-04]
- README must explain public demo readiness can be degraded/not_ready while demo seed is enabled. [VERIFIED: README.md + Phase 28 verification]
- README must state production pilot requires `ALLOW_DEMO_SEED=false`, `ALLOW_DEMO_LOGIN=false`, exact HTTPS origins, secure cookies, current migrations, and no placeholder secrets. [VERIFIED: README.md + readiness.py]
- Safe rollback docs should prefer redeploy/config rollback/readiness recheck over destructive database reset. [VERIFIED: REQUIREMENTS.md out-of-scope destructive reset]

## Validation Architecture

Project config has `workflow.nyquist_validation=false`, so no Nyquist section is required. [VERIFIED: .planning/config.json]

Recommended Phase 29 validation gates:

| Area | Command |
|------|---------|
| Backend targeted | `Set-Location D:\BeYou\backend; python -m pytest tests\test_phase7_readiness.py tests\test_phase11_operations_visibility.py tests\test_demo_seed.py -q` |
| Backend lint | `Set-Location D:\BeYou\backend; python -m ruff check .` |
| Frontend targeted | `Set-Location D:\BeYou\frontend; npm test -- tests\phase11-operations-ui.test.tsx` |
| Frontend lint | `Set-Location D:\BeYou\frontend; npm run lint` |
| Frontend build | `Set-Location D:\BeYou\frontend; npm run build` |
| Guardrail demo profile | `BEYOU_DEPLOY_PROFILE=public_demo npm --prefix frontend run guard:deploy` |
| Guardrail pilot profile | `BEYOU_DEPLOY_PROFILE=production_pilot ... npm --prefix frontend run guard:deploy` |
| Demo smoke | `npm --prefix frontend run smoke:demo` |
| Pilot smoke | `npm --prefix frontend run smoke:pilot` |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Guardrail/smoke scripts | yes | v22.17.0 | None needed. [VERIFIED: environment audit] |
| npm | Frontend scripts/tests | yes | 10.9.2 | None needed. [VERIFIED: environment audit] |
| Python | Backend tests | yes | 3.12.7 | None needed. [VERIFIED: environment audit] |
| curl | Optional manual smoke/debug | yes | 8.13.0 | Use Node fetch scripts. [VERIFIED: environment audit] |
| git | Grep/history checks | yes | 2.52.0.windows.1 | None needed. [VERIFIED: environment audit] |

**Missing dependencies with no fallback:** None found. [VERIFIED: environment audit]

## Security / Privacy Considerations

| Concern | Mitigation |
|---------|------------|
| Raw secrets in guardrail output | Print env var keys and safe statuses only; never print values. [VERIFIED: UI-SPEC] |
| Cookie name/value exposure | Backend/admin metadata must not serialize cookie names or values. [VERIFIED: Phase 28 tests] |
| Raw origin leakage | UI-SPEC permits public documented hostnames only; prefer kinds/counts/booleans in admin operations. [VERIFIED: 29-UI-SPEC.md] |
| Demo account leakage in pilot | Pilot smoke must not reference demo emails/password. [VERIFIED: DEPLOY-04] |
| False readiness | Pilot smoke requires `/health/ready` ready; demo smoke can pass with degraded/not_ready but must label itself demo. [VERIFIED: README.md + DEPLOY-04] |
| Operations surveillance drift | UI must not add exports, risk leaderboards, per-student drilldowns, raw notes/transcripts/answers/reasons. [VERIFIED: UI-SPEC + copilot-instructions.md] |

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Keep backend-owned cookie sessions; pilot smoke avoids demo auth dependency. [VERIFIED: PROJECT.md + DEPLOY-04] |
| V3 Session Management | yes | Secure cookie settings and credentialed CORS checks. [VERIFIED: readiness.py + main.py] |
| V4 Access Control | yes | Admin operations remains admin-gated through existing backend dependencies. [VERIFIED: api/admin_operations.py] |
| V5 Input Validation | yes | Use Pydantic backend schemas and zod/script validation for env inputs. [VERIFIED: schemas + npm registry] |
| V6 Cryptography | limited | Do not handle crypto in Phase 29; do not expose credentials or cookies. [VERIFIED: scope] |

## Open Questions (RESOLVED)

1. **Should `smoke:production` remain?**  
   - What we know: Existing docs and UI reference it. [VERIFIED: grep]  
   - Default: Keep it as a compatibility alias to `smoke:demo` and update docs to prefer explicit `smoke:demo` / `smoke:pilot`. [ASSUMED]
   - **RESOLVED:** Keep `smoke:production` as a compatibility alias to `smoke:demo`, and make the script print that pilot readiness must use `smoke:pilot`.

2. **How to validate Vercel root directory if it is only in Vercel project settings?**  
   - What we know: `frontend/vercel.json` does not encode root directory. [VERIFIED: vercel.json]  
   - Default: Guardrail should warn unless operator passes `BEYOU_VERCEL_ROOT=frontend`; docs should state the manual Vercel setting. [ASSUMED]
   - **RESOLVED:** Treat `BEYOU_VERCEL_ROOT=frontend` as the guardrail input for the Vercel project setting; missing input is a warning, a non-`frontend` value is a failure.

3. **Should guardrail call deployed endpoints or only inspect config?**  
   - What we know: DEPLOY-01 allows before or after deploy; smoke scripts already call deployed endpoints. [VERIFIED: REQUIREMENTS.md + production-smoke.mjs]  
   - Default: Guardrail should support config-only checks by default and optional live checks when `BEYOU_GUARDRAIL_LIVE=true`. [ASSUMED]
   - **RESOLVED:** Guardrail remains deterministic/config-only by default; live endpoint checks belong to `smoke:demo` and `smoke:pilot`, with optional live guardrail checks deferred unless execution adds them safely.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vercel root directory may live outside `frontend/vercel.json` in project settings. | Common Pitfalls / Open Questions | Guardrail may need adjustment if project encodes root elsewhere. |
| A2 | One Phase 29 plan with four waves is the best planning split. | Summary / Plan Decomposition | Planner may choose multiple plans if granularity changes. |
| A3 | Keep `smoke:production` as compatibility alias. | Smoke profile split / Open Questions | Could confuse operators unless docs label it clearly. |
| A4 | Guardrail should support optional live checks via env flag. | Open Questions | Planner may keep guardrail config-only and leave live checks to smoke scripts. |

## Sources

### Primary / HIGH confidence

- `D:\BeYou\.planning\REQUIREMENTS.md` — DEPLOY-01..DEPLOY-05 requirement text. [VERIFIED: file read]
- `D:\BeYou\.planning\ROADMAP.md` — Phase 29 goal and success criteria. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\28-runtime-mode-production-readiness-foundation\28-VERIFICATION.md` — Phase 28 runtime/readiness behavior. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\29-deployment-guardrails-smoke-profiles\29-UI-SPEC.md` — approved UI contract. [VERIFIED: file read]
- `D:\BeYou\copilot-instructions.md` — project constraints and GSD conventions. [VERIFIED: file read]
- `D:\BeYou\render.yaml` — current Render backend blueprint. [VERIFIED: file read]
- `D:\BeYou\frontend\package.json` — existing frontend scripts/dependencies. [VERIFIED: file read]
- `D:\BeYou\frontend\scripts\production-smoke.mjs` — existing demo-based production smoke. [VERIFIED: file read]
- `D:\BeYou\backend\app\services\readiness.py` — readiness checks and status behavior. [VERIFIED: file read]
- `D:\BeYou\backend\app\services\admin_operations.py` — operations metadata builder. [VERIFIED: file read]
- `D:\BeYou\backend\app\schemas\admin_operations.py` — operations response schema. [VERIFIED: file read]
- `D:\BeYou\frontend\app\(authenticated)\admin\operations\page.tsx` — UI extension point. [VERIFIED: file read]
- npm registry: next 16.2.6, react 19.2.6, vitest 4.1.7, yaml 2.9.0, zod 4.4.3. [VERIFIED: npm registry]

### Secondary / MEDIUM confidence

- Installed backend package versions from local Python metadata: FastAPI 0.135.3, Pydantic 2.13.0, SQLAlchemy 2.0.49, Alembic 1.18.4, pytest 8.4.2, Ruff 0.15.13. [VERIFIED: local environment]

### Tertiary / LOW confidence

- Official Render/Vercel/Next docs fetch attempts failed with curl exit code 35, so platform-doc-specific claims were avoided or marked `[ASSUMED]`. [VERIFIED: curl attempt]

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Code extension points | HIGH | Directly read relevant backend/frontend files. |
| Deployment guardrail design | MEDIUM | Codebase is clear; Vercel root-setting details are assumed because official docs could not be fetched. |
| Smoke split | HIGH | Existing script and DEPLOY-04 clearly confirm the demo dependency must be separated. |
| UI/admin operations | HIGH | UI-SPEC and operations page/schema/service were read directly. |
| Security/privacy | HIGH | Project constraints, UI-SPEC, and Phase 28 tests all confirm the metadata-only boundary. |

Research complete. Planner can proceed to PLAN.md.
