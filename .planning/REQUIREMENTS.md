# Requirements: BeYou - Tu Tin La Minh

**Defined:** 2026-05-22  
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.2 Requirements

Requirements for Trusted Adult Plan & Mood Check-ins. Each maps to exactly one roadmap phase.

### Trusted Adult Support Plan

- [ ] **PLAN-01**: Student can create a trusted adult support plan using only adults already linked to the student.
- [ ] **PLAN-02**: Student can select which linked adults are part of the support plan and see clear copy explaining what each selected adult can view.
- [ ] **PLAN-03**: Student can record shareable support preferences such as what helps, what does not help, preferred contact style, and safe timing.
- [ ] **PLAN-04**: Student can update, pause, or deactivate the support plan without deleting historical metadata needed for audit and safety context.
- [ ] **PLAN-05**: Support plan changes emit metadata-only audit events and never include private student notes or unshared details.

### Mood Check-ins

- [ ] **MOOD-01**: Student can complete a lightweight mood check-in with non-clinical mood, energy, stress, and context inputs.
- [ ] **MOOD-02**: Student can add an optional private note to a mood check-in that remains student-only by default.
- [ ] **MOOD-03**: Student can review their own mood check-in history with timestamps, trend labels, and supportive non-clinical guidance.
- [ ] **MOOD-04**: System handles repeat same-day check-ins predictably by showing timestamps and preserving each submitted entry.
- [ ] **MOOD-05**: High-concern check-ins suggest trusted-adult contact and SOS options without automatically sending SOS or alerting adults.

### Adult Support Summaries

- [ ] **ADULT-01**: Teacher can view privacy-preserving support plan and mood trend summaries only for students they are linked to or manage.
- [ ] **ADULT-02**: Parent can view privacy-preserving support plan and mood trend summaries only for linked students.
- [ ] **ADULT-03**: Adult summaries include shareable support preferences, recent trend direction, recency, and suggested supportive actions without raw private notes.
- [ ] **ADULT-04**: Wrong-role, unlinked, or unauthorized adult access is denied without leaking whether a student or sensitive resource exists.
- [ ] **ADULT-05**: Adult support UI copy stays supportive and summary-only, avoiding diagnosis, discipline, raw exports, risk leaderboards, or per-student surveillance language.

### Admin Configuration and Operations

- [ ] **ADMIN-01**: Admin can manage mood check-in prompts, option labels, support guidance, sort order, and lifecycle status.
- [ ] **ADMIN-02**: Admin validation blocks publishing prompts or guidance with missing options, unsafe lifecycle state, or copy that violates non-clinical support boundaries.
- [ ] **ADMIN-03**: Admin can preview student-facing check-in prompts and adult-facing support guidance before publishing.
- [ ] **ADMIN-04**: Admin and operations visibility for support plans and mood check-ins remains metadata-only and excludes raw notes, raw answers, exports, leaderboards, and drilldowns.
- [ ] **ADMIN-05**: Readiness/operations audit metadata includes support-plan, check-in, adult-summary, and admin-config actions using safe counts/statuses only.

### Privacy and Safety Integration

- [ ] **SAFE-01**: New student support-plan and mood-check-in routes remain behind authenticated role and privacy-acknowledgement gating before sensitive children render.
- [ ] **SAFE-02**: Student-facing copy clearly explains what stays private, what may be shared with selected adults, and how SOS remains a separate explicit action.
- [ ] **SAFE-03**: Backend response schemas for adults, admins, and operations exclude optional private notes and raw check-in details by construction.
- [ ] **SAFE-04**: Tests cover role/relationship authorization, privacy-blocked routing, raw-note exclusion, metadata-only audit, and no automatic SOS side effects.

## Future Requirements

Deferred to later releases. Tracked but not in the current roadmap.

### Notifications and Reminders

- **REMIND-01**: Student can opt into check-in reminders with quiet hours and consent controls.
- **REMIND-02**: System can deliver reminders or support nudges through Zalo, SMS, push, or email with retry/dead-letter handling.
- **REMIND-03**: Adults can receive student-approved notification digests without raw private notes.

### Advanced Support

- **SUPPORT-01**: Student can share a selected private note with a chosen adult for a specific conversation.
- **SUPPORT-02**: Sensitive support actions can require reason-for-access prompts.
- **SUPPORT-03**: System can hand off to a human counselor with staffing, SLA, consent, and legal process.

### Scale and Governance

- **TENANT-01**: Schools can customize prompt/guidance policy and support-plan defaults by tenant.
- **IDENTITY-01**: System supports OAuth/SSO for production school identity providers.

## Out of Scope

Explicitly excluded from v1.2 to prevent scope creep and safety risk.

| Feature | Reason |
|---------|--------|
| Automatic SOS or adult alert from a mood check-in | SOS must remain explicit and student-confirmed. |
| Clinical diagnosis, scoring, or treatment recommendations | BeYou is supportive and non-clinical. |
| AI mood/risk classification from private notes | Adds surveillance and false-positive risk beyond v1.2. |
| Adult/admin access to raw private mood notes | Violates student-owned privacy boundaries. |
| Risk leaderboards, punitive monitoring, or per-student risk drilldowns | Conflicts with support-not-surveillance product direction. |
| Raw exports of support plan or mood check-in data | High privacy risk and not needed for support workflows. |
| External Zalo/SMS/push reminders | Requires consent, provider governance, and retry operations beyond v1.2. |
| Counselor handoff or emergency service automation | Requires policy, staffing, legal, and operational readiness not scoped for v1.2. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAN-01 | TBD | Pending |
| PLAN-02 | TBD | Pending |
| PLAN-03 | TBD | Pending |
| PLAN-04 | TBD | Pending |
| PLAN-05 | TBD | Pending |
| MOOD-01 | TBD | Pending |
| MOOD-02 | TBD | Pending |
| MOOD-03 | TBD | Pending |
| MOOD-04 | TBD | Pending |
| MOOD-05 | TBD | Pending |
| ADULT-01 | TBD | Pending |
| ADULT-02 | TBD | Pending |
| ADULT-03 | TBD | Pending |
| ADULT-04 | TBD | Pending |
| ADULT-05 | TBD | Pending |
| ADMIN-01 | TBD | Pending |
| ADMIN-02 | TBD | Pending |
| ADMIN-03 | TBD | Pending |
| ADMIN-04 | TBD | Pending |
| ADMIN-05 | TBD | Pending |
| SAFE-01 | TBD | Pending |
| SAFE-02 | TBD | Pending |
| SAFE-03 | TBD | Pending |
| SAFE-04 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after v1.2 requirements definition*
