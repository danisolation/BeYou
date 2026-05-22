# Architecture Research: BeYou v1.4 Consent-Based Notifications & Access Transparency

**Milestone:** v1.4 Consent-Based Notifications & Access Transparency  
**Researched:** 2026-05-22

## Summary

v1.4 should reuse the existing architecture seams: FastAPI routers, service-layer authorization/audit, PostgreSQL models, Next.js client pages, and metadata-only operations. Do not create a parallel notification or access-control subsystem.

Recommended build order: policy/contracts first, then student reminder preferences/reminders, then selective mood-note sharing, then reason-for-access, then admin policy/operations and cross-role regression.

## Current Architecture Touchpoints

| Area | Existing component | v1.4 integration |
|---|---|---|
| Models | `backend/app/db/models.py` | Add preference, reminder state, share grant, and policy default tables. |
| Migrations | `backend/alembic/versions/*` | Add v1.4 migration after mood check-in config migration. |
| Authorization | `backend/app/core/authorization.py` | Add v1.4 resource types and keep relationship checks central. |
| Audit | `backend/app/services/audit.py` | Extend forbidden metadata keys and safe summaries. |
| Mood check-ins | `student_mood_checkins`, `mood_checkins` | Reminder entry and specific private-note share controls. |
| Adult summaries | `adult_summaries` | Reason-gated access and shared-note section. |
| Admin operations | `admin_operations` | v1.4 metadata buckets and readiness warnings. |
| Frontend | authenticated student/adult/admin pages | New settings/policy pages and guarded adult access prompts. |

## Proposed Data Model

- `student_notification_preferences`: student-owned consent, cadence, quiet hours, pause state, timezone, enabled in-app channel, and demo flag.
- `mood_checkin_reminder_states`: last shown/dismissed/snoozed/opened timestamps for request-time in-app reminders.
- `mood_note_shares`: student-created active/revoked grants linking one mood check-in to one adult, with share scope and optional student summary.
- `school_privacy_policy_defaults`: single-school v1.4 defaults for reminders, quiet hours, reason requirements, allowed reasons, and external-channel disabled status.

## API/Service Flow

### Consent preferences

`GET/PUT /api/student/notification-preferences` returns effective policy defaults plus student preferences. PUT validates in-app-only channels, quiet hours, pause state, and emits metadata-only audit.

### Mood reminders

`GET /api/student/reminders/mood-check-in` computes due state from consent, quiet hours, pause, and recent check-ins. Dismiss/snooze/open endpoints update reminder state and safe audit only. Reminder services must not call SOS or adult notification services.

### Selective mood-note sharing

Student routes manage shares under `/api/student/mood-check-ins/{checkin_id}/shares`. Services validate ownership, private-note presence, active adult links, active grants, and revocation. Adult routes return only active shares for the current linked adult.

### Reason-for-access

Sensitive adult routes use controlled reason codes before returning protected summaries/shared notes when policy requires. Missing reason should return a clear precondition response; invalid reason is rejected. The service layer, not only frontend, must enforce this.

### Admin policy and operations

Admin policy routes read/update safe defaults and reject external channels. Admin operations aggregates v1.4 counts/status/readiness while stripping identifiers and raw sensitive text.

## Frontend Flow

- Student settings page for reminder consent, quiet hours, pause/resume, and channel boundaries.
- Student dashboard reminder card with dismiss/snooze/open actions and non-clinical copy.
- Mood history share/revoke UI with exact preview and per-adult status.
- Teacher/parent support summary reason prompt before protected fetches.
- Admin policy page and operations v1.4 panel.

## Authorization/Audit

- Student preferences are readable/writable only by the student.
- Note sharing requires mood check-in ownership and active linked adult relationship.
- Adult shared-note reads require both active relationship and active student-created share grant.
- Reason-for-access never grants access by itself.
- Audit metadata cannot include raw note text, student summary text, reminder message bodies, free-text reason details, names, emails, or private content.
