# Stack Research: BeYou v1.4 Consent-Based Notifications & Access Transparency

**Milestone:** v1.4 Consent-Based Notifications & Access Transparency
**Researched:** 2026-05-22

## Summary

v1.4 should stay inside the current FastAPI, PostgreSQL, SQLAlchemy/Alembic, Pydantic, cookie-session, metadata-only audit, and Next.js/TypeScript stack. No new external notification providers, queues, workers, mobile push, Zalo/SMS, or email reminder delivery are needed.

The main stack work is additive: database-backed student reminder consent, in-app reminder state, student-controlled mood-note share grants, school privacy policy defaults, controlled reason-for-access codes, and metadata-only operations buckets.

## Stack Additions

- New Alembic migration for v1.4 privacy controls.
- New SQLAlchemy models:
  - `StudentNotificationPreference`
  - `MoodCheckinReminderState`
  - `MoodNoteShare`
  - `SchoolPrivacyPolicyDefault`
- New backend schemas/services/routes for notification preferences, reminders, mood-note sharing, access reasons, and admin privacy policy.
- Extended metadata sanitizer/forbidden audit keys for shared note text, student summary text, reminder bodies, reason details, and contact identifiers.
- Frontend API clients and pages using existing `apiFetch`, local state, and Vitest patterns.

## Backend Integration Points

- `backend/app/db/models.py` and Alembic versions for new tables.
- `backend/app/core/authorization.py` for v1.4 resource types.
- `backend/app/services/audit.py` for metadata-only safeguards.
- Existing mood check-in services/routes for reminder entry and shareable notes.
- Existing adult summary services/routes for reason-gated access and shared-note views.
- Existing admin operations service/schema for v1.4 metadata buckets.
- Demo seed for safe policy/preference sample data.

## Frontend Integration Points

- Student notification/privacy controls page for consent, quiet hours, pause/resume, and in-app-only boundaries.
- Student dashboard reminder card that opens the existing mood check-in flow, can be dismissed/snoozed, and never triggers SOS.
- Mood check-in history share/revoke controls for specific private notes.
- Teacher/parent support summary reason prompt before protected sensitive access.
- Admin privacy controls page and operations panel.

## Testing/Verification

Use existing gates:

- `pytest backend/tests`
- `npm --prefix frontend run test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Add targeted tests for:

- external channels rejected;
- consent defaults off;
- quiet hours and pause suppress reminders;
- reminders never create SOS/adult notifications;
- share grants require active linked adults;
- revocation blocks adult access;
- reason prompts cannot bypass role/relationship authorization;
- operations remains metadata-only.

## Not In Scope

- Zalo/SMS/browser push/native push/email reminder delivery.
- New provider packages such as Twilio, Firebase, OneSignal, Zalo SDK, or web-push.
- Celery/RQ/Redis/cron worker infrastructure.
- Automatic SOS from reminders, mood check-ins, note sharing, or missed reminders.
- Adult/admin raw private mood-note access by default.
- Free-text reason storage as a sensitive narrative log.
- Risk leaderboards, per-student reminder compliance reports, raw exports, or multi-school tenancy.
