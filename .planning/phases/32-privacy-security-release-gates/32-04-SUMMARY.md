---
phase: 32-privacy-security-release-gates
plan: 04
subsystem: docs
tags: [readme, release-gates, smoke, privacy, operations]

requires:
  - phase: 32-privacy-security-release-gates
    plan: 02
    provides: `test:release-gates` and deterministic Node deploy/smoke gates.
  - phase: 32-privacy-security-release-gates
    plan: 03
    provides: Frontend privacy/UI release-gate test paths.
provides:
  - README Phase 32 release-gate command matrix for QA-01 through QA-06.
  - Live `smoke:pilot` constraint documentation and deterministic substitute commands.
  - Privacy grep guidance for metadata-only support-not-surveillance operations.
affects: [32-05-verification]

tech-stack:
  added: []
  patterns:
    - Release documentation maps QA IDs to exact executable commands.
    - Constrained live checks are recorded explicitly instead of being treated as passed.

key-files:
  modified:
    - README.md

key-decisions:
  - "Documented live `smoke:pilot` as constrained unless safe pilot URLs and readiness-ready production_pilot deployment exist."
  - "Kept privacy grep guidance as rejection/warning copy, not instructions to build exports, reset flows, risk leaderboards, or drilldowns."

patterns-established:
  - "`## Privacy, security, and release gates` is the operator-facing Phase 32 command matrix."
  - "`### Privacy grep gates` documents required safe terms and forbidden operational markers."

requirements-covered: [QA-05, QA-06]

duration: 9 min
completed: 2026-05-26
---

# Phase 32 Plan 04: README release-gate documentation Summary

**README now maps QA-01 through QA-06 to exact commands and documents live pilot smoke constraints.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-26T05:24:00Z
- **Completed:** 2026-05-26T05:33:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Added `## Privacy, security, and release gates` with a QA-01..QA-06 command matrix covering backend, frontend, Node, docs, lint, build, and full release gates.
- Added `### Live smoke constraints` with the exact constrained `smoke:pilot` sentence and deterministic substitute commands.
- Added `### Privacy grep gates` with safe required terms and forbidden marker search guidance.

## Task Commits

1. **Task 1: Add exact Phase 32 release-gate command matrix to README** - pending commit
2. **Task 2: Document live smoke:pilot constraints and deterministic substitutes** - pending commit
3. **Task 3: Add README privacy grep guidance for operations/readiness redlines** - pending commit

## Files Created/Modified

- `README.md` - Adds Phase 32 release-gate matrix, live smoke constraints, and privacy grep gates.

## Decisions Made

- Made live `smoke:pilot` evidence conditional on real safe pilot URLs/configuration and readiness `ready`.
- Explicitly stated that real student accounts, school domains, IdP credentials, and secrets are not required for deterministic Phase 32 verification.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## Verification

- `Select-String -Path README.md -Pattern ...` - required release-gate, live constraint, and privacy grep strings found.
- `npm run test:release-gates` - 8 passed.

## User Setup Required

Only live `smoke:pilot` requires real safe pilot URLs/configuration and readiness `ready`; deterministic gates require no external secrets.

## Next Phase Readiness

Ready for Plan 32-05 final verification evidence and release decision.

---
*Phase: 32-privacy-security-release-gates*
*Completed: 2026-05-26*
