---
phase: 32-privacy-security-release-gates
plan: 02
subsystem: frontend-scripts
tags: [node-test, deployment-guardrails, smoke, release-gates, privacy]

requires:
  - phase: 29-deployment-guardrails-smoke-profiles
    provides: Deploy guardrail validators and split demo/pilot smoke profiles.
  - phase: 32-privacy-security-release-gates
    plan: 01
    provides: Backend release-gate precedent and metadata redline constants.
provides:
  - Deterministic Node release-gate tests for QA-02 and QA-06.
  - `npm run test:release-gates` script for local release-gate execution.
  - Guardrail output sanitizer hardening for token-like values and OAuth-style secret labels.
affects: [32-04-docs-release-gates, 32-05-verification]

tech-stack:
  added: []
  patterns:
    - Node release-gate tests use built-in `node:test` and no new dependencies.
    - Live pilot smoke constraints are explicit deterministic test evidence, not a false live pass.

key-files:
  created:
    - frontend/scripts/release-gates.test.mjs
  modified:
    - frontend/package.json
    - frontend/scripts/deployment-guardrails.mjs

key-decisions:
  - "Kept `smoke:demo`, `smoke:pilot`, and `smoke:production` semantics unchanged while adding a local release-gate test wrapper."
  - "Hardened guardrail output redaction when the QA-06 metadata-only gate covered lower-case token labels and JWT-like values."

patterns-established:
  - "`PHASE32_NODE_REQUIREMENT_IDS` maps Node release-gate coverage to QA-02 and QA-06."
  - "`test:release-gates` is the stable command for deterministic deployment/smoke release gates."

requirements-covered: [QA-02, QA-06]

duration: 16 min
completed: 2026-05-26
---

# Phase 32 Plan 02: Node deployment/smoke release gates Summary

**Node release gates now prove deploy/smoke split semantics locally and document live pilot smoke constraints.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-05-26T04:44:00Z
- **Completed:** 2026-05-26T05:00:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `frontend/scripts/release-gates.test.mjs` with 8 Node tests for production-pilot Render env expectations, safe deploy metadata, smoke URL failures, pilot/demo smoke separation, readiness-ready requirement, metadata-only guardrail output, and explicit live pilot smoke constraints.
- Added `npm run test:release-gates` without changing existing deploy/smoke script names.
- Extended deployment guardrail sanitizer coverage for `client_secret`, `access_token`, `refresh_token`, `id_token`, and JWT-like `eyJ...` token strings.

## Task Commits

1. **Task 1: Add deterministic QA-02 deploy/smoke release-gate Node tests** - pending commit
2. **Task 2: Wire release-gate Node test into package scripts** - pending commit
3. **Task 3: Assert deploy/smoke output remains metadata-only** - pending commit

## Files Created/Modified

- `frontend/scripts/release-gates.test.mjs` - Adds deterministic QA-02/QA-06 Node release gates.
- `frontend/package.json` - Adds `test:release-gates`.
- `frontend/scripts/deployment-guardrails.mjs` - Redacts lower-case token/secret labels and JWT-like values in formatted guardrail output.

## Decisions Made

- Used deterministic source and validator tests instead of requiring live pilot URLs or real pilot credentials.
- Preserved `smoke:production` as a demo compatibility alias while asserting it points operators to `smoke:pilot` for production-pilot readiness.

## Deviations from Plan

- Production script code changed only because the new metadata-only output test exposed a sanitizer coverage gap.

## Issues Encountered

- Existing guardrail sanitizer redacted uppercase env labels but not lower-case token labels or token-like `eyJ...` strings.

## Verification

- `npm run test:release-gates` - 8 passed.
- `npm run test:deploy-guardrails` - 8 passed.
- `npm run test:smoke-profiles` - 5 passed.

## User Setup Required

None for deterministic tests. Live `smoke:pilot` still requires safe `BEYOU_FRONTEND_URL`, `BEYOU_BACKEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, and a readiness-`ready` production-pilot deployment.

## Next Phase Readiness

Ready for Plan 32-03 frontend privacy/UI release-gate tests.

---
*Phase: 32-privacy-security-release-gates*
*Completed: 2026-05-26*
