---
phase: 29-deployment-guardrails-smoke-profiles
verified: 2026-05-25T10:15:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 29: Deployment Guardrails & Smoke Profiles Verification Report

**Phase Goal:** Operators can validate Vercel/Render deployment shape and run separate demo vs pilot smoke checks without false confidence.  
**Verified:** 2026-05-25T10:15:00Z  
**Status:** passed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Operator can run a deployment guardrail command that validates Render backend and Vercel frontend deployment expectations. | ✓ VERIFIED | `frontend/package.json` defines `guard:deploy`; `deployment-guardrails.mjs` validates Render `rootDir`, build/start/health and Vercel framework/build/install/root. Positive CLI spot-check exited 0 with all pass results. |
| 2 | Frontend production validation rejects missing, localhost, non-HTTPS, or mismatched API targets. | ✓ VERIFIED | `validateFrontendApiTarget` implements missing/local/non-HTTPS/mismatch failures; Node tests cover all four cases and passed. |
| 3 | Backend validation confirms exact credentialed CORS origins and production cookie requirements using safe metadata. | ✓ VERIFIED | Backend schemas expose `deployment_guardrails`; service computes `_exact_credentialed_origin_match`, `allowed_origin_count`, wildcard/local/HTTPS flags, and `credentialed_cors` without raw origins/cookie names. Backend tests passed. |
| 4 | Demo smoke and pilot smoke are separate; pilot smoke requires readiness `ready` and has no demo-user dependency. | ✓ VERIFIED | `smoke:demo` and `smoke:pilot` scripts exist separately. `pilot-smoke.mjs` throws unless readiness status is `ready`; source contains no demo emails or `BEYOU_DEMO_PASSWORD`; tests passed. |
| 5 | Deployment docs explain root directories, env vars, smoke commands, demo-vs-pilot readiness, and safe rollback. | ✓ VERIFIED | README contains deployment guardrails section, Vercel/Render root/build/start/health expectations, env var keys, `guard:deploy`, `smoke:demo`, `smoke:pilot`, demo-vs-pilot readiness, and safe rollback excluding destructive reset/raw export. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `frontend/scripts/deployment-guardrails.mjs` | Guardrail CLI and validators | ✓ VERIFIED | Exports validators and `main`; validates API target, Render, Vercel, profile env, CORS/cookie metadata; sanitized output. |
| `frontend/scripts/deployment-guardrails.test.mjs` | Guardrail regression tests | ✓ VERIFIED | 8 Node tests passed. |
| `frontend/scripts/smoke-utils.mjs` | Shared smoke helpers | ✓ VERIFIED | URL validation, readiness evaluation, health/CORS helpers implemented. |
| `frontend/scripts/demo-smoke.mjs` | Demo smoke profile | ✓ VERIFIED | Uses seeded demo role accounts and emits `DEMO_SMOKE_PASS`. |
| `frontend/scripts/pilot-smoke.mjs` | Pilot smoke profile | ✓ VERIFIED | Validates safe URLs, live/ready/CORS; requires readiness `ready`; no demo-account strings. |
| `frontend/scripts/production-smoke.mjs` | Compatibility runner | ✓ VERIFIED | Explicitly delegates to demo and points to `smoke:pilot`. |
| `backend/app/schemas/admin_operations.py` | Backend metadata schema | ✓ VERIFIED | Defines `DeploymentGuardrailItem`, `SmokeProfileItem`, and dashboard arrays. |
| `backend/app/services/admin_operations.py` | Backend metadata builders | ✓ VERIFIED | Builds safe guardrail/smoke metadata; no raw origins, cookie names, secrets, or demo emails in metadata evidence. |
| `frontend/lib/admin-operations-api.ts` | Frontend contract | ✓ VERIFIED | Types include deployment guardrails and smoke profiles. |
| `frontend/app/(authenticated)/admin/operations/page.tsx` | Operations UI panels | ✓ VERIFIED | Renders guardrail and smoke profile panels from backend data with nullish fallback arrays. |
| `README.md` | Operator docs | ✓ VERIFIED | Contains deployment shape, env keys, commands, readiness distinctions, rollback guidance. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `frontend/package.json` | `frontend/scripts/deployment-guardrails.mjs` | `guard:deploy` | ✓ WIRED | `"guard:deploy": "node scripts/deployment-guardrails.mjs"`. |
| `frontend/package.json` | `frontend/scripts/demo-smoke.mjs` | `smoke:demo` | ✓ WIRED | `"smoke:demo": "node scripts/demo-smoke.mjs"`. |
| `frontend/package.json` | `frontend/scripts/pilot-smoke.mjs` | `smoke:pilot` | ✓ WIRED | `"smoke:pilot": "node scripts/pilot-smoke.mjs"`. |
| `backend/app/services/admin_operations.py` | `backend/app/schemas/admin_operations.py` | Dashboard response fields | ✓ WIRED | `build_operations_dashboard()` populates `deployment_guardrails` and `smoke_profiles`. |
| `frontend/app/(authenticated)/admin/operations/page.tsx` | `frontend/lib/admin-operations-api.ts` | Typed API fetch | ✓ WIRED | Imports `AdminOperationsDashboard`, `DeploymentGuardrailItem`, `SmokeProfileItem`; renders fetched dashboard arrays. |
| `README.md` | `frontend/package.json` | Documented commands | ✓ WIRED | README command names match package scripts. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| Operations UI page | `dashboard.deployment_guardrails` / `dashboard.smoke_profiles` | `getAdminOperationsDashboard()` → `/api/admin/operations/dashboard` | Yes — backend service constructs metadata from settings/readiness | ✓ FLOWING |
| Backend dashboard response | `deployment_guardrails` | `_deployment_guardrails(settings)` | Yes — computed from runtime/demo flags and CORS/cookie settings | ✓ FLOWING |
| Backend dashboard response | `smoke_profiles` | `_smoke_profiles(settings, readiness_report)` | Yes — computed from runtime and readiness status | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Guardrail and smoke helper tests pass | `node --test scripts\deployment-guardrails.test.mjs scripts\smoke-profiles.test.mjs` | 13/13 passed | ✓ PASS |
| Backend operations metadata tests pass | `python -m pytest tests\test_phase11_operations_visibility.py tests\test_demo_seed.py -q` | 11 passed | ✓ PASS |
| Operations UI regression tests pass | `npm test -- tests\phase11-operations-ui.test.tsx tests\phase15-admin-metadata-closure-ui.test.tsx tests\phase25-admin-policy-operations-ui.test.tsx` | 3 files / 9 tests passed | ✓ PASS |
| Guardrail command positive profile exits successfully | `npm run guard:deploy` with safe public_demo env metadata | exited 0; all checks pass | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DEPLOY-01 | Plans 01, 04 | Guard command validates Render backend and Vercel frontend expectations. | ✓ SATISFIED | CLI/package script exists; validates Render/Vercel shape; README documents usage. |
| DEPLOY-02 | Plans 01, 02, 04 | Frontend validation rejects unsafe production API config. | ✓ SATISFIED | `validateFrontendApiTarget` and `validateSmokeUrls` fail missing/local/non-HTTPS/mismatch cases; tests passed. |
| DEPLOY-03 | Plans 01, 03, 04 | Backend validates exact credentialed CORS origins and production cookie settings. | ✓ SATISFIED | Backend safe metadata contract and tests verify exact match, HTTPS, no wildcard/local, secure SameSite=None. |
| DEPLOY-04 | Plans 02, 03, 04 | Demo and pilot smoke are separate; pilot requires ready and no demo users. | ✓ SATISFIED | Separate scripts/package commands; backend/UI metadata distinguishes demo and pilot; tests passed. |
| DEPLOY-05 | Plan 04 | Docs cover deployment, smoke, readiness, rollback. | ✓ SATISFIED | README contains root directories, env vars, smoke commands, readiness behavior, and safe rollback steps. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| Multiple CLI scripts | various | `console.log` | ℹ️ Info | Expected CLI output, not a stub. |
| URL normalization helpers | various | `return null` | ℹ️ Info | Valid invalid-input handling, not empty implementation. |
| Operations page filter inputs | 178,188,198 | `placeholder=` | ℹ️ Info | UI placeholder text only, not stub content. |

No blocker anti-patterns found.

### Human Verification Required

None.

### Gaps Summary

No gaps found. Phase 29 achieves its goal: deployment guardrails, safe frontend/backend validation, separated demo/pilot smoke profiles, backend/UI metadata, tests, and docs are implemented and wired end-to-end.

---

_Verified: 2026-05-25T10:15:00Z_  
_Verifier: gsd-verifier_
