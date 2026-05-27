---
phase: 05-supportive-chatbot-gateway-guardrails
status: all_fixed
fixed: 2026-05-21
---

# Phase 05 Review Fix Summary

All code review findings in `05-REVIEW.md` were fixed.

## Fixes

### F-01 fixed: high-risk first response includes disclaimer

- Wrapped high-risk escalation text with the first-response intro when it is the first assistant message.
- Added backend regression assertion that high-risk input response includes `không thay thế chuyên gia tư vấn hay bác sĩ`.

### F-02 fixed: provider fallback logs failures

- Added warning logging with exception type and stack trace before deterministic fallback.
- Fallback behavior remains safe and user-facing responses do not expose provider errors/secrets.

## Commit

- `b8a73a4` — `fix(05): harden chatbot safety fallback`

## Verification

- `cd backend; python -m pytest tests\test_phase5_chatbot_backend.py -q` — passed, 5 tests.
- `cd backend; python -m ruff check app\services\chat.py tests\test_phase5_chatbot_backend.py` — passed.
