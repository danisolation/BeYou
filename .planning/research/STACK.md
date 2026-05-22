# Technology Stack Research: BeYou v1.2 Trusted Adult Plan & Mood Check-ins

**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Researched:** 2026-05-22

## Summary

v1.2 should reuse the existing FastAPI, PostgreSQL, SQLAlchemy/Alembic, Next.js, TypeScript, Vitest, and pytest stack. Trusted adult plans and mood check-ins are mostly domain/model/API/UI work; no new infrastructure or third-party dependency is needed for the planned scope.

## Recommended Stack

| Area | Recommendation | Why |
|---|---|---|
| Backend runtime/API | Keep FastAPI + Pydantic schemas | Existing role routers, services, schemas, and tests already fit the feature shape |
| Persistence | Keep PostgreSQL + SQLAlchemy + Alembic | Support plans, check-ins, summaries, and audit events are relational |
| Frontend | Keep Next.js + TypeScript + existing authenticated layout | Student/adult/admin pages already share role gating and cookie-authenticated API helpers |
| Testing | Keep pytest, Ruff, Vitest, and production build | Current regressions cover privacy, role, and UI behavior without adding tooling |
| Background jobs | Do not add Celery/Redis yet | v1.2 is not sending external notifications or scheduled reminders |
| Analytics/AI scoring | Do not add AI/sentiment scoring | Mood check-ins should stay low-friction and non-clinical, not become surveillance |

## No-New-Dependency Decision

No new dependency is required for:

- Student support-plan CRUD.
- Mood check-in submission and history.
- Simple trend aggregation.
- Teacher/parent summary views.
- Admin prompt/guidance configuration.
- Metadata-only audit and operations visibility.

Avoid adding charting, notification, analytics, or AI classification packages unless a later milestone explicitly scopes them.

## Backend Impact

- Add tables for student support plans, shareable support preferences, mood check-in prompts/options, mood check-in submissions, and optional derived summary metadata.
- Add Alembic migration with conservative nullable/backfill behavior.
- Add student APIs for support plan and check-in submission/history.
- Add teacher/parent APIs for linked-student summaries only.
- Add admin APIs for prompt/guidance configuration and lifecycle status.
- Reuse `AuditEvent` for metadata-only support plan, check-in, adult summary, and admin config activity.

## Frontend Impact

- Add student pages or dashboard cards for:
  - trusted adult plan;
  - mood check-in submission;
  - mood history/trends.
- Extend teacher/parent support pages with privacy-preserving check-in/support-plan summary cards.
- Extend admin content/config area for check-in prompts and supportive guidance.
- Add API helpers in `frontend/lib` following existing cookie-authenticated patterns.

## Data and Privacy Controls

- Raw optional mood notes remain student-only by default.
- Adult summaries expose trend labels, recency, student-shareable preferences, and suggested supportive actions only.
- Admin and operations views must not expose raw notes, raw check-in answers, risk leaderboards, or per-student drilldowns.
- Public/student copy should remain non-clinical and should not diagnose mood states.
- High-concern check-ins can suggest SOS/trusted adult contact, but must not automatically trigger SOS.

## Testing Impact

- Backend tests should cover:
  - student CRUD/submission;
  - role/relationship authorization;
  - adult summary privacy boundaries;
  - admin validation and audit metadata;
  - no raw notes in adult/admin/operations responses.
- Frontend tests should cover:
  - student support-plan/check-in flows;
  - privacy copy and history/trend display;
  - teacher/parent summary-only UI;
  - admin config validation;
  - no blocked child rendering in protected routes.

## Risks and Non-Goals

- Do not turn check-ins into diagnosis, monitoring, or discipline workflows.
- Do not introduce external notification delivery in v1.2.
- Do not expose raw private notes to adults/admins.
- Do not add dashboards that rank students by mood/risk.
