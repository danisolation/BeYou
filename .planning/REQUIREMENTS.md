# Requirements: BeYou - Tu Tin La Minh

**Defined:** 2026-05-21  
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.1 Requirements

Requirements for Production Hardening & Support Polish. Each maps to exactly one roadmap phase.

### Production Readiness

- [ ] **READY-01**: Admin/operator can view liveness and readiness states that distinguish process health from production readiness.
- [ ] **READY-02**: System flags unsafe production configuration including debug/dev mode, placeholder session secrets, demo seed enabled, and missing required provider secrets.
- [ ] **READY-03**: System verifies database connectivity and Alembic migration head/current status and surfaces migration drift safely.
- [ ] **READY-04**: System flags unsafe credentialed CORS and session-cookie settings such as wildcard origins, insecure production cookies, missing explicit frontend origin, or unsafe SameSite/HttpOnly values.
- [ ] **READY-05**: Readiness responses show status and remediation hints while masking secret values and sensitive environment data.
- [ ] **READY-06**: Public health/readiness endpoints expose only non-sensitive overall status while detailed readiness data requires admin access.

### SOS Email Notification Readiness

- [ ] **EMAIL-01**: Backend can run SOS email delivery in disabled, local outbox, or SMTP mode using server-only configuration.
- [ ] **EMAIL-02**: Confirmed SOS alert still persists and creates in-app linked-adult notifications when email is disabled or fails.
- [ ] **EMAIL-03**: When email is enabled, backend creates minimal SOS email attempts for authorized linked adults only after the canonical SOS alert is persisted.
- [ ] **EMAIL-04**: Local/dev mode records SOS email attempts in a safe outbox without sending real messages.
- [ ] **EMAIL-05**: System records SOS email delivery metadata including alert, recipient role/id, channel, provider, status, timestamps, and error category without raw student content.
- [ ] **EMAIL-06**: Email provider failure records failed delivery metadata and audit without rolling back the SOS workflow or changing SOS status.
- [ ] **EMAIL-07**: Email messages, delivery logs, and frontend responses never expose raw SOS notes, self-check answers, chatbot transcripts, or provider credentials.

### Role and Privacy UX

- [ ] **UX-01**: Unacknowledged student session navigating directly to sensitive `/student` pages is redirected to `/privacy` with a return path.
- [ ] **UX-02**: Authenticated layout shows only role-appropriate navigation for student, teacher, parent, and admin users.
- [ ] **UX-03**: Wrong-role, unlinked, or privacy-blocked screens show supportive next steps without leaking whether a student or sensitive resource exists.
- [ ] **UX-04**: Teacher and parent support pages explain summary-only privacy boundaries and do not imply access to raw answers or chatbot transcripts.
- [ ] **UX-05**: SOS detail UX clearly distinguishes teacher status controls from parent read-only/status visibility.

### Admin Content Management

- [ ] **CONTENT-01**: Admin can edit complete self-check structures including metadata, ordered questions, ordered choices, scoring values, thresholds, and lifecycle status.
- [ ] **CONTENT-02**: System blocks publishing self-checks with missing or invalid nested fields, choices, scores, thresholds, or unsafe lifecycle state and shows actionable validation errors.
- [ ] **CONTENT-03**: Admin can edit complete scenario structures including situation, ordered choices, feedback, recommended response, lesson, skill tags, and lifecycle status.
- [ ] **CONTENT-04**: System blocks publishing scenarios with missing or invalid choices, feedback, recommendation, lesson, skill metadata, or unsafe lifecycle state and shows actionable validation errors.
- [ ] **CONTENT-05**: Admin can preview nested self-check and scenario content before publishing so student-facing flow can be checked.
- [ ] **CONTENT-06**: Historical self-check and scenario attempts remain interpretable after content edits through snapshots or version-safe behavior.

### Operational Visibility

- [ ] **OPS-01**: Admin can view a metadata-only operations dashboard with readiness status, SOS email delivery status, and recent support/admin activity.
- [ ] **OPS-02**: Admin can filter audit events by date, actor role, action type, target type, and status using metadata only.
- [ ] **OPS-03**: Admin can inspect SOS email delivery attempts and error categories without seeing raw student distress content or recipient credentials.
- [ ] **OPS-04**: Non-admin users cannot access operations endpoints or operations UI.
- [ ] **OPS-05**: Operations visibility excludes raw self-check answers, chatbot transcripts, SOS notes, secret values, raw exports, student risk leaderboards, and per-student risk drilldowns.
- [ ] **OPS-06**: v1.1 readiness checks, email delivery attempts, content publish actions, and sensitive support/admin actions emit minimal metadata audit events.

## Future Requirements

Deferred to later releases. Tracked but not in the current roadmap.

### Notification Channels

- **NOTIF-01**: System can send SOS notifications through Zalo, SMS, or push notification with consent and provider governance.
- **NOTIF-02**: User can configure notification preferences and delivery channels.
- **NOTIF-03**: System supports retry queues with backoff and operator-visible dead-letter handling for production email scale.

### Support and Operations

- **SUPP-01**: Student can define a trusted adult plan.
- **SUPP-02**: Student can complete lightweight daily or weekly mood check-ins.
- **SUPP-03**: System can hand off to a human counselor with staffing, SLA, consent, and legal process.
- **OPS-FUTURE-01**: Admin can view content diff/version history after nested editing is stable.
- **OPS-FUTURE-02**: Sensitive support actions can require reason-for-access prompts.

### Scale and Identity

- **SCALE-01**: System supports multi-school tenancy with tenant-specific admins and data boundaries.
- **AUTH-FUTURE-01**: System supports OAuth/SSO for production school identity providers.

## Out of Scope

Explicitly excluded from v1.1 to prevent scope creep and safety risk.

| Feature | Reason |
|---------|--------|
| Replacing in-app SOS with email | Email can fail, delay, or be missed; in-app SOS remains the source of truth. |
| Email links that update SOS status | Authenticated in-app status updates are safer and preserve role checks. |
| Raw SOS notes, self-check answers, or chatbot transcripts in email | Email is less controlled and may be forwarded or exposed. |
| Frontend-held SMTP/API credentials | Provider credentials must remain backend-only. |
| SMS/Zalo/push notifications | Adds consent, provider, and reliability complexity beyond v1.1. |
| Redis/Celery delivery infrastructure | Defer until production volume requires guaranteed async delivery. |
| Raw audit exports or raw sensitive admin browsing | Violates privacy-by-default and student trust. |
| Student risk leaderboards or punitive monitoring | BeYou must support students, not surveil or discipline them. |
| Session replay or analytics capturing student-sensitive content | High privacy risk for a wellbeing product. |
| Automatic emergency service contact | Requires legal/school policy and operational responsibility beyond v1.1. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| READY-01 | Phase 7 | Pending |
| READY-02 | Phase 7 | Pending |
| READY-03 | Phase 7 | Pending |
| READY-04 | Phase 7 | Pending |
| READY-05 | Phase 7 | Pending |
| READY-06 | Phase 7 | Pending |
| EMAIL-01 | Phase 8 | Pending |
| EMAIL-02 | Phase 8 | Pending |
| EMAIL-03 | Phase 8 | Pending |
| EMAIL-04 | Phase 8 | Pending |
| EMAIL-05 | Phase 8 | Pending |
| EMAIL-06 | Phase 8 | Pending |
| EMAIL-07 | Phase 8 | Pending |
| UX-01 | Phase 9 | Pending |
| UX-02 | Phase 9 | Pending |
| UX-03 | Phase 9 | Pending |
| UX-04 | Phase 9 | Pending |
| UX-05 | Phase 9 | Pending |
| CONTENT-01 | Phase 10 | Pending |
| CONTENT-02 | Phase 10 | Pending |
| CONTENT-03 | Phase 10 | Pending |
| CONTENT-04 | Phase 10 | Pending |
| CONTENT-05 | Phase 10 | Pending |
| CONTENT-06 | Phase 10 | Pending |
| OPS-01 | Phase 11 | Pending |
| OPS-02 | Phase 11 | Pending |
| OPS-03 | Phase 11 | Pending |
| OPS-04 | Phase 11 | Pending |
| OPS-05 | Phase 11 | Pending |
| OPS-06 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 after v1.1 roadmap creation*

