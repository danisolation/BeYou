# Peerlight AI

## What This Is

Peerlight AI is a privacy-first web app for Vietnamese high-school students to recognize pressure, check mental well-being through short psychological self-checks, practice real school situations, chat with a supportive AI companion, build proactive trusted-adult support plans, complete lightweight mood check-ins, and send SOS alerts when they feel unsafe or at risk.

The product serves students first. Teacher, parent, and admin portals support escalation, content management, trusted-adult support summaries, aggregate reporting, and operational visibility without turning sensitive student data into surveillance.

## Core Value

Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## Current State

**Shipped version:** v2.4 External Notifications & Security Hardening Prep (shipped 2026-06-04)
**Milestone status:** No active milestone — DRAFT artifacts for v2.5 UI/UX Real-App Overhaul exist at `.planning/milestones/v2.5-DRAFT-*`
**Next step:** `/gsd-new-milestone v2.5 UI/UX Real-App Overhaul`
**Latest tag:** v2.4 (pending push)

## Current Milestone: v2.3 Content Management Polish

- Python/FastAPI backend with PostgreSQL, SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, metadata-only audit, readiness checks, connection pool optimization, and keep-alive cron.
- Next.js/TypeScript frontend with student, teacher, parent, and admin portals using cookie-authenticated API calls and no browser token storage.
- **PWA:** Installable web app with service worker (5-branch caching), offline fallback, install prompt for returning users, app shell pre-caching via build-time manifest injection.
- **Mobile navigation:** Bottom tab bar for students (5 items + center SOS), drawer for admin, responsive breakpoint switching at 768px, 44px touch targets.
- **Responsive layouts:** All pages (student, admin, teacher, parent, public) responsive from 320px to 1440px+.
- **Animations:** Page transitions, micro-interactions (btn-press, card-lift), skeleton loading, pull-to-refresh, reduced-motion respect.
- Student wellbeing flows: privacy notice, Test tâm lý results/history, Tình huống xử lý thực tế, supportive Peerlight AI chat, confirmed SOS alerts, trusted adult support plans, mood check-ins/history, in-app reminders, selective mood-note sharing/revocation.
- Adult support flows: linked teacher/parent views, reason-gated support summaries, student-consented shared mood notes, in-app SOS notifications, teacher status workflow.
- Admin flows: users, links, content editing, chatbot config, mood check-in config, privacy policy, aggregate reports, operations dashboard with pilot panels.
- Demo/pilot readiness: guided landing, demo roles, runtime modes, deployment guardrails, OAuth/SSO-ready identity contracts.

### Latest Verification Snapshot

- Backend full pytest: `189 passed`
- Backend ruff: passed
- Frontend full Vitest: `22 test files passed`, `111 tests passed`
- Frontend lint: passed
- Frontend production build: passed
- Public demo smoke: `DEMO_SMOKE_PASS 16/16` after Phase 32
- Live production-pilot smoke: constrained until safe pilot URLs/configuration and `/health/ready=ready` exist
- Phase 27 copy/privacy grep gates: passed for frontend app/components and backend app, allowing the legacy demo password only
- Phase 28 verification: passed, including backend runtime/readiness/auth/seed regressions, frontend operations contract regressions, code review, and schema drift check
- Phase 29 verification: passed, including guardrail/smoke Node tests, backend operations metadata tests, operations UI regressions, frontend lint/build, schema drift check, and clean code review/re-review
- Phase 30 verification: passed, including identity/session schema tests, external identity resolver tests, authorization privacy regressions, auth capabilities tests, operations UI regressions, code review fixes, Alembic check, schema drift check, backend ruff, frontend lint/build
- Phase 31 verification: passed, including pilot operations backend regressions, operations UI regressions, README docs gate, code review, backend ruff, frontend lint/build, and `31-VERIFICATION.md` score 5/5
- Phase 32 Plan 32-01 verification: passed, including backend release gates for QA-01/QA-03/QA-04/QA-05, 72 related backend regressions, and backend ruff
- Phase 32 Plan 32-02 verification: passed, including deterministic Node release gates, deploy guardrail tests, and smoke profile tests
- Phase 32 Plan 32-03 verification: passed, including frontend no-token/privacy/operations release gates, related UI regressions, and frontend lint
- Phase 32 Plan 32-04 verification: passed, including README release-gate matrix, live smoke constraints, privacy grep guidance, and Node release gates
- Phase 32 final verification: constrained pass, including full backend/frontend/lint/build/docs/guard/demo-smoke gates; live `smoke:pilot` remains constrained until safe production-pilot URLs/configuration and readiness `ready` exist
- v1.5 milestone audit: tech debt status after 3-source cross-reference and integration checker; 28/28 requirements satisfied, 0 blockers, live `smoke:pilot` remains a pre-launch constraint
- Phase 33 verification: passed, including `33-UI-INVENTORY.md`, `33-PERFORMANCE-BASELINE.md`, artifact redline gate, frontend UI inventory and baseline helper tests, backend performance baseline pytest, and aggregate-only privacy-safe evidence checks
- Phase 36 verification: passed, including bounded Admin users/links, batched Teacher/Parent SOS visibility and support overview, SQL-side adult summaries, bounded metadata-only Admin operations, no-new-index DBPERF-05 decision, focused backend 56/56 tests, backend ruff passed, Alembic no-drift check, and clean code review

### Planning Archives

- v1.5 roadmap archive: `.planning/milestones/v1.5-ROADMAP.md`
- v1.5 requirements archive: `.planning/milestones/v1.5-REQUIREMENTS.md`
- v1.5 audit archive: `.planning/milestones/v1.5-MILESTONE-AUDIT.md`
- v1.5 phase artifacts: `.planning/milestones/v1.5-phases/`
- v1.5 research archive: `.planning/milestones/v1.5-research/`
- v1.4 roadmap archive: `.planning/milestones/v1.4-ROADMAP.md`
- v1.4 requirements archive: `.planning/milestones/v1.4-REQUIREMENTS.md`
- v1.4 audit archive: `.planning/milestones/v1.4-MILESTONE-AUDIT.md`
- v1.4 phase artifacts: `.planning/milestones/v1.4-phases/`
- v1.4 research archive: `.planning/milestones/v1.4-research/`
- v1.3 roadmap archive: `.planning/milestones/v1.3-ROADMAP.md`
- v1.3 requirements archive: `.planning/milestones/v1.3-REQUIREMENTS.md`
- v1.3 audit archive: `.planning/milestones/v1.3-MILESTONE-AUDIT.md`
- v1.3 phase artifacts: `.planning/milestones/v1.3-phases/`
- v1.2 roadmap archive: `.planning/milestones/v1.2-ROADMAP.md`
- v1.2 requirements archive: `.planning/milestones/v1.2-REQUIREMENTS.md`
- v1.2 audit archive: `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- v1.2 phase artifacts: `.planning/milestones/v1.2-phases/`
- Milestone summary: `.planning/MILESTONES.md`

## Current Milestone: v2.3 Content Management Polish

**Goal:** Formalize and polish the content management editor — threshold scoring reliability, cover image media, FE-BE publish alignment, and minor UX tweaks.

**Target features:**

- Manual threshold scoring with visual coverage grid (gaps, overlaps, out-of-range detection)
- FE publish checklist perfectly aligned with BE validation rules
- Cover image upload for tests/scenarios across all roles
- Vietnamese placeholders and helper text
- Smart "add threshold" and explicit-only redistribute

## Completed Milestone: v1.9 Production Polish

**Goal:** Remove demo visual indicators, production tone, runtime switch, admin/student UI polish.
**Archived:** 2026-05-28
**Status:** Complete.

## Completed Milestone: v1.5 Production Pilot Readiness & Identity

**Goal:** Move Peerlight AI from a public demo that is usable to a production-pilot-ready system that can safely support a real school pilot without demo data, unsafe deployment drift, or weak identity controls.

**Archived:** 2026-05-26
**Status:** Complete with accepted tech debt: live `smoke:pilot` must be run before a real school pilot launch.

**Target features:**

- Production/demo environment separation with demo seeding disabled for real launch and readiness checks that can pass in production mode.
- Deployment guardrails for Vercel/Render configuration, frontend root-directory safety, environment validation, and repeatable smoke verification.
- Production identity foundation with OAuth/SSO-ready contracts while preserving current email/password demo access.
- School pilot operational readiness: admin launch checklist, safe seed/data controls, metadata-only monitoring, and rollback/handoff guidance.
- Privacy regression coverage proving production pilot changes do not weaken student-owned data, SOS boundaries, or support-not-surveillance rules.

## Completed Milestone: v1.4 Consent-Based Notifications & Access Transparency

**Goal:** Add student-controlled reminder consent, selective mood-note sharing, reason-for-access transparency, school policy controls, Peerlight AI demo polish, and SOS-only adult visibility without weakening privacy-by-default boundaries.

**Target features:**

- Consent-first notification/reminder preferences with quiet hours, pause controls, and clear channel boundaries.
- Non-clinical in-app mood check-in reminders that never create SOS alerts automatically.
- Student-controlled selective private mood-note sharing with chosen linked adults.
- Reason-for-access prompts and metadata-only audit for sensitive adult/admin support access.
- Admin school policy defaults and metadata-only operations visibility for the new privacy controls.

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
- [x] New support-plan/check-in flows preserve Peerlight AI's privacy-by-default, non-clinical, support-not-surveillance boundaries.

### Validated in v1.3

- [x] Live demo/pilot entry point is understandable and role-guided for first-time evaluators.
- [x] Key production flows have tested responsive and accessibility coverage on mobile, tablet, and desktop.
- [x] Student, adult, and admin copy/interactions are polished without weakening student privacy boundaries.
- [x] Demo/pilot operations expose safe readiness feedback for seed state, connectivity, CORS/session behavior, and live walkthrough smoke checks.
- [x] Frontend quality tooling works on Next 16 with lightweight responsive/demo regression coverage.

### Validated in v1.4

- [x] Students can manage notification/reminder consent, quiet hours, pause state, and channel boundaries.
- [x] Students can receive supportive in-app mood check-in reminders without diagnosis, pressure, or automatic SOS side effects.
- [x] Students can selectively share specific private mood notes or note summaries with chosen linked adults and revoke sharing later.
- [x] Teachers and parents provide controlled support-oriented reasons before protected support-summary/shared-note access when policy requires it.
- [x] Admins can configure school-level v1.4 privacy/notification defaults and inspect metadata-only operations readiness for v1.4 controls.
- [x] Cross-role v1.4 privacy regressions, documentation, demo readiness, and production smoke are complete.
- [x] v1.4 audit gaps are closed: school policy defaults drive runtime behavior, note-sharing policy is enforced, and operations audit responses do not expose raw `resource_id`.
- [x] Peerlight AI rebrand, Vietnamese-first student UX, expanded psychological test content, and SOS-only adult visibility are complete.

### Validated in v1.5

- [x] Production and demo runtime modes are explicit, validated, and safe to deploy independently.
- [x] Real production readiness can pass when demo seeding is disabled and required secrets/configuration are present.
- [x] Production pilot boot blocks demo seeding, production-pilot auth blocks demo-user sessions, and public/admin readiness remains status-only or metadata-masked.
- [x] Frontend/backend deployment configuration is protected against root-directory, origin, cookie, and environment drift.
- [x] Demo smoke and production-pilot smoke are separate, with pilot smoke requiring readiness `ready` and no demo-user dependency.
- [x] Deployment guardrail/smoke metadata and README guidance are metadata-only and prevent public demo smoke from being mistaken for production-pilot proof.
- [x] Identity contracts support future OAuth/SSO through provider+subject mappings without unverified email auto-merge or privileged auto-create.
- [x] Auth sessions remain backend-owned HttpOnly cookies while recording safe auth method/provider metadata with no browser token storage.
- [x] Production pilot can disable public demo entry through public-safe auth capabilities while local/demo email-password flows continue.
- [x] Identity readiness and operations expose only metadata-safe provider, mapping, and session buckets.
- [x] School pilot operations expose safe launch checklist, demo/real data-safety metadata, rollback guidance, and handoff metadata without raw student surveillance.
- [x] Phase 32 release-gate context, research, and 5 verified execution plans are ready for final v1.5 privacy/security validation.
- [x] Backend Phase 32 release gates now prove production-pilot readiness/seed blocking, no-callback/no-token identity scope, SOS-only adult visibility, and operations metadata redlines for QA-01, QA-03, QA-04, and QA-05.
- [x] Node Phase 32 release gates now prove production-pilot deploy guardrails, demo/pilot smoke split, metadata-only guardrail output, and explicit live pilot smoke constraints for QA-02 and QA-06.
- [x] Frontend Phase 32 release gates now prove no-token auth, privacy acknowledgement routing, and metadata-only operations DOM behavior for QA-03, QA-04, and QA-05.
- [x] README Phase 32 release guidance now maps QA-01..QA-06 to exact commands and documents live `smoke:pilot` constraints plus privacy grep gates.
- [x] Final Phase 32 verification records deterministic gates passed, public demo smoke passed, and live production-pilot smoke constrained with no high-severity deterministic privacy/security failures.

### Active in v1.6 (Archived)

- [x] Establish a cross-role UI inventory and privacy-safe baseline evidence before UI/performance changes.
- [x] Harmonize Student, Teacher, Parent, and Admin UI patterns into a cohesive Peerlight AI experience.
- [x] Improve production performance across database and backend API hot paths.
- [x] Improve frontend rendering/data loading performance.
- [x] Add measurable UI/performance regression gates that preserve privacy, role authorization, and metadata-only operations boundaries.

### Active in v1.7

(Requirements being defined)

### Out of Scope

- Native mobile app - responsive web remains the current product surface.
- Replacing in-app SOS with email - email is optional best-effort notification readiness; in-app SOS remains canonical.
- Real Zalo/SMS/push notification delivery - requires consent, provider governance, and production retry/dead-letter operations.
- Chatbot replacing professional psychological care - chatbot only provides supportive first response and escalation guidance.
- Full school-district deployment automation and multi-school tenancy - deferred until single-school operational safety is stable.
- Full OAuth/SSO callback - Phase 30 only prepares identity contracts; provider-specific login waits until a school IdP is selected.
- Parent/teacher access to full raw chatbot transcripts by default - violates privacy-by-default and may reduce student trust.
- Adult/admin access to raw private mood notes by default - violates student-owned privacy boundaries.
- Student risk leaderboard or punitive monitoring - Peerlight AI must support, not surveil or discipline students.

## Context

The app is intended for high-school students and must feel friendly, light, and non-clinical. Student-facing copy stays supportive, calm, Vietnamese, and clear that Peerlight AI does not replace professional care. Red is reserved for SOS or high-risk states.

Core student flows shipped:

1. Student logs in, opens dashboard, and can review privacy/support boundaries.
2. Student takes a Test tâm lý, receives backend-scored feedback with Vietnamese visible labels, and can review history.
3. Student opens a Tình huống xử lý thực tế, chooses a response, and receives supportive advice, better alternatives, and related skill guidance.
4. Student chats with the bot; high-risk content triggers SOS/trusted-adult guidance without unrestricted advice.
5. Student confirms SOS; linked teacher/parent see the alert in-app and status moves from sent to received, supporting, and completed.
6. Student is redirected to privacy acknowledgement before sensitive `/student/*` content renders when acknowledgement is missing.
7. Student creates a trusted adult support plan, chooses linked adults, and controls what shareable support preferences adults can see.
8. Student submits lightweight mood check-ins with optional private notes and can review timestamped history/trends.

Roles:

- **Student**: uses tests, scenarios, chatbot, SOS, dashboard, history, support plan, and mood check-ins.
- **Teacher**: receives SOS, views linked students only after they have sent SOS, sees selected support-plan details and mood trend summaries within privacy boundaries, and updates SOS handling status.
- **Parent**: receives SOS and sees linked student status/support summaries only after the student has sent SOS.
- **Admin**: manages users, links, wellbeing content, chatbot safety config, mood check-in config, aggregate reports, readiness, and metadata-only operations.

## Constraints

- **Backend stack**: Python backend is required.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required.
- **Chatbot safety**: The chatbot must not claim to be a therapist or diagnostic tool. High-risk messages must trigger escalation guidance and SOS/trusted-adult suggestions.
- **SOS delivery**: In-app SOS is canonical. Email delivery is optional, backend-owned, best-effort, and must not expose raw student content or provider credentials.
- **Authentication**: The current product uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **Operations visibility**: Admin operations views must stay metadata-only and must not add raw exports, risk leaderboards, or per-student risk drilldowns.
- **Support-plan and mood privacy**: Adults see only selected support preferences and trend summaries; optional private mood notes remain student-only by default.
- **Notification consent**: Reminder work must start with explicit consent, quiet hours, and pause controls; external Zalo/SMS/push delivery remains deferred until provider governance, retries, and dead-letter handling are designed.
- **Sensitive access transparency**: Reason-for-access metadata can explain why support data was viewed, but must not become a raw-content export or punitive surveillance workflow.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid medicalized language.

## Key Decisions

| Decision                                                                     | Rationale                                                                                                                                                                | Outcome                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Build v1 as MVP demo with full core flows                                    | Shows the end-to-end student, teacher, parent, and admin journey                                                                                                         | Validated in v1.0                              |
| Use Python FastAPI backend                                                   | Explicit user requirement and a good fit for API-first backend                                                                                                           | Validated in v1.0                              |
| Use backend-only freemodel.dev provider abstraction                          | Keeps API keys private and enables provider swap                                                                                                                         | Validated in v1.0                              |
| Use in-app SOS notifications as canonical                                    | Demonstrates escalation and handling without depending on external delivery                                                                                              | Validated in v1.0 and reinforced in v1.1/v1.2  |
| Treat real student data as possible from day one                             | Sensitive psychology data needs production-minded defaults                                                                                                               | Validated in v1.0                              |
| Use email/password and seeded demo accounts                                  | Supports realistic demo without OAuth/SSO complexity                                                                                                                     | Validated in v1.0                              |
| Keep raw self-check answers student-only                                     | Preserves student trust while enabling summary support from adults                                                                                                       | Validated in v1.0                              |
| Keep adult views privacy-limited                                             | Product should support students, not surveil them                                                                                                                        | Validated across v1.0-v1.4                     |
| Use explicit local dev origins for credentialed CORS                         | Supports localhost and 127.0.0.1 dev URLs without wildcard credentials                                                                                                   | Validated in v1.0; v1.2 added PUT coverage     |
| Keep chatbot transcripts student-owned                                       | Admins manage safety config and metadata, not raw private chat by default                                                                                                | Validated in v1.0                              |
| Keep aggregate reports privacy-limited                                       | Reports should support capacity planning, not expose raw detail or rank students by risk                                                                                 | Validated in v1.0                              |
| Add production readiness before expanding operations                         | Operators need safe liveness/readiness distinction before trusting real student data                                                                                     | Validated in Phase 7                           |
| Use backend-owned SOS email delivery attempts                                | Provider credentials and failure isolation belong on the backend; email must not replace in-app SOS                                                                      | Validated in Phase 8                           |
| Use local outbox for development email                                       | Prevents accidental real-world SOS messages while preserving delivery metadata                                                                                           | Validated in Phase 8                           |
| Gate student UX at authenticated layout                                      | Privacy-blocked or wrong-role states should not render protected children first                                                                                          | Validated in Phase 9 and reused in v1.2        |
| Preserve historical attempts through snapshots/version-safe content behavior | Admin content edits must not break past student records                                                                                                                  | Validated in Phase 10                          |
| Keep operations visibility metadata-only                                     | Admins need readiness and support operations context without raw sensitive browsing                                                                                      | Validated in Phase 11 and extended in Phase 15 |
| Make support plans student-owned and selected-adult scoped                   | Students should control which linked adults see proactive support preferences                                                                                            | Validated in Phase 12                          |
| Keep mood check-ins lightweight and non-clinical                             | The feature should support reflection without diagnosis, treatment, or surveillance                                                                                      | Validated in Phase 13                          |
| Keep optional mood notes student-only by default                             | Private notes are for student reflection, not adult/admin monitoring                                                                                                     | Validated in Phases 13-15                      |
| Let adults see trends and selected support preferences, not raw details      | Adults need supportive context without raw private notes or check-in drilldowns                                                                                          | Validated in Phase 14                          |
| Let admins configure prompts/guidance but not raw student data               | Configuration should improve copy while preserving metadata-only operations                                                                                              | Validated in Phase 15                          |
| Use public landing plus one-step demo role entry                             | Evaluators should understand Peerlight AI and enter each seeded role quickly without manual credential copying                                                           | Validated in Phase 16                          |
| Use global responsive/accessibility guardrails before per-page polish        | Shared layout fixes reduce overflow/focus risks across current and future screens                                                                                        | Validated in Phase 17                          |
| Make critical actions narrate consequences and outcomes                      | SOS, destructive, and config changes should be understandable and accessible without expanding private data access                                                       | Validated in Phase 18                          |
| Keep live demo smoke separate from production launch readiness               | Public demo usability can pass while production `/health/ready` remains `not_ready` until demo seeding is disabled for real launch                                       | Validated in Phase 19                          |
| Use ESLint flat config for Next 16                                           | Direct ESLint CLI replaces deprecated/broken `next lint` while preserving strict frontend quality gates                                                                  | Validated in Phase 20                          |
| Start v1.4 with consent and transparency before external channels            | Notification and sensitive-access features need student control, school policy, and audit boundaries before adding Zalo/SMS/push or broader adult access                 | Validated in v1.4                              |
| Make selective mood-note sharing student-granted and revocable               | Raw mood notes stay private by default; adults only see notes or student summaries through active relationship plus active unrevoked student grant                       | Validated in Phase 23                          |
| Require controlled reasons for protected adult support access                | Reason prompts add transparency but cannot bypass relationship authorization or become free-text surveillance records                                                    | Validated in Phase 24                          |
| Keep admin policy controls metadata-only and in-app-only                     | Admins can configure safe defaults and inspect v1.4 readiness without external channels, raw exports, student drilldowns, or raw reason text                             | Validated in Phase 25                          |
| Close v1.4 with regression evidence before archiving                         | Full backend/frontend gates, production smoke, docs, and code review provide milestone closure confidence                                                                | Validated in Phase 26                          |
| Close audit gaps before archive                                              | Policy defaults, note-sharing policy, and operations audit identifiers must be enforced at runtime before v1.4 can ship                                                  | Validated in Phase 27                          |
| Rebrand to Peerlight AI with Vietnamese-first student UX                     | User requested a calmer Stitch-inspired student experience, richer psychological test content, and Peerlight AI naming                                                   | Validated in Phase 27                          |
| Require SOS before teacher/parent student visibility                         | Adult support views should activate for students who sent SOS instead of enabling broad linked-student browsing                                                          | Validated in Phase 27                          |
| Separate runtime intent from deployment environment                          | `RUNTIME_MODE` captures product intent (`local_demo`, `public_demo`, `production_pilot`) while `ENVIRONMENT` remains platform/deployment semantics                       | Validated in Phase 28                          |
| Block demo seed/login before production-pilot side effects                   | Real pilots must not create walkthrough data or issue demo-user cookies even when legacy demo flags are accidentally enabled                                             | Validated in Phase 28                          |
| Keep production readiness metadata-only                                      | Public readiness stays status-only and admin operations expose masked runtime/connectivity metadata without secrets, cookie names, raw identifiers, or student content   | Validated in Phase 28                          |
| Separate deployment guardrails from live smoke checks                        | Config-only guardrails validate Render/Vercel/API/CORS/cookie expectations, while smoke scripts own live health/readiness/CORS checks                                    | Validated in Phase 29                          |
| Keep demo smoke and pilot smoke distinct                                     | `smoke:demo` can use seeded public-demo accounts; `smoke:pilot` requires readiness `ready` and no demo-user dependency                                                   | Validated in Phase 29                          |
| Prepare identity contracts before full OAuth/SSO                             | Provider-specific callbacks stay deferred, but Phase 30 added safe provider+subject mappings, session auth metadata, and public-safe capabilities                        | Validated in Phase 30                          |
| Keep identity claims out of authorization                                    | App-owned role, active relationship, privacy acknowledgement, and student-sent SOS remain the source of truth for access                                                 | Validated in Phase 30                          |
| Keep identity operations metadata-only                                       | Admin operations can show readiness, mapping, and session buckets without raw claims, provider subjects, emails, exports, or account drilldowns                          | Validated in Phase 30                          |
| Fix release-gate sanitizer gaps immediately                                  | Phase 32 Plan 32-01 expanded operations redlines when QA-05 caught answer/export/risk markers in serialized dashboard metadata                                           | Validated in Phase 32                          |
| Keep live pilot smoke constraints explicit                                   | Phase 32 Plan 32-02 adds deterministic Node gates and requires real safe pilot URLs/readiness before live `smoke:pilot` can count as evidence                            | Validated in Phase 32                          |
| Keep operations UI as a final redaction layer                                | Phase 32 Plan 32-03 filters unsafe audit metadata before rendering the admin operations DOM                                                                              | Validated in Phase 32                          |
| Preserve release docs as support-not-surveillance guidance                   | Phase 32 Plan 32-04 documents release commands, constrained live smoke, and privacy grep gates without normalizing raw exports/reset/risk drilldowns                     | Validated in Phase 32                          |
| Treat unavailable pilot smoke as constrained, not passed                     | Phase 32 final verification passed deterministic gates and public demo smoke, while recording live `smoke:pilot` as constrained until safe pilot config/readiness exists | Validated in Phase 32                          |

## Known Tech Debt

- `npm --prefix frontend audit --omit=dev` reports an existing moderate Next/PostCSS advisory; `npm audit fix --force` proposes a breaking downgrade, so track until a non-breaking stable Next release resolves it.
- Future hardening can add direct DemoRoleEntry click-through tests and authenticated browser dashboard hydration in production smoke.
- Deferred future work includes notification retry queues, Zalo/SMS/push channels, counselor handoff, content diff/version history, multi-school tenancy, and production OAuth/SSO.

## Next Milestone Goals

v1.7 focuses on rebuilding all student-facing and teacher/parent pages to match Google Stitch mockup designs. Deferred candidates after v1.7 remain live production-pilot evidence, provider-specific identity login, counselor handoff, external notification delivery governance, multi-school tenancy, and richer launch automation.

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

_Last updated: 2026-05-27 after starting v1.7 milestone_
