# Architecture Research: BeYou v1.1

**Milestone:** v1.1 Production Hardening & Support Polish  
**Researched:** 2026-05-21  
**Approach:** Add small slices to the existing FastAPI/Next.js architecture. Do not rewrite existing v1.0 flows.

## Architectural Principles

1. SOS source of truth remains the existing persisted SOS alert, status events, and in-app notifications.
2. Email is an optional backend-owned delivery channel layered after canonical SOS persistence.
3. `/health`-style liveness stays cheap; production readiness is a separate service.
4. Operational visibility reuses metadata-only audit and never exposes raw sensitive content.
5. Role/privacy UX polish improves user clarity but backend authorization remains authoritative.
6. Nested admin editing should reuse existing backend content contracts unless a gap is proven.

## Backend Additions

| File | Purpose |
|---|---|
| `backend/app/services/readiness.py` | Config, DB, Alembic, cookie/origin, secret, and email readiness checks |
| `backend/app/schemas/readiness.py` | Safe readiness response models |
| `backend/app/api/admin_operations.py` | Admin readiness, audit metadata, and delivery status endpoints |
| `backend/app/services/sos_email.py` | Backend-owned email provider/outbox abstraction |
| `backend/app/schemas/admin_operations.py` | Operational visibility schemas |
| `backend/alembic/versions/*_sos_notification_deliveries.py` | Delivery/outbox table migration |

## Backend Modifications

| File | Change |
|---|---|
| `backend/app/main.py` | Include admin operations router and optional non-sensitive readiness endpoint |
| `backend/app/core/config.py` | Add readiness and SOS email settings |
| `backend/app/db/models.py` | Add `SosNotificationDelivery` or equivalent model |
| `backend/app/services/sos.py` | Create/attempt delivery after canonical SOS and in-app notifications are persisted |
| `backend/app/services/audit.py` | Preserve forbidden metadata rules and add tests for new event shapes |
| `backend/pyproject.toml` | Avoid new dependency unless stdlib SMTP proves insufficient |

## Frontend Additions

| File | Purpose |
|---|---|
| `frontend/lib/admin-operations-api.ts` | Readiness, audit, and delivery API client |
| `frontend/app/(authenticated)/admin/operations/page.tsx` | Metadata-only operations dashboard |
| `frontend/components/admin/self-check-editor.tsx` | Nested self-check editor |
| `frontend/components/admin/scenario-editor.tsx` | Nested scenario editor |

## Frontend Modifications

| File | Change |
|---|---|
| `frontend/app/(authenticated)/layout.tsx` | Role-scoped navigation and student privacy redirect |
| `frontend/app/(authenticated)/admin/page.tsx` | Link to operations page |
| `frontend/app/(authenticated)/admin/content/page.tsx` | Replace MVP-simple content editing with nested editors |
| `frontend/lib/admin-content-api.ts` | Add helper builders only if needed; prefer existing contracts |

## SOS Email Delivery Data Flow

Current v1.0:

```text
student POST /api/student/sos-alerts
  -> create canonical SosAlert
  -> create SosStatusEvent
  -> create linked-adult InAppNotification records
  -> write metadata-only audit
  -> commit
```

v1.1:

```text
student POST /api/student/sos-alerts
  -> create canonical SosAlert
  -> create SosStatusEvent
  -> create linked-adult InAppNotification records
  -> create SosNotificationDelivery rows for authorized linked adults
  -> local_outbox stores queued rows or smtp attempts backend send
  -> write metadata-only delivery audit
  -> commit canonical SOS even when email fails
```

Email failure must not roll back SOS creation, in-app notifications, or existing status workflow.

## Delivery Table Shape

Recommended columns:

- `id`
- `alert_id`
- `recipient_id`
- `channel`
- `provider`
- `recipient_role_snapshot`
- `status` (`queued`, `sent`, `failed`, `skipped`)
- `attempt_count`
- `last_attempt_at`
- `delivered_at`
- `error_code`
- `is_demo`
- `created_at`
- `updated_at`

If recipient email must be stored for delivery, keep it in the delivery table and do not copy it into audit metadata or broad admin exports.

## Readiness Flow

```text
GET /api/admin/operations/readiness
  -> require admin
  -> readiness service
  -> check config, DB, migration head/current, cookie/origin safety, secret hygiene, email readiness
  -> return safe status, category, severity, and remediation hint
```

Optional public readiness should expose only an overall status and no config details.

## Operational Visibility Flow

```text
GET /api/admin/operations/audit-events
  -> require admin
  -> query AuditEvent with filters/pagination
  -> return metadata summary only
```

Forbidden response content includes raw SOS notes, self-check answers, score breakdown internals, chatbot text, provider secrets, and risk leaderboards.

## Suggested Build Order

1. Backend readiness foundation.
2. SOS email delivery table and local outbox/provider abstraction.
3. Backend metadata-only admin operations endpoints.
4. Frontend role/privacy UX polish.
5. Frontend admin operations dashboard.
6. Nested admin content editing.
7. Regression and manual SOS verification.

## Test Focus

Backend:

- Unsafe wildcard origins and insecure production cookies are flagged.
- DB connectivity and Alembic drift are surfaced safely.
- Secret values never appear in readiness responses.
- SOS persists when email is disabled or provider delivery fails.
- Local outbox creates delivery rows without real sends.
- Delivery audit metadata excludes forbidden sensitive keys.
- Admin operations endpoints reject non-admin users.

Frontend:

- Role nav shows only allowed links.
- Student privacy acknowledgement redirects direct `/student` navigation.
- Nested content editors add/remove/reorder fields and show validation errors.
- Operations UI renders safe statuses and metadata-only audit rows.

