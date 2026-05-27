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

## Milestone: v1.3 - Pilot UX & Demo Readiness

**Shipped:** 2026-05-22
**Phases:** 5
**Plans:** 5
**Requirements:** 20/20 satisfied

### What Was Built

- Public guided demo landing and one-step role entry for student, teacher, parent, and admin evaluators.
- Role-specific guided walkthrough cards and demo/live indicators across the dashboards.
- Global responsive/accessibility guardrails plus smoke coverage for critical mobile/tablet/desktop routes.
- Supportive Vietnamese copy and critical-action outcome states for SOS, adult/admin support framing, destructive actions, and config changes.
- Metadata-only demo operations readiness for seed state, connectivity/session contract, and production smoke checklist.
- Next 16-compatible ESLint flat config, passing lint, targeted responsive smoke, full frontend regression, and production build gates.

### What Worked

- Treating v1.3 as UX/operations hardening avoided scope creep into new sensitive data-sharing features.
- Existing privacy invariants made copy polish and operations readiness safer to implement quickly.
- Production smoke exposed the exact public demo state: live role flows pass while `/health/ready` remains `not_ready` because demo seeding is enabled.
- Fixing lint in Phase 20 converted a known v1.2 tooling debt into a durable regression gate.

### What Was Inefficient

- GSD automatic milestone archive still produced sparse accomplishments and required manual MILESTONES/PROJECT/STATE enrichment.
- SUMMARY artifacts still lack standardized machine-readable one-liners, making cross-source audit partly manual.
- Phase directories still needed manual archive movement to match prior milestone organization.
- Smoke coverage remains mostly semantic/API-level; authenticated browser hydration across deployed role dashboards is deferred.

### Patterns Established

- Demo/pilot readiness should have two separate signals: public demo usability smoke and stricter production launch readiness.
- Operations dashboards should expose connectivity/session/seed metadata, not cookie values, secrets, exports, or raw student content.
- Responsive smoke can be fast and useful in Vitest/jsdom when it verifies semantic role entry and critical links at representative widths.
- Next 16 frontend quality should use ESLint flat config and direct ESLint CLI rather than `next lint`.

### Key Lessons

- Demo UX is product functionality: role entry, copy, and guide cards need the same verification rigor as backend APIs.
- For live demos with public seed data, document the intentional gap between demo readiness and real production readiness.
- Keep lint/test/build/smoke evidence in phase verification so milestone audit can cross-check requirements quickly.
- Archive automation should run before manual doc evolution, but the output needs deliberate human/agent review.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Autonomous execution remained effective because the milestone had narrow phase boundaries and strict privacy constraints.
- The largest manual overhead remained archival/document normalization and audit synthesis.

## Milestone: v1.4 - Consent-Based Notifications & Access Transparency

**Shipped:** 2026-05-25
**Phases:** 7
**Plans:** 7
**Requirements:** 36/36 satisfied

### What Was Built

- Student-controlled in-app reminder preferences with consent, quiet hours, pause/resume, deferred external channels, and no automatic SOS side effects.
- Selective private mood-note or student-summary sharing with chosen linked adults, preview/confirmation, revocation, relationship checks, and metadata-only audit.
- Reason-for-access transparency for protected teacher/parent support summaries and shared notes.
- Admin privacy policy defaults plus metadata-only operations/readiness coverage for v1.4 consent, sharing, reason-gate, and policy activity.
- Peerlight AI Vietnamese-first student UX refresh, expanded non-proprietary psychological self-check demo content, and SOS-only adult student visibility.

### What Worked

- Starting with policy contracts made reminder, sharing, reason-gate, and operations surfaces easier to wire without expanding raw-data access.
- Cross-role privacy regression in Phase 26 gave the audit enough evidence to isolate real runtime gaps instead of rechecking every feature manually.
- Phase 27's gap-closure pass converted audit findings into focused product improvements and validated them with full backend/frontend gates plus a live demo.
- Keeping external notification channels deferred prevented provider/retry scope creep while still delivering consent and transparency foundations.

### What Was Inefficient

- Automatic milestone accomplishment extraction again returned none and required manual MILESTONES enrichment.
- `gsd-tools milestone complete` archived core files but left ROADMAP/REQUIREMENTS/PROJECT/STATE normalization and phase-directory movement to manual follow-up.
- Some legacy frontend test fixtures still carried old operations identifiers after the API contract changed and needed cleanup during audit.
- Local live-demo debugging was slowed by stale listeners and localhost vs 127.0.0.1 cookie/CORS mismatches.

### Patterns Established

- Admin policy toggles must be consumed by runtime feature code, not only saved as configuration.
- Adult support visibility now requires both active relationship and an explicit student SOS signal before student lists/support summaries reveal the student.
- Operations APIs should omit raw object identifiers when metadata categories/statuses are enough for support readiness.
- Product rebrands should include copy/privacy grep gates so old names and unsafe content do not leak into sensitive student surfaces.

### Key Lessons

- Milestone audits should include 3-source requirements checks: requirements table, phase summaries, and verification artifacts.
- Privacy-sensitive UI refreshes need API-contract validation; visible Vietnamese labels can change while backend enum contracts stay stable.
- Live demos are most reliable when frontend/backend ports, API base URL, and cookie host are aligned before walkthrough.
- Archive automation is still a first pass; final milestone closure needs deliberate living-doc review.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Autonomous execution remained effective for tightly scoped privacy phases and a final gap-closure phase.
- Most manual effort was archive normalization, live-demo environment debugging, and audit evidence synthesis.

## Milestone: v1.5 - Production Pilot Readiness & Identity

**Shipped:** 2026-05-26
**Phases:** 5
**Plans:** 22
**Requirements:** 28/28 satisfied

### What Was Built

- Explicit runtime modes for `local_demo`, `public_demo`, and `production_pilot`, with strict pilot readiness checks, production-pilot demo seed no-op, and demo-login blocking.
- Deployment guardrail CLI plus separate public-demo and production-pilot smoke profiles so demo success cannot be counted as pilot proof.
- OAuth/SSO-ready identity contracts using provider+subject hash mapping, safe session auth metadata, and public-safe auth capabilities without browser token storage.
- School pilot operations metadata for launch checklist, demo/real data safety, rollback guidance, and handoff support without raw student surveillance.
- Phase 32 release gates across backend, Node scripts, frontend UI, docs, guardrail output, and final verification.

### What Worked

- Phase 28 runtime separation gave Phases 29-32 a stable safety contract to build deployment, identity, launch, and release gates on.
- Keeping identity provider work contract-only avoided OAuth callback/token-exchange scope creep while still preparing database/session/auth surfaces.
- Metadata-only operations constraints stayed consistent across backend schemas, frontend DOM, CLI guardrail output, README docs, and release tests.
- The final release gates caught real sanitizer and test-runner drift before archive.

### What Was Inefficient

- Automatic milestone accomplishment extraction again returned none and required manual MILESTONES enrichment.
- `gsd-tools milestone complete` archived core files but left ROADMAP/PROJECT/STATE normalization, phase-directory movement, and research archive movement to manual follow-up.
- Full-suite frontend verification initially failed because Vitest collected Node `node:test` files and an older Phase 20 smoke test did not mock new auth capabilities.
- Live `smoke:pilot` could not be run in this environment because safe production-pilot URLs/configuration and readiness `ready` were unavailable.

### Patterns Established

- Public demo readiness and production-pilot readiness are separate product states with separate smoke evidence.
- Production-pilot launch evidence must distinguish deterministic local gates, public demo smoke, and live pilot smoke.
- External identity claims never grant visibility; app-owned role, active relationship, and student-sent SOS remain authoritative.
- Admin operations should add frontend defense-in-depth filtering even when backend sanitization already exists.

### Key Lessons

- Release-gate phases are valuable because they find integration drift that individual implementation phases can miss.
- For pilot readiness, constrained external evidence should be recorded honestly instead of converted into a fake pass.
- Contract-first identity work can safely prepare for SSO without weakening existing cookie/session and privacy boundaries.
- Archive automation is still a first pass; final milestone closure needs deliberate living-doc and memory updates.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Autonomous execution remained effective for heavily constrained production/privacy work.
- Most manual effort was final archive normalization, audit synthesis, and maintaining accurate global memory.

## Cross-Milestone Trends

| Theme | v1.0 Observation | Follow-up |
|---|---|---|
| Privacy defaults | Effective when decided before feature work | v1.5 kept identity, launch, operations, and release gates tied to metadata-only and support-not-surveillance constraints |
| GSD state drift | ROADMAP/STATE/REQUIREMENTS sometimes needed manual correction | Still true in v1.5; archive automation should be followed by manual living-doc normalization |
| UX debt | v1.0 role nav/privacy redirect issues were non-blocking | v1.5 kept production identity UI fail-closed via backend auth capabilities before showing demo shortcuts |
| Admin tooling | v1.0 backend supported richer nested content than MVP UI exposed | v1.5 adds pilot launch, data-safety, identity readiness, and smoke metadata panels without raw content or drilldowns |
| Operations visibility | v1.0 avoided raw sensitive reports | v1.5 tightened metadata-only visibility across backend serialization, frontend DOM, CLI guardrail output, and docs |
| Integration audit | Phase tests catch local behavior | v1.5 confirmed cross-phase checks can accept constrained external evidence while still blocking fake production-pilot proof |
