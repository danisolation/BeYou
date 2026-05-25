# Phase 26 v1.4 Regression Matrix

## Backend Coverage

| Requirement | Evidence |
|---|---|
| QA-01 consent/preferences | `backend/tests/test_phase21_privacy_controls.py`, `backend/tests/test_phase22_notification_preferences.py` |
| QA-01 quiet hours/pause | `backend/tests/test_phase22_notification_preferences.py::test_quiet_hours_and_pause_suppress_in_app_reminder` |
| QA-01 external-channel rejection | `backend/tests/test_phase22_notification_preferences.py::test_external_channels_are_rejected_for_v1_4`, `backend/tests/test_phase25_admin_policy_operations.py` |
| QA-01 no automatic SOS/adult alerts | `backend/tests/test_phase22_notification_preferences.py::test_student_controls_in_app_reminders_and_reminder_actions_create_no_sos` |
| QA-01 share authorization/revocation | `backend/tests/test_phase23_mood_note_shares.py` |
| QA-01 reason gating | `backend/tests/test_phase24_reason_access.py` |
| QA-01 metadata-only audit | `backend/tests/test_phase21_privacy_controls.py`, `backend/tests/test_phase23_mood_note_shares.py`, `backend/tests/test_phase24_reason_access.py`, `backend/tests/test_phase25_admin_policy_operations.py` |

## Frontend Coverage

| Requirement | Evidence |
|---|---|
| QA-02 student reminder controls | `frontend/tests/phase22-notification-preferences-ui.test.tsx` |
| QA-02 reminder card copy/actions | `frontend/tests/phase22-notification-preferences-ui.test.tsx` |
| QA-02 mood-note share/revoke UI | `frontend/tests/phase23-mood-note-sharing-ui.test.tsx` |
| QA-02 adult reason prompts | `frontend/tests/phase24-reason-access-ui.test.tsx` |
| QA-02 admin policy controls | `frontend/tests/phase25-admin-policy-operations-ui.test.tsx` |
| QA-02 operations metadata-only display | `frontend/tests/phase11-operations-ui.test.tsx`, `frontend/tests/phase25-admin-policy-operations-ui.test.tsx` |

## Full Gates

| Requirement | Command |
|---|---|
| QA-03 backend tests | `cd D:\BeYou\backend; python -m pytest` |
| QA-03 backend lint | `cd D:\BeYou\backend; python -m ruff check .` |
| QA-03 frontend tests | `cd D:\BeYou\frontend; npm test` |
| QA-03 frontend lint/build | `cd D:\BeYou\frontend; npm run lint; npm run build` |
| QA-03 production smoke | `cd D:\BeYou; npm --prefix frontend run smoke:production` |

## Documentation / Demo Readiness

| Requirement | Evidence |
|---|---|
| QA-04 v1.4 boundaries | `README.md`, Phase 26 verification report |
| QA-04 demo data warning | `README.md` live demo section |
| QA-04 deferred external delivery | `README.md` v1.4 privacy boundaries |
| QA-04 planning artifacts | `26-CONTEXT.md`, `26-UI-SPEC.md`, `26-01-PLAN.md`, `26-VERIFICATION.md` |
