# Phase 4: SOS Workflow & Adult Support Portals - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning  
**Mode:** Autonomous smart discuss (`/gsd-autonomous --only 4`, user said "don't ask")

<domain>

## Phase Boundary

Phase 4 delivers a student-confirmed SOS workflow, in-app adult notifications, visible SOS status progress, teacher handling controls, and parent/teacher support portals that combine SOS status with privacy-limited warning and self-check summaries.

In scope: SOS creation, confirmation, severity/source/note capture, linked-adult in-app notifications, status events (`sent` → `received` → `supporting` → `completed`), metadata-only audit, teacher warning summary groups, and parent status/support views.

Out of scope: external SMS/Zalo/email/push delivery, chatbot escalation, aggregate reports, risk leaderboards, raw self-check answer exposure, punitive monitoring, automatic emergency-service contact, and Phase 5+ chatbot features.

</domain>

<decisions>

## Implementation Decisions

### SOS Severity, Source, and Status Model
- SOS alerts use backend values `support` and `urgent` for severity. Vietnamese UI copy describes them as "Em cần người lớn liên hệ sớm" and "Em đang không an toàn ngay lúc này".
- SOS source is stored as a safe backend enum-like string. Phase 4 uses `student_dashboard` for the visible button and reserves `self_check_result`/`chatbot` for later integrations without implementing them.
- New SOS alerts start as `sent`; linked teachers can move them forward to `received`, `supporting`, and `completed`. Parent and student views are read-only for status after creation.
- Every status change writes a status-event row with actor, timestamp, previous status, new status, optional note, and `is_demo`.

### Confirmation UX and Student Copy
- The student dashboard shows a visible SOS support card/button without gamification.
- Before sending, the student must confirm in a modal/dialog-like panel with the Phase 1 copy: "Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin cậy được liên kết với em sẽ nhận thông báo trong BeYou."
- Optional note copy is calm and non-clinical. It asks what the student wants adults to know now, not for a diagnosis.
- The status progress display uses Vietnamese labels: `Đã gửi`, `Đã nhận`, `Đang hỗ trợ`, `Đã hoàn tất`.

### Notifications and Adult Visibility
- v1 notifications are in-app only. Creating an SOS alert creates notification rows for active linked teachers and parents.
- Notification text stays minimal and support-oriented; it does not include raw self-check answers or private assessment detail.
- Adults see the student's allowed identity context, school/class snapshots, severity, source, optional SOS note, and status. They do not see raw self-check answers.
- Successful SOS list/detail reads and status workflow changes are audited with metadata-only payloads.

### Teacher and Parent Boundaries
- Teachers can view linked students, warning/support groups, SOS alerts, notifications, and can update SOS status forward.
- Parent views show linked student SOS status plus permitted latest self-check/support summaries; parents cannot change SOS status in Phase 4.
- Teacher warning groups are support categories, not rankings: `Cần quan tâm` and `Nguy cơ cao`. They are derived from permitted summary labels/open SOS only.
- Adult UI language uses "hỗ trợ", "tóm tắt được phép xem", and "học sinh cần được quan tâm"; it avoids surveillance framing.

### Audit, Privacy, and Demo Separation
- SOS alerts are sensitive safety resources. Authorization is role + active relationship + purpose based.
- `sos_alert_created`, `sos_status_changed`, and `sensitive_resource_read` audit events contain only metadata such as relationship check, status, severity, and recipient count.
- Demo SOS alerts, notifications, status events, and UI cards carry `is_demo` and show the existing `Demo` badge/banner patterns.
- CORS/same-site mutation protection remains exact-origin and credentialed; no wildcard origins or browser token storage are introduced.

### the agent's Discretion
- The agent may choose exact file/module names, route grouping, DTO shapes, and responsive layout details if all locked privacy, audit, demo, Vietnamese copy, and status workflow requirements are met.
- The agent may keep frontend status updates simple and page-local rather than adding global polling; Phase 4 only requires visible in-app notification/status workflow.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Student-first BeYou product vision, Python backend, in-app SOS v1, non-clinical tone, and no external notification scope.
- `.planning/REQUIREMENTS.md` — SOS-01..SOS-06, TEACH-01..TEACH-03, PARENT-01..PARENT-03 requirements.
- `.planning/ROADMAP.md` — Phase 4 goal, dependency on Phase 3, and success criteria.
- `.planning/STATE.md` — Current milestone state and Phase 4 active focus.

### Safety, Privacy, Audit, Demo, UI
- `.planning/phases/01-safety-privacy-policy-foundation/01-VISIBILITY-MATRIX.md` — SOS alert visibility and summary-only adult boundaries.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUDIT-EVENT-CATALOG.yml` — SOS audit event requirements.
- `.planning/phases/01-safety-privacy-policy-foundation/01-SAFETY-COPY-GUIDE.md` — exact SOS copy and banned clinical/surveillance concepts.
- `.planning/phases/01-safety-privacy-policy-foundation/01-DEMO-DATA-POLICY.md` — demo data marking.
- `.planning/phases/03-student-self-checks-scenarios-content-management/03-CONTEXT.md` — adult summary-only and raw answer privacy decisions.
- `.planning/phases/03-student-self-checks-scenarios-content-management/03-04-SUMMARY.md` — adult summary API pattern and audit behavior.
- `.planning/phases/03-student-self-checks-scenarios-content-management/03-07-SUMMARY.md` — frontend adult/admin patterns and verification baseline.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets
- Backend: `app.db.models`, `app.core.authorization.require_permission`, `app.core.sessions.require_same_site_mutation`, `app.services.audit.record_audit_event`, adult summary service, teacher/parent/student routers.
- Frontend: `apiFetch`, `DemoBadge`, `EmptyState`, authenticated student/teacher/parent dashboards, adult summary helper/pages, Vitest and Playwright patterns.

### Established Patterns
- API routes are included in `main.py` with `/api` prefixes.
- Mutations call `require_same_site_mutation`; frontend uses cookie-authenticated `apiFetch` with `credentials: "include"` and no token storage.
- Adult summary APIs enforce linked-adult authorization in service code and write metadata-only `sensitive_resource_read` events.
- Demo records carry `is_demo` and UI renders existing demo indicators.

### Integration Points
- Add SOS/notification models and Alembic migration after `20260521_0003`.
- Extend authorization to `sos_alert`.
- Add schemas/services/routes for student SOS, teacher/parent SOS/support overview, and current-user notifications.
- Extend demo seed with an idempotent demo SOS alert and notifications.
- Extend student dashboard and adult portals with Phase 4 UI.

</code_context>

<specifics>

## Specific Ideas

- Student primary SOS card copy: `Gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.`
- Confirmation copy: `Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin cậy được liên kết với em sẽ nhận thông báo trong BeYou.`
- Boundary copy: `BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.`
- Emergency guidance: `Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc liên hệ nguồn hỗ trợ phù hợp tại nơi em sống.`
- Adult support copy should lead with actions like "đã nhận tín hiệu", "đang hỗ trợ", and "hoàn tất khi em đã có bước hỗ trợ phù hợp".

</specifics>

<deferred>

## Deferred Ideas

- External SMS/Zalo/email/push delivery.
- Chatbot-triggered SOS escalation.
- Automatic emergency-service contact.
- Counselor staffing/SLA handoff.
- Aggregate SOS analytics or school risk reports.
- Raw self-check answers or raw chat transcript access for adults.

</deferred>

---

*Phase: 04-sos-workflow-adult-support-portals*  
*Context gathered: 2026-05-21 via autonomous smart discuss*
