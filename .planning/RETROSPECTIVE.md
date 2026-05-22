# Retrospective: BeYou - Tu Tin La Minh

## Milestone: v1.0 - MVP Demo

**Shipped:** 2026-05-21  
**Phases:** 6  
**Plans:** 26  
**Requirements:** 47/47 satisfied

### What Was Built

- Privacy, authorization, audit, demo-data, and non-clinical safety foundation.
- Email/password auth, role portals, demo accounts, and admin user/link management.
- Student self-check and scenario flows with admin content management and summary-only adult visibility.
- Confirmed SOS workflow with linked teacher/parent visibility and teacher status handling.
- Backend-only supportive chatbot gateway with provider abstraction, guardrails, escalation copy, and admin safety config.
- Privacy-limited aggregate reports with small-group suppression and no raw sensitive exports.

### What Worked

- Building privacy and authorization contracts first reduced later rework across self-checks, SOS, chatbot, and reports.
- Backend-owned session, authorization, scoring, guardrails, and report suppression kept the frontend from becoming a security boundary.
- Phase-level verification plus final milestone audit caught artifact drift before archive.
- Autonomous phase execution worked well once user decisions were encoded as locked defaults.

### What Was Inefficient

- Some GSD tracking updates missed ROADMAP/STATE/REQUIREMENTS fields and required manual normalization.
- Phase 02 had verification evidence in `02-07-SUMMARY.md` but lacked the standard `02-VERIFICATION.md` artifact until milestone audit.
- Local dev auth was slowed by localhost vs 127.0.0.1 CORS/same-site mismatches and frontend port relay issues.
- `MILESTONES.md` needed manual accomplishments because automatic extraction returned none.

### Patterns Established

- Sensitive student resources use role + relationship + purpose checks, deny-by-default backend enforcement, and metadata-only audit.
- Raw self-check answers and chatbot transcripts remain student-owned by default.
- Adults receive support summaries and SOS workflow state, not raw private detail.
- Chatbot safety is enforced pre- and post-provider on the backend, with provider abstraction and deterministic fallback.
- Aggregate reports suppress small sensitive buckets and avoid exports, drilldowns, and risk leaderboards.

### Key Lessons

- Treat GSD generated state as useful but verify against disk artifacts before advancing workflow gates.
- Every completed phase should have a canonical `*-VERIFICATION.md`, even if the final plan summary already includes verification evidence.
- Local cookie-auth flows need explicit dev origins documented and tested early.
- For sensitive wellbeing apps, "support, not surveillance" must be validated in API shape, UI copy, and reporting constraints.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Most value came from autonomous execution agents plus targeted orchestrator audits/fixes.
- The largest manual overhead was artifact normalization rather than application implementation.

## Milestone: v1.1 - Production Hardening & Support Polish

**Shipped:** 2026-05-22  
**Phases:** 5  
**Plans:** 15  
**Requirements:** 30/30 satisfied

### What Was Built

- Production readiness service and endpoints for liveness, readiness, unsafe config, database/Alembic state, cookie/origin safety, demo seed state, and secret masking.
- Backend-owned SOS email delivery readiness with disabled, local outbox, and SMTP modes; canonical in-app SOS persistence remains isolated from email failures.
- Role/privacy UX polish for student privacy redirects, role-specific navigation, supportive wrong-role states, adult summary-only copy, and teacher/parent SOS clarity.
- Complete nested admin content editing for self-checks and scenarios, including validation detail, previews, and version-safe historical attempts.
- Metadata-only admin operations dashboard for readiness, SOS delivery attempts, and filtered audit activity without raw sensitive content.

### What Worked

- Keeping in-app SOS canonical made email readiness additive and low-risk.
- Metadata-only rules were validated repeatedly across email delivery, readiness, audit summaries, and operations UI.
- Targeted tests plus full regressions gave confidence after each privacy-sensitive backend/frontend change.
- Phase 9 resolved the main v1.0 UX debts before Phase 10 and Phase 11 built on the authenticated layout.

### What Was Inefficient

- Automatic milestone accomplishment extraction returned none, so MILESTONES.md needed manual enrichment.
- `gsd-tools milestone complete` updated some state fields generically and required manual STATE/PROJECT review.
- Large nested admin-content UI tests were initially slow; using direct change events for large text areas reduced suite timeout risk.
- Milestone audit required manual 3-source cross-reference because SUMMARY files do not expose standardized one-liners.

### Patterns Established

- Production readiness should separate public overall status from admin-only remediation details.
- Optional external notification channels should be backend-owned, failure-isolated, and metadata-only by default.
- Protected layouts should block rendering children before redirecting privacy-blocked or wrong-role users.
- Operations surfaces must use explicit sanitizers and should frame themselves as support metadata, not student monitoring.

### Key Lessons

- Additive hardening milestones work best when every new operations surface reuses existing privacy boundaries instead of creating new raw-data access paths.
- Local/dev delivery modes need first-class tests because they are the safest way to validate notification workflows.
- For nested admin editors, version-safe backend behavior matters as much as frontend edit completeness.
- GSD archive automation is useful, but living docs still need human/agent judgment for product-state evolution.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Autonomous execution was effective for phases with clear privacy constraints and existing regression suites.
- The largest manual overhead was milestone archival/document normalization, not feature implementation.

## Milestone: v1.2 - Trusted Adult Plan & Mood Check-ins

**Shipped:** 2026-05-22
**Phases:** 4
**Plans:** 12
**Requirements:** 24/24 satisfied

### What Was Built

- Student-owned trusted adult support plans with selected linked adults, shareable support preferences, lifecycle controls, and metadata-only audit.
- Lightweight student mood check-ins with non-clinical prompts, optional private notes, timestamped repeat entries, history, and supportive trend guidance.
- Teacher/parent support summaries that combine selected support-plan details and mood trend summaries without raw private notes or raw check-in details.
- Admin mood check-in configuration for prompts, option labels, guidance, lifecycle status, validation, and preview.
- v1.2 operations metadata buckets for support-plan, mood-check-in, adult-summary, and admin-config activity.

### What Worked

- Student-owned privacy boundaries from Phases 12 and 13 made Phase 14 adult summaries straightforward and safe.
- Keeping SOS separate from mood check-ins avoided accidental escalation side effects.
- Phase 15's cross-surface privacy regression caught the exact integration surfaces needed for milestone audit.
- The integration checker found a real CORS `PUT` gap before archive, and the fix was small and testable.

### What Was Inefficient

- GSD accomplishment extraction again returned none, requiring manual enrichment of MILESTONES.md.
- `gsd-tools milestone complete` archived core files but still required manual ROADMAP/PROJECT/STATE normalization.
- Phase directories had to be moved manually after archive to match prior milestone organization.
- Frontend lint remains blocked by Next 16 `next lint` script drift.

### Patterns Established

- Proactive support features should stay student-owned and selected-adult scoped.
- Mood tracking must remain lightweight, non-clinical, and explicitly separate from SOS automation.
- Adult views should expose trend/support summaries only, not raw private detail.
- Admin configuration can improve copy and guidance without expanding raw data access.
- CORS preflight coverage should be included for every browser mutation method used by the frontend.

### Key Lessons

- Cross-phase integration checks are valuable even after phase-level tests pass; they catch deployment-shaped wiring gaps.
- For sensitive student support features, privacy rules need to be tested at API schemas, UI copy, audit metadata, and operations summaries together.
- Archival automation should be treated as a first pass; living project docs need a deliberate product-state review.
- Keep future notification/reminder work separate until consent, quiet hours, retries, and provider governance are designed.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Autonomous execution was effective because v1.2 had clear privacy/safety invariants and small phase boundaries.
- Most manual effort was again document/archive normalization rather than feature implementation.

## Cross-Milestone Trends

| Theme | v1.0 Observation | Follow-up |
|---|---|---|
| Privacy defaults | Effective when decided before feature work | v1.2 confirmed this must extend to support plans, mood notes, adult summaries, admin config, and operations metadata |
| GSD state drift | ROADMAP/STATE/REQUIREMENTS sometimes needed manual correction | Still true in v1.2; audit and archive artifacts before completion |
| UX debt | v1.0 role nav/privacy redirect issues were non-blocking | v1.1 resolved layout gating; v1.2 reused it for support-plan and mood-check-in routes |
| Admin tooling | v1.0 backend supported richer nested content than MVP UI exposed | v1.1 closed nested editing; v1.2 added safe configuration for mood prompts/guidance |
| Operations visibility | v1.0 avoided raw sensitive reports | v1.2 extends metadata-only visibility to proactive support and mood activity |
| Integration audit | Phase tests catch local behavior | v1.2 showed milestone integration checks can catch deployment-shaped gaps such as missing CORS methods |
