# Phase 32: Privacy, Security & Release Gates - Research

**Researched:** 2026-05-26
**Domain:** release-gate verification, privacy/security regression, deployment/auth/readiness evidence
**Confidence:** High, based on planning artifacts, implementation files, tests, scripts, and documentation.

## Summary

Phase 32 should plan a release-gate matrix mapping QA-01 through QA-06 to exact commands, existing tests, new assertions, and accepted external constraints. Most foundations already exist from Phases 28-31, so the phase should avoid new product behavior and add targeted regression coverage and evidence only where gaps exist.

Primary recommendation: create executable plans split across backend release gates, deployment/smoke gates, frontend/privacy gates, docs/grep gates, and final verification evidence.

## Existing Coverage Map

| Requirement | Existing coverage | Gaps to strengthen |
|---|---|---|
| QA-01 | `backend/tests/test_phase7_readiness.py` covers runtime modes, production-pilot readiness fail/pass, demo seed/login flags, cookie/origin drift, and secret masking. `backend/tests/test_demo_seed.py` covers production-pilot seed no-op. | Add Phase 32 matrix assertions tying QA-01 to exact release gates and broaden forbidden secret/token marker checks where needed. |
| QA-02 | `frontend/scripts/deployment-guardrails.test.mjs`, `frontend/scripts/smoke-profiles.test.mjs`, `frontend/scripts/pilot-smoke.mjs`, `frontend/scripts/demo-smoke.mjs`, and `README.md` cover Vercel/Render expectations, CORS/cookie compatibility, and demo/pilot smoke split. | Add deterministic release-gate command coverage and document live pilot smoke constraints when pilot URLs or credentials are absent. |
| QA-03 | Existing backend and frontend auth/identity tests cover provider metadata, identity mapping denial, session metadata, privacy routing, and no browser token storage. | Add explicit Phase 32 source/test assertions rejecting OAuth callback/token-exchange/browser-token-storage additions. |
| QA-04 | Existing authorization, auth privacy, reason access, privacy controls, and mood-note share tests cover SOS-only adult visibility, active relationship checks, reason gates, selective sharing, and student-owned private data. | Add a consolidated cross-role invariant matrix so all privacy suites are required release gates. |
| QA-05 | Existing Phase 31 operations backend/frontend tests and operations UI tests reject raw emails, IDs, notes, transcripts, answers, reasons, tokens, exports, drilldowns, and risk leaderboard markers. | Add grep/docs gates for risky UI/documentation copy, export/reset controls, and surveillance-shaped terms. |
| QA-06 | README and Phase 31 verification establish backend pytest/ruff, frontend test/lint/build, guard/smoke, and docs-grep command style. | Create final `32-VERIFICATION.md` evidence map with exact command outcomes, constraints, and QA requirement mapping. |

## Recommended Plan Split

### Wave 1 - Backend release-gate matrix

Likely files:
- `backend/tests/test_phase32_release_gates.py`
- Existing suites to reference or extend only when necessary: `test_phase7_readiness.py`, `test_demo_seed.py`, `test_auth_privacy_portals.py`, `test_phase24_reason_access.py`, `test_phase25_admin_policy_operations.py`, `test_phase31_school_pilot_operations.py`

Recommended work:
- Add QA-01, QA-03, QA-04, and QA-05 explicit requirement assertions.
- Add reusable forbidden-marker checks for readiness, auth/identity, privacy, and operations metadata surfaces.
- Avoid changing production behavior unless a release-gate regression is discovered.

### Wave 2 - Node deploy/smoke gate hardening

Likely files:
- `frontend/scripts/deployment-guardrails.test.mjs`
- `frontend/scripts/smoke-profiles.test.mjs`
- Potential new file: `frontend/scripts/release-gates.test.mjs`
- `frontend/package.json` only if a new script is needed

Recommended work:
- Verify pilot smoke requires readiness `ready`, safe HTTPS URLs, CORS/cookie compatibility, and no demo-account dependency.
- Verify deploy guardrail output remains metadata-only and does not print raw secret/env values.
- Keep `smoke:production` as public-demo compatibility alias unless an existing test proves otherwise.

### Wave 3 - Frontend privacy/UI guardrails

Likely files:
- `frontend/tests/phase32-release-gates-ui.test.tsx`
- Existing suites to reference or extend only when necessary: `auth-portals.test.tsx`, `phase11-operations-ui.test.tsx`, `phase25-admin-policy-operations-ui.test.tsx`, `phase31-school-pilot-operations-ui.test.tsx`, `phase23-mood-note-sharing-ui.test.tsx`, `phase24-reason-access-ui.test.tsx`

Recommended work:
- Assert no browser token storage patterns are introduced.
- Assert operations/readiness UI does not expose raw student data, exports, reset actions, per-student drilldowns, risk leaderboards, raw provider claims, raw emails, or free-text reasons.
- Preserve intentional student-controlled shared mood-note behavior.

### Wave 4 - Docs/grep gates and operator command guidance

Likely files:
- `README.md`
- Potential script/test additions only if existing commands cannot express the release gates clearly

Recommended work:
- Add a concise v1.5 release-gates subsection with exact backend, frontend, deploy, smoke, and docs/privacy grep commands.
- Document that live `smoke:pilot` is constrained unless a real pilot deployment with safe URLs and production-pilot readiness exists.
- Keep docs support-oriented and avoid surveillance framing.

### Wave 5 - Final evidence

Likely file:
- `.planning/phases/32-privacy-security-release-gates/32-VERIFICATION.md`

Recommended work:
- Record exact command names, outcomes, requirement coverage, external constraints, and final release-gate status.

## Verification Command Set

Recommended deterministic local gates:

```powershell
Set-Location D:\BeYou\backend
python -m pytest
python -m ruff check .

Set-Location D:\BeYou\frontend
npm test
npm run lint
npm run build
npm run test:deploy-guardrails
npm run test:smoke-profiles

Set-Location D:\BeYou
npm --prefix frontend run guard:deploy
```

Conditional live gates:

```powershell
npm --prefix frontend run smoke:demo
npm --prefix frontend run smoke:pilot
```

`smoke:pilot` cannot be deterministic without safe real `BEYOU_FRONTEND_URL`, `BEYOU_BACKEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, and a production-pilot deployment whose `/health/ready` returns `ready`. If absent, record the live pilot smoke as constrained in `32-VERIFICATION.md` and rely on local script tests plus readiness/admin metadata gates.

## Privacy and Security Redlines

Phase 32 gates must reject:
- Raw identifiers, raw emails, private notes, SOS notes, chatbot transcripts, self-check/scenario answers.
- Secrets, token-like strings, cookie values, provider subjects, raw claims, raw origins containing credentials.
- Free-text reasons, raw exports/export URLs, destructive reset controls.
- Risk leaderboards, per-student drilldowns, surveillance-shaped operations copy.
- OAuth callback/token-exchange/browser token storage additions.
- Multi-school tenancy expansion and destructive pilot reset/export actions.

Nuance: selective mood-note sharing intentionally allows adults to see content a student explicitly shared. Phase 32 should not break that behavior, but operations/admin/readiness surfaces must remain metadata-only.

## Validation Architecture Advisory

Nyquist validation is disabled in `.planning/config.json`, so no required validation strategy artifact is needed. Advisory sampling:
- Per backend task: targeted pytest files plus `python -m ruff check .`.
- Per frontend task: targeted Vitest files plus lint.
- Per release gate: full backend pytest/ruff, full frontend test/lint/build, Node guard/smoke tests, docs/privacy grep gates, then constrained live smoke if env exists.

## Security Domain

Applicable controls:
- Authentication/session: backend-owned HttpOnly cookie sessions and no browser token storage.
- Access control: app role, active relationship, student SOS/share gates, and reason gates remain authoritative; identity claims do not authorize adult visibility.
- Input/config validation: settings/readiness reject unsafe provider metadata and unsafe origin/cookie combinations.
- Secrets: readiness, operations, and guardrails must mask or omit secrets and token-like values.
- Privacy: operations surfaces must stay counts/statuses/commands/remediation only.

## Open Questions Resolved by Agent Defaults

1. Live public-demo and production-pilot URLs may be unavailable during deterministic verification. Default: run local script tests and document live smoke constraints.
2. Add one consolidated `test_phase32_release_gates.py` while reusing existing suites.
3. Add a concise README release-gates subsection only if new/clarified commands are part of QA-06.

## Sources

- `.planning/phases/32-privacy-security-release-gates/32-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- Prior Phase 28, 29, 30, and 31 context, summary, and verification artifacts
- Backend readiness, auth, authorization, demo seed, and admin operations implementation/tests
- Frontend auth, operations, privacy UI tests and deployment/smoke scripts
- `README.md`, `render.yaml`, `backend/.env.example`, and `frontend/package.json`

---

*Phase: 32-privacy-security-release-gates*
*Research gathered: 2026-05-26*
