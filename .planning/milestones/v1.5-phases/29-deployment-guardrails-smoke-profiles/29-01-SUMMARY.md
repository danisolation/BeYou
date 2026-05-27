---
phase: 29-deployment-guardrails-smoke-profiles
plan: 01
subsystem: infra
tags: [node, vercel, render, yaml, deployment-guardrails, smoke-readiness]

requires:
  - phase: 28-runtime-mode-production-readiness-foundation
    provides: Runtime mode, readiness, demo seed, origin, and cookie safety contracts for deployment validation
provides:
  - Deployment guardrail CLI for Render, Vercel, frontend API target, and Render env expectations
  - Pure guardrail validation helpers with Node regression coverage
  - Safe pass/warn/fail guardrail formatting that avoids secrets, cookie names, URLs, and demo emails
affects: [29-02-smoke-profiles, 29-03-admin-operations-metadata, 29-04-operations-ui-docs]

tech-stack:
  added: [yaml]
  patterns:
    - Pure Node `.mjs` validators exported separately from CLI entrypoint
    - Metadata-only guardrail output with env keys and remediations but no raw values

key-files:
  created:
    - frontend/scripts/deployment-guardrails.mjs
  modified:
    - frontend/scripts/deployment-guardrails.test.mjs
    - frontend/package.json
    - frontend/package-lock.json

key-decisions:
  - "Guardrail validation is config-only and deterministic by default; live endpoint checks remain in smoke profiles."
  - "BEYOU_VERCEL_ROOT warns when absent, fails when explicitly wrong, and passes only when set to frontend."
  - "Render env checks can be safely overridden through BEYOU_RENDER_* metadata fixtures without reading or printing real secrets."

patterns-established:
  - "Guardrail result shape: status, category, key, evidence, remediation, command, envKeys."
  - "CLI output is sanitized before printing and only exposes safe labels, statuses, command names, and env var keys."

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-03]

duration: 6 min
completed: 2026-05-25
---

# Phase 29 Plan 01: Deployment Guardrail CLI Summary

**Deterministic Render/Vercel/API deployment guardrails with safe metadata-only CLI output**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-25T09:22:11Z
- **Completed:** 2026-05-25T09:27:46Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `npm --prefix frontend run guard:deploy` for pre/post-deploy validation.
- Validates frontend API targets against missing, local, non-HTTPS, and backend mismatch cases.
- Validates Render backend shape, Vercel frontend shape, runtime/demo flags, cookie metadata, and exact frontend origin metadata.
- Added Node regression tests for guardrail helpers and safe output redaction.

## Task Commits

1. **Task 1: Add guardrail validation tests before CLI implementation** - `469ccd1` (test)
2. **Task 2: Implement deployment guardrail CLI with safe output** - `63290cc` (feat)

**Plan metadata:** pending docs commit

_Note: TDD task used separate RED and GREEN commits._

## Files Created/Modified

- `frontend/scripts/deployment-guardrails.mjs` - CLI, pure validators, config parsing, env expectation checks, safe output formatting.
- `frontend/scripts/deployment-guardrails.test.mjs` - Node tests for API target failures, Render/Vercel config, Render env expectations, and output redaction.
- `frontend/package.json` - Adds `guard:deploy` and `test:deploy-guardrails`.
- `frontend/package-lock.json` - Adds `yaml` dev dependency.

## Decisions Made

- Kept guardrail checks deterministic and local: no network calls, no real secret reads, and no live smoke behavior in this plan.
- Required exact `NEXT_PUBLIC_API_BASE_URL` and `BEYOU_EXPECTED_BACKEND_URL` match after trailing-slash normalization.
- Allowed `BEYOU_RENDER_*` operator overrides so public demo and production pilot fixtures can be verified without editing `render.yaml`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

Operators must provide the documented guardrail env keys when running `guard:deploy`; no separate setup artifact was needed.

## Next Phase Readiness

Ready for `29-02-PLAN.md`: smoke profile split can reuse the same safe URL validation conventions and npm script style.

---
*Phase: 29-deployment-guardrails-smoke-profiles*
*Completed: 2026-05-25*
