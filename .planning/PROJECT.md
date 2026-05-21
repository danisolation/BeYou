# BeYou - Tu Tin La Minh

## What This Is

BeYou is a web app for Vietnamese high-school students to recognize peer pressure, check mental well-being through short assessments, practice handling school situations, chat with a basic supportive counseling bot, and send SOS alerts when they feel unsafe or at risk.

The product serves students first, with teacher, parent, and admin portals for support, monitoring, content management, and safe escalation. v1 is an MVP demo with complete core flows, but the system must be designed with production-grade privacy and authorization because it may handle real student mental-health data.

## Core Value

Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## Requirements

### Validated

- [x] Phase 1 established privacy-by-default policy contracts for sensitive student psychology data: data classification, role/relationship/purpose authorization, metadata-only audit events, demo/real-data separation, and non-clinical safety copy.
- [x] Phase 2 implemented email/password login, role-based portals, seeded demo accounts, student-adult links, admin user/link management, and no-token cookie-authenticated frontend access.
- [x] Phase 3 implemented student self-checks, scenario practice, summary-only adult visibility, audited content management, seeded demo wellbeing content, and approved UAT for supportive UI tone.
- [x] Phase 4 implemented confirmed SOS alerts, in-app linked-adult notifications, visible status workflow, teacher handling controls, parent read-only status, summary-only adult support views, and metadata-only SOS audit.
- [x] Phase 5 implemented backend-only supportive chatbot gateway, provider abstraction, server-side guardrails, high-risk escalation guidance, student-owned transcript access, and admin-editable safety copy/config without exposing API keys.
- [x] Phase 6 implemented admin privacy-limited aggregate reports with small-group suppression, demo/real filtering, metadata-only audit, and no raw sensitive exports or per-student risk drilldowns.

### Active

- [x] Students can sign up or log in, access a personal dashboard, and use seeded demo accounts for the MVP.
- [x] Role-based access separates student, teacher, parent, and admin capabilities.
- [x] Students can complete short mental-health and peer-pressure tests, receive scored risk levels, and view test history.
- [x] Students can practice realistic school-pressure scenarios and receive feedback on each choice.
- [x] Students can chat with a supportive chatbot powered by freemodel.dev through the Python backend, with guardrails for high-risk messages.
- [x] Students can send an SOS alert that appears in-app to linked teachers and parents, then track handling status.
- [x] Teachers can view managed students, warning levels, SOS alerts, and support summaries.
- [x] Parents can view linked student alerts and permitted recent assessment results.
- [x] Admins can manage chatbot safety copy/config.
- [x] Admins can view privacy-limited aggregate reports.
- [x] Sensitive student psychology data is implemented with strict authorization, encrypted passwords, and private-by-default visibility.

### Out of Scope

- Native mobile app - v1 is responsive web-first.
- Real Zalo/SMS/push notification delivery - v1 uses in-app SOS notifications and status tracking.
- Chatbot replacing professional psychological care - chatbot only provides supportive first response and escalation guidance.
- Full school-district deployment automation - v1 supports one deployable product and can expand later to multiple schools/classes.
- OAuth/SSO - email/password plus seeded demo accounts is enough for v1.

## Context

The app is intended for high-school students and must feel friendly, light, and non-clinical. The interface should use calming colors such as light blue, light green, white, soft orange for mild warnings, and red only for SOS or high-risk states. It must work well on phones and desktops.

Core student flows:

1. Student logs in, opens dashboard, sees current state and quick actions.
2. Student takes a psychological or peer-pressure test, receives score, warning level, advice, positive content, and history entry.
3. Student opens a school scenario, chooses a response, and receives feedback, better alternatives, and related skill guidance.
4. Student chats with the bot; high-risk content triggers a warning, SOS suggestion, and trusted-adult guidance.
5. Student confirms SOS; linked teacher/parent see the alert in-app and update its status from sent to received, supporting, and completed.

Roles:

- **Student**: uses tests, scenarios, chatbot, SOS, dashboard, and history.
- **Teacher**: receives SOS, views managed students, risk levels, and class summaries.
- **Parent**: receives SOS, sees linked student warnings and support suggestions, with privacy boundaries.
- **Admin**: manages users, tests, scenarios, chatbot knowledge/content, and aggregate reports.

The backend must be Python. Chatbot integration should use freemodel.dev as the v1 LLM provider through the backend only, with provider abstraction so it can be swapped later. API keys must never be exposed to the frontend.

## Constraints

- **Backend stack**: Python backend is required by the user.
- **Scope**: v1 is an MVP demo with complete core flows, not every production extension.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required from the start.
- **Chatbot safety**: The chatbot must not claim to be a therapist or professional diagnosis tool. High-risk messages must trigger escalation guidance and SOS suggestions.
- **SOS delivery**: v1 SOS is in-app notification and status handling, not external email/Zalo/SMS.
- **Authentication**: v1 uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid heavy medicalized language.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build v1 as MVP demo with full core flows | Keeps scope achievable while showing the end-to-end student, teacher, parent, and admin journey | - Validated through Phase 6 |
| Use Python for the backend | Explicit user requirement | - Validated in Phase 2 |
| Use freemodel.dev as v1 chatbot provider | User requested it; backend abstraction reduces lock-in | - Validated in Phase 5 |
| Use in-app SOS notifications for v1 | Demonstrates escalation and handling without external notification integration complexity | - Validated in Phase 4 |
| Treat real student data as possible from day one | User selected production-grade handling for real data | - Validated in Phase 1 policy foundation |
| Use email/password and seeded demo accounts | Supports realistic demo without OAuth/SSO complexity | - Validated in Phase 2 |
| Keep raw self-check answers student-only | Preserves student trust while still enabling summary support from linked adults | - Validated in Phase 3 |
| Use explicit local dev origins for credentialed CORS | Supports localhost and 127.0.0.1 dev URLs without wildcard origins when cookies are enabled | - Validated in Phase 3 UAT |
| Keep SOS as a visible status workflow | Students and adults need to see `sent` → `received` → `supporting` → `completed`, not a fire-and-forget alert | - Validated in Phase 4 |
| Keep chatbot API keys backend-only | Frontend must call the Python gateway; provider secrets stay server-side and never appear in UI/API schemas | - Validated in Phase 5 |
| Keep chatbot transcripts student-owned | Adults/admins can manage safety configuration and see metadata-only safety signals, but not raw student chat content | - Validated in Phase 5 |
| Keep aggregate reports privacy-limited | Admin reporting should improve support capacity, not expose raw sensitive content or rank students by risk | - Validated in Phase 6 |

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
*Last updated: 2026-05-21 after Phase 6 completion*
