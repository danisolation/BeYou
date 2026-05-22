# BeYou - Tu Tin La Minh

## What This Is

BeYou is a privacy-first web app for Vietnamese high-school students to recognize peer pressure, check mental well-being through short assessments, practice handling school situations, chat with a basic supportive bot, build proactive trusted-adult support plans, complete lightweight mood check-ins, and send SOS alerts when they feel unsafe or at risk.

The product serves students first. Teacher, parent, and admin portals support escalation, content management, trusted-adult support summaries, aggregate reporting, and operational visibility without turning sensitive student data into surveillance.

## Core Value

Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## Current State

**Shipped version:** v1.2 Trusted Adult Plan & Mood Check-ins on 2026-05-22
**Milestone status:** Complete, audited, archived, and tagged for release
**Scope shipped:** 15 total phases, 53 total plans, 101/101 cumulative requirements satisfied
**Latest audit:** `.planning/milestones/v1.2-MILESTONE-AUDIT.md` passed with 24/24 v1.2 requirements, 4/4 phases, and 6/6 integration flows

### Built Product

- Python/FastAPI backend with PostgreSQL, SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, metadata-only audit, readiness checks, and demo-data separation.
- Next.js/TypeScript frontend with student, teacher, parent, and admin portals using cookie-authenticated API calls and no browser token storage.
- Student wellbeing flows: privacy notice, self-check tests/results/history, school scenarios/feedback/history, supportive chatbot, confirmed SOS alerts, trusted adult support plans, and mood check-ins/history.
- Adult support flows: linked teacher/parent views, summary-only wellbeing support, selected support-plan visibility, mood trend summaries without raw private notes, in-app SOS notifications, optional backend-owned SOS email delivery metadata, and teacher status workflow.
- Admin flows: users, student-adult links, nested self-check/scenario content editing, chatbot safety config, mood check-in prompt/guidance configuration, privacy-limited aggregate reports, and metadata-only operations dashboard.

### Latest Verification Snapshot

- Backend pytest: `101 passed`
- Frontend Vitest: `68 passed`
- Frontend production build: passed
- Milestone audit: `24/24` v1.2 requirements satisfied, `6/6` integration flows passed

### Planning Archives

- v1.2 roadmap archive: `.planning/milestones/v1.2-ROADMAP.md`
- v1.2 requirements archive: `.planning/milestones/v1.2-REQUIREMENTS.md`
- v1.2 audit archive: `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- v1.2 phase artifacts: `.planning/milestones/v1.2-phases/`
- Milestone summary: `.planning/MILESTONES.md`

## Current Milestone: v1.3 Pilot UX & Demo Readiness

**Goal:** Make the live BeYou deployment feel polished, trustworthy, and easy to evaluate on mobile, tablet, and desktop for students, adults, admins, and school pilot stakeholders.

**Target features:**
- Guided public/demo entry that explains BeYou and helps evaluators enter the correct role quickly.
- Responsive and accessibility baseline across the production student, adult, admin, and auth flows.
- Friendlier UX copy and interaction polish while preserving privacy, SOS, and non-clinical boundaries.
- Demo/pilot operations improvements that make demo seed, deploy state, and live walkthroughs more reliable.
- Frontend developer quality improvements, including the Next 16 lint script issue and lightweight responsive smoke coverage.

## Requirements

### Validated in v1.0

- [x] Privacy-by-default policy contracts for sensitive student psychology data: data classification, role/relationship/purpose authorization, metadata-only audit events, demo/real-data separation, and non-clinical safety copy.
- [x] Email/password login, role-based portals, seeded demo accounts, student-adult links, admin user/link management, and no-token cookie-authenticated frontend access.
- [x] Student self-checks, scenario practice, summary-only adult visibility, audited content management, seeded demo wellbeing content, and supportive UI tone.
- [x] Confirmed SOS alerts, in-app linked-adult notifications, visible status workflow, teacher handling controls, parent read-only status, summary-only adult support views, and metadata-only SOS audit.
- [x] Backend-only supportive chatbot gateway, provider abstraction, server-side guardrails, high-risk escalation guidance, student-owned transcript access, and admin-editable safety copy/config without exposing API keys.
- [x] Admin privacy-limited aggregate reports with small-group suppression, demo/real filtering, metadata-only audit, and no raw sensitive exports or per-student risk drilldowns.

### Validated in v1.1

- [x] Production-readiness checks flag unsafe configuration, database/migration drift, cookie/origin risks, demo seed state, and missing provider secrets while masking sensitive values.
- [x] SOS notifications can optionally create backend-owned email delivery attempts in disabled, local outbox, or SMTP mode while preserving in-app SOS as the source of truth.
- [x] Student privacy acknowledgement and role navigation UX are clearer, role-appropriate, and avoid rendering protected children during blocked states.
- [x] Admin content management supports complete nested self-check and scenario editing, validation errors, previews, and version-safe historical attempts.
- [x] Admin operational visibility is metadata-only, support-oriented, admin-protected, filterable, and excludes raw sensitive student content, exports, risk leaderboards, and drilldowns.

### Validated in v1.2

- [x] Students can create and update a trusted adult support plan from existing linked adults.
- [x] Students can complete lightweight mood check-ins and review their own check-in history/trends.
- [x] Teachers and parents can see privacy-preserving check-in/support summaries for linked students without raw private notes.
- [x] Admins can configure mood check-in prompts/guidance and inspect v1.2 support activity metadata safely.
- [x] New support-plan/check-in flows preserve BeYou's privacy-by-default, non-clinical, support-not-surveillance boundaries.

### Active

- [ ] Make the live demo/pilot entry point understandable and role-guided for first-time evaluators.
- [ ] Bring key production flows to a tested responsive and accessibility baseline on mobile, tablet, and desktop.
- [ ] Polish user-facing copy and interaction states without weakening student privacy boundaries.
- [ ] Improve demo/pilot operations feedback so live walkthroughs are more reliable.
- [ ] Repair frontend quality tooling and add lightweight regression coverage for responsive UX.

### Out of Scope

- Native mobile app - responsive web remains the current product surface.
- Replacing in-app SOS with email - email is optional best-effort notification readiness; in-app SOS remains canonical.
- Real Zalo/SMS/push notification delivery - requires consent, provider governance, and production retry/dead-letter operations.
- Chatbot replacing professional psychological care - chatbot only provides supportive first response and escalation guidance.
- Full school-district deployment automation and multi-school tenancy - deferred until single-school operational safety is stable.
- OAuth/SSO - email/password plus seeded demo accounts is enough until a production school identity provider is selected.
- Parent/teacher access to full raw chatbot transcripts by default - violates privacy-by-default and may reduce student trust.
- Adult/admin access to raw private mood notes by default - violates student-owned privacy boundaries.
- Student risk leaderboard or punitive monitoring - BeYou must support, not surveil or discipline students.

## Context

The app is intended for high-school students and must feel friendly, light, and non-clinical. Student-facing copy stays supportive, calm, Vietnamese, and clear that BeYou does not replace professional care. Red is reserved for SOS or high-risk states.

Core student flows shipped:

1. Student logs in, opens dashboard, and can review privacy/support boundaries.
2. Student takes a self-check, receives backend-scored feedback, and can review history.
3. Student opens a school scenario, chooses a response, and receives feedback, better alternatives, and related skill guidance.
4. Student chats with the bot; high-risk content triggers SOS/trusted-adult guidance without unrestricted advice.
5. Student confirms SOS; linked teacher/parent see the alert in-app and status moves from sent to received, supporting, and completed.
6. Student is redirected to privacy acknowledgement before sensitive `/student/*` content renders when acknowledgement is missing.
7. Student creates a trusted adult support plan, chooses linked adults, and controls what shareable support preferences adults can see.
8. Student submits lightweight mood check-ins with optional private notes and can review timestamped history/trends.

Roles:

- **Student**: uses tests, scenarios, chatbot, SOS, dashboard, history, support plan, and mood check-ins.
- **Teacher**: receives SOS, views managed students, selected support-plan details, mood trend summaries, and updates SOS handling status.
- **Parent**: receives SOS and sees linked student status/support summaries within privacy boundaries.
- **Admin**: manages users, links, wellbeing content, chatbot safety config, mood check-in config, aggregate reports, readiness, and metadata-only operations.

## Constraints

- **Backend stack**: Python backend is required.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required.
- **Chatbot safety**: The chatbot must not claim to be a therapist or diagnostic tool. High-risk messages must trigger escalation guidance and SOS/trusted-adult suggestions.
- **SOS delivery**: In-app SOS is canonical. Email delivery is optional, backend-owned, best-effort, and must not expose raw student content or provider credentials.
- **Authentication**: The current product uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **Operations visibility**: Admin operations views must stay metadata-only and must not add raw exports, risk leaderboards, or per-student risk drilldowns.
- **Support-plan and mood privacy**: Adults see only selected support preferences and trend summaries; optional private mood notes remain student-only by default.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid medicalized language.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build v1 as MVP demo with full core flows | Shows the end-to-end student, teacher, parent, and admin journey | Validated in v1.0 |
| Use Python FastAPI backend | Explicit user requirement and a good fit for API-first backend | Validated in v1.0 |
| Use backend-only freemodel.dev provider abstraction | Keeps API keys private and enables provider swap | Validated in v1.0 |
| Use in-app SOS notifications as canonical | Demonstrates escalation and handling without depending on external delivery | Validated in v1.0 and reinforced in v1.1/v1.2 |
| Treat real student data as possible from day one | Sensitive psychology data needs production-minded defaults | Validated in v1.0 |
| Use email/password and seeded demo accounts | Supports realistic demo without OAuth/SSO complexity | Validated in v1.0 |
| Keep raw self-check answers student-only | Preserves student trust while enabling summary support from adults | Validated in v1.0 |
| Keep adult views privacy-limited | Product should support students, not surveil them | Validated across v1.0-v1.2 |
| Use explicit local dev origins for credentialed CORS | Supports localhost and 127.0.0.1 dev URLs without wildcard credentials | Validated in v1.0; v1.2 added PUT coverage |
| Keep chatbot transcripts student-owned | Admins manage safety config and metadata, not raw private chat by default | Validated in v1.0 |
| Keep aggregate reports privacy-limited | Reports should support capacity planning, not expose raw detail or rank students by risk | Validated in v1.0 |
| Add production readiness before expanding operations | Operators need safe liveness/readiness distinction before trusting real student data | Validated in Phase 7 |
| Use backend-owned SOS email delivery attempts | Provider credentials and failure isolation belong on the backend; email must not replace in-app SOS | Validated in Phase 8 |
| Use local outbox for development email | Prevents accidental real-world SOS messages while preserving delivery metadata | Validated in Phase 8 |
| Gate student UX at authenticated layout | Privacy-blocked or wrong-role states should not render protected children first | Validated in Phase 9 and reused in v1.2 |
| Preserve historical attempts through snapshots/version-safe content behavior | Admin content edits must not break past student records | Validated in Phase 10 |
| Keep operations visibility metadata-only | Admins need readiness and support operations context without raw sensitive browsing | Validated in Phase 11 and extended in Phase 15 |
| Make support plans student-owned and selected-adult scoped | Students should control which linked adults see proactive support preferences | Validated in Phase 12 |
| Keep mood check-ins lightweight and non-clinical | The feature should support reflection without diagnosis, treatment, or surveillance | Validated in Phase 13 |
| Keep optional mood notes student-only by default | Private notes are for student reflection, not adult/admin monitoring | Validated in Phases 13-15 |
| Let adults see trends and selected support preferences, not raw details | Adults need supportive context without raw private notes or check-in drilldowns | Validated in Phase 14 |
| Let admins configure prompts/guidance but not raw student data | Configuration should improve copy while preserving metadata-only operations | Validated in Phase 15 |

## Known Tech Debt

- `npm run lint` currently calls invalid Next 16 `next lint`; frontend tests and production build are passing.
- Deferred future work includes notification retry queues, Zalo/SMS/push channels, selective private-note sharing, reason-for-access prompts, counselor handoff, content diff/version history, multi-school tenancy, and production OAuth/SSO.

## Next Milestone Goals

v1.3 is active and focuses on pilot UX and demo readiness. Deferred candidates remain reminder/notification consent flows, selective private-note sharing, reason-for-access controls, school/tenant policy customization, and production identity/OAuth readiness.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 after starting v1.3 milestone*
