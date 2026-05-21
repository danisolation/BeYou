# Phase 05 Research: Supportive Chatbot Gateway & Guardrails

## Existing Architecture

- Backend is FastAPI with cookie-authenticated sessions and SQLAlchemy/Postgres models.
- Routers are registered in `backend/app/main.py` under `/api/...`.
- Mutating endpoints use `require_same_site_mutation`.
- Authorization is deny-by-default in `backend/app/core/authorization.py`.
- Audit events are stored in `audit_events`; `record_audit_event` rejects sensitive metadata keys such as tokens, API keys, and raw transcript labels.
- Phase 04 completed SOS models/services/routes and student/adult UI with in-app status workflow.
- Frontend uses Next client pages and `apiFetch` with `credentials: "include"`; no token storage.

## Implementation Options Considered

| Area | Option | Decision | Rationale |
|---|---|---|---|
| Provider | Call `freemodel.dev` directly from frontend | Rejected | Would expose API key and bypass backend guardrails. |
| Provider | Backend abstraction with real adapter + fallback | Chosen | Meets CHAT-02/03, keeps tests deterministic, supports later provider swap. |
| Storage | Stateless chat only | Rejected | Harder to prove privacy/audit boundaries and first-response behavior. |
| Storage | Student-owned threads/messages | Chosen | Enables chat history, own transcript reads, and no adult/admin raw access. |
| Safety | Provider-only moderation | Rejected | Requirements demand backend detects before and after LLM output. |
| Safety | Rule-based guardrail + provider response check | Chosen | Deterministic, testable, no external calls needed. |
| Admin | Admin can disable guardrails | Rejected | Violates ADMIN-04 and safety requirements. |
| Admin | Admin can manage keywords/copy only | Chosen | Useful demo control without bypassing backend protection. |

## Backend Design

### Data Model

- `chat_threads`: student-owned conversation metadata, `is_demo`, timestamps.
- `chat_messages`: raw own-student transcript records for student UI only.
- `chat_safety_signals`: metadata-only safety signal records with stage/category/summary/escalation suggestion.
- `chatbot_safety_configs`: singleton/default safety config with keywords and safe escalation copy.

### Routes

- `POST /api/student/chat/messages` — student sends a message; backend creates/continues thread, applies pre/post guardrails, stores messages, returns assistant response and safety result.
- `GET /api/student/chat/threads` — student lists own threads, metadata only.
- `GET /api/student/chat/threads/{thread_id}/messages` — student reads own transcript, audited as sensitive read.
- `GET /api/admin/chatbot/config` — admin reads safety config without secrets.
- `PATCH /api/admin/chatbot/config` — admin updates keywords/copy with same-site guard and audit.

### Provider

- `ChatProvider` protocol returns text.
- `DeterministicSupportProvider` is default fallback and test/demo provider.
- `FreemodelProvider` uses backend-only `FREEMODEL_API_KEY`, `FREEMODEL_BASE_URL`, and `FREEMODEL_MODEL`; it is only selected when configured.

## Frontend Design

- Add student dashboard entry card linking to `/student/chat`.
- Add `frontend/lib/chat-api.ts` typed helper using existing `apiFetch`.
- Add `/student/chat` with message bubbles, high-risk panel, SOS CTA, and no provider secret display.
- Add admin dashboard entry card and `/admin/chatbot` config page.
- Add Vitest coverage for API paths, no token storage, first response/high-risk/admin copy.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| API key exposure | Settings only on backend; schemas omit secrets; frontend tests assert no key fields/rendered copy. |
| Raw transcript leakage | No adult/admin transcript endpoints; authorization only allows owning student; audit metadata forbidden keys extended if needed. |
| Unsafe LLM output | Post-provider guardrail replaces unsafe output with escalation guidance. |
| High-risk advice too permissive | Pre-provider guardrail blocks unrestricted advice and suggests SOS/trusted adult. |
| Tests making network calls | Default provider fallback; unit tests do not set real provider/API key. |
| Admin bypassing safety | Config endpoint does not expose disable switches; server guardrail always runs. |

## Plan-Checker Self-Review

- Goal coverage: CHAT-01..CHAT-06 and ADMIN-04 each map to backend/API/UI/test tasks.
- Dependency coverage: Phase 04 SOS is reused via links/CTA, not duplicated.
- Privacy coverage: raw transcripts student-only; adult/admin default denial is explicit.
- Testability: backend tests cover provider abstraction/fallback, pre/post guardrails, audit, auth, admin config; frontend tests cover UI and API helper behavior.
- Scope control: no reports, external notifications, auto emergency contact, or Phase 06 work.

