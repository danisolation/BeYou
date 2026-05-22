# Requirements: BeYou v1.3 Pilot UX & Demo Readiness

**Defined:** 2026-05-22
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.3 Requirements

Requirements for the current milestone. Each requirement maps to exactly one roadmap phase.

### Demo Entry & Onboarding

- [x] **DEMO-01**: A first-time evaluator can open a public BeYou entry page that explains the product purpose, roles, privacy boundary, non-clinical limits, and SOS boundary.
- [x] **DEMO-02**: A first-time evaluator can enter each seeded demo role from the UI without manually copying demo credentials.
- [x] **DEMO-03**: A user in each role dashboard can follow a concise guided next-step path for the live demo.
- [x] **DEMO-04**: Demo and live environment indicators clearly distinguish seeded demo data from real student data.

### Responsive & Accessibility

- [x] **RESP-01**: Auth, privacy, student, teacher, parent, and admin routes render without horizontal overflow at mobile, tablet, and desktop widths.
- [x] **RESP-02**: Header navigation, cards, forms, and action groups adapt to touch-friendly mobile layouts.
- [x] **RESP-03**: Keyboard focus, tab order, labels, and control semantics are usable across key flows.
- [x] **RESP-04**: Visual states for hover, focus, disabled, loading, empty, success, and error are consistent.
- [ ] **RESP-05**: Responsive smoke coverage verifies critical routes and role entry points.

### UX Copy & Interaction Polish

- [x] **UX-01**: Student-facing copy stays supportive, Vietnamese, non-clinical, and easy to understand.
- [x] **UX-02**: Adult and admin copy reinforces support-not-surveillance and privacy-limited visibility.
- [x] **UX-03**: Critical actions such as SOS, disable/delete/revoke, and configuration changes have clear confirmation and outcome states.
- [x] **UX-04**: Cards, buttons, forms, and page hierarchy use a consistent visual system.

### Demo/Pilot Operations

- [x] **OPS-01**: Operators and admins can verify demo seed state, backend/frontend connectivity, and readiness without exposing secrets or private student data.
- [x] **OPS-02**: Demo runbook or in-app guidance explains live URLs, demo accounts, roles, and the expected walkthrough path.
- [x] **OPS-03**: Production smoke checks cover login, session cookie behavior, CORS, and role dashboards.

### Quality & Regression

- [ ] **QUAL-01**: Frontend lint tooling works with the current Next.js version.
- [ ] **QUAL-02**: Existing frontend tests and production build remain passing.
- [ ] **QUAL-03**: New responsive and demo-readiness changes include targeted automated regression coverage.
- [x] **QUAL-04**: Documentation reflects deployed URLs, demo accounts, and demo/pilot constraints.

## Future Requirements

Deferred to future milestones, not in v1.3 scope.

### Notifications & Handoff

- **FUT-NOTIF-01**: Students and adults can opt into reminder or notification consent flows.
- **FUT-NOTIF-02**: BeYou can support governed Zalo, SMS, or push notification delivery with retry and dead-letter operations.
- **FUT-HANDOFF-01**: BeYou can support counselor or school-care-team handoff flows with explicit consent and audit boundaries.

### Privacy Controls

- **FUT-PRIV-01**: Students can selectively share specific private mood notes with chosen adults.
- **FUT-PRIV-02**: Adult/admin sensitive access can require reason-for-access prompts and stronger audit review.

### Scale & Identity

- **FUT-SCALE-01**: BeYou supports multi-school tenancy and school-specific policy customization.
- **FUT-AUTH-01**: BeYou supports production OAuth/SSO with a selected school identity provider.

## Out of Scope

Explicit exclusions for v1.3.

| Feature | Reason |
|---------|--------|
| Native mobile app | v1.3 focuses on responsive web as the current product surface. |
| Zalo/SMS/push delivery | Requires consent, provider governance, retry/dead-letter operations, and production policy work. |
| OAuth/SSO | Deferred until pilot UX and demo readiness are stable. |
| Raw chatbot transcript access for adults/admins | Violates student-owned privacy and existing support-not-surveillance boundaries. |
| Raw private mood-note access for adults/admins | Violates student-owned privacy and existing v1.2 decisions. |
| Student risk leaderboard or punitive monitoring | Conflicts with BeYou's support-oriented core value. |
| Clinical diagnosis or treatment guidance | BeYou remains supportive and non-clinical. |

## Traceability

Roadmap mapping is filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
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
| OPS-01 | Phase 19 | Complete |
| OPS-02 | Phase 16 | Complete |
| OPS-03 | Phase 19 | Complete |
| QUAL-01 | Phase 20 | Pending |
| QUAL-02 | Phase 20 | Pending |
| QUAL-03 | Phase 20 | Pending |
| QUAL-04 | Phase 16 | Complete |

**Coverage:**
- v1.3 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after Phase 19 completion*
