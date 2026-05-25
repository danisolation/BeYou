---
phase: 23-selective-mood-note-sharing-revocation
plan: 01
subsystem: selective-mood-note-sharing-revocation
requirements-completed: [SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05]
completed: 2026-05-25
---

# Phase 23 Plan 01: Selective Mood-Note Sharing & Revocation Summary

## Accomplishments

- Added student mood-note share options, share, per-adult revoke, and revoke-all endpoints.
- Added `MoodNoteShare` lifecycle service behavior for private-note scope, student-summary scope, idempotent re-share updates, revocation, and adult active-grant reads.
- Extended student mood history responses with `shareable`, `can_share_private_note`, and `active_shares`.
- Extended adult support summaries with a separate `shared_mood_notes` collection.
- Added student history UI for consent preview, selected adult confirmation, summary-only sharing, active-share state, per-adult revocation, and revoke-all.
- Added adult support-summary UI card that separates student-consented shared notes from aggregate mood trend.
- Added backend and frontend tests covering SHARE-01 through SHARE-05, revocation, privacy audit invariants, no side effects, and UI copy boundaries.
- Fixed the code-review finding by requiring joined `MoodCheckIn.student_id == student_id` during adult shared-note reads, with regression coverage for inconsistent cross-student rows.
- Removed unrelated stale backend imports so the required backend ruff gate passes.

## Requirements Covered

- **SHARE-01:** Students can share a selected own mood check-in private note or student-authored summary with selected active linked adults.
- **SHARE-02:** Student preview names selected adults, exact content scope, remaining-private boundary, revocation path, and no external notification/SOS/risk-score side effect.
- **SHARE-03:** Students can revoke one adult or all active shares for a check-in; revoked adult access disappears immediately.
- **SHARE-04:** Teacher/parent shared-note reads require active relationship and active unrevoked student grant.
- **SHARE-05:** Share/read/revoke audit metadata excludes raw private note, student summary text, shared note text, names, emails, contact identifiers, free-text reasons, and private content.

## Decisions Implemented

- **D-01:** Sharing starts from owned mood history and supports check-ins with private note or explicit student summary.
- **D-02:** Private-note sharing and student-authored summary sharing are distinct scopes; no text is auto-generated.
- **D-03:** Adults are selected from active linked adults; stale, revoked, disabled, and unlinked adults are rejected server-side.
- **D-04:** Re-sharing the same check-in/adult pair updates the active grant instead of creating duplicate active grants.
- **D-05:** Student UI shows confirmation preview with adults, scope, privacy boundary, and revocation path.
- **D-06:** Copy stays Vietnamese, supportive, consent-first, and non-clinical.
- **D-07:** Empty states guide students without pressure to share.
- **D-08:** Revocation controls sit next to active shares and clearly confirm access removal.
- **D-09:** Adults get a dedicated shared-note surface in support summaries; aggregate mood trends stay summary-only.
- **D-10:** Adult reads require role check, active relationship, and active `MoodNoteShare`.
- **D-11:** Adult UI presents shared notes as student-consented context, not monitoring or scoring.
- **D-12:** Revoked shares disappear from adult read responses immediately while audit remains metadata-only.
- **D-13:** Share/read/revoke audits include only safe IDs, scope, relationship type, flags, and counts.
- **D-14:** Audit metadata excludes raw note, raw summary, free-text reason, names, emails, and contact identifiers.
- **D-15:** Phase 23 does not create SOS alerts, adult notifications, external messages, risk scores, or background delivery.
- **D-16:** Tests prove revoked adults and unrelated linked adults cannot read unshared content.

## Files Changed

- `backend/app/api/student_mood_checkins.py`
- `backend/app/schemas/adult_summaries.py`
- `backend/app/schemas/mood_checkins.py`
- `backend/app/schemas/mood_note_shares.py`
- `backend/app/services/adult_summaries.py`
- `backend/app/services/mood_checkins.py`
- `backend/app/services/mood_note_shares.py`
- `backend/tests/test_phase14_adult_support_summaries.py`
- `backend/tests/test_phase23_mood_note_shares.py`
- `frontend/app/(authenticated)/student/mood-check-ins/history/page.tsx`
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx`
- `frontend/lib/adult-summary-api.ts`
- `frontend/lib/mood-checkin-api.ts`
- `frontend/tests/phase13-mood-checkins-ui.test.tsx`
- `frontend/tests/phase14-adult-support-summary-ui.test.tsx`
- `frontend/tests/phase23-mood-note-sharing-ui.test.tsx`
- `backend/app/services/admin_content.py`
- `backend/tests/test_phase3_admin_content_seed.py`
- `backend/tests/test_phase3_adult_summaries.py`

## Verification

- `cd D:\BeYou\backend; python -m pytest tests/test_phase23_mood_note_shares.py -q` - passed, 8 tests.
- `cd D:\BeYou\backend; python -m pytest tests/test_phase13_mood_checkins.py tests/test_phase14_adult_support_summaries.py tests/test_phase21_privacy_controls.py -q` - passed, 9 tests.
- `cd D:\BeYou\backend; python -m ruff check app tests` - passed.
- `cd D:\BeYou\frontend; npm test -- --run tests/phase23-mood-note-sharing-ui.test.tsx` - passed, 7 tests.
- `cd D:\BeYou\frontend; npm test -- --run tests/phase13-mood-checkins-ui.test.tsx tests/phase14-adult-support-summary-ui.test.tsx tests/phase22-notification-preferences-ui.test.tsx` - passed, 8 tests.
- `cd D:\BeYou\frontend; npm run lint` - passed.
- `cd D:\BeYou\frontend; npm run build` - passed.

## Privacy Grep Gates

- No `"/api/` child route decorators found in `backend/app/api/student_mood_checkins.py`.
- No forbidden audit metadata keys or raw private-content markers found inside Phase 23 audit metadata blocks.
- No sharing side-effect systems introduced for SOS alerts, adult notifications, external messages, risk scores, email/SMS/Zalo/push, workers, Celery, or background tasks.
- Adult read service requires active relationship plus active unrevoked `MoodNoteShare.revoked_at.is_(None)` and joined `MoodCheckIn.student_id == student_id`.
- UI forbidden-copy scan only finds the approved UI-SPEC exceptions: `không tạo điểm rủi ro` and `không tự tạo diễn giải hay chẩn đoán`.

## Deviations

- Backend ruff initially failed on three unrelated pre-existing unused imports; those imports were removed because ruff is a required Phase 23 verification gate.
- The code-review and verification agents returned artifact content instead of writing files, so the orchestrator wrote the final `23-REVIEW.md` and `23-VERIFICATION.md` artifacts directly.
