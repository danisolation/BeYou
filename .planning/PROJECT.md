# BeYou - Tu Tin La Minh

## What This Is

BeYou is a privacy-first web app for Vietnamese high-school students to recognize peer pressure, check mental well-being through short assessments, practice handling school situations, chat with a basic supportive bot, and send SOS alerts when they feel unsafe or at risk.

The product serves students first. Teacher, parent, and admin portals support escalation, content management, aggregate reporting, and operational visibility without turning sensitive student data into surveillance.

## Core Value

Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## Current State

**Shipped version:** v1.1 Production Hardening & Support Polish on 2026-05-22  
**Milestone status:** Complete, audited, archived, and ready for the next milestone  
**Scope shipped:** 11 total phases, 41 total plans, 77/77 cumulative requirements satisfied  
**Latest audit:** `.planning/milestones/v1.1-MILESTONE-AUDIT.md` passed with 30/30 v1.1 requirements, 5/5 phases, and 4/4 integration flows

### Built Product

- Python/FastAPI backend with PostgreSQL, SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, metadata-only audit, readiness checks, and demo-data separation.
- Next.js/TypeScript frontend with student, teacher, parent, and admin portals using cookie-authenticated API calls and no browser token storage.
- Student wellbeing flows: privacy notice, self-check tests/results/history, school scenarios/feedback/history, supportive chatbot, and confirmed SOS alerts.
- Adult support flows: linked teacher/parent views, summary-only wellbeing support, in-app SOS notifications, optional backend-owned SOS email delivery metadata, and teacher status workflow.
- Admin flows: users, student-adult links, nested self-check/scenario content editing, chatbot safety config, privacy-limited aggregate reports, and metadata-only operations dashboard.

### Latest Verification Snapshot

- Backend pytest: `88 passed`
- Frontend Vitest: `57 passed`
- Frontend production build: passed
- Milestone audit: `30/30` v1.1 requirements satisfied, `4/4` integration flows passed

### Planning Archives

- v1.1 roadmap archive: `.planning/milestones/v1.1-ROADMAP.md`
- v1.1 requirements archive: `.planning/milestones/v1.1-REQUIREMENTS.md`
- v1.1 audit archive: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- v1.1 phase artifacts: `.planning/milestones/v1.1-phases/`
- Milestone summary: `.planning/MILESTONES.md`

## Current Milestone: v1.2 Trusted Adult Plan & Mood Check-ins

**Goal:** Help students build a proactive support plan and share lightweight mood trends with trusted adults before concerns escalate into SOS situations.

**Target features:**
- Student-owned trusted adult plan that lets students choose linked adults, support preferences, boundaries, and what kind of help they want in difficult moments.
- Lightweight daily/weekly mood check-ins with supportive Vietnamese copy, low-friction inputs, optional private notes, and student-owned history/trends.
- Privacy-preserving adult support summaries that show trends and suggested supportive actions without exposing raw notes, raw answers, or punitive risk rankings.
- Admin-safe configuration and metadata audit for check-in prompts/support guidance without adding surveillance dashboards or raw exports.

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

### Active

- [ ] Students can create and update a trusted adult support plan from existing linked adults.
- [ ] Students can complete lightweight mood check-ins and review their own check-in history/trends.
- [ ] Teachers and parents can see privacy-preserving check-in/support summaries for linked students without raw private notes.
- [ ] Admins can configure support-plan/check-in guidance and inspect metadata-only activity safely.
- [ ] New support-plan/check-in flows preserve BeYou's privacy-by-default, non-clinical, support-not-surveillance boundaries.

### Out of Scope

- Native mobile app - responsive web remains the current product surface.
- Replacing in-app SOS with email - email is optional best-effort notification readiness; in-app SOS remains canonical.
- Real Zalo/SMS/push notification delivery - requires consent, provider governance, and production retry/dead-letter operations.
- Chatbot replacing professional psychological care - chatbot only provides supportive first response and escalation guidance.
- Full school-district deployment automation and multi-school tenancy - deferred until single-school operational safety is stable.
- OAuth/SSO - email/password plus seeded demo accounts is enough until a production school identity provider is selected.
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
6. Student is redirected to privacy acknowledgement before sensitive `/student/*` content renders when acknowledgement is missing.

Roles:

- **Student**: uses tests, scenarios, chatbot, SOS, dashboard, and history.
- **Teacher**: receives SOS, views managed students, support summaries, and updates SOS handling status.
- **Parent**: receives SOS and sees linked student status/support summaries within privacy boundaries.
- **Admin**: manages users, links, wellbeing content, chatbot safety config, aggregate reports, readiness, and metadata-only operations.

## Constraints

- **Backend stack**: Python backend is required.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required.
- **Chatbot safety**: The chatbot must not claim to be a therapist or diagnostic tool. High-risk messages must trigger escalation guidance and SOS/trusted-adult suggestions.
- **SOS delivery**: In-app SOS is canonical. Email delivery is optional, backend-owned, best-effort, and must not expose raw student content or provider credentials.
- **Authentication**: The current product uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **Operations visibility**: Admin operations views must stay metadata-only and must not add raw exports, risk leaderboards, or per-student risk drilldowns.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid medicalized language.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build v1 as MVP demo with full core flows | Shows the end-to-end student, teacher, parent, and admin journey | Validated in v1.0 |
| Use Python FastAPI backend | Explicit user requirement and a good fit for API-first backend | Validated in v1.0 |
| Use backend-only freemodel.dev provider abstraction | Keeps API keys private and enables provider swap | Validated in v1.0 |
| Use in-app SOS notifications as canonical | Demonstrates escalation and handling without depending on external delivery | Validated in v1.0 and reinforced in v1.1 |
| Treat real student data as possible from day one | Sensitive psychology data needs production-minded defaults | Validated in v1.0 |
| Use email/password and seeded demo accounts | Supports realistic demo without OAuth/SSO complexity | Validated in v1.0 |
| Keep raw self-check answers student-only | Preserves student trust while enabling summary support from adults | Validated in v1.0 |
| Keep adult views privacy-limited | Product should support students, not surveil them | Validated across v1.0 and v1.1 |
| Use explicit local dev origins for credentialed CORS | Supports localhost and 127.0.0.1 dev URLs without wildcard credentials | Validated in v1.0 |
| Keep chatbot transcripts student-owned | Admins manage safety config and metadata, not raw private chat by default | Validated in v1.0 |
| Keep aggregate reports privacy-limited | Reports should support capacity planning, not expose raw detail or rank students by risk | Validated in v1.0 |
| Add production readiness before expanding operations | Operators need safe liveness/readiness distinction before trusting real student data | Validated in Phase 7 |
| Use backend-owned SOS email delivery attempts | Provider credentials and failure isolation belong on the backend; email must not replace in-app SOS | Validated in Phase 8 |
| Use local outbox for development email | Prevents accidental real-world SOS messages while preserving delivery metadata | Validated in Phase 8 |
| Gate student UX at authenticated layout | Privacy-blocked or wrong-role states should not render protected children first | Validated in Phase 9 |
| Preserve historical attempts through snapshots/version-safe content behavior | Admin content edits must not break past student records | Validated in Phase 10 |
| Keep operations visibility metadata-only | Admins need readiness and support operations context without raw sensitive browsing | Validated in Phase 11 |

## Known Tech Debt

- No blocker debt remains for v1.1 completion.
- Deferred future work includes notification retry queues, Zalo/SMS/push channels, reason-for-access prompts, content diff/version history, multi-school tenancy, and production OAuth/SSO.

## Next Milestone Goals

v1.2 focuses on trusted adult planning and lightweight mood check-ins. The milestone should deepen proactive support while preserving in-app SOS as canonical, keeping raw student notes student-owned, and avoiding surveillance-oriented adult/admin views.

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
*Last updated: 2026-05-22 after starting v1.2 milestone*
