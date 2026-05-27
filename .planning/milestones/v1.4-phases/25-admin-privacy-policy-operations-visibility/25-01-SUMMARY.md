---
phase: 25-admin-privacy-policy-operations-visibility
plan: 01
subsystem: admin-privacy-policy-operations
requirements-completed: [POLICY-01, POLICY-02, OPS-01, OPS-02, OPS-03]
completed: 2026-05-25
---

# Phase 25 Plan 01: Admin Privacy Policy & Operations Visibility Summary

## Accomplishments

- Added admin-only `/api/admin/privacy-policy` read/update endpoints for the default v1.4 school policy.
- Reused existing policy contracts while forbidding unknown fields so raw-note exposure toggles cannot be silently accepted.
- Enforced in-app-only v1.4 reminder channels and rejected external channel enablement.
- Added metadata-only `privacy_policy_updated` audit with counts/booleans only.
- Extended operations demo readiness with v1.4 policy, consent preference, reminder state, and share sample counts.
- Updated operations audit summaries to strip raw reason text and sanitize v1.4 forbidden metadata keys.
- Seeded safe demo v1.4 policy, reminder preference/state, and student-summary share sample.
- Added `/admin/privacy-policy` UI, admin dashboard entry, controlled reason choices, deferred channel cards, and v1.4 operations panel.
- Added backend and frontend tests covering POLICY-01, POLICY-02, OPS-01, OPS-02, and OPS-03.

## Requirements Covered

- **POLICY-01:** Admins can configure default in-app reminders, quiet hours, timezone, note sharing, reason requirements, and allowed controlled reason choices.
- **POLICY-02:** Policy saves validate safe defaults, reject external reminder channel enablement, and reject unknown raw-note exposure fields.
- **OPS-01:** Operations dashboard exposes metadata-only v1.4 buckets for notification preferences, reminders, note shares/reads, reason-gated support summaries, and policy updates.
- **OPS-02:** Operations views and audit summaries exclude raw notes, raw reason text, names/emails/contact identifiers where unsafe, private content, exports, risk ranking, and per-student drilldowns.
- **OPS-03:** Demo seed/readiness verifies v1.4 policy, consent preference, reminder state, and sharing sample state as counts only.

## Decisions Implemented

- Policy editing remains single-school/default-scope for v1.4.
- External Zalo/SMS/push/email reminder delivery remains unavailable and cannot be enabled through policy.
- Reason choices remain controlled codes; no free-text reason editor was added.
- Operations continues to be metadata-only and hides raw `reason` values from audit event responses.
- Demo seed adds synthetic v1.4 state but operations readiness only exposes counts/statuses.
- Admin UI copy frames controls as safety defaults and operations as support-not-surveillance.

## Files Changed

- `backend/app/api/admin_privacy_policy.py`
- `backend/app/main.py`
- `backend/app/schemas/admin_operations.py`
- `backend/app/schemas/privacy_controls.py`
- `backend/app/seeds/demo_seed.py`
- `backend/app/services/admin_operations.py`
- `backend/app/services/privacy_controls.py`
- `backend/tests/test_phase25_admin_policy_operations.py`
- `frontend/app/(authenticated)/admin/page.tsx`
- `frontend/app/(authenticated)/admin/operations/page.tsx`
- `frontend/app/(authenticated)/admin/privacy-policy/page.tsx`
- `frontend/lib/admin-operations-api.ts`
- `frontend/lib/admin-privacy-policy-api.ts`
- `frontend/tests/phase25-admin-policy-operations-ui.test.tsx`

## Verification

- `cd D:\BeYou\backend; python -m pytest tests\test_phase25_admin_policy_operations.py tests\test_phase21_privacy_controls.py tests\test_phase22_notification_preferences.py tests\test_phase23_mood_note_shares.py tests\test_phase24_reason_access.py tests\test_phase11_operations_visibility.py` - passed, 27 tests.
- `cd D:\BeYou\backend; python -m ruff check .` - passed.
- `cd D:\BeYou\frontend; npm test -- --run tests/phase25-admin-policy-operations-ui.test.tsx tests/phase11-operations-ui.test.tsx tests/phase22-notification-preferences-ui.test.tsx tests/phase24-reason-access-ui.test.tsx` - passed, 11 tests.
- `cd D:\BeYou\frontend; npm run lint` - passed.
- `cd D:\BeYou\frontend; npm run build` - passed.
- Phase 25 code review - clean.

## Privacy Grep Gates

- No external channel enablement path was introduced.
- No double `/api` child route prefix was introduced.
- No raw note/reason/email/identifier fields are exposed by Phase 25 operations paths.
- No export/download, risk ranking, per-student drilldown, external delivery, worker, or background task path was introduced.
- UI only shows controlled reason checkboxes and deferred external channel cards.

## Deviations

- Operations demo role responses now use non-identifying `account_key` values instead of demo email addresses.

