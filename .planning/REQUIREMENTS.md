# Requirements: BeYou - Tu Tin La Minh

**Defined:** 2026-05-20  
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1 Requirements

Requirements for the MVP demo with complete core flows and production-minded privacy defaults.

### Safety & Privacy

- [x] **SAFE-01**: System classifies data by sensitivity before implementing storage or sharing rules.
- [x] **SAFE-02**: Student can read a clear privacy and visibility notice explaining who can see self-check results, SOS alerts, and chatbot safety signals.
- [x] **SAFE-03**: Backend enforces role, relationship, and purpose-based authorization for every sensitive student resource.
- [x] **SAFE-04**: System records audit events when users access sensitive student data, update SOS alerts, change roles/links, or modify safety-related content.
- [x] **SAFE-05**: System separates demo data from real data so seeded accounts and demo records cannot be mistaken for production student records.
- [x] **SAFE-06**: Student-facing self-check, chatbot, and result copy avoids clinical diagnosis language and clearly states the app does not replace professional support.

### Authentication & Users

- [x] **AUTH-01**: User can log in with email and password.
- [x] **AUTH-02**: System provides seeded demo accounts for student, teacher, parent, and admin roles.
- [x] **AUTH-03**: User lands in the correct role-based portal after login.
- [x] **AUTH-04**: Student profile stores required school context including name, class, school, and linked support adults.
- [x] **AUTH-05**: Admin can create and manage active links between students, teachers, and parents.
- [x] **AUTH-06**: Admin can manage user role, account status, and basic profile information.

### Self-Checks

- [x] **TEST-01**: Student can view active self-check tests.
- [x] **TEST-02**: Student can answer multiple-choice self-check questions.
- [x] **TEST-03**: Backend calculates self-check score and risk level from submitted answers.
- [x] **TEST-04**: Student sees score, risk level, short comment, advice, positive content, and suggested next action after completing a self-check.
- [x] **TEST-05**: Student can view self-check history with date, test type, score, risk level, and advice summary.
- [x] **TEST-06**: Teacher and parent views show only permitted self-check summaries, not raw answers or full private detail by default.

### School Scenarios

- [x] **SCEN-01**: Student can browse published school-pressure scenarios.
- [x] **SCEN-02**: Student can open a scenario and read the title, situation description, and response choices.
- [x] **SCEN-03**: Student receives feedback explaining whether the selected response is constructive or risky.
- [x] **SCEN-04**: Student sees the recommended response, lesson learned, and related skill such as saying no, emotion regulation, seeking help, or positive communication.
- [x] **SCEN-05**: System saves scenario attempt history for the student.

### Chatbot

- [ ] **CHAT-01**: Student can chat with a supportive chatbot through the Python backend.
- [ ] **CHAT-02**: Backend integrates freemodel.dev through a provider abstraction so the LLM provider can be swapped later.
- [ ] **CHAT-03**: Frontend never receives or exposes the freemodel.dev API key.
- [ ] **CHAT-04**: Chatbot presents itself as supportive first response only, not as a therapist, doctor, or diagnostic tool.
- [ ] **CHAT-05**: Backend detects high-risk chat messages using safety rules before and after the LLM response.
- [ ] **CHAT-06**: When high-risk content is detected, chatbot returns supportive escalation guidance and suggests SOS or a trusted adult instead of continuing unrestricted advice.

### SOS

- [x] **SOS-01**: Student can access a visible SOS button from the student experience.
- [x] **SOS-02**: Student must confirm before an SOS alert is sent.
- [x] **SOS-03**: Confirmed SOS alert stores student identity, class, school, timestamp, severity, source, and optional student note.
- [x] **SOS-04**: System creates in-app notifications for linked teacher and parent recipients when an SOS alert is sent.
- [x] **SOS-05**: Student, teacher, and parent can see SOS status progress from sent to received, supporting, and completed.
- [x] **SOS-06**: System records every SOS status update with actor, timestamp, previous status, new status, and optional note.

### Teacher Portal

- [x] **TEACH-01**: Teacher can view students actively linked to them.
- [x] **TEACH-02**: Teacher can view permitted warning summaries for managed students, including "can quan tam" and "nguy co cao" groups.
- [x] **TEACH-03**: Teacher can view, acknowledge, update, and complete SOS alerts for managed students.

### Parent Portal

- [x] **PARENT-01**: Parent can view students actively linked to their account.
- [x] **PARENT-02**: Parent can view linked student SOS alerts and current handling status.
- [x] **PARENT-03**: Parent can view permitted latest self-check summary and support suggestions for linked students.

### Admin & Reports

- [x] **ADMIN-01**: Admin can create, edit, disable, and delete user accounts.
- [x] **ADMIN-02**: Admin can create and edit self-check tests, questions, answer choices, scoring values, and risk thresholds.
- [x] **ADMIN-03**: Admin can create and edit scenarios, response choices, feedback, lessons, and skill tags.
- [ ] **ADMIN-04**: Admin can manage chatbot safety/content configuration without exposing secrets or bypassing backend guardrails.
- [x] **ADMIN-05**: Admin can view aggregate reports for user counts, self-check usage, risk-level distribution, SOS counts, and popular scenarios.
- [x] **ADMIN-06**: Reports avoid raw sensitive exports and avoid exposing identifiable mental-health detail beyond authorized purpose.

## v2 Requirements

Deferred to future releases. Tracked but not in the current roadmap.

### Notifications

- **NOTF-01**: System can send SOS notifications through email.
- **NOTF-02**: System can send SOS notifications through Zalo, SMS, or push notification.
- **NOTF-03**: User can configure notification preferences and delivery channels.

### Support & Personalization

- **SUPP-01**: Student can define a trusted adult plan.
- **SUPP-02**: Student can complete lightweight daily or weekly mood check-ins.
- **SUPP-03**: System can recommend personalized coping skill paths based on history.
- **SUPP-04**: System can hand off to a human counselor with staffing, SLA, consent, and legal process.

### Scale & Analytics

- **SCALE-01**: System supports multi-school tenancy with tenant-specific admins and data boundaries.
- **SCALE-02**: Admin can view advanced anonymized school climate analytics.
- **SCALE-03**: System supports anonymous reporting with moderation and abuse prevention.

## Out of Scope

Explicitly excluded from v1 to prevent scope creep and safety risk.

| Feature | Reason |
|---------|--------|
| Native mobile app | Responsive web is sufficient for v1 MVP demo. |
| OAuth/SSO | Email/password plus seeded demo accounts is enough for v1. |
| External SMS/Zalo/email/push notifications | Valuable later, but v1 proves SOS workflow with in-app notifications. |
| Human counselor marketplace or live counseling | Requires staffing, legal process, SLA, and expert governance. |
| Chatbot diagnosis or therapy | Safety risk; chatbot is supportive first response only. |
| Parent/teacher access to full raw chatbot transcripts by default | Violates privacy-by-default and may reduce student trust. |
| Student risk leaderboard or punitive monitoring | BeYou must support, not surveil or discipline students. |
| Public social feed or peer sharing of mental state | High bullying and privacy risk. |
| Training AI models on student data by default | Requires explicit consent, legal review, and data governance. |
| Automatic emergency service contact | Requires legal/school policy and operational responsibility beyond v1. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01 | Phase 1 | Complete |
| SAFE-02 | Phase 1 | Complete |
| SAFE-03 | Phase 1 | Complete |
| SAFE-04 | Phase 1 | Complete |
| SAFE-05 | Phase 1 | Complete |
| SAFE-06 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| ADMIN-01 | Phase 2 | Complete |
| TEST-01 | Phase 3 | Complete |
| TEST-02 | Phase 3 | Complete |
| TEST-03 | Phase 3 | Complete |
| TEST-04 | Phase 3 | Complete |
| TEST-05 | Phase 3 | Complete |
| TEST-06 | Phase 3 | Complete |
| SCEN-01 | Phase 3 | Complete |
| SCEN-02 | Phase 3 | Complete |
| SCEN-03 | Phase 3 | Complete |
| SCEN-04 | Phase 3 | Complete |
| SCEN-05 | Phase 3 | Complete |
| ADMIN-02 | Phase 3 | Complete |
| ADMIN-03 | Phase 3 | Complete |
| SOS-01 | Phase 4 | Complete |
| SOS-02 | Phase 4 | Complete |
| SOS-03 | Phase 4 | Complete |
| SOS-04 | Phase 4 | Complete |
| SOS-05 | Phase 4 | Complete |
| SOS-06 | Phase 4 | Complete |
| TEACH-01 | Phase 4 | Complete |
| TEACH-02 | Phase 4 | Complete |
| TEACH-03 | Phase 4 | Complete |
| PARENT-01 | Phase 4 | Complete |
| PARENT-02 | Phase 4 | Complete |
| PARENT-03 | Phase 4 | Complete |
| CHAT-01 | Phase 5 | Complete |
| CHAT-02 | Phase 5 | Complete |
| CHAT-03 | Phase 5 | Complete |
| CHAT-04 | Phase 5 | Complete |
| CHAT-05 | Phase 5 | Complete |
| CHAT-06 | Phase 5 | Complete |
| ADMIN-04 | Phase 5 | Complete |
| ADMIN-05 | Phase 6 | Complete |
| ADMIN-06 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-21 after Phase 6 completion*
