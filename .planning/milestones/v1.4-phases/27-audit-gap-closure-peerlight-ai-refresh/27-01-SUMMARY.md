---
phase: 27-audit-gap-closure-peerlight-ai-refresh
plan: 01
subsystem: audit-gap-closure-peerlight-ai-refresh
requirements-completed: [GAP-01, GAP-02, GAP-03, REFRESH-01, REFRESH-02, ACCESS-06, QA-05]
completed: 2026-05-25
---

# Phase 27 Summary: Audit Gap Closure & Peerlight AI Demo Refresh

**Status:** Complete  
**Completed:** 2026-05-25

## Scope Completed

- Closed v1.4 audit gaps by wiring school policy defaults into student notification preference creation/update, enforcing `note_sharing_enabled` in mood-note sharing, and removing raw `resource_id` from admin operations audit responses.
- Rebranded user-facing app surfaces from BeYou to Peerlight AI while keeping the legacy demo password unchanged.
- Refreshed student UX with Vietnamese-first labels, a collapsible student sidebar, updated dashboard cards/table, chat history/new-chat controls, and clearer SOS/settings actions.
- Changed visible self-check/result labels to `Bình thường`, `Cần quan tâm`, and `Nguy cơ cao` while preserving backend contract labels for compatibility.
- Expanded demo self-check seed content with non-proprietary psychological topics: school anxiety, depression signs, ADHD/focus, and autism/social communication.
- Restricted teacher/parent student lists and protected support-summary access to linked students who have sent SOS.
- Updated backend/frontend tests for the new policy runtime, SOS-only adult access, Peerlight AI copy, and refreshed student/adult UI expectations.

## Requirements Closed

- GAP-01: School policy defaults are consumed by student reminder runtime.
- GAP-02: Mood-note sharing honors the admin note-sharing policy toggle.
- GAP-03: Admin operations responses exclude raw `resource_id`.
- REFRESH-01: Peerlight AI Vietnamese-first rebrand and student UX refresh are complete.
- REFRESH-02: Demo psychological test seed content is richer and non-proprietary.
- ACCESS-06: Teacher/parent visibility requires active relationship plus student-sent SOS.
- QA-05: Full local validation and grep gates passed.

## Validation

- Backend: `python -m pytest --quiet` -> `129 passed`
- Backend: `python -m ruff check .` -> passed
- Frontend: `npm test -- --run` -> `20 files / 94 tests passed`
- Frontend: `npm run lint` -> passed
- Frontend: `npm run build` -> passed
- Grep gates: no blocked legacy copy in `frontend/app`, `frontend/components`, or `backend/app` except the intentional legacy demo password.
