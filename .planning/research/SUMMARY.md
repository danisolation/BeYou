# Research Summary: BeYou v1.2 Trusted Adult Plan & Mood Check-ins

**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Synthesized:** 2026-05-22

## Stack Additions

No new stack dependency is recommended. v1.2 should reuse FastAPI, PostgreSQL, SQLAlchemy/Alembic, Next.js, TypeScript, pytest, Ruff, and Vitest.

Avoid Celery/Redis, external notification providers, AI scoring, clinical analytics, or new charting libraries in this milestone.

## Feature Table Stakes

1. Student-owned trusted adult support plan using existing linked adults.
2. Lightweight mood check-ins with optional private notes and student-owned history.
3. Privacy-preserving adult summaries with trend labels and support suggestions only.
4. Admin-managed check-in prompts/guidance with lifecycle validation and metadata audit.
5. Strong privacy boundaries: no raw notes to adults/admins, no risk leaderboards, no automatic SOS.

## Architecture Recommendation

Build four additive slices:

1. Support plan domain/API/student UI.
2. Mood check-in domain/API/student UI/history.
3. Adult support summaries for teacher/parent.
4. Admin prompt/guidance configuration plus metadata-only audit/operations closure.

Continue phase numbering from Phase 12.

## Watch Out For

- Raw optional notes leaking through summary APIs, audit metadata, operations views, logs, or fixtures.
- Adult summaries becoming disciplinary risk monitoring.
- High-concern check-ins auto-triggering SOS without explicit confirmation.
- Admin prompt copy becoming clinical, punitive, or surveillance-oriented.

## Recommended v1.2 Boundaries

- In scope: support plan, mood check-in, student history/trends, adult summaries, admin prompt/guidance config, metadata audit.
- Future: reminders, external notification channels, counselor handoff, student-selected note sharing, reason-for-access prompts, tenant policy customization.
- Out of scope: clinical diagnosis, AI risk scoring, risk leaderboards, raw exports, automatic emergency escalation.
