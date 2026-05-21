# BeYou - Tu Tin La Minh

## What This Is

BeYou is a privacy-first web app for Vietnamese high-school students to recognize peer pressure, check mental well-being through short assessments, practice handling school situations, chat with a basic supportive bot, and send SOS alerts when they feel unsafe or at risk.

The product serves students first. Teacher, parent, and admin portals support escalation, content management, and aggregate reporting without turning sensitive student data into surveillance.

## Core Value

Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## Current State

**Shipped version:** v1.0 MVP Demo on 2026-05-21  
**Milestone status:** Complete, audited, and archived  
**Scope shipped:** 6 phases, 26 plans, 47/47 v1 requirements satisfied  
**Audit:** `.planning/milestones/v1.0-MILESTONE-AUDIT.md` passed with 6/6 integration flows and no blockers

## Current Milestone: v1.1 Production Hardening & Support Polish

**Goal:** Make BeYou safer and easier to run beyond the MVP demo by hardening operations, adding server-owned SOS email notification readiness, polishing role/privacy UX, and improving admin support tools without weakening privacy-by-default.

**Target features:**
- Production-readiness checks for configuration, database/migration health, cookie/origin safety, and secret hygiene.
- Server-side SOS email notification provider with safe local/dev outbox behavior, delivery audit, and no frontend-exposed credentials.
- Student/adult UX polish for privacy redirect and role-specific navigation.
- Richer admin content editing for nested self-check/scenario structures.
- Metadata-only operational audit visibility for admins, with no raw sensitive student content.

### Built Product

- Python/FastAPI backend with PostgreSQL, SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, metadata-only audit, and demo-data separation.
- Next.js/TypeScript frontend with student, teacher, parent, and admin portals using cookie-authenticated API calls and no browser token storage.
- Student wellbeing flows: privacy notice, self-check tests/results/history, school scenarios/feedback/history, supportive chatbot, and confirmed SOS alerts.
- Adult support flows: linked teacher/parent views, summary-only wellbeing support, in-app SOS notifications, and teacher status workflow.
- Admin flows: users, student-adult links, self-check/scenario content, chatbot safety config, and privacy-limited aggregate reports.

### Latest Verification Snapshot

- Backend pytest: `79 passed`
- Frontend Vitest: `50 passed`
- Playwright Phase 06 E2E: `1 passed`
- Frontend production build: passed
- Milestone audit: `47/47` requirements satisfied

### Planning Archives

- Roadmap archive: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Audit archive: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- Milestone summary: `.planning/MILESTONES.md`

## Requirements

### Validated in v1.0

- [x] Privacy-by-default policy contracts for sensitive student psychology data: data classification, role/relationship/purpose authorization, metadata-only audit events, demo/real-data separation, and non-clinical safety copy.
- [x] Email/password login, role-based portals, seeded demo accounts, student-adult links, admin user/link management, and no-token cookie-authenticated frontend access.
- [x] Student self-checks, scenario practice, summary-only adult visibility, audited content management, seeded demo wellbeing content, and supportive UI tone.
- [x] Confirmed SOS alerts, in-app linked-adult notifications, visible status workflow, teacher handling controls, parent read-only status, summary-only adult support views, and metadata-only SOS audit.
- [x] Backend-only supportive chatbot gateway, provider abstraction, server-side guardrails, high-risk escalation guidance, student-owned transcript access, and admin-editable safety copy/config without exposing API keys.
- [x] Admin privacy-limited aggregate reports with small-group suppression, demo/real filtering, metadata-only audit, and no raw sensitive exports or per-student risk drilldowns.

### Active

- [ ] Production-readiness checks make unsafe configuration, database/migration drift, and missing secrets visible before launch.
- [ ] SOS notifications can optionally be delivered through backend-owned email infrastructure while preserving in-app workflow as the source of truth.
- [ ] Student privacy acknowledgement and role navigation UX are clear and role-appropriate.
- [ ] Admin content management supports complete nested self-check and scenario editing, not just MVP-simple edits.
- [ ] Admin operational visibility remains metadata-only and support-oriented, not surveillance-oriented.

### Out of Scope

- Native mobile app - v1 is responsive web-first.
- Real Zalo/SMS/push notification delivery - v1 uses in-app SOS notifications and status tracking.
- Chatbot replacing professional psychological care - chatbot only provides supportive first response and escalation guidance.
- Full school-district deployment automation - v1 supports one deployable product and can expand later to multiple schools/classes.
- OAuth/SSO - email/password plus seeded demo accounts is enough for v1.
- Parent/teacher access to full raw chatbot transcripts by default - violates privacy-by-default and may reduce student trust.
- Student risk leaderboard or punitive monitoring - BeYou must support, not surveil or discipline students.

## Context

The app is intended for high-school students and must feel friendly, light, and non-clinical. Student-facing copy stays supportive, calm, Vietnamese, and clear that BeYou does not replace professional care. Red is reserved for SOS or high-risk states.

Core student flows shipped:

1. Student logs in, opens dashboard, and can review privacy/support boundaries.
2. Student takes a self-check, receives backend-scored feedback, and can review history.
3. Student opens a school scenario, chooses a response, and receives feedback, better alternatives, and related skill guidance.
4. Student chats with the bot; high-risk content triggers SOS/trusted-adult guidance without unrestricted advice.
5. Student confirms SOS; linked teacher/parent see the alert in-app and status moves from sent to received, supporting, and completed.

Roles:

- **Student**: uses tests, scenarios, chatbot, SOS, dashboard, and history.
- **Teacher**: receives SOS, views managed students, support summaries, and updates SOS handling status.
- **Parent**: receives SOS and sees linked student status/support summaries within privacy boundaries.
- **Admin**: manages users, links, wellbeing content, chatbot safety config, and aggregate reports.

## Constraints

- **Backend stack**: Python backend is required.
- **Scope**: v1 is an MVP demo with complete core flows, not every production extension.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required.
- **Chatbot safety**: The chatbot must not claim to be a therapist or diagnostic tool. High-risk messages must trigger escalation guidance and SOS/trusted-adult suggestions.
- **SOS delivery**: v1 SOS is in-app notification and status handling, not external email/Zalo/SMS.
- **Authentication**: v1 uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid medicalized language.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build v1 as MVP demo with full core flows | Shows the end-to-end student, teacher, parent, and admin journey | Validated through Phase 6 |
| Use Python FastAPI backend | Explicit user requirement and a good fit for API-first backend | Validated in Phase 2 |
| Use backend-only freemodel.dev provider abstraction | Keeps API keys private and enables provider swap | Validated in Phase 5 |
| Use in-app SOS notifications for v1 | Demonstrates escalation and handling without external delivery scope | Validated in Phase 4 |
| Treat real student data as possible from day one | Sensitive psychology data needs production-minded defaults | Validated in Phase 1 |
| Use email/password and seeded demo accounts | Supports realistic demo without OAuth/SSO complexity | Validated in Phase 2 |
| Keep raw self-check answers student-only | Preserves student trust while enabling summary support from adults | Validated in Phase 3 |
| Keep adult views privacy-limited | Product should support students, not surveil them | Validated across Phases 3-6 |
| Use explicit local dev origins for credentialed CORS | Supports localhost and 127.0.0.1 dev URLs without wildcard credentials | Validated during Phase 3 UAT |
| Keep SOS as a visible status workflow | Students and adults need shared status, not fire-and-forget alerts | Validated in Phase 4 |
| Keep chatbot transcripts student-owned | Admins manage safety config and metadata, not raw private chat by default | Validated in Phase 5 |
| Keep aggregate reports privacy-limited | Reports should support capacity planning, not expose raw detail or rank students by risk | Validated in Phase 6 |

## Known Tech Debt

- Direct `/student` navigation with an unacknowledged existing session shows an empty/error state instead of redirecting to `/privacy`; backend still blocks sensitive access.
- Authenticated layout shows nav links for all roles; backend and layout block wrong-role content, but UX could be clearer.
- Admin content UI remains MVP-simple for nested editing while backend supports richer nested content.

## Next Milestone Goals

v1.1 focuses on production hardening, SOS email notification readiness, student/adult/admin UX polish, admin content depth, and metadata-only operational visibility.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after starting v1.1 milestone*
