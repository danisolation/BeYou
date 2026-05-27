# Phase 8: Backend-Owned SOS Email Notification Readiness - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 8 adds backend-owned SOS email delivery readiness. It introduces server-only email configuration, a metadata-only delivery/outbox table, local outbox behavior, SMTP attempt handling, delivery audit metadata, and SOS integration that never replaces the canonical in-app SOS workflow.

</domain>

<decisions>
## Implementation Decisions

### Source of Truth
- In-app SOS alert/status and in-app notifications remain canonical.
- Email attempts happen only after `SosAlert`, initial `SosStatusEvent`, and in-app notifications are created.
- Email success or failure never changes `SosAlert.current_status`.

### Provider Modes
- Support `disabled`, `local_outbox`, and `smtp` modes through backend settings only.
- Default stays `disabled` so v1.0 behavior remains safe.
- `local_outbox` records queued delivery rows without sending real email.
- `smtp` sends minimal backend-owned messages using Python stdlib and records sent/failed metadata.

### Privacy and Audit
- Delivery rows store delivery metadata, not raw student content.
- Email body is intentionally minimal and tells the adult to sign in to BeYou.
- Audit metadata includes alert id, recipient id, role, channel, provider, status, and error category only.
- No frontend API or response exposes credentials, raw SOS notes, self-check answers, chatbot transcripts, or recipient email credentials.

### the agent's Discretion
- Choose exact helper names and error categories.
- Keep SMTP simple and synchronous for v1.1; no queue worker or retry backoff in this phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/services/sos.py` creates canonical SOS alerts, status events, linked-adult in-app notifications, and metadata-only audit.
- `backend/app/core/config.py` is the settings source for backend-only provider secrets.
- `backend/app/services/audit.py` rejects forbidden sensitive metadata keys.
- Phase 7 added readiness checks that can be extended with email provider readiness.

### Established Patterns
- Additive SQLAlchemy models live in `backend/app/db/models.py` with matching Alembic migrations.
- Tests use API calls for existing SOS flow and service-level checks when custom settings are needed.
- Audit events must remain metadata-only.

### Integration Points
- Add `SosNotificationDelivery` model/table.
- Add `backend/app/services/sos_email.py`.
- Pass `Settings` from SOS API to `create_sos_alert`.
- Update demo seed call to pass existing settings.
- Extend readiness with SOS email configuration safety.

</code_context>

<specifics>
## Specific Ideas

Do not add frontend UI in this phase. Admin delivery visibility belongs to Phase 11.

</specifics>

<deferred>
## Deferred Ideas

- Retry queues/backoff, dead-letter handling, and provider dashboards are future scope.
- SMS/Zalo/push channels are future notification-channel scope.
- Operations dashboard for delivery rows is Phase 11.

</deferred>

