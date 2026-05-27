---
phase: 04-sos-workflow-adult-support-portals
status: findings_found
reviewed: 2026-05-21
---

# Phase 04 Code Review

High-signal review found three real issues to fix.

## Findings

### F-01: Open SOS count returns only 0/1

- **Severity:** High
- **File:** `backend/app/services/sos.py`
- **Issue:** `_open_sos_count` uses `limit(1)` and converts existence to `int`, so students with multiple active SOS alerts show `open_sos_count: 1` instead of the true count.
- **Impact:** Adult support overview can understate active SOS workload/status.
- **Fix:** Use `select(func.count(SosAlert.id))`.

### F-02: Phase 4 backend cleanup omits privacy acknowledgements

- **Severity:** High
- **File:** `backend/tests/test_phase4_sos_backend.py`
- **Issue:** Test cleanup does not delete `PrivacyAcknowledgement` before `User`.
- **Impact:** Tests can fail with foreign-key leftovers when run after flows that acknowledge privacy.
- **Fix:** Add `PrivacyAcknowledgement` to the cleanup order before sessions/users.

### F-03: Demo notification marker can be lost for mixed demo links

- **Severity:** Medium
- **File:** `backend/app/services/sos.py`
- **Issue:** Notification `is_demo` uses `student.is_demo and recipient.is_demo`; a demo SOS sent to a non-demo linked adult becomes non-demo.
- **Impact:** Demo-originated safety notifications can lose visible demo separation.
- **Fix:** Mark notification demo if either side is demo (`or`) or enforce stricter link rules. Phase 4 fix uses `or`.

## Clean Areas

- Adult raw-answer privacy boundaries remain summary/support-only.
- Teacher-only status update authorization is enforced.
- SOS mutations use same-site mutation guard.
- Audit payloads remain metadata-only.
- Status transitions are sequential.
