# Research Summary: BeYou v1.4 Consent-Based Notifications & Access Transparency

**Milestone:** v1.4 Consent-Based Notifications & Access Transparency  
**Synthesized:** 2026-05-22

## Stack Additions

No new runtime dependencies or external providers are recommended. v1.4 should reuse FastAPI, PostgreSQL, SQLAlchemy/Alembic, Pydantic, metadata-only audit, Next.js 16, TypeScript, pytest, Vitest, lint, and build gates.

Add database-backed privacy controls for student reminder preferences, in-app reminder state, mood-note share grants, school policy defaults, controlled access reasons, and operations metadata buckets.

## Feature Table Stakes

1. Students can manage in-app reminder consent, quiet hours, pause/resume, and channel boundaries.
2. Supportive in-app mood check-in reminders respect consent, quiet hours, and pause state.
3. Reminders never create SOS, adult notifications, risk scores, or automatic check-ins.
4. Students can selectively share and revoke specific private mood notes with chosen linked adults.
5. Adults can see only active student-shared notes and must provide reason codes when policy requires protected access.
6. Admins can configure safe school defaults and inspect v1.4 metadata-only operations readiness.

## Architecture Recommendation

Build six additive slices:

1. Privacy contracts, data model, policy defaults, authorization resource types, and audit safeguards.
2. Student reminder preferences and in-app reminder eligibility/UI.
3. Selective mood-note sharing and revocation.
4. Reason-for-access enforcement and adult support transparency.
5. Admin privacy policy defaults and metadata-only operations visibility.
6. Cross-role privacy regression, demo seed/readiness, and docs.

Continue phase numbering from Phase 21.

## Watch Out For

- Admin policy defaults becoming forced consent.
- Reminder copy becoming clinical or coercive.
- Reminder/mood flows creating SOS automatically.
- Sharing all future notes instead of one specific note.
- Revocation enforced only in UI.
- Reason prompts stored as sensitive free text.
- Operations leaking identifiers, raw notes, or per-student monitoring.

## Recommended Boundaries

In scope: consent preferences, in-app reminders, selective note sharing/revocation, reason-gated protected access, admin policy defaults, metadata-only operations, and regression coverage.

Future: external notification channels, counselor handoff, OAuth/SSO, multi-school tenancy, raw exports governance, and production notification delivery infrastructure.

Out of scope: Zalo/SMS/push/email reminders, automatic SOS from reminders/check-ins, risk leaderboards, adult/admin default access to private mood notes, punitive monitoring, clinical diagnosis, and raw sensitive exports.
