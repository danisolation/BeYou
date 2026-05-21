---
phase: 03-student-self-checks-scenarios-content-management
plan: 06
subsystem: student-wellbeing-frontend
tags: [nextjs, react, typescript, vitest, privacy, student-ui]

requires:
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 02
    provides: Student self-check list, submit, result, history, and own-detail APIs
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 03
    provides: Student scenario browse, attempt, feedback, and history APIs
provides:
  - Typed frontend API helpers for Phase 3 student wellbeing endpoints
  - Student dashboard entry cards for self-checks and scenarios
  - Student self-check list, question flow, result, history, and raw-answer detail pages
  - Student scenario list, response/feedback, and private history pages
affects: [phase-03-final-verification, phase-04-student-safety-entry-points]

tech-stack:
  added: []
  patterns:
    - Cookie-authenticated frontend API helpers wrapping existing apiFetch
    - Client-side student pages with surface-specific Vietnamese empty/error copy
    - Vitest component coverage for API path usage and student wellbeing UI behavior

key-files:
  created:
    - frontend/lib/wellbeing-api.ts
    - frontend/app/(authenticated)/student/self-checks/page.tsx
    - frontend/app/(authenticated)/student/self-checks/[testId]/page.tsx
    - frontend/app/(authenticated)/student/self-checks/results/[attemptId]/page.tsx
    - frontend/app/(authenticated)/student/self-checks/history/page.tsx
    - frontend/app/(authenticated)/student/self-checks/history/[attemptId]/page.tsx
    - frontend/app/(authenticated)/student/scenarios/page.tsx
    - frontend/app/(authenticated)/student/scenarios/[scenarioId]/page.tsx
    - frontend/app/(authenticated)/student/scenarios/history/page.tsx
    - frontend/tests/student-wellbeing-ui.test.tsx
  modified:
    - frontend/app/(authenticated)/student/page.tsx

key-decisions:
  - "Student wellbeing API helpers use existing apiFetch only, preserving HttpOnly cookie auth and avoiding browser token storage."
  - "Self-check result pages lead with supportive headline, state label, and next action; score is rendered as secondary text-label metadata."
  - "Raw self-check answer snapshots are rendered only under the student self-check history detail route."
  - "Scenario feedback uses constructive/risky labels plus border styling so the feedback state is not color-only."

requirements-completed: [TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, SCEN-01, SCEN-02, SCEN-03, SCEN-04, SCEN-05]
duration: 6min
completed: 2026-05-21
---

# Phase 03 Plan 06: Student Frontend Self-Checks and Scenarios Summary

**Warm Vietnamese student UI for completing self-checks, reviewing private raw answers, practicing scenarios, and seeing constructive feedback**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-21T11:36:00Z
- **Completed:** 2026-05-21
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added `frontend/lib/wellbeing-api.ts` with typed helpers for all planned student self-check and scenario endpoints using existing cookie-authenticated `apiFetch`.
- Added student dashboard entry cards linking to self-check list/history and scenario list/history with exact Phase 3 UI contract copy.
- Built the student self-check list, question flow, result, history, and raw-answer detail pages with demo badges, privacy reminders, validation copy, and score as secondary metadata.
- Built the student scenario list, choice/feedback page, and private scenario history page with constructive/risky text labels, recommended response, lesson, and skill tag rendering.
- Added Vitest component/API-helper coverage for dashboard links, API paths, self-check flows, result ordering, raw answer history, scenario feedback, and scenario history empty copy.

## Task Commits

1. **Task 1 RED:** `6f64236` (test) add failing student wellbeing UI tests.
2. **Task 1 GREEN:** `43c2bd4` (feat) add wellbeing helpers and student entry cards.
3. **Task 2 RED:** `d55d02d` (test) add failing self-check UI flow tests.
4. **Task 2 GREEN:** `417c1f3` (feat) build student self-check flows.
5. **Task 3 RED:** `190b9ad` (test) add failing scenario UI flow tests.
6. **Task 3 GREEN:** `939eaef` (feat) build student scenario flows.

## Files Created/Modified

- `frontend/lib/wellbeing-api.ts` - Adds typed helpers and DTOs for self-check and scenario student APIs.
- `frontend/app/(authenticated)/student/page.tsx` - Adds wellbeing entry cards and adjusts card padding to the Phase 3 `p-6` contract.
- `frontend/app/(authenticated)/student/self-checks/page.tsx` - Lists published self-checks with demo badges, status, count, and CTA.
- `frontend/app/(authenticated)/student/self-checks/[testId]/page.tsx` - Implements the question flow, validation message, submit state, and result redirect.
- `frontend/app/(authenticated)/student/self-checks/results/[attemptId]/page.tsx` - Renders supportive result detail with score as secondary metadata.
- `frontend/app/(authenticated)/student/self-checks/history/page.tsx` - Lists the student's own self-check history with privacy reminder.
- `frontend/app/(authenticated)/student/self-checks/history/[attemptId]/page.tsx` - Shows private raw answer snapshots for the student's own completed attempt.
- `frontend/app/(authenticated)/student/scenarios/page.tsx` - Lists scenario cards with situation, skill tag, demo badge, and CTA.
- `frontend/app/(authenticated)/student/scenarios/[scenarioId]/page.tsx` - Supports one selected response, submit pending state, and feedback/recommended response/lesson/skill tag display.
- `frontend/app/(authenticated)/student/scenarios/history/page.tsx` - Lists private scenario attempt snapshots and exact empty state copy.
- `frontend/tests/student-wellbeing-ui.test.tsx` - Covers the Phase 3 student wellbeing UI contract.

## Decisions Made

- Used the existing backend history detail endpoint for result rendering so the frontend does not need a separate result-only API route.
- Kept all raw answer rendering inside `/student/self-checks/history/{attemptId}` surfaces and did not add adult/admin links from student raw-detail views.
- Used text labels alongside accent/warning borders for scenario feedback so constructive/risky state is accessible and not color-only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Updated existing student card padding to match UI contract**
- **Found during:** Task 1
- **Issue:** Existing linked-adult student dashboard card used `p-5`, while the Phase 3 UI contract requires valid card padding such as `p-6` and explicitly disallows `p-5` for this plan's surfaces.
- **Fix:** Updated the existing student dashboard linked-adult card to `rounded-3xl bg-white p-6 shadow-sm` while adding the new wellbeing entry cards.
- **Files modified:** `frontend/app/(authenticated)/student/page.tsx`
- **Commit:** `43c2bd4`

**2. [Rule 1 - Bug] Adjusted component tests for repeated privacy/skill labels**
- **Found during:** Tasks 2 and 3
- **Issue:** Tests initially expected globally unique copies that are intentionally repeated across list/detail surfaces, causing false failures while the UI behavior was correct.
- **Fix:** Updated tests to assert at least one matching privacy/skill label where repeated labels are expected.
- **Files modified:** `frontend/tests/student-wellbeing-ui.test.tsx`
- **Commit:** `417c1f3`, `939eaef`

**Total deviations:** 2 auto-fixed.

## Issues Encountered

- None blocking.

## Known Stubs

None.

## Threat Flags

None. The new frontend surfaces match the plan threat model: no browser token storage was added, form submissions send only selected IDs, raw self-check answers only render in the student history detail route, and copy remains non-diagnostic.

## Auth Gates

None.

## User Setup Required

None.

## Verification

- `cd frontend; npm run test -- --run student-wellbeing-ui` — passed, 9 tests.
- Acceptance checks for helper functions/API paths, exact dashboard/self-check/scenario copy, score-not-display styling, no `localStorage`/`sessionStorage`, no `Đúng/Sai`, and no forbidden self-check copy — passed.

## Self-Check: PASSED

Verified from disk:
- Created summary, wellbeing API helper, self-check pages, scenario pages, and UI test file exist.
- Modified student dashboard exists with wellbeing entry cards.
- Task commits `6f64236`, `43c2bd4`, `d55d02d`, `417c1f3`, `190b9ad`, and `939eaef` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
