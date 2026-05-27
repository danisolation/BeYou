# Phase 04 Research: SOS Workflow & Adult Support Portals

## Existing Backend Patterns

- `backend/app/db/models.py` defines enum-like classes and SQLAlchemy models with UUID primary keys, `is_demo`, and timestamp fields.
- Phase 3 sensitive resources use dedicated schemas and services instead of exposing ORM objects directly.
- `require_permission` is deny-by-default and already enforces active linked-adult checks for `self_check_summary`.
- Mutations require `require_same_site_mutation` in routers.
- Audit events are written through `record_audit_event`, which rejects forbidden raw sensitive metadata keys.

## Existing Frontend Patterns

- All authenticated screens use `apiFetch` from `frontend/lib/api.ts`.
- Role dashboards are client components with page-local loading state.
- Demo indicators use `DemoBadge`/`DemoBanner`.
- Adult summaries use typed helper functions and dedicated pages that render whitelisted fields only.
- Tests use Vitest with mocked `fetch`; Playwright specs exist for full demo flows.

## Implementation Approach

1. Add backend domain tables:
   - `sos_alerts`
   - `sos_status_events`
   - `in_app_notifications`
2. Extend authorization for `sos_alert`:
   - student own read/write
   - linked teacher/parent read under `safety_escalation`
   - linked teacher update under `safety_escalation`
3. Add service layer:
   - create alert with student identity snapshots, recipient discovery, notifications, creation/status audit
   - list own/linked alerts
   - update status forward for teachers only
   - adult support overview with warning groups and latest summary-only information
4. Add routers:
   - `/api/student/sos-alerts`
   - `/api/teacher/sos-alerts`
   - `/api/teacher/support-overview`
   - `/api/parent/sos-alerts`
   - `/api/parent/support-overview`
   - `/api/notifications`
5. Extend frontend:
   - student dashboard SOS card, confirmation, status list
   - teacher/parent dashboard notifications and support overview cards
   - teacher status update page
   - parent read-only status page
6. Extend demo seed and tests.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Adult view leaks raw self-check detail | Use dedicated DTOs with only latest summary/support fields; add tests for forbidden strings |
| Notifications duplicate or expose note | Notifications store minimal text and link to authorized SOS detail |
| Status transitions inconsistent | Service validates forward-only transitions and records status events |
| Sensitive reads unaudited | Service writes `sensitive_resource_read` for successful SOS list/detail responses |
| CSRF guard weakened | Reuse `require_same_site_mutation` and no wildcard CORS changes |

## Plan Split

- `04-01-PLAN.md`: backend SOS/notification domain, service, routes, tests, demo seed.
- `04-02-PLAN.md`: frontend student/adult SOS UI and Vitest tests.
- `04-03-PLAN.md`: E2E/security review, verification artifacts, state/roadmap/requirements updates.
