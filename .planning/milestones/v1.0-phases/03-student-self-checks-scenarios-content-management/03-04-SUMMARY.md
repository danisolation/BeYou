---
phase: 03-student-self-checks-scenarios-content-management
plan: 04
subsystem: adult-self-check-summary-api
tags: [fastapi, sqlalchemy, pydantic, postgres, privacy, authorization, audit, pytest]

requires:
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 01
    provides: Phase 3 self-check models, adult summary router registration, and linked-adult permission resources
  - phase: 03-student-self-checks-scenarios-content-management
    plan: 02
    provides: self-check attempt result fields and private raw-answer snapshots
provides:
  - Privacy-limited teacher and parent self-check summary APIs
  - Adult summary DTOs that exclude raw answers, answer text, score breakdowns, and scenario history
  - Latest plus up to 5 recent/30-day linked-student summary queries
  - Metadata-only sensitive_resource_read audit events for adult summary reads
affects: [phase-03-adult-ui, phase-04-support-portals, phase-06-privacy-hardening]

tech-stack:
  added: []
  patterns:
    - Adult summary routes delegate authorization, query limits, minimization, and audit to a service layer
    - Adult response schemas whitelist summary-only fields instead of reusing student raw-detail schemas
    - Successful teacher/parent summary reads commit metadata-only audit events

key-files:
  created:
    - backend/app/schemas/adult_summaries.py
    - backend/app/services/adult_summaries.py
    - backend/tests/test_phase3_adult_summaries.py
  modified:
    - backend/app/api/adult_summaries.py

key-decisions:
  - "Adult self-check summary responses include student context, latest summary, recent summaries, and is_demo only; raw answer and score-breakdown fields are not schema members."
  - "Recent adult summary history is capped to 5 attempts completed in the last 30 days while latest_summary always reflects the newest attempt."
  - "Every successful teacher/parent summary read writes sensitive_resource_read with relationship_check, purpose_key, decision, and student_id metadata only."

patterns-established:
  - "Teacher and parent summary routes live on the /api router at /teacher/students/{student_id}/self-check-summaries and /parent/students/{student_id}/self-check-summaries."
  - "Linked-adult authorization uses self_check_summary with support_not_surveillance before any summary response is returned."
  - "Adult summary tests assert serialized JSON does not contain saved raw answer text values."

requirements-completed: [TEST-06]
duration: 3min
completed: 2026-05-21
---

# Phase 03 Plan 04: Privacy-Limited Adult Self-Check Summary APIs Summary

**Linked teacher/parent summary-only self-check APIs with latest/recent limits and metadata-only sensitive-read audit**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-21T04:31:14Z
- **Completed:** 2026-05-21T04:34:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added adult summary DTOs that expose only student context, completion date, test type, risk/state label, advice summary, support suggestion, latest summary, recent summaries, and demo flags.
- Implemented a service that enforces linked teacher/parent `self_check_summary` permission for `support_not_surveillance`, returns latest plus up to 5 recent summaries from the last 30 days, and excludes raw answer rows.
- Recorded `sensitive_resource_read` audit events for every successful adult summary read with metadata-only `student_id`, `relationship_check`, `purpose_key`, and `decision`.
- Exposed teacher and parent routes under `/api/teacher/students/{student_id}/self-check-summaries` and `/api/parent/students/{student_id}/self-check-summaries`.
- Added TEST-06 regressions for linked access, unlinked denial, raw-answer omission, recent-limit behavior, and audit event creation.

## Task Commits

1. **RED tests:** `e5bf87a` (test) add failing adult summary privacy tests.
2. **Task 1: Create adult summary service and DTOs:** `673e064` (feat) implement adult summary service.
3. **Task 2: Expose teacher and parent summary-only endpoints:** `9ce4dac` (feat) expose adult summary endpoints.

## Files Created/Modified

- `backend/app/schemas/adult_summaries.py` - Adult summary-only Pydantic schemas with no raw-answer, answer-list, score-breakdown, or scenario-history fields.
- `backend/app/services/adult_summaries.py` - Linked-adult authorization, latest/recent summary query, DTO mapping, and metadata-only audit write.
- `backend/app/api/adult_summaries.py` - Teacher and parent summary endpoints registered under the existing `/api` router.
- `backend/tests/test_phase3_adult_summaries.py` - Service/schema/route security regressions for TEST-06.

## Decisions Made

- Used a dedicated `AdultStudentContext` nested DTO for allowed student context instead of returning profile/email data.
- Kept adult summary items score-free; the locked state label and supportive summary copy are sufficient for support without surveillance.
- Committed the audit event inside the read service so successful GET requests reliably persist the `sensitive_resource_read` event.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Auth Gates

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `cd backend; python -m alembic upgrade head` — passed.
- `cd backend; python -m pytest tests/test_phase3_adult_summaries.py -q` — passed, 4 passed.
- `cd backend; python -m pytest -q` — passed, 61 passed.
- Acceptance greps for `AdultSelfCheckSummaryResponse`, `sensitive_resource_read`, `summary_only`, teacher/parent route strings, and role checks — passed.
- Acceptance greps for forbidden `raw_answers` and `question_text_snapshot` in `backend/app/schemas/adult_summaries.py` — returned no matches.

## Next Phase Readiness

- Adult frontend work can call the summary endpoints and render Vietnamese labels `Tóm tắt gần nhất`, `Các lần gần đây`, `Tóm tắt gợi ý`, and `Gợi ý hỗ trợ`.
- Phase 4 support portals can build on metadata-audited summary reads without adult raw-answer access.

## Self-Check: PASSED

Verified from disk:
- Created summary, adult schemas, adult service, and adult summary test file exist.
- Modified adult summary router exists.
- Task commits `e5bf87a`, `673e064`, and `9ce4dac` exist in git history.

---
*Phase: 03-student-self-checks-scenarios-content-management*
*Completed: 2026-05-21*
