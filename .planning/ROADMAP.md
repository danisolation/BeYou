# Roadmap: BeYou - Tu Tin La Minh

**Created:** 2026-05-22
**Granularity:** Coarse
**Milestone:** v1.4 Consent-Based Notifications & Access Transparency
**Coverage:** 29/29 v1.4 requirements mapped; 10/29 complete

## Completed Milestones

- ✅ **v1.3 Pilot UX & Demo Readiness** — Phases 16-20 (shipped 2026-05-22) — [roadmap archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.2 Trusted Adult Plan & Mood Check-ins** — Phases 12-15 (shipped 2026-05-22) — [roadmap archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.1 Production Hardening & Support Polish** — Phases 7-11 (shipped 2026-05-22) — [roadmap archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.0 MVP Demo** — Phases 1-6 (shipped 2026-05-21) — [roadmap archive](milestones/v1.0-ROADMAP.md)

## Phase Overview

| # | Phase | Goal | Requirements | Depends on | UI hint |
|---|-------|------|--------------|------------|---------|
| 21 | Privacy Control Foundation & Policy Contracts | Establish backend data contracts, audit safeguards, authorization resource types, and safe defaults for v1.4 consent, reminders, sharing, and reason policies. | NOTIF-01, NOTIF-05 | v1.3 archive, v1.4 research | no |
| 22 | Student Reminder Preferences & In-App Mood Reminders | Students can control in-app mood reminder consent, quiet hours, pause/resume, and receive optional reminders without SOS/adult-alert side effects. | NOTIF-02..NOTIF-04, REMIND-01..REMIND-05 | Phase 21 | yes |
| 23 | Selective Mood-Note Sharing & Revocation | Students can share specific private mood notes or student summaries with chosen linked adults and revoke access later. | SHARE-01..SHARE-05 | Phase 21, Phase 22 mood history context | yes |
| 24 | Reason-for-Access & Adult Support Transparency | Teacher/parent protected support access is reason-gated when policy requires it, without bypassing relationship authorization or privacy boundaries. | ACCESS-01..ACCESS-05 | Phase 21, Phase 23 | yes |
| 25 | Admin Privacy Policy & Operations Visibility | Admins can configure safe v1.4 policy defaults and inspect metadata-only operations/readiness for consent, reminders, sharing, and reason access. | POLICY-01, POLICY-02, OPS-01..OPS-03 | Phases 21-24 | yes |
| 26 | Cross-Role Privacy Regression & Demo Readiness | v1.4 privacy invariants are covered by backend/frontend regression gates, build/lint/smoke checks, docs, and demo readiness. | QA-01..QA-04 | Phases 21-25 | yes |

## Phase Checklist

- [x] Phase 21: Privacy Control Foundation & Policy Contracts
- [x] Phase 22: Student Reminder Preferences & In-App Mood Reminders
- [ ] Phase 23: Selective Mood-Note Sharing & Revocation
- [ ] Phase 24: Reason-for-Access & Adult Support Transparency
- [ ] Phase 25: Admin Privacy Policy & Operations Visibility
- [ ] Phase 26: Cross-Role Privacy Regression & Demo Readiness

## Phase Details

### Phase 21: Privacy Control Foundation & Policy Contracts

**Goal:** Establish backend data contracts, audit safeguards, authorization resource types, and safe defaults for v1.4 consent, reminders, sharing, and reason policies.
**Depends on:** v1.3 archive, v1.4 research
**Requirements:** NOTIF-01, NOTIF-05
**UI hint:** no
**Status:** Complete

**Success criteria:**
1. Database models and migration support student notification preferences, reminder state, school privacy policy defaults, and mood-note share grants with privacy-safe defaults.
2. Backend schemas/services expose safe contract helpers for policy defaults, preference state, allowed channels, allowed reason codes, and metadata-only audit decisions.
3. Authorization recognizes v1.4 resource types without granting new raw sensitive access.
4. Audit metadata filtering rejects or strips shared-note text, student summaries, reminder bodies, free-text reasons, contact identifiers, and private content.

**Plans:** 1/1 complete

Plans:
- [x] 21-01-PLAN.md - v1.4 privacy data contracts, authorization resources, policy helpers, and audit safeguards

### Phase 22: Student Reminder Preferences & In-App Mood Reminders

**Goal:** Students can control in-app mood reminder consent, quiet hours, pause/resume, and receive optional reminders without SOS/adult-alert side effects.
**Depends on:** Phase 21
**Requirements:** NOTIF-02, NOTIF-03, NOTIF-04, REMIND-01, REMIND-02, REMIND-03, REMIND-04, REMIND-05
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Student settings UI and API let students enable/disable in-app reminders, set quiet hours, pause/resume reminders, and see external channels as unavailable/deferred.
2. Student dashboard can request a computed in-app mood reminder that respects consent, quiet hours, pause state, and recent check-in state.
3. Reminder actions dismiss, snooze, or open the existing mood check-in flow without creating SOS alerts, adult notifications, risk scores, or automatic check-ins.
4. Reminder copy is Vietnamese, supportive, optional, non-clinical, and metadata-only audit records safe reminder statuses only.

**Plans:** 1/1 complete

Plans:
- [x] 22-01-PLAN.md - Student reminder preferences, in-app reminder card, and no-auto-SOS regression coverage

### Phase 23: Selective Mood-Note Sharing & Revocation

**Goal:** Students can share specific private mood notes or student summaries with chosen linked adults and revoke access later.
**Depends on:** Phase 21, Phase 22 mood history context
**Requirements:** SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Student mood history offers share controls only for own check-ins with private notes.
2. Student preview/confirmation names the selected adult(s), content scope, revocation path, and what remains private.
3. Adult reads require active relationship plus active share grant and lose access after revocation.
4. Share/read/revoke audit stays metadata-only and never includes private note or student summary text.

**Plans:** 0/1 complete

Plans:
- [ ] 23-01-PLAN.md - Selective mood-note sharing, revocation, adult reads, and audit privacy

### Phase 24: Reason-for-Access & Adult Support Transparency

**Goal:** Teacher/parent protected support access is reason-gated when policy requires it, without bypassing relationship authorization or privacy boundaries.
**Depends on:** Phase 21, Phase 23
**Requirements:** ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Backend reason gate blocks protected teacher/parent summary or shared-note access until a controlled allowed reason code is provided when policy requires it.
2. Reason submission never grants access without the existing active relationship and role checks.
3. Adult UI explains reasons as support/transparency, not discipline or surveillance.
4. Allowed, denied, and missing-reason attempts are audited as metadata only.

**Plans:** 0/1 complete

Plans:
- [ ] 24-01-PLAN.md - Reason-gated adult access and metadata-only transparency audit

### Phase 25: Admin Privacy Policy & Operations Visibility

**Goal:** Admins can configure safe v1.4 policy defaults and inspect metadata-only operations/readiness for consent, reminders, sharing, and reason access.
**Depends on:** Phases 21-24
**Requirements:** POLICY-01, POLICY-02, OPS-01, OPS-02, OPS-03
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Admin policy UI/API configures reminder defaults, quiet-hour defaults, pause options, reason requirements, allowed reason codes, and helper copy.
2. Policy validation rejects external reminder channel enablement and any default raw-note exposure.
3. Operations dashboard shows v1.4 counts/readiness for preferences, reminders, shares, revocations, shared-note reads, reason-gated access, and policy updates.
4. Demo seed/readiness verifies sample v1.4 policy and metadata without real student content.

**Plans:** 0/1 complete

Plans:
- [ ] 25-01-PLAN.md - Admin privacy policy defaults, operations buckets, readiness, and demo seed

### Phase 26: Cross-Role Privacy Regression & Demo Readiness

**Goal:** v1.4 privacy invariants are covered by backend/frontend regression gates, build/lint/smoke checks, docs, and demo readiness.
**Depends on:** Phases 21-25
**Requirements:** QA-01, QA-02, QA-03, QA-04
**UI hint:** yes
**Status:** Not Started

**Success criteria:**
1. Backend regression verifies consent/quiet/pause/external-channel rejection, no auto-SOS/adult-alerts, share authorization, revocation, reason gating, and metadata-only audit.
2. Frontend regression verifies student controls/reminders/sharing, adult reason prompts, admin policy/operations, and responsive support copy.
3. Full backend tests, frontend tests, lint, build, and production smoke pass or document accepted external constraints.
4. Docs and planning artifacts explain v1.4 boundaries, demo data, and deferred external delivery.

**Plans:** 0/1 complete

Plans:
- [ ] 26-01-PLAN.md - Cross-role privacy regression, docs, and demo readiness closure

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| NOTIF-01 | Phase 21 | Complete |
| NOTIF-02 | Phase 22 | Complete |
| NOTIF-03 | Phase 22 | Complete |
| NOTIF-04 | Phase 22 | Complete |
| NOTIF-05 | Phase 21 | Complete |
| REMIND-01 | Phase 22 | Complete |
| REMIND-02 | Phase 22 | Complete |
| REMIND-03 | Phase 22 | Complete |
| REMIND-04 | Phase 22 | Complete |
| REMIND-05 | Phase 22 | Complete |
| SHARE-01 | Phase 23 | Pending |
| SHARE-02 | Phase 23 | Pending |
| SHARE-03 | Phase 23 | Pending |
| SHARE-04 | Phase 23 | Pending |
| SHARE-05 | Phase 23 | Pending |
| ACCESS-01 | Phase 24 | Pending |
| ACCESS-02 | Phase 24 | Pending |
| ACCESS-03 | Phase 24 | Pending |
| ACCESS-04 | Phase 24 | Pending |
| ACCESS-05 | Phase 24 | Pending |
| POLICY-01 | Phase 25 | Pending |
| POLICY-02 | Phase 25 | Pending |
| OPS-01 | Phase 25 | Pending |
| OPS-02 | Phase 25 | Pending |
| OPS-03 | Phase 25 | Pending |
| QA-01 | Phase 26 | Pending |
| QA-02 | Phase 26 | Pending |
| QA-03 | Phase 26 | Pending |
| QA-04 | Phase 26 | Pending |

**Coverage:**
- v1.4 requirements: 29 total
- Mapped to phases: 29
- Complete: 10
- Unmapped: 0

## Assumptions

- v1.4 continues phase numbering from v1.3, so it starts at Phase 21.
- Reminder delivery remains in-app and request-time computed; no external provider or worker infrastructure is introduced.
- Student privacy defaults from v1.0-v1.3 remain binding.
- Adult shared-note reads require active student-created grants, not just relationship links.
- Admin policy defaults cannot override explicit student privacy boundaries or enable external channels in v1.4.

---
*Last updated: 2026-05-22 after Phase 22 completion*
