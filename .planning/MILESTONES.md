# Project Milestones: Peerlight AI

## v2.4 External Notifications & Security Hardening Prep (Shipped: 2026-06-04)

**Delivered:** SMTP startup validation with safe fallback, sanitized email dispatch metadata, multi-school tenant_id schema scaffolding (nullable UUID columns, no runtime enforcement), comprehensive v2.4 release-gate matrix mirroring Phase 32 pattern with privacy grep gates extending to SMTP credentials, free-email domains, and raw tenant_id exposure.

**Phases completed:** 71-73 (3 phases)

**Key accomplishments:**

- Phase 71: `validate_smtp_configuration_rules` startup check with explicit fallback reporting and credential-placeholder rejection (`changeme` etc.).
- Phase 72: SQLAlchemy + alembic scaffolding for tenant_id nullable UUID on User/Session models (forward-compat, no runtime tenancy enforcement).
- Phase 73: Backend `test_phase73_release_gates.py` (7 tests), frontend `phase73-release-gates-ui.test.tsx` (3 tests), Node `release-gates.test.mjs` extended with 3 v2.4 cases (11/11 total). README v2.4 release-gate matrix + 3 privacy grep gates. `OPERATIONS_FORBIDDEN_METADATA_KEYS` extended with SMTP/tenant markers; admin operations frontend regex defense-in-depth.
- Zero-regression statement: Phase 32 invariants re-asserted under v2.4 changes; 172/172 frontend; 16/16 demo smoke.
- D4 live-env constraint policy: smoke:pilot/guard:deploy constrained when live URLs absent (deterministic substitutes pass).

**Requirements:** 4/4 validated (NOTIFY-01, NOTIFY-02, TENANT-01, SECURE-01)
**Git range:** `f031bd8` → `e02462c`
**Audit:** `.planning/milestones/v2.4-MILESTONE-AUDIT.md` — PASSED
**Integration check:** `.planning/milestones/v2.4-INTEGRATION-CHECK.md` — PASS

---

## v2.3 Content Management Polish (Shipped: 2026-06-01)

**Phases completed:** 0 phases, 0 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v2.3 Content Management Polish (Shipped: 2026-05-28)

**Delivered:** Content editor threshold scoring reliability, cover image support across all roles (admin, student, teacher, parent), FE-BE publish validation alignment, and content editor UX improvements.

**Phases completed:** 68-70 (3 phases)

**Key accomplishments:**

- Manual min/max threshold scoring with ScoreCoverageGrid visual validation (gap/overlap/out-of-range).
- FE publish checklist aligned exactly to BE validation rules — no more "all green but can't publish".
- Smart "add threshold" fills first gap or splits largest range; explicit-only redistribute.
- Empty choices and questions with <2 valid choices auto-stripped before API submission.
- Cover image upload (base64, max 2MB) for self-check tests and scenarios.
- Cover image displayed on student list cards, teacher/parent summary cards.
- Vietnamese placeholders, duplicate button, step validation gates.

**Git range:** `a0af47a` -> `b68894f`

---

## v2.2 UX Refinement & Usability Polish (Shipped: 2026-05-28)

**Delivered:** Toast notification system, universal retry/error patterns, consistent loading skeletons, student feature polish (chat search, mood toasts, autosave), adult portal search/filter/indicators, admin unsaved-changes warnings.

**Phases completed:** 64-67 (4 phases)

**Git tag:** v2.2

---

## v2.1 AI Chat Enhancement (Shipped: 2026-05-28)

**Delivered:** AI chat enhancements including typing indicators, message streaming, thread management, and guardrail improvements.

**Phases completed:** 60-63 (4 phases)

**Git tag:** v2.1

---

## v2.0 Mobile-First & PWA (Shipped: 2026-05-28)

**Delivered:** PWA foundation, bottom tab navigation, responsive layouts for all pages, animations, install prompt.

**Phases completed:** 54-59 (6 phases)

**Git tag:** v2.0

---

## v1.9 Production Polish (Shipped: 2026-05-28)

**Delivered:** Removed demo visual indicators, production tone updates, runtime mode switch to production_pilot, full admin page redesign (users, links, operations, content wizard), student page polish (time-based greeting, colored risk/signal badges), and 4-step content editor wizard.

**Phases completed:** 51-53 (3 phases)

**Key accomplishments:**

- Removed DemoBanner and DemoBadge components from all pages.
- Updated landing, login, privacy pages to production wording.
- Switched runtime default from local_demo to production_pilot.
- Redesigned admin users page with search, role/status filters, badges, avatars.
- Redesigned admin links page with search, filter, status badges.
- Polished admin operations with toggle filter panel, dark mode, skeleton loading.
- Redesigned admin content editor as 4-step wizard (info → questions → thresholds → review).
- Added time-based greeting, colored risk/signal badges to student pages.
- Fixed 168/169 tests (1 known flaky).

**Git range:** `79ec7fa` -> `9c19c68`

---

## v1.5 Production Pilot Readiness & Identity (Shipped: 2026-05-26)

**Delivered:** Production/demo runtime separation, deployment guardrails, split demo/pilot smoke profiles, OAuth/SSO-ready identity contracts, school pilot operations metadata, and release gates for privacy/security boundaries.

**Phases completed:** 28-32 (22 plans total, 57 tasks)

**Key accomplishments:**

- Added explicit `local_demo`, `public_demo`, and `production_pilot` runtime modes with production-pilot readiness checks, demo seed no-op behavior, demo-login blocking, and status-only/masked readiness responses.
- Added deployment guardrails for Render/Vercel/API/CORS/cookie drift plus separate `smoke:demo` and `smoke:pilot` profiles so public-demo success cannot be mistaken for pilot proof.
- Added OAuth/SSO-ready identity contracts with provider+subject hash mapping, safe session auth metadata, public-safe auth capabilities, and no browser token storage.
- Added school pilot operations panels for launch checklist, demo/real data safety, rollback guidance, and handoff metadata without raw student surveillance, exports, destructive reset defaults, or risk drilldowns.
- Added Phase 32 release-gate matrices across backend, Node scripts, frontend UI, README/docs, and final verification; deterministic gates passed and public demo smoke passed 16/16.
- Audited v1.5 with 28/28 requirements satisfied, 5/5 phases verified, 8/8 integration flows wired, and 0 critical blockers.

**Stats:**

- 123 tracked files changed from `v1.4` through v1.5 audit
- 18,442 insertions and 275 deletions during the v1.5 implementation/audit range
- 37,249 backend/frontend tracked code lines after v1.5 (`21,437` Python, `14,575` TypeScript/TSX, `1,237` MJS)
- 5 phases, 22 plans, 28 requirements
- 107 commits from `v1.4` through milestone audit
- 2 calendar days from first v1.5 post-v1.4 commit to audit

**Git range:** `4b139f0` -> `c7e1806` before final archive commit

**Verification:**

- Milestone audit: tech debt status, 28/28 requirements satisfied, 5/5 phases verified, 8/8 integration flows wired, 0 critical gaps.
- Phase 32 final regression: backend pytest `189 passed`, backend ruff passed, frontend Vitest `111 passed`, frontend lint/build passed, Node release gates passed, deployment guardrail passed, public demo smoke `DEMO_SMOKE_PASS 16/16`.

**Known non-blocking tech debt:**

- Live `smoke:pilot` was not run because safe production-pilot URLs/configuration and readiness `ready` were absent. Before a real school pilot launch, configure production-pilot env, confirm `/health/ready=ready`, run `npm --prefix frontend run smoke:pilot`, and record evidence.
- The pilot launch checklist infers pilot-smoke readiness from readiness/demo-flag metadata; operators must attach or record actual live smoke evidence before launch.

**What's next:** Define the next milestone with `/gsd-new-milestone`; likely candidates include live production-pilot evidence, provider-specific identity login, counselor handoff, external notification delivery governance, multi-school tenancy, or richer launch automation.

---

## v1.4 Consent-Based Notifications & Access Transparency (Shipped: 2026-05-25)

**Delivered:** Consent-first in-app reminders, student-controlled mood-note sharing, reason-gated adult access, admin privacy policy controls, full Peerlight AI Vietnamese demo refresh, and SOS-only adult visibility.

**Phases completed:** 21-27 (7 plans total)

**Key accomplishments:**

- Added student notification/reminder preferences with explicit consent, quiet hours, pause/resume, deferred external channels, and no automatic SOS/adult-alert side effects.
- Added selective mood-note and student-summary sharing with chosen linked adults, confirmation copy, revocation, relationship checks, and metadata-only audit.
- Added reason-for-access transparency for protected teacher/parent support summaries and shared notes without bypassing role/relationship authorization.
- Added admin v1.4 privacy policy defaults and metadata-only operations/readiness for reminder, sharing, reason-gate, and policy activity.
- Closed milestone audit gaps by enforcing runtime policy defaults, blocking note sharing when disabled, and removing raw `resource_id` exposure from operations responses.
- Rebranded the product to Peerlight AI with Vietnamese-first student UX, expanded psychological self-check demo content, and teacher/parent visibility limited to SOS-signaled linked students.

**Stats:**

- 151 tracked files changed from v1.4 start through milestone audit
- 11,657 insertions and 737 deletions during the v1.4 implementation/audit range
- 31,340 backend/frontend tracked code lines after v1.4 (`18,259` Python, `13,081` TypeScript/TSX)
- 7 phases, 7 plans, 36 requirements
- 33 commits from v1.4 start through milestone audit
- 3 calendar days from first v1.4 milestone commit to audit

**Git range:** `af32726` -> `6eab51c` before final archive commit

**Verification:**

- Milestone audit: 36/36 requirements satisfied, 7/7 phases passed, 7/7 integration flows passed.
- Latest Phase 27 regression: backend pytest `129 passed`, backend ruff passed, frontend Vitest `94 passed`, frontend lint passed, frontend build passed.
- Local live demo: landing, student dashboard, Test tam ly, scenarios, chat, support plan, teacher, parent, and admin walkthrough passed on localhost.

**Known non-blocking tech debt:**

- Student history UI can make the disabled-policy reason clearer when admin disables note sharing.
- Standalone `/api/admin/operations/readiness` is available but not directly called because readiness is embedded in the operations dashboard.
- Public `/health/ready` can remain `not_ready` while demo seeding is enabled; real production launch should disable demo seed state.
- Existing moderate Next/PostCSS advisory remains until a non-breaking stable Next release resolves it.

**What's next:** Define v1.5 with `/gsd-new-milestone`; likely candidates include production identity/OAuth readiness, counselor handoff, external notification delivery governance, multi-school tenancy, or richer launch automation.

---

## v1.3 Pilot UX & Demo Readiness (Shipped: 2026-05-22)

**Delivered:** Public guided demo entry, responsive/accessibility guardrails, supportive critical-action polish, metadata-only demo operations readiness, production smoke coverage, and repaired Next 16 frontend quality gates.

**Phases completed:** 16-20 (5 plans total)

**Key accomplishments:**

- Added public landing and one-step demo role entry with role-specific guided walkthrough cards.
- Added global responsive/accessibility guardrails and targeted smoke coverage across mobile, tablet, and desktop role entry/dashboard surfaces.
- Polished student/adult/admin copy and critical interaction outcome states while preserving privacy-by-default and support-not-surveillance boundaries.
- Added metadata-only demo seed, connectivity/session, and production smoke readiness to admin operations.
- Added `npm --prefix frontend run smoke:production` for deployed frontend/backend, CORS, login/session cookie, and role dashboard checks.
- Replaced broken Next 16 `next lint` with ESLint flat config and passed lint, full frontend tests, and production build.

**Stats:**

- 74 tracked files changed from v1.3 start through milestone audit
- 7,799 insertions and 674 deletions during the v1.3 implementation/audit range
- 24,734 backend/frontend tracked code lines after v1.3 (`14,278` Python, `10,456` TypeScript/TSX)
- 5 phases, 5 plans, 20 requirements
- 9 commits from v1.3 start through milestone audit
- 1 calendar day from first v1.3 milestone commit to audit

**Git range:** `13f2a6e` -> `74019f3` before final archive commit

**Verification:**

- Milestone audit: 20/20 requirements satisfied, 5/5 phases passed, 5/5 integration flows passed.
- Latest Phase 20 regression: frontend lint passed, frontend Vitest `79 passed`, frontend build passed.
- Phase 19 backend regression: backend pytest `104 passed`; production smoke `16/16 passed`.

**Known non-blocking tech debt:**

- Existing moderate Next/PostCSS advisory remains until a non-breaking stable Next release resolves it; forced audit fix proposes a breaking downgrade.
- Future hardening can add direct DemoRoleEntry click-through tests and authenticated browser dashboard hydration in production smoke.

**What's next:** Define v1.4 with `/gsd-new-milestone`; likely candidates include reminder/notification consent, selective private-note sharing, reason-for-access controls, school/tenant policy customization, or production identity/OAuth readiness.

---

## v1.2 Trusted Adult Plan & Mood Check-ins (Shipped: 2026-05-22)

**Delivered:** Student-owned trusted adult support plans, lightweight mood check-ins/history, privacy-preserving adult support summaries, and admin mood configuration with metadata-only operations closure.

**Phases completed:** 12-15 (12 plans total)

**Key accomplishments:**

- Added student trusted-adult support plans with linked-adult validation, lifecycle controls, selected-adult sharing boundaries, and metadata-only audit.
- Added student mood check-ins/history with non-clinical prompts, optional private notes, repeat timestamped entries, trend guidance, and no automatic SOS side effects.
- Added teacher/parent support summaries that combine selected support-plan preferences and mood trend summaries without raw private notes or check-in drilldowns.
- Added admin mood check-in prompt/guidance configuration with validation, preview, lifecycle status, and published-config fallback for student options.
- Extended admin operations with v1.2 metadata buckets for support-plan, mood-check-in, adult-summary, and admin-config activity.
- Passed milestone audit after fixing CORS `PUT` coverage for browser support-plan and admin-config mutation flows.

**Stats:**

- 99 tracked files changed from v1.2 start through milestone audit
- 7,306 insertions and 558 deletions during the v1.2 implementation/audit range
- 25,825 backend/frontend code lines after v1.2 (`16,254` Python, `9,571` TypeScript/TSX)
- 4 phases, 12 plans, 24 requirements
- 18 commits from v1.2 start through milestone audit
- 1 calendar day from first v1.2 milestone commit to audit

**Git range:** `ddc5dc9` -> `b968644` before final archive commit

**Verification:**

- Milestone audit: 24/24 requirements satisfied, 4/4 phases passed, 6/6 integration flows passed.
- Latest Phase 15 regression: backend pytest `101 passed`, frontend Vitest `68 passed`, frontend build passed.

**Known non-blocking tech debt:**

- `npm run lint` remains blocked by the existing invalid Next 16 `next lint` script; frontend tests and production build pass.

**What's next:** Define the next milestone with `/gsd-new-milestone`; likely candidates include reminders/notification consent, selective private-note sharing, reason-for-access controls, tenant policy customization, or production identity readiness.

---

## v1.1 Production Hardening & Support Polish (Shipped: 2026-05-22)

**Delivered:** Production hardening and support polish with readiness checks, backend-owned SOS email delivery readiness, clearer role/privacy UX, complete nested admin content editing, and metadata-only operations visibility.

**Phases completed:** 7-11 (15 plans total)

**Key accomplishments:**

- Added production readiness checks for environment/config hygiene, database and Alembic state, cookie/origin safety, demo seed state, and secret masking.
- Implemented backend-owned SOS email delivery attempts with disabled/local outbox/SMTP modes, failure isolation, delivery audit, and no raw student content in email metadata.
- Polished authenticated role navigation, student privacy redirects, adult summary-only boundary copy, and teacher-vs-parent SOS detail behavior.
- Expanded admin content management to edit complete nested self-check and scenario structures with validation errors, previews, and version-safe historical behavior.
- Shipped admin operations dashboard for readiness, SOS delivery, and audit metadata without raw sensitive exports, risk leaderboards, or per-student drilldowns.

**Stats:**

- 80 tracked files changed from Phase 7 planning through milestone audit
- 4,962 insertions and 276 deletions during Phase 7-11 implementation/audit range
- 18,689 backend/frontend code lines after v1.1 (`11,144` Python, `7,545` TypeScript/TSX)
- 5 phases, 15 plans, 30 requirements
- 17 commits from Phase 7 planning through milestone audit
- 1 calendar day from first Phase 7 plan commit to milestone audit

**Git range:** `3a06abe` -> `cfe2669` before final archive commit

**Verification:**

- Milestone audit: 30/30 requirements satisfied, 5/5 phases passed, 4/4 integration flows passed.
- Latest Phase 11 regression: backend pytest `88 passed`, frontend Vitest `57 passed`, frontend build passed.

**Known non-blocking tech debt:**

- No blocker or non-blocking v1.1 tech debt was reported by phase verification. Future notification channels, retry queues, tenant isolation, content version diff history, reason-for-access prompts, and production identity provider work remain deferred.

**What's next:** Define the next milestone with `/gsd-new-milestone`; likely candidates are deferred support/operations, notification, scale, or identity requirements.

---

## v1.0 MVP Demo (Shipped: 2026-05-21)

**Delivered:** Complete Vietnamese high-school wellbeing MVP with privacy-first auth, self-checks, scenarios, SOS workflow, supportive chatbot guardrails, and aggregate admin reports.

**Phases completed:** 1-6 (26 plans total)

**Key accomplishments:**

- Established privacy, authorization, audit, demo-data, and non-clinical safety policies before sensitive features.
- Built email/password login, role-based portals, seeded demo accounts, and admin user/link management.
- Implemented student self-checks, scenario practice, admin content management, and summary-only adult support views.
- Delivered confirmed SOS alerts with linked teacher/parent visibility, teacher status workflow, and metadata-only audit.
- Added backend-only supportive chatbot gateway with provider abstraction, guardrails, high-risk escalation guidance, and admin safety config.
- Shipped privacy-limited aggregate reports with small-group suppression, demo/real filtering, and no raw sensitive exports.

**Stats:**

- 261 tracked files changed during v1.0
- 38,468 insertions across project files
- 16,169 backend/frontend code lines
- 6 phases, 26 plans, 43 tracked tasks
- 141 commits from initial scaffold through milestone audit
- 2 calendar days from first implementation commit to ship

**Git range:** `8ee1bca` -> `3bbe603` before final archive commit

**Verification:**

- Milestone audit: 47/47 requirements satisfied, 6/6 integration flows passed.
- Latest Phase 06 regression: backend pytest `79 passed`, frontend Vitest `50 passed`, Playwright `1 passed`, frontend build passed.

**Known non-blocking tech debt:**

- Direct `/student` navigation with an unacknowledged existing session shows an empty/error state instead of redirecting to `/privacy`; backend still blocks sensitive access.
- Authenticated layout shows nav links for all roles; backend and layout block wrong-role content, but UX could be clearer.
- Admin content UI remains MVP-simple for nested editing while backend supports richer nested content.

**What's next:** v1.1 shipped production hardening and support polish; define the next milestone with `/gsd-new-milestone`.

---
