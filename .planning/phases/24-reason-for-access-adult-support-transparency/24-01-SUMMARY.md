---
phase: 24-reason-for-access-adult-support-transparency
plan: 01
subsystem: adult-access-reason-transparency
requirements-completed: [ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05]
completed: 2026-05-25
---

# Phase 24 Plan 01: Reason-for-Access Adult Support Transparency Summary

## Accomplishments

- Added safe access reason option/status schemas and Vietnamese labels for the controlled v1.4 reason codes.
- Added optional `reason_code` query support to teacher and parent adult support-summary routes.
- Enforced policy-required reason gates after role/relationship authorization and before protected adult summary content returns.
- Returned safe HTTP 428 `access_reason_required` detail for missing required reasons and HTTP 422 for invalid/disallowed controlled reasons.
- Added metadata-only `adult_access_reason_checked` audits for allowed, missing, invalid, and unauthorized attempts.
- Propagated accepted controlled reason codes into support-summary and shared mood-note read audit metadata.
- Added adult support summary UI reason prompt, protected-content gating, parent reuse, and accepted-reason transparency card.
- Added backend and frontend tests covering ACCESS-01 through ACCESS-05, authorization boundaries, audit privacy, policy-disabled behavior, and supportive copy.

## Requirements Covered

- **ACCESS-01:** School policy can require a controlled reason prompt before teacher/parent support-summary and shared-note access.
- **ACCESS-02:** Teacher/parent must submit an allowed controlled reason code before protected content returns when policy requires it.
- **ACCESS-03:** Reason submission does not bypass role or active relationship authorization.
- **ACCESS-04:** Allowed, denied, invalid, and missing-reason attempts create metadata-only audit with safe reason code/status/resource metadata only.
- **ACCESS-05:** Adult UI copy frames the prompt as support/transparency and avoids discipline, surveillance, or free-text reason collection.

## Decisions Implemented

- Reason prompting is enforced on adult support summary reads and covers the shared mood notes returned inside that protected summary.
- Reason enforcement runs only after existing `require_permission` authorization checks.
- Missing required reason returns HTTP 428 with controlled reason options and no protected content.
- Invalid/disallowed reason returns HTTP 422 and records only a safe denial status, not the raw attempted string.
- Accepted reasons are controlled codes from policy defaults; free-text reason narratives are not collected.
- UI keeps support content hidden until the selected controlled reason succeeds.
- Parent support-summary pages reuse the same reason-prompt component through the shared teacher implementation.
- Audit remains metadata-only and excludes private notes, student summaries, raw reason text, names, emails, and contact identifiers.
- Phase 24 does not create SOS alerts, adult notifications, external messages, risk scores, or background delivery.

## Files Changed

- `backend/app/api/adult_summaries.py`
- `backend/app/schemas/adult_summaries.py`
- `backend/app/schemas/privacy_controls.py`
- `backend/app/services/adult_summaries.py`
- `backend/tests/test_phase14_adult_support_summaries.py`
- `backend/tests/test_phase23_mood_note_shares.py`
- `backend/tests/test_phase24_reason_access.py`
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx`
- `frontend/lib/adult-summary-api.ts`
- `frontend/tests/phase24-reason-access-ui.test.tsx`

## Verification

- `cd D:\BeYou\backend; python -m pytest tests\test_phase24_reason_access.py tests\test_phase14_adult_support_summaries.py tests\test_phase23_mood_note_shares.py tests\test_phase21_privacy_controls.py` - passed, 19 tests.
- `cd D:\BeYou\backend; python -m ruff check .` - passed.
- `cd D:\BeYou\frontend; npm test -- --run tests/phase24-reason-access-ui.test.tsx tests/phase14-adult-support-summary-ui.test.tsx tests/phase23-mood-note-sharing-ui.test.tsx` - passed, 13 tests.
- `cd D:\BeYou\frontend; npm run lint` - passed.
- `cd D:\BeYou\frontend; npm run build` - passed.
- Phase 24 code review - clean.

## Privacy Grep Gates

- No free-text reason input fields or raw reason text persistence were introduced.
- No forbidden audit metadata keys are written by Phase 24 reason-audit paths.
- No `"/api/` child route double-prefix was introduced in the adult summary router.
- No SOS, adult notification, external message, risk score, worker, Celery, or background delivery side-effect path was introduced.
- Adult shared-note reads remain bounded by active relationship plus active unrevoked student grant.

## Deviations

- The frontend 428 detector was adjusted to unwrap FastAPI's nested `{ detail: ... }` response shape so the reason prompt renders instead of a generic error state.

