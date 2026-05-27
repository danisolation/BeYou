# Phase 28: Runtime Mode & Production Readiness Foundation - Research

**Researched:** 2026-05-25  
**Domain:** FastAPI backend runtime configuration, readiness checks, demo seed safety, production pilot masking  
**Confidence:** High for repo-specific surfaces; medium for exact new helper names because names are implementation choices.

<user_constraints>

## User Constraints from CONTEXT.md

- Runtime modes are exactly `local_demo`, `public_demo`, and `production_pilot`.
- Keep existing `ENVIRONMENT` for platform/deployment semantics; runtime mode controls product intent for demo seed, demo login, and pilot readiness.
- Missing runtime mode must preserve safe local/demo development behavior.
- Preserve readiness status vocabulary: checks use `pass`/`warn`/`fail`; reports use `ready`/`degraded`/`not_ready`.
- Preserve `/health/ready` HTTP behavior: return 503 only for `not_ready`.
- Public demo may be `degraded` or `not_ready` while demo seed is intentionally enabled.
- Production pilot must fail readiness for unsafe demo seed, demo login, insecure cookies, unsafe origins, missing DB/migrations, placeholder secrets, or incompatible mode/config combinations.
- Production pilot boot must not create demo users, demo links, or walkthrough data.
- Public readiness remains minimal. Admin readiness can include safe metadata, but no secrets, cookie values, connection strings, provider credentials, SMTP credentials, token-like values, or raw student data.
- Phase 28 is backend/API/config focused. Deployment guard commands and smoke split are Phase 29; identity contracts are Phase 30; pilot checklist UI is Phase 31.

</user_constraints>

## Executive Summary

Phase 28 should extend the existing FastAPI/Pydantic readiness foundation rather than introduce new infrastructure. The backend already has centralized `Settings`, public `/health/ready`, admin `/api/admin/operations/readiness`, static readiness checks, DB connectivity checks, Alembic migration checks, demo seed tests, and readiness masking tests.

The key architectural change is adding explicit `RUNTIME_MODE` with exactly `local_demo`, `public_demo`, and `production_pilot`, while preserving `ENVIRONMENT` as platform/deployment semantics. Production pilot readiness must be stricter than current generic production checks and must fail on unsafe seed/login/cookie/origin/database/migration/placeholder-secret states.

Recommended Phase 28 slice:

1. Add runtime-mode fields/helpers in `backend/app/core/config.py`.
2. Extend `backend/app/services/readiness.py` with composable runtime-mode and production-pilot checks.
3. Prevent demo seeding from writing rows in `production_pilot` while keeping `public_demo` seeding intact.
4. Block demo-user login in `production_pilot` without replacing existing auth.
5. Expose safe runtime metadata through admin readiness/operations, not public readiness.
6. Add targeted backend tests and minimal env/docs/render updates.

## Existing Architecture and Reusable Patterns

### Settings/config

- `backend/app/core/config.py` defines `Settings` using `pydantic_settings.BaseSettings`, env aliases, defaults, and cached `get_settings()`.
- Tests that mutate env should call `get_settings.cache_clear()` before and after, matching existing `test_demo_seed.py` patterns.
- Add fields directly to `Settings` with defaults that preserve local development behavior.
- Do not infer runtime mode from `ENVIRONMENT`; current Render public demo uses `ENVIRONMENT=production` plus demo seeding.

### Readiness

- `backend/app/services/readiness.py` has `evaluate_static_readiness_checks(settings)` returning `ReadinessCheck` objects with `key`, `category`, `status`, `summary`, and optional `remediation`.
- `build_readiness_report()` appends database connectivity and Alembic migration checks after static checks.
- `_overall_status()` already aggregates check statuses: any `fail` -> `not_ready`, any `warn` -> `degraded`, otherwise `ready`.
- `readiness_http_status()` already returns 503 only for `not_ready`.
- Prefer small composable checks so admin operations can point to clear remediation.

### Public/admin split

- Public `/health/ready` returns only `status` and `generated_at`.
- Admin `/api/admin/operations/readiness` is behind admin authorization and can return detailed `ReadinessReport`.
- Runtime-mode visibility should be admin-only or operations metadata, not public readiness.

### Demo seed

- `backend/app/seeds/demo_seed.py` currently refuses when `ALLOW_DEMO_SEED=false`, otherwise creates/upserts four demo roles and walkthrough content.
- `render.yaml` currently runs `alembic upgrade head && python -m app.seeds.demo_seed && uvicorn ...` with `ALLOW_DEMO_SEED=true`.
- Add a production-pilot guard before any DB writes. Public demo should keep seeding intentionally.

### Admin operations metadata

- `backend/app/services/admin_operations.py` already has sanitizer patterns for metadata-only operations and dashboard summaries.
- Existing dashboard includes readiness summary, demo seed summary, connectivity summary, production smoke checklist, delivery, v1.2 audit, v1.4 audit, and audit summary.
- Extend existing metadata surfaces rather than creating new UI or new routes in Phase 28.

## Recommended Implementation Approach

### 1. Add runtime mode contract to `Settings`

Recommended shape:

```python
RuntimeMode = Literal["local_demo", "public_demo", "production_pilot"]

runtime_mode: RuntimeMode = Field(default="local_demo", validation_alias="RUNTIME_MODE")
allow_demo_login: bool = Field(default=True, validation_alias="ALLOW_DEMO_LOGIN")

@property
def is_local_demo(self) -> bool: ...

@property
def is_public_demo(self) -> bool: ...

@property
def is_production_pilot(self) -> bool: ...

@property
def is_demo_runtime(self) -> bool: ...
```

Recommended behavior:

- Default `RUNTIME_MODE=local_demo`.
- Invalid runtime mode should fail settings validation early.
- `ALLOW_DEMO_LOGIN=true` should remain compatible for local/public demo but fail readiness in `production_pilot`.
- Keep existing `ENVIRONMENT` field and production platform checks; do not reinterpret all `ENVIRONMENT=production` deployments as production pilot.

### 2. Extend static readiness checks

Recommended check keys:

| Key | Category | Production pilot fail condition |
|---|---|---|
| `runtime_mode` | configuration | Runtime mode is absent/invalid; normally caught by settings validation. |
| `runtime_environment_compatibility` | configuration | Contradictory combinations such as `production_pilot` with non-production `ENVIRONMENT`, or `local_demo` with production `ENVIRONMENT`. |
| `demo_seed_policy` | configuration | `production_pilot` and `ALLOW_DEMO_SEED=true`. |
| `demo_login_policy` | authentication | `production_pilot` and `ALLOW_DEMO_LOGIN=true`. |
| `origin_security` | security | `production_pilot` with wildcard, localhost, `127.0.0.1`, or non-HTTPS frontend origins. |
| `cookie_security` | security | `production_pilot` with insecure cookie settings or incompatible `SameSite`/`Secure` combination. |
| `frontend_api_contract` | configuration | Missing or unsafe deployed frontend/backend API compatibility metadata needed for pilot. |
| `provider_secrets` | configuration | Enabled provider has missing or placeholder secret in pilot. |
| `identity_configuration` | authentication | Demo identity/login remains enabled or placeholder identity mode is incompatible with pilot. |
| `database_connectivity` | database | Existing DB check fails. |
| `alembic_migration` | database | Existing migration check fails. |

Use safe remediation strings that never echo configured values. Examples:

- `Set RUNTIME_MODE to one of the approved runtime modes.`
- `Disable demo seeding before production pilot launch.`
- `Disable demo login before production pilot launch.`
- `Configure exact HTTPS frontend origins for production pilot.`
- `Enable secure cookie settings for deployed HTTPS.`
- `Configure required backend secrets before production pilot readiness.`

### 3. Adjust strictness by runtime mode

- `production_pilot`: strict failures for unsafe seed/login/cookie/origin/provider/database/migration states.
- `public_demo`: preserve intentional seed path and do not call it pilot-ready; `degraded` or `not_ready` is acceptable when demo seed is enabled.
- `local_demo`: preserve current local tests/dev behavior; use warnings rather than surprise blockers where possible.

### 4. Guard demo seed in production pilot

Recommended early guard:

```python
def seed_demo_data(db: OrmSession, settings: Settings) -> bool:
    if settings.is_production_pilot:
        return False
    if not settings.allow_demo_seed:
        return False
    ...
```

This guard must run before `_upsert_demo_user()` or any content/link/SOS seed helper. Readiness should still fail if `production_pilot` has `ALLOW_DEMO_SEED=true`, even if the seed function no-ops safely.

### 5. Guard demo login in production pilot

Current login accepts active users with valid credentials and does not block `user.is_demo` by runtime. Add a minimal guard in `backend/app/api/auth.py` or an auth helper:

```python
if settings.is_production_pilot and user.is_demo:
    raise HTTPException(status_code=403, detail="Demo accounts are disabled in production pilot mode.")
```

Do not replace the current email/password flow. Do not implement OAuth/SSO in Phase 28.

### 6. Keep schemas minimal

- `ReadinessCheck` likely already has enough fields.
- Do not add runtime mode to `PublicReadinessResponse`.
- If operations dashboard needs runtime mode, add a small admin-only schema such as `RuntimeModeSummary` with safe tokens/booleans only.

### 7. Minimal docs/config updates

Update in Phase 28:

- `backend/.env.example`: add `RUNTIME_MODE=local_demo` and `ALLOW_DEMO_LOGIN=true`.
- `render.yaml`: set current public demo service to `RUNTIME_MODE=public_demo` while keeping `ALLOW_DEMO_SEED=true`.
- `README.md`: clarify public demo vs production-pilot readiness and the intentional demo seed behavior.

Defer to Phase 29:

- Deployment guardrail command.
- Vercel root validation.
- Frontend env validation.
- Demo/pilot smoke split.

## Requirement Coverage Notes (RUNTIME-01..RUNTIME-05)

### RUNTIME-01

Plan should add safe runtime-mode visibility via admin readiness or operations metadata using stable tokens `local_demo`, `public_demo`, and `production_pilot`. Do not add runtime mode to public readiness if following D-12 strictly.

### RUNTIME-02

Plan should include fail-path tests for:

- `production_pilot + ALLOW_DEMO_SEED=true`
- `production_pilot + ALLOW_DEMO_LOGIN=true`
- `production_pilot + SESSION_COOKIE_SECURE=false`
- `production_pilot + localhost/non-HTTPS/wildcard origins`
- existing DB connectivity failure
- existing migration failure
- placeholder provider secrets/config when the provider is enabled

### RUNTIME-03

Plan should include at least one service-level static readiness test where production-pilot config passes all static checks. Full `/health/ready` ready behavior still depends on a reachable DB and current Alembic revision through existing checks.

### RUNTIME-04

Plan should include tests proving:

- `seed_demo_data()` returns false and creates no users/content in `production_pilot`.
- `seed_demo_data()` still creates idempotent public demo users/content in `public_demo`.

### RUNTIME-05

Plan should preserve public readiness response shape and add regression assertions that admin readiness/operations responses do not contain:

- database URL / connection string
- cookie value
- demo password
- provider API key
- SMTP password
- token-like values
- raw student data

## Test Strategy

### Targeted backend tests

Add or extend tests in `backend/tests/test_phase7_readiness.py`:

1. `test_settings_runtime_mode_defaults_to_local_demo`
2. `test_settings_rejects_unknown_runtime_mode`
3. `test_production_pilot_readiness_flags_demo_seed_and_demo_login`
4. `test_production_pilot_readiness_flags_cookie_and_origin_drift`
5. `test_production_pilot_static_readiness_can_pass_safe_config`
6. `test_public_ready_response_remains_minimal_with_runtime_mode`
7. `test_admin_readiness_exposes_runtime_mode_without_secret_values`

Add or extend tests in `backend/tests/test_demo_seed.py`:

1. `test_demo_seed_refuses_in_production_pilot_even_if_allow_demo_seed_true`
2. `test_public_demo_seed_still_runs_when_enabled`

Add an auth test in the existing auth test file, or create a small targeted backend auth test if no suitable file exists:

1. `test_production_pilot_blocks_demo_user_login`

### Verification commands

Targeted gate:

```powershell
Set-Location D:\BeYou\backend
python -m pytest tests/test_phase7_readiness.py tests/test_demo_seed.py
python -m ruff check .
```

Full backend gate:

```powershell
Set-Location D:\BeYou\backend
python -m pytest
python -m ruff check .
```

Frontend gates are not expected to change in Phase 28, but full milestone execution may still run existing frontend tests/lint/build after backend work.

## Files Likely Modified

| File | Why |
|---|---|
| `backend/app/core/config.py` | Add `RUNTIME_MODE`, `ALLOW_DEMO_LOGIN`, validators/helpers, and local defaults. |
| `backend/app/services/readiness.py` | Add runtime-mode, demo seed/login, compatibility, frontend contract, and stricter production-pilot checks. |
| `backend/app/schemas/readiness.py` | Probably no public shape change; only change if admin-only safe metadata needs schema support. |
| `backend/app/api/auth.py` | Add production-pilot demo-user login guard. |
| `backend/app/seeds/demo_seed.py` | Add production-pilot no-op guard before writes. |
| `backend/app/services/admin_operations.py` | Add safe runtime metadata and possibly avoid raw origin values in operations summary. |
| `backend/app/schemas/admin_operations.py` | Add safe runtime metadata fields if the operations dashboard surfaces runtime mode. |
| `backend/tests/test_phase7_readiness.py` | Add readiness, masking, and runtime-mode tests. |
| `backend/tests/test_demo_seed.py` | Add production-pilot no-op and public-demo still-seeds tests. |
| Existing auth tests | Add production-pilot demo login denial. |
| `backend/.env.example` | Document runtime mode and demo login defaults. |
| `render.yaml` | Mark current deployed demo as `RUNTIME_MODE=public_demo`. |
| `README.md` | Add concise demo-vs-production-pilot readiness note. |

## Pitfalls and Guardrails

### Pydantic settings cache

Tests that mutate env must clear `get_settings.cache_clear()` before and after. Otherwise old env values can leak across tests.

### App creation vs dependency settings

CORS middleware reads settings during `create_app()`, while readiness endpoints also use `get_settings()`. Tests that assert readiness should prefer direct service functions or dependency overrides; tests that assert CORS middleware should create a fresh app with desired settings.

### Do not make `ENVIRONMENT=production` mean production pilot

Current public demo Render config uses `ENVIRONMENT=production` and `ALLOW_DEMO_SEED=true`. Phase 28 must not break public demo by treating every production environment as production pilot.

### Demo seed no-op is not enough

If `production_pilot` has `ALLOW_DEMO_SEED=true`, seed can no-op safely, but readiness must still fail with explicit remediation.

### Avoid leaking values in remediation

Do not echo env values, URLs, passwords, cookies, tokens, provider credentials, SMTP credentials, or connection strings in readiness summaries/remediation.

### Keep public readiness shape stable

Public readiness should remain exactly status plus generated timestamp. Runtime mode belongs in admin-only detail.

### Be careful with admin operations connectivity

Current connectivity summary exposes `frontend_origin`, allowed-origin count, cookie name, secure flag, and SameSite. If treating raw origins as potentially sensitive, prefer counts/booleans or masked labels in Phase 28.

### Reuse existing DB and Alembic readiness

Do not hand-roll new DB/migration detection unless existing checks cannot satisfy a requirement.

## Security Domain

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | yes | Demo login must be disabled/blocked in production pilot. |
| V3 Session Management | yes | Existing backend-owned HttpOnly cookie session model remains. |
| V4 Access Control | yes | Admin readiness remains behind admin role/permission gates. |
| V5 Input Validation | yes | Pydantic settings validation and origin/cookie validators remain the standard. |
| V6 Cryptography/Secrets | yes | Readiness must not expose provider credentials, SMTP credentials, cookies, tokens, or connection strings. |

## Planning Recommendations

1. Start with `Settings` runtime mode and tests because all other Phase 28 changes depend on product intent being explicit.
2. Implement readiness checks before auth/seed behavior changes so every failure mode maps to RUNTIME-02/RUNTIME-03.
3. Add seed production-pilot guard before touching Render config because current Render start command invokes demo seed.
4. Add demo-user login guard after adding `ALLOW_DEMO_LOGIN`; current auth login does not block `is_demo` users by runtime.
5. Keep README/env/render updates minimal and defer smoke split/deploy guard scripts to Phase 29.
6. Do not add frontend UI in Phase 28.
7. Do not add identity provider models/contracts in Phase 28; only add minimal readiness placeholder/config checks needed for production pilot compatibility.

## Assumptions Log

| # | Claim | Risk if wrong |
|---|---|---|
| A1 | Invalid `RUNTIME_MODE` should fail settings validation early. | If implementation prefers readiness failure instead, tests must change. |
| A2 | `ALLOW_DEMO_LOGIN` should default true for compatibility and fail readiness only in `production_pilot`. | If default false, public demo entry could break. |
| A3 | Public readiness should not include runtime mode. | If operators need unauthenticated runtime metadata, this conflicts with CONTEXT.md D-12. |
| A4 | Existing DB/Alembic checks can satisfy database/migration portions of RUNTIME-02/RUNTIME-03. | If they cannot, planner must include targeted extension tasks. |

## Sources

### Planning and prior decisions

- `.planning/phases/28-runtime-mode-production-readiness-foundation/28-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/STACK.md`
- `.planning/research/PITFALLS.md`
- `.planning/milestones/v1.1-phases/07-production-readiness-safe-operations-foundation/07-CONTEXT.md`
- `.planning/milestones/v1.3-phases/19-demo-pilot-operations-readiness/19-CONTEXT.md`
- `.planning/milestones/v1.4-phases/26-cross-role-privacy-regression-demo-readiness/26-CONTEXT.md`

### Code and tests

- `backend/app/core/config.py`
- `backend/app/services/readiness.py`
- `backend/app/schemas/readiness.py`
- `backend/app/main.py`
- `backend/app/seeds/demo_seed.py`
- `backend/app/api/admin_operations.py`
- `backend/app/services/admin_operations.py`
- `backend/app/api/auth.py`
- `backend/tests/test_phase7_readiness.py`
- `backend/tests/test_demo_seed.py`
- `backend/.env.example`
- `render.yaml`
- `README.md`
- `copilot-instructions.md`

## Research Complete

This research is sufficient for planning Phase 28 with backend/config/readiness implementation tasks, targeted tests, safe docs/config updates, and no frontend UI work.
