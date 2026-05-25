# Phase 26 UI Spec: Demo Readiness Documentation

**Status:** Approved for autonomous implementation
**Date:** 2026-05-25

## Surface

- `README.md`
- Phase 26 verification artifacts

## User Goal

Evaluators and future maintainers should understand what v1.4 demonstrates, which privacy boundaries are enforced, how demo data should be handled, and which external notification channels are intentionally deferred.

## Required Content

- Live demo frontend/backend URLs.
- Demo accounts and warning not to enter real student data into the public demo.
- v1.4 privacy boundaries:
  - in-app reminders only
  - student-controlled reminder consent and pause/quiet hours
  - student-granted mood-note sharing and revocation
  - reason-gated adult support access
  - admin policy defaults and operations metadata only
- Deferred items:
  - Zalo/SMS/push/email reminders
  - background queues/retries
  - multi-school tenancy
  - OAuth/SSO
- Verification commands for backend, frontend, build, lint, and production smoke.

## Forbidden Content

- Do not publish secrets, live cookies, API keys, real student data, raw notes, raw reason text, exports, or per-student risk drilldown instructions.

## Acceptance

- README and Phase 26 verification artifacts explain v1.4 boundaries and demo data.
- Production smoke result is captured in Phase 26 verification.

