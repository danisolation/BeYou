# Phase 05: Supportive Chatbot Gateway & Guardrails - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning  
**Mode:** Autonomous smart discuss (`/gsd-autonomous --only 5`, user said "don't ask")

<domain>

## Phase Boundary

Phase 05 delivers a backend-only supportive chatbot gateway for students, safety guardrails before and after LLM/provider output, a real `freemodel.dev` adapter path, deterministic local fallback, student chat UI, and minimal admin safety/content configuration.

In scope: student-owned chat sessions/messages, provider abstraction, non-clinical Vietnamese support copy, high-risk keyword/category detection, metadata-only safety audit events, escalation guidance toward SOS/trusted adults, and admin-managed safety keywords/copy without exposing secrets or disabling guardrails.

Out of scope: automatic emergency-service contact, external SMS/Zalo/email delivery, counselor staffing/SLA handoff, adult/admin raw transcript access, aggregate reports, risk leaderboards, and Phase 06 analytics.

</domain>

<decisions>

## Implementation Decisions

### Chat Storage and Privacy
- Chat threads and messages are stored so students can continue a conversation through the backend.
- Only the owning student can list/read raw chat transcript content in v1. Teachers, parents, and admins do not receive raw transcripts by default.
- High-risk safety signals are stored/audited as metadata summaries only; audit metadata never includes raw user messages, raw assistant content, API keys, tokens, or transcript fields.
- Demo chat records carry `is_demo` and reuse existing `Demo` UI indicators.

### Guardrail Categories and Flow
- Guardrails classify high-risk content with server-side rules before provider invocation and after provider response.
- Initial categories: self-harm/suicide, harm to others, immediate danger/abuse/coercion, and emergency/unsafe-now language.
- If student input is high risk, the backend does not request unrestricted LLM advice. It stores the student message, stores a safe assistant escalation response, records `high_risk_safety_event`, and returns SOS/trusted-adult guidance.
- If provider output is high risk, the backend replaces it with the same safe escalation response and records an output-stage safety event.

### Escalation Behavior
- High-risk responses are calm, supportive, Vietnamese, and non-clinical.
- The bot suggests using the existing SOS flow or finding a trusted adult nearby. It does not auto-create SOS, auto-call emergency services, or promise outside dispatch.
- The exact Phase 1 disclaimer remains visible: `BeYou không thay thế chuyên gia tư vấn hay bác sĩ. Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.`

### Provider Abstraction and Fallback
- Backend exposes a provider interface with `freemodel.dev` adapter and deterministic fallback provider.
- Default local/test behavior is deterministic fallback; no external calls in tests.
- `FREEMODEL_API_KEY` stays server-side only. Frontend receives only safe provider status such as fallback/real provider availability, never secrets.

### Admin Safety Config
- Admin can view/update safety keywords and supportive escalation copy through backend endpoints.
- Admin cannot disable guardrails, bypass backend safety checks, or configure/expose provider secrets from the frontend.
- Admin config mutations require same-site protection and metadata-only `admin_safety_content_changed` audit events.

### Student UI States
- Student chat lives at `/student/chat` and is linked from the student dashboard.
- First assistant response presents BeYou as supportive only, not therapist/doctor/diagnostic.
- UI shows loading, sending, high-risk escalation, error, and empty/welcome states with specific Vietnamese copy.
- High-risk response includes CTA back to existing SOS support on the student dashboard and guidance to contact a trusted adult.

### Audit Boundaries
- Successful student transcript reads are audited as sensitive reads with metadata only.
- High-risk input/output guardrail events are audited with category/stage/suggestion metadata only.
- Admin safety config reads and writes are metadata-only; write events include changed field names, not secret or raw transcript values.

### the agent's Discretion
- The agent may choose exact route/module names, DB column names, DTO shapes, and UI layout details if all locked privacy, safety, Vietnamese copy, provider-secret, audit, demo, and SOS-boundary requirements are met.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Python backend, freemodel.dev through backend only, chatbot non-clinical boundaries.
- `.planning/REQUIREMENTS.md` — CHAT-01..CHAT-06 and ADMIN-04.
- `.planning/ROADMAP.md` — Phase 05 goal and success criteria.
- `.planning/STATE.md` — Phase 05 current focus and validated prior decisions.

### Safety, Privacy, Audit, UI
- `.planning/phases/01-safety-privacy-policy-foundation/01-VISIBILITY-MATRIX.md` — raw chat transcript is student-only by default; safety signal is metadata-limited.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUDIT-EVENT-CATALOG.yml` — metadata-only audit event constraints and high-risk safety event shape.
- `.planning/phases/01-safety-privacy-policy-foundation/01-SAFETY-COPY-GUIDE.md` — exact chatbot disclaimer, SOS copy, and banned concepts.
- `.planning/phases/04-sos-workflow-adult-support-portals/04-CONTEXT.md` — completed in-app SOS workflow and no external emergency-service automation.
- `.planning/phases/04-sos-workflow-adult-support-portals/04-01-SUMMARY.md` — reusable SOS APIs and notification/status patterns.

### Code Patterns
- `backend/app/db/models.py` — SQLAlchemy models, enums, timestamps, demo flags.
- `backend/app/core/authorization.py` — deny-by-default permission gates.
- `backend/app/core/sessions.py` — cookie auth and same-site mutation guard.
- `backend/app/services/audit.py` — forbidden audit metadata keys.
- `frontend/lib/api.ts` — cookie-authenticated `apiFetch`.
- `frontend/app/(authenticated)/student/page.tsx` — student dashboard and SOS UI integration point.
- `frontend/app/(authenticated)/admin/page.tsx` and `frontend/app/(authenticated)/admin/content/page.tsx` — admin UI patterns.

</canonical_refs>

<specifics>

## Specific Ideas

- Student chat entry card: `Trò chuyện với BeYou`
- Student entry copy: `Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.`
- First backend assistant intro: `Chào em, mình là BeYou — một người bạn hỗ trợ trong ứng dụng. Mình không thay thế chuyên gia tư vấn hay bác sĩ.`
- High-risk title: `Mình muốn ưu tiên sự an toàn của em ngay lúc này.`
- High-risk guidance: `Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou để người lớn được liên kết biết em cần hỗ trợ.`
- Boundary copy: `BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.`

</specifics>

<deferred>

## Deferred Ideas

- Adult/admin raw transcript review.
- Automatic SOS creation from chatbot without student confirmation.
- External emergency-service/SMS/Zalo/email delivery.
- Human counselor staffing, SLA, escalation queues, or legal workflows.
- Aggregate reports or school risk analytics.
- Training or fine-tuning AI models on student chat data.

</deferred>

---

*Phase: 05-supportive-chatbot-gateway-guardrails*  
*Context gathered: 2026-05-21 via autonomous smart discuss*
