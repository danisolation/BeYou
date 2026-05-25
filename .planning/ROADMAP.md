# Roadmap: Peerlight AI

**Created:** 2026-05-25
**Granularity:** Coarse
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Coverage:** 28/28 v1.5 requirements mapped; 8/28 complete

## Completed Milestones

- ✅ **v1.4 Consent-Based Notifications & Access Transparency** — Phases 21-27 (shipped 2026-05-25) — [roadmap archive](milestones/v1.4-ROADMAP.md)
- ✅ **v1.3 Pilot UX & Demo Readiness** — Phases 16-20 (shipped 2026-05-22) — [roadmap archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.2 Trusted Adult Plan & Mood Check-ins** — Phases 12-15 (shipped 2026-05-22) — [roadmap archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.1 Production Hardening & Support Polish** — Phases 7-11 (shipped 2026-05-22) — [roadmap archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.0 MVP Demo** — Phases 1-6 (shipped 2026-05-21) — [roadmap archive](milestones/v1.0-ROADMAP.md)

## Phase Overview

| # | Phase | Goal | Requirements | Depends on | UI hint |
|---|---|---|---|---|---|
| 28 | Runtime Mode & Production Readiness Foundation | Operators can distinguish demo vs production-pilot runtime and trust readiness without unsafe seed/config drift or secret leakage. | RUNTIME-01..RUNTIME-05 | v1.4 archive, v1.5 research | no |
| 29 | Deployment Guardrails & Smoke Profiles | Operators can validate Vercel/Render deployment shape and run separate demo vs pilot smoke checks without false confidence. | DEPLOY-01..DEPLOY-05 | Phase 28 | yes |
| 30 | Identity Foundation & Auth Contracts | Peerlight AI is ready for future OAuth/SSO while preserving backend-owned sessions, demo login safety, and existing authorization boundaries. | IDENT-01..IDENT-07 | Phase 28 | yes |
| 31 | School Pilot Operations & Safe Launch | Admins can launch and operate a real school pilot using metadata-only readiness, checklist, rollback, and data-safety guidance. | PILOT-01..PILOT-05 | Phases 28-30 | yes |
| 32 | Privacy, Security & Release Gates | The milestone can only ship when tests prove production, identity, operations, and privacy boundaries still hold. | QA-01..QA-06 | Phases 28-31 | yes |

## Phase Checklist

- [x] Phase 28: Runtime Mode & Production Readiness Foundation (completed 2026-05-25)
- [ ] Phase 29: Deployment Guardrails & Smoke Profiles
- [ ] Phase 30: Identity Foundation & Auth Contracts
- [ ] Phase 31: School Pilot Operations & Safe Launch
- [ ] Phase 32: Privacy, Security & Release Gates

## Phase Details

### Phase 28: Runtime Mode & Production Readiness Foundation

**Goal:** Operators can distinguish demo vs production-pilot runtime and trust readiness without unsafe seed/config drift or secret leakage.
**Depends on:** v1.4 archive, v1.5 research
**Requirements:** RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04, RUNTIME-05
**UI hint:** no
**Status:** Complete

**Success criteria:**
1. Operator can identify local/development, public demo, or production pilot mode through safe readiness or operations metadata.
2. Production pilot readiness clearly fails when demo seed, demo login, insecure cookies, unsafe origins, missing database/migrations, or placeholder secrets are detected.
3. Production pilot readiness returns `ready` when required configuration passes and demo seeding is disabled.
4. Production pilot boot does not create demo users or walkthrough data, while public demo mode can still seed intentionally.
5. Public and admin readiness responses remain minimal or masked and never expose secrets, cookies, credentials, connection strings, or sensitive values.

**Plans:** 3/3 plans complete

### Phase 29: Deployment Guardrails & Smoke Profiles

**Goal:** Operators can validate Vercel/Render deployment shape and run separate demo vs pilot smoke checks without false confidence.
**Depends on:** Phase 28
**Requirements:** DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**UI hint:** yes
**Status:** In Progress

**Success criteria:**
1. Operator can run a guardrail command that validates Render backend and Vercel frontend deployment expectations.
2. Frontend production validation rejects missing, localhost, non-HTTPS, or mismatched API targets.
3. Backend validation confirms exact credentialed CORS origins and production cookie requirements.
4. Demo smoke and pilot smoke are separate; pilot smoke requires readiness `ready` and has no demo-user dependency.
5. Deployment docs explain root directories, env vars, smoke commands, demo-vs-pilot readiness, and safe rollback.

**Plans:** 1/4 plans executed

### Phase 30: Identity Foundation & Auth Contracts

**Goal:** Peerlight AI is ready for future OAuth/SSO while preserving backend-owned sessions, demo login safety, and existing authorization boundaries.
**Depends on:** Phase 28
**Requirements:** IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05, IDENT-06, IDENT-07
**UI hint:** yes
**Status:** Pending

**Success criteria:**
1. Admin/operator can see auth provider readiness through metadata-only fields.
2. External identity mapping links provider and subject to an internal user without unverified email auto-merge.
3. Demo/local email-password and seeded login continue to work, while production pilot can disable public demo entry safely.
4. All sessions use backend-owned HttpOnly cookies and record safe auth method/provider metadata without browser token storage.
5. All auth paths enforce account status, revocation, privacy acknowledgement, and role dashboard routing through the same backend contract.
6. External identity claims, school/class metadata, or provider groups never grant adult student visibility; active relationship plus student-sent SOS remains mandatory.
7. Unknown, unlinked, disabled, or deprovisioned identities receive safe denial or pending-review behavior without privileged auto-creation.

**Plans:** 0/1 pending

### Phase 31: School Pilot Operations & Safe Launch

**Goal:** Admins can launch and operate a real school pilot using metadata-only readiness, checklist, rollback, and data-safety guidance.
**Depends on:** Phases 28-30
**Requirements:** PILOT-01, PILOT-02, PILOT-03, PILOT-04, PILOT-05
**UI hint:** yes
**Status:** Pending

**Success criteria:**
1. Admin can review a production pilot launch checklist covering runtime, readiness, migrations, origins/cookies, seed state, identity readiness, smoke evidence, and privacy regression.
2. Admin can verify demo/real data safety using counts and statuses only.
3. Pilot launch is blocked or flagged when active demo users, links, or walkthrough rows appear unexpectedly.
4. Operations expose login, session, readiness, audit, and launch metadata without raw emails, identifiers, notes, transcripts, answers, SOS notes, free-text reasons, exports, or risk drilldowns.
5. Pilot rollback/handoff guidance supports safe redeploy, config rollback, readiness recheck, school contact, and incident escalation without destructive reset or raw export defaults.

**Plans:** 0/1 pending

### Phase 32: Privacy, Security & Release Gates

**Goal:** The milestone can only ship when tests prove production, identity, operations, and privacy boundaries still hold.
**Depends on:** Phases 28-31
**Requirements:** QA-01, QA-02, QA-03, QA-04, QA-05, QA-06
**UI hint:** yes
**Status:** Pending

**Success criteria:**
1. Backend tests verify runtime mode validation, readiness pass/fail behavior, seed blocking, deployment checks, and secret masking.
2. Deploy/smoke tests verify Vercel/Render expectations, CORS/cookie contract, demo smoke, and production-pilot smoke.
3. Auth tests verify provider metadata, identity mapping safety, disabled/deprovisioned denial, session metadata, privacy routing, and no browser token storage.
4. Cross-role privacy tests prove SOS-only adult visibility, active relationship checks, reason gates, selective mood-note sharing, and student-owned private data remain intact.
5. Operations/readiness tests or grep gates reject raw identifiers, emails, notes, transcripts, answers, secrets, free-text reasons, exports, and risk leaderboards.
6. Backend tests/lint, frontend tests/lint/build, docs checks, and relevant smoke commands pass or document explicit accepted external constraints.

**Plans:** 0/1 pending

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| RUNTIME-01 | Phase 28 | Complete |
| RUNTIME-02 | Phase 28 | Complete |
| RUNTIME-03 | Phase 28 | Complete |
| RUNTIME-04 | Phase 28 | Complete |
| RUNTIME-05 | Phase 28 | Complete |
| DEPLOY-01 | Phase 29 | Complete |
| DEPLOY-02 | Phase 29 | Complete |
| DEPLOY-03 | Phase 29 | Complete |
| DEPLOY-04 | Phase 29 | Pending |
| DEPLOY-05 | Phase 29 | Pending |
| IDENT-01 | Phase 30 | Pending |
| IDENT-02 | Phase 30 | Pending |
| IDENT-03 | Phase 30 | Pending |
| IDENT-04 | Phase 30 | Pending |
| IDENT-05 | Phase 30 | Pending |
| IDENT-06 | Phase 30 | Pending |
| IDENT-07 | Phase 30 | Pending |
| PILOT-01 | Phase 31 | Pending |
| PILOT-02 | Phase 31 | Pending |
| PILOT-03 | Phase 31 | Pending |
| PILOT-04 | Phase 31 | Pending |
| PILOT-05 | Phase 31 | Pending |
| QA-01 | Phase 32 | Pending |
| QA-02 | Phase 32 | Pending |
| QA-03 | Phase 32 | Pending |
| QA-04 | Phase 32 | Pending |
| QA-05 | Phase 32 | Pending |
| QA-06 | Phase 32 | Pending |

**Coverage:**
- v1.5 requirements: 28 total
- Mapped to phases: 28
- Complete: 8
- Unmapped: 0

## Assumptions

- v1.5 continues phase numbering from v1.4, so it starts at Phase 28.
- Full OAuth/OIDC/SAML/SCIM implementation is deferred until a pilot school selects a provider.
- Public demo remains available, but production pilot readiness must not depend on seeded demo users.
- Runtime/deployment/identity changes must not weaken student-owned data, SOS-only adult visibility, reason gates, or metadata-only operations.

---
*Last updated: 2026-05-25 after Phase 29 Plan 01 execution*
