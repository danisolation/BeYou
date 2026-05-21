---
phase: 05-supportive-chatbot-gateway-guardrails
plan: 01
subsystem: backend-chatbot-gateway-guardrails
tags: [fastapi, sqlalchemy, alembic, postgres, llm-provider, safety, audit, pytest]
requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, ADMIN-04]
completed: 2026-05-21
---

# Phase 05 Plan 01: Backend Chat Gateway Summary

Backend student chat is implemented with student-owned thread/message storage, deterministic fallback provider, `freemodel.dev` adapter path, pre/post high-risk guardrails, metadata-only safety audit, and admin safety config APIs.

## Accomplishments

- Added `chat_threads`, `chat_messages`, `chat_safety_signals`, and `chatbot_safety_configs` models plus Alembic migration.
- Added backend settings for `CHAT_PROVIDER`, `FREEMODEL_API_KEY`, base URL, model, and timeout.
- Added provider abstraction with deterministic fallback and backend-only `freemodel.dev` adapter.
- Added pre-input and post-output guardrails with high-risk escalation toward SOS/trusted adults.
- Added student chat send/list/read APIs and admin chatbot safety config GET/PATCH APIs.
- Extended authorization for student-private chat and admin chatbot config.
- Extended audit forbidden metadata vocabulary and added high-risk safety event auditing.
- Added backend regression coverage for first response, no secret exposure, high-risk input/output, transcript authorization, audit, and admin config.

## Commits

- `d77ebf2` — `test(05-01): add failing chatbot backend tests`
- `7723c66` — `feat(05-01): implement chatbot backend guardrails`

## Verification

- `cd backend; python -m alembic upgrade head` — passed.
- `cd backend; python -m pytest tests\test_phase5_chatbot_backend.py -q` — passed, 5 tests.
- `cd backend; python -m pytest -q` — passed, 76 tests.
- `cd backend; python -m ruff check app\services\chat.py app\api\chat.py app\schemas\chat.py tests\test_phase5_chatbot_backend.py` — passed.
- `cd backend; python -m ruff check app tests\test_phase5_chatbot_backend.py` — failed on pre-existing unused imports in `admin_content.py` and `sos.py`; Phase 05 chatbot files passed targeted Ruff after removing one new unused import.

## Deviations from Plan

- Did not add demo chat seed data. The backend creates default safety config lazily, avoiding new demo-seed cleanup coupling and keeping raw demo transcripts out of adult/admin views.

## Issues Encountered

- Full-app Ruff revealed pre-existing unused imports unrelated to Phase 05; not changed to avoid unrelated cleanup.

## Next Phase Readiness

Frontend can use:

- `POST /api/student/chat/messages`
- `GET /api/student/chat/threads`
- `GET /api/student/chat/threads/{thread_id}/messages`
- `GET /api/admin/chatbot/config`
- `PATCH /api/admin/chatbot/config`

All routes use existing cookie auth, same-site mutation guards for writes, and no browser token/API-key exposure.
