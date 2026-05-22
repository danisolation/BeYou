# Phase 11: Metadata-Only Operational Visibility - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 11 adds admin operations visibility for production support without exposing sensitive student content. It should aggregate readiness status, SOS email delivery metadata, and audit activity metadata. It must not introduce raw exports, student risk drilldowns, raw SOS notes, self-check answers, chatbot transcripts, recipient credentials, or secret values.

</domain>

<decisions>
## Implementation Decisions

### Backend
- Add a metadata-only `/api/admin/operations/dashboard` endpoint under the existing admin operations router.
- Reuse Phase 7 readiness report internally, but summarize readiness for dashboard display.
- Summarize SOS email delivery attempts by status/provider/error category and expose recent safe attempt metadata only.
- Add audit event filters for date range, actor role, action type, target/resource type, and status.
- Record minimal audit metadata when admins run readiness/operations checks.

### Frontend
- Add `/admin/operations` page and admin dashboard card.
- Show readiness, delivery metadata, recent audit events, and filter controls.
- Keep copy explicit that operations visibility is metadata-only.

### Tests
- Backend tests for admin-only access, filters, delivery metadata privacy, readiness audit emission, and sensitive content exclusion.
- Frontend tests for API helper, dashboard card, filters, rendered metadata-only copy, and no raw sensitive fields.

### the agent's Discretion
- Use compact cards/tables; no charts or exports.
- Keep individual resource IDs only where needed as operational metadata and avoid emails/names/notes/transcripts.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/api/admin_operations.py` already exposes admin-only readiness.
- `backend/app/services/readiness.py` builds readiness reports with masked/safe data.
- `backend/app/db/models.py` includes `AuditEvent` and `SosNotificationDelivery`.
- `backend/app/services/audit.py` validates forbidden sensitive metadata keys.
- `frontend/app/(authenticated)/admin/page.tsx` uses `AdminEntryCard` cards.
- `frontend/app/(authenticated)/admin/reports/page.tsx` provides existing admin privacy-report UI patterns.

### Current Gap
- Admin readiness exists as a detailed API but no unified operations dashboard.
- SOS delivery attempts are persisted but not inspectable by admins.
- Audit events exist but are not queryable/filterable from UI.

### Integration Points
- Backend schemas/service/router for operations dashboard.
- Frontend API helper and operations page.
- Admin dashboard card.

</code_context>

<specifics>
## Specific Ideas

- Avoid returning `recipient_id`, recipient email, SOS note, student name, self-check raw answers, chatbot text, or secret values from operations responses.
- Echo filter values so UI can show what is active.

</specifics>

<deferred>
## Deferred Ideas

- CSV/raw export.
- Per-student risk timelines.
- Alerting and retry queues.
- Multi-school operations tenancy.

</deferred>

