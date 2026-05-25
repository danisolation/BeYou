# Requirements: Peerlight AI v1.4 Consent-Based Notifications & Access Transparency

**Defined:** 2026-05-22
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.4 Requirements

Requirements for the current milestone. Each requirement maps to exactly one roadmap phase.

### Student Consent & Reminder Preferences

- [x] **NOTIF-01**: Student can view reminder preference state including enabled/disabled, paused/unpaused, quiet hours, timezone, and active channel boundaries.
- [x] **NOTIF-02**: Student can enable or disable in-app mood check-in reminders with explicit consent.
- [x] **NOTIF-03**: Student can configure quiet hours for reminders within school policy defaults.
- [x] **NOTIF-04**: Student can pause and resume reminders without penalty.
- [x] **NOTIF-05**: The API and UI clearly reject or mark Zalo, SMS, push, and email reminder channels as deferred in v1.4.

### Non-Clinical In-App Mood Check-In Reminders

- [x] **REMIND-01**: Eligible student sees a supportive in-app mood check-in reminder only when consented, not paused, and outside quiet hours.
- [x] **REMIND-02**: Student can dismiss, snooze, or open the mood check-in flow from a reminder.
- [x] **REMIND-03**: Reminder display, dismissal, snooze, missed state, or check-in entry never creates SOS, adult notifications, risk scores, or automatic check-ins.
- [x] **REMIND-04**: Reminder copy is Vietnamese, supportive, optional, non-clinical, and states that reminders do not notify adults or create SOS automatically.
- [x] **REMIND-05**: Reminder events create metadata-only audit records without mood content or private notes.

### Selective Private Mood-Note Sharing

- [x] **SHARE-01**: Student can share a specific existing private mood note or student-authored summary with selected currently linked adults.
- [x] **SHARE-02**: Student must preview and confirm exactly what will be shared, who will see it, and what remains private.
- [x] **SHARE-03**: Student can revoke a shared mood note per adult or for all selected adults.
- [x] **SHARE-04**: Teacher or parent can see only active mood-note shares explicitly granted to them by the student.
- [x] **SHARE-05**: Share, read, and revoke audit metadata excludes raw private note text and student-authored summary text.

### Reason-for-Access Transparency

- [x] **ACCESS-01**: Policy can require controlled reason prompts before teacher/parent access to protected support summaries or shared mood notes.
- [x] **ACCESS-02**: Teacher/parent must provide an allowed support-oriented reason before protected access when policy requires it.
- [x] **ACCESS-03**: Reason submission never bypasses role or active relationship authorization.
- [x] **ACCESS-04**: Allowed, denied, and missing-reason access attempts create metadata-only audit with safe reason code, actor role, resource type, and status.
- [x] **ACCESS-05**: Adult UI copy explains that reason prompts support transparency and support-not-surveillance boundaries.

### Admin Policy & Operations

- [x] **POLICY-01**: Admin can configure school-level v1.4 defaults for reminder availability, quiet-hour defaults, pause options, reason requirements, and allowed reason choices.
- [x] **POLICY-02**: Admin policy saves validate privacy-safe defaults and reject external reminder channel enablement in v1.4.
- [x] **OPS-01**: Admin operations dashboard includes metadata-only v1.4 buckets for reminder preferences, reminder events, note shares/revocations/reads, reason-gated access, and policy changes.
- [x] **OPS-02**: Operations views and audit summaries exclude raw notes, raw reason text, names, emails, identifiers where unsafe, private content, exports, and per-student risk drilldowns.
- [x] **OPS-03**: Demo seed/readiness can verify v1.4 policy, consent, reminder, and sharing sample state without real student data.

### Privacy Regression & Demo Readiness

- [x] **QA-01**: Backend tests verify reminder consent, quiet hours, pause, external-channel rejection, no automatic SOS/adult alerts, share authorization, revocation, reason gating, and metadata-only audit.
- [x] **QA-02**: Frontend tests verify student reminder controls, reminder card copy/actions, mood-note share/revoke UI, adult reason prompts, admin policy controls, and operations metadata-only display.
- [x] **QA-03**: Existing backend tests, frontend tests, lint, production build, and production smoke remain passing after v1.4 changes.
- [x] **QA-04**: Documentation and planning artifacts explain v1.4 privacy boundaries, demo data, and deferred external channel delivery.

### Audit Gap Closure & Peerlight AI Demo Refresh

- [x] **GAP-01**: Student notification preference creation/update consumes school privacy policy reminder defaults, quiet hours, timezone, and pause options instead of hardcoded defaults.
- [x] **GAP-02**: Mood-note sharing runtime enforces the admin `note_sharing_enabled` policy toggle and blocks share create/update when disabled.
- [x] **GAP-03**: Admin operations audit response excludes raw `resource_id` while preserving metadata-only event visibility.
- [x] **REFRESH-01**: User-facing UI copy is rebranded to Peerlight AI and Vietnamese-first labels for student self-checks, scenarios, chat, dashboard, login, and landing.
- [x] **REFRESH-02**: Demo psychological test seeds include broader non-proprietary anxiety, depression, ADHD, and autism/social-communication content.
- [x] **ACCESS-06**: Teacher/parent student lists and protected support-summary access are limited to linked students who have sent SOS.
- [x] **QA-05**: Full backend/frontend tests, lint, build, and copy/privacy grep gates pass after gap closure and Peerlight AI refresh.

## Future Requirements

Deferred to future milestones, not in v1.4 scope.

### External Notifications

- **FUT-NOTIF-01**: Governed Zalo/SMS/push/email reminder delivery with explicit consent, provider governance, retry/dead-letter handling, and message privacy review.
- **FUT-NOTIF-02**: Background queue/worker scheduling for reminders across inactive sessions.

### Access & Scale

- **FUT-ACCESS-01**: Student-facing adult/admin access timeline if pilot feedback confirms it supports trust without increasing anxiety.
- **FUT-HANDOFF-01**: Counselor or school-care-team handoff flows with explicit consent and audit boundaries.
- **FUT-SCALE-01**: Multi-school tenancy and school-specific policy customization.
- **FUT-AUTH-01**: Production OAuth/SSO with a selected school identity provider.

## Out of Scope

Explicit exclusions for v1.4.

| Feature | Reason |
|---------|--------|
| Zalo/SMS/push/email reminder delivery | Requires consent governance, provider operations, retries, dead-letter handling, and message privacy review. |
| Automatic SOS from reminders or mood check-ins | Violates student agency; SOS remains an explicit confirmed student action. |
| Adult/admin access to all private mood notes | Violates privacy-by-default and v1.2 mood privacy decisions. |
| Free-text reason narratives | Can become sensitive content; v1.4 uses controlled reason codes only. |
| Risk leaderboards or per-student reminder compliance reports | Conflicts with support-not-surveillance boundaries. |
| Raw exports of notes, reasons, audit trails, or private summaries | Creates privacy and misuse risk. |
| Multi-school tenancy | v1.4 uses single-school/default policy controls. |
| OAuth/SSO | Deferred until privacy-control foundations are stable. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
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
| SHARE-01 | Phase 23 | Complete |
| SHARE-02 | Phase 23 | Complete |
| SHARE-03 | Phase 23 | Complete |
| SHARE-04 | Phase 23 | Complete |
| SHARE-05 | Phase 23 | Complete |
| ACCESS-01 | Phase 24 | Complete |
| ACCESS-02 | Phase 24 | Complete |
| ACCESS-03 | Phase 24 | Complete |
| ACCESS-04 | Phase 24 | Complete |
| ACCESS-05 | Phase 24 | Complete |
| POLICY-01 | Phase 25 | Complete |
| POLICY-02 | Phase 25 | Complete |
| OPS-01 | Phase 25 | Complete |
| OPS-02 | Phase 25 | Complete |
| OPS-03 | Phase 25 | Complete |
| QA-01 | Phase 26 | Complete |
| QA-02 | Phase 26 | Complete |
| QA-03 | Phase 26 | Complete |
| QA-04 | Phase 26 | Complete |
| GAP-01 | Phase 27 | Complete |
| GAP-02 | Phase 27 | Complete |
| GAP-03 | Phase 27 | Complete |
| REFRESH-01 | Phase 27 | Complete |
| REFRESH-02 | Phase 27 | Complete |
| ACCESS-06 | Phase 27 | Complete |
| QA-05 | Phase 27 | Complete |

**Coverage:**
- v1.4 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-25 after Phase 27 gap closure and Peerlight AI refresh*
