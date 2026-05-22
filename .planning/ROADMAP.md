# Roadmap: BeYou - Tu Tin La Minh

**Created:** 2026-05-22
**Granularity:** Coarse
**Milestone:** v1.3 Pilot UX & Demo Readiness
**Coverage:** 20/20 v1.3 requirements mapped; 0/20 complete

## Phase Overview

| # | Phase | Goal | Requirements | Depends on | UI hint |
|---|-------|------|--------------|------------|---------|
| 16 | Guided Demo Entry & Role Onboarding | First-time evaluators can understand BeYou, enter each seeded role quickly, and follow a guided demo path without weakening demo/real-data boundaries. | DEMO-01..DEMO-04, OPS-02, QUAL-04 | v1.2 archive, deployed UI polish | yes |
| 17 | Responsive Accessibility Baseline | Core auth, student, adult, and admin surfaces meet a tested responsive and accessibility baseline across mobile, tablet, and desktop. | RESP-01..RESP-04, UX-04 | Phase 16 design direction | yes |
| 18 | Supportive Copy & Critical Interaction Polish | Student, adult, and admin experiences use clearer supportive copy and safer interaction states for privacy, SOS, and destructive/configuration actions. | UX-01..UX-03 | Phases 16, 17 | yes |
| 19 | Demo/Pilot Operations Readiness | Operators can verify live demo readiness, connectivity, seed state, and production smoke paths without exposing secrets or sensitive student content. | OPS-01, OPS-03 | Phases 16, 17 | yes |
| 20 | Frontend Quality & Regression Closure | Frontend quality tooling, responsive smoke coverage, and existing test/build gates are stable enough to protect the pilot-ready UX. | RESP-05, QUAL-01..QUAL-03 | Phases 16-19 | yes |

## Phase Checklist

- [x] Phase 16: Guided Demo Entry & Role Onboarding
- [x] Phase 17: Responsive Accessibility Baseline
- [x] Phase 18: Supportive Copy & Critical Interaction Polish
- [ ] Phase 19: Demo/Pilot Operations Readiness
- [ ] Phase 20: Frontend Quality & Regression Closure

## Phase Details

### Phase 16: Guided Demo Entry & Role Onboarding

**Goal:** First-time evaluators can understand BeYou, enter each seeded role quickly, and follow a guided demo path without weakening demo/real-data boundaries.
**Depends on:** v1.2 archive, deployed UI polish
**Requirements:** DEMO-01, DEMO-02, DEMO-03, DEMO-04, OPS-02, QUAL-04
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Public entry explains BeYou's purpose, roles, privacy boundaries, non-clinical positioning, and SOS boundaries in evaluator-friendly Vietnamese.
2. Demo role entry avoids manual credential copying and routes each role to the correct dashboard.
3. Student, teacher, parent, and admin dashboards expose concise guided demo next steps.
4. Demo/live indicators and docs make seeded demo data, live URLs, accounts, and pilot constraints clear.

**Plans:** 1/1 complete

Plans:
- [x] 16-01-PLAN.md - Guided demo entry, role onboarding, dashboard guide cards, and docs

### Phase 17: Responsive Accessibility Baseline

**Goal:** Core auth, student, adult, and admin surfaces meet a tested responsive and accessibility baseline across mobile, tablet, and desktop.
**Depends on:** Phase 16 design direction
**Requirements:** RESP-01, RESP-02, RESP-03, RESP-04, UX-04
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Auth, privacy, student, teacher, parent, and admin routes have no horizontal overflow at representative mobile, tablet, and desktop widths.
2. Header navigation, cards, forms, and action groups remain touch-friendly and readable on small screens.
3. Keyboard focus, tab order, labels, and control semantics are usable across key flows.
4. Shared visual hierarchy and states for cards, buttons, forms, loading, empty, disabled, success, and error are consistent.

**Plans:** 1/1 complete

Plans:
- [x] 17-01-PLAN.md - Responsive overflow guardrails, accessibility states, and smoke coverage

### Phase 18: Supportive Copy & Critical Interaction Polish

**Goal:** Student, adult, and admin experiences use clearer supportive copy and safer interaction states for privacy, SOS, and destructive/configuration actions.
**Depends on:** Phases 16, 17
**Requirements:** UX-01, UX-02, UX-03
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Student-facing copy stays supportive, Vietnamese, non-clinical, and easy to understand across wellbeing, chat, SOS, mood, and support-plan flows.
2. Adult and admin copy reinforces support-not-surveillance boundaries and privacy-limited visibility.
3. SOS, disable/delete/revoke, and configuration changes provide clear confirmation and outcome states.
4. Copy changes preserve existing privacy defaults and do not expand adult/admin access to raw sensitive data.

**Plans:** 1/1 complete

Plans:
- [x] 18-01-PLAN.md - Supportive copy, privacy boundary copy, and critical action outcome states

### Phase 19: Demo/Pilot Operations Readiness

**Goal:** Operators can verify live demo readiness, connectivity, seed state, and production smoke paths without exposing secrets or sensitive student content.
**Depends on:** Phases 16, 17
**Requirements:** OPS-01, OPS-03
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Admin/operator-facing readiness makes demo seed state, frontend/backend connectivity, and deployment health understandable without exposing secrets.
2. Production smoke checks cover login, session cookie behavior, allowed-origin mutations/CORS, and role dashboards.
3. Operations output remains metadata-only with no raw notes, chatbot transcripts, credentials, exports, or per-student risk drilldowns.
4. Demo readiness failures provide actionable remediation steps for local and deployed environments.

**Plans:** 0/0 pending planning

Plans:
- [ ] To be created by `/gsd-plan-phase 19`

### Phase 20: Frontend Quality & Regression Closure

**Goal:** Frontend quality tooling, responsive smoke coverage, and existing test/build gates are stable enough to protect the pilot-ready UX.
**Depends on:** Phases 16-19
**Requirements:** RESP-05, QUAL-01, QUAL-02, QUAL-03
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Frontend lint tooling works with the current Next.js version and runs from the existing npm script.
2. Existing frontend tests and production build continue to pass after v1.3 UX changes.
3. Automated responsive/demo readiness coverage verifies critical routes and role entry points without relying only on screenshots.
4. Regression documentation clearly states what is covered by tests, build, lint, and production smoke checks.

**Plans:** 0/0 pending planning

Plans:
- [ ] To be created by `/gsd-plan-phase 20`

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| DEMO-01 | Phase 16 | Complete |
| DEMO-02 | Phase 16 | Complete |
| DEMO-03 | Phase 16 | Complete |
| DEMO-04 | Phase 16 | Complete |
| RESP-01 | Phase 17 | Complete |
| RESP-02 | Phase 17 | Complete |
| RESP-03 | Phase 17 | Complete |
| RESP-04 | Phase 17 | Complete |
| RESP-05 | Phase 20 | Pending |
| UX-01 | Phase 18 | Complete |
| UX-02 | Phase 18 | Complete |
| UX-03 | Phase 18 | Complete |
| UX-04 | Phase 17 | Complete |
| OPS-01 | Phase 19 | Pending |
| OPS-02 | Phase 16 | Complete |
| OPS-03 | Phase 19 | Pending |
| QUAL-01 | Phase 20 | Pending |
| QUAL-02 | Phase 20 | Pending |
| QUAL-03 | Phase 20 | Pending |
| QUAL-04 | Phase 16 | Complete |

**Coverage:**
- v1.3 requirements: 20 total
- Mapped to phases: 20
- Complete: 14
- Unmapped: 0

## Assumptions

- v1.3 continues phase numbering from v1.2, so it starts at Phase 16.
- v1.3 focuses on live demo and pilot readiness rather than new sensitive data-sharing features.
- Responsive web remains the product surface; native mobile, SSO/OAuth, Zalo/SMS/push, and multi-school tenancy remain deferred.
- Student privacy defaults from v1.0-v1.2 remain binding: adults and admins do not get raw chatbot transcripts, raw self-check answers, raw private mood notes, risk leaderboards, or punitive monitoring views.
- Recent post-v1.2 UI responsive polish is treated as useful context, but v1.3 requirements still need formal GSD planning, implementation, review, and verification.

---
*Last updated: 2026-05-22 after Phase 18 completion*
