# Requirements: Peerlight AI v1.5 Production Pilot Readiness & Identity

**Defined:** 2026-05-25
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.5 Requirements

Requirements for the current milestone. Each requirement maps to exactly one roadmap phase.

### Runtime Modes & Production Readiness

- [x] **RUNTIME-01**: Admin or operator can distinguish `public_demo`, `production_pilot`, and local/development runtime modes through safe readiness or operations metadata.
- [x] **RUNTIME-02**: Production pilot readiness fails with clear safe remediation when demo seeding, demo login, insecure cookies, unsafe origins, missing database/migration state, or placeholder secrets are detected.
- [x] **RUNTIME-03**: Production pilot readiness can return `ready` when demo seeding is disabled and required database, migration, origin, cookie, frontend API, and identity configuration checks pass.
- [x] **RUNTIME-04**: Production pilot boot does not run demo seeding, while public demo mode can still seed demo users and walkthrough data intentionally.
- [x] **RUNTIME-05**: Public readiness remains minimal and admin readiness masks secrets, cookie values, connection strings, provider credentials, and other sensitive configuration values.

### Deployment Guardrails & Smoke Profiles

- [x] **DEPLOY-01**: Operator can run a deployment guardrail command that validates Render backend root/start/env expectations and Vercel frontend root/build expectations before or after deploy.
- [x] **DEPLOY-02**: Frontend validation rejects unsafe production API configuration, including missing `NEXT_PUBLIC_API_BASE_URL`, localhost production targets, non-HTTPS pilot targets, or mismatch with expected backend smoke URL.
- [x] **DEPLOY-03**: Backend validation verifies exact credentialed CORS origins and production cookie settings for the deployed Vercel/Render topology.
- [x] **DEPLOY-04**: Demo smoke and production-pilot smoke are separate commands or modes; demo smoke may use seeded role accounts, while pilot smoke requires readiness `ready` and does not require demo users.
- [x] **DEPLOY-05**: Deployment documentation explains Vercel root directory, Render backend profile, environment variables, smoke commands, known demo-vs-pilot readiness behavior, and safe rollback steps.

### Identity Foundation & Auth Contracts

- [x] **IDENT-01**: Admin or operator can see configured authentication provider readiness using metadata-only fields such as enabled status, provider label, mode, and last check status.
- [x] **IDENT-02**: Backend supports an OAuth/SSO-ready identity mapping contract that links external provider and subject metadata to an internal user without relying on unverified email auto-merge.
- [x] **IDENT-03**: Existing email/password and seeded demo login flows continue to work in demo/local mode, while production pilot mode can disable public demo entry and demo accounts safely.
- [x] **IDENT-04**: Auth sessions record safe auth method/provider metadata and continue to use backend-owned HttpOnly cookie sessions with no browser token storage.
- [x] **IDENT-05**: All auth methods enforce account status, session revocation, privacy acknowledgement requirements, and role dashboard routing through the same backend session/user contract.
- [x] **IDENT-06**: External identity claims, school/class metadata, or provider groups never grant adult student visibility; app role, active relationship, and student-sent SOS remain mandatory.
- [x] **IDENT-07**: Unknown, unlinked, disabled, or deprovisioned external identities receive safe denial or pending-review behavior without creating privileged users automatically.

### School Pilot Operations & Safe Launch

- [ ] **PILOT-01**: Admin operations includes a production pilot launch checklist covering runtime mode, readiness, migrations, origins/cookies, seed state, identity readiness, smoke evidence, and privacy regression status.
- [ ] **PILOT-02**: Admin can verify demo/real data safety through counts and statuses only, and production pilot launch is blocked or flagged when active demo users, links, or walkthrough rows are present unexpectedly.
- [ ] **PILOT-03**: Pilot operations exposes login, session, readiness, audit, and launch metadata without raw emails, raw identifiers, private notes, chatbot transcripts, self-check answers, SOS notes, free-text reasons, exports, or per-student risk drilldowns.
- [ ] **PILOT-04**: Pilot rollback and handoff guidance documents safe redeploy, config rollback, readiness recheck, school contact, and incident escalation paths without destructive database reset or raw data export defaults.
- [ ] **PILOT-05**: Baseline content and school policy setup guidance supports real pilot launch without creating public demo accounts, demo student-adult links, or demo walkthrough data in production pilot mode.

### Privacy, Security & Regression Gates

- [ ] **QA-01**: Backend tests verify runtime mode validation, production readiness success/failure, demo seed blocking/no-op behavior, deployment config checks, and secret masking.
- [ ] **QA-02**: Deploy guard and smoke tests verify Vercel/Render config expectations, credentialed CORS, cookie contract, demo smoke, and production-pilot smoke behavior.
- [ ] **QA-03**: Auth/identity tests verify provider metadata, identity mapping safety, disabled/deprovisioned account denial, session auth-method metadata, privacy acknowledgement routing, and no browser token storage.
- [ ] **QA-04**: Cross-role privacy tests verify identity and production changes do not weaken SOS-only adult visibility, active relationship checks, reason gates, selective mood-note sharing, or student-owned private data.
- [ ] **QA-05**: Operations and readiness tests or grep gates verify metadata-only responses and reject raw identifiers, emails, notes, transcripts, answers, secrets, free-text reasons, exports, and risk leaderboards.
- [ ] **QA-06**: Full backend tests, backend lint, frontend tests, frontend lint, frontend build, documentation checks, and relevant demo/pilot smoke commands pass or record explicit accepted external constraints.

## Future Requirements

Deferred to future milestones, not in v1.5 scope.

### Full Identity Provider Integration

- **FUTURE-IDENT-01**: Implement full OAuth/OIDC login callback after a pilot school selects an identity provider and provides redirect URI, issuer, client, and claim requirements.
- **FUTURE-IDENT-02**: Implement SAML or SCIM provisioning only when a school or district rollout requires enterprise provisioning.

### Support Operations

- **FUTURE-SUPPORT-01**: Add counselor handoff workflow after production pilot safety and identity readiness are stable.
- **FUTURE-SUPPORT-02**: Add external Zalo/SMS/push delivery only after provider governance, consent, retries, dead-letter handling, and message privacy review are designed.

### Scale & Governance

- **FUTURE-SCALE-01**: Add multi-school tenancy after a single-school pilot is safely operational.
- **FUTURE-OPS-01**: Add richer incident response or SIEM integration after pilot operations produce concrete requirements.

## Out of Scope

| Feature | Reason |
|---|---|
| Full OAuth/OIDC login implementation | v1.5 prepares contracts; real provider details are required before callback implementation. |
| SAML, SCIM, or enterprise IAM platform | Too broad for one-school pilot readiness. |
| Browser-stored OAuth/access tokens | Violates backend-owned session and no-token browser contract. |
| Replacing email/password demo login | Public demo and local development still require the current flow. |
| Multi-school tenancy | Deferred until single-school production safety is verified. |
| Zalo/SMS/push notification delivery | Requires separate provider governance and delivery reliability design. |
| Counselor handoff workflow | Valuable but separate from production pilot readiness and identity foundation. |
| Raw student data exports, risk leaderboards, or per-student risk drilldowns | Violates privacy-by-default and support-not-surveillance boundaries. |
| One-click destructive database reset for pilot data | Unsafe for real student data and not acceptable as a default rollback path. |

## Traceability

Each v1.5 requirement maps to exactly one roadmap phase.

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
| DEPLOY-04 | Phase 29 | Complete |
| DEPLOY-05 | Phase 29 | Complete |
| IDENT-01 | Phase 30 | Complete |
| IDENT-02 | Phase 30 | Complete |
| IDENT-03 | Phase 30 | Complete |
| IDENT-04 | Phase 30 | Complete |
| IDENT-05 | Phase 30 | Complete |
| IDENT-06 | Phase 30 | Complete |
| IDENT-07 | Phase 30 | Complete |
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
- Complete: 17
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-26 after Phase 30 Plan 03 execution*
