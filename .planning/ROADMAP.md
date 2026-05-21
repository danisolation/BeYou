# Roadmap: BeYou - Tu Tin La Minh

**Created:** 2026-05-20  
**Granularity:** Coarse  
**Milestone:** v1 MVP demo with production-minded privacy defaults  
**Coverage:** 47/47 v1 requirements mapped

## Phase Overview

| # | Phase | Goal | Requirements | Depends on | UI hint |
|---|-------|------|--------------|------------|---------|
| 1 | Safety, Privacy & Policy Foundation | BeYou has safe privacy, data, authorization, audit, demo/real-data, and non-clinical boundaries before sensitive flows are built. | SAFE-01..SAFE-06 | None | yes |
| 2 | Identity, Roles, Links & Demo Access | Users can securely log in, reach the correct role portal, and admins can manage accounts and student-adult links. | AUTH-01..AUTH-06, ADMIN-01 | Phase 1 | yes |
| 3 | Student Self-Checks, Scenarios & Content Management | Students can complete self-checks and scenarios with safe feedback, while admins manage test/scenario content. | TEST-01..TEST-06, SCEN-01..SCEN-05, ADMIN-02..ADMIN-03 | Phase 2 | yes |
| 4 | SOS Workflow & Adult Support Portals | Students can send confirmed SOS alerts and linked teachers/parents can support them through a visible status workflow. | SOS-01..SOS-06, TEACH-01..TEACH-03, PARENT-01..PARENT-03 | Phase 3 | yes |
| 5 | Supportive Chatbot Gateway & Guardrails | Students can chat with a backend-only supportive bot that detects high-risk content and escalates toward SOS/trusted adults safely. | CHAT-01..CHAT-06, ADMIN-04 | Phase 4 | yes |
| 6 | Aggregate Reports & Privacy Hardening | Admins can view privacy-limited aggregate reporting without exposing raw sensitive student data. | ADMIN-05..ADMIN-06 | Phase 5 | yes |

## Phase Details

### Phase 1: Safety, Privacy & Policy Foundation

**Goal:** BeYou has safe privacy, data, authorization, audit, demo/real-data, and non-clinical boundaries before sensitive flows are built.  
**Depends on:** Nothing  
**Requirements:** SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06  
**UI hint**: yes  
**Status:** Complete (2026-05-20)

**Success criteria:**
1. Student can read a clear notice explaining who can see self-check results, SOS alerts, and chatbot safety signals.
2. Sensitive resources have defined visibility rules by role, relationship, and purpose before feature implementation.
3. Safety-related access and changes are recorded as audit events.
4. Demo accounts and demo records are visibly separated from real student data.
5. Student-facing safety copy avoids diagnosis/therapy claims and explains BeYou is supportive, not professional care.

**Plans:** 3/3 complete

### Phase 2: Identity, Roles, Links & Demo Access

**Goal:** Users can securely log in, reach the correct role portal, and admins can manage accounts and student-adult links.  
**Depends on:** Phase 1  
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, ADMIN-01  
**UI hint**: yes  
**Status:** Complete (2026-05-20)

**Success criteria:**
1. Student, teacher, parent, and admin demo users can log in with email/password.
2. Each user lands in the correct role-based portal after login.
3. Student profile includes school, class, name, and linked support adults.
4. Admin can create, edit, disable, delete, and update users/roles.
5. Admin can manage active student-teacher-parent links.

**Plans:** 7/7 complete

### Phase 3: Student Self-Checks, Scenarios & Content Management

**Goal:** Students can complete self-checks and scenarios with safe feedback, while admins manage test/scenario content.  
**Depends on:** Phase 2  
**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, SCEN-01, SCEN-02, SCEN-03, SCEN-04, SCEN-05, ADMIN-02, ADMIN-03  
**UI hint**: yes  
**Status:** In Progress

**Success criteria:**
1. Student can view active self-checks, answer questions, submit, and receive backend-calculated score, risk level, and advice.
2. Student can view self-check history with date, test type, score, risk level, and advice summary.
3. Teacher and parent views show permitted summaries only, not raw answers by default.
4. Student can browse scenarios, choose a response, and receive feedback, recommended response, lesson, and skill tag.
5. Admin can create and edit tests, questions, choices, scoring thresholds, scenarios, choices, feedback, lessons, and skill tags.

**Plans:** 5/7 complete

Plans:
- [x] 03-01-PLAN.md - Backend domain models, migration, authorization, and router contracts
- [x] 03-02-PLAN.md - Student self-check scoring, result, history, and detail APIs
- [x] 03-03-PLAN.md - Student scenario browse, feedback, and history APIs
- [x] 03-04-PLAN.md - Adult summary-only self-check APIs with audit
- [x] 03-05-PLAN.md - Admin content APIs, lifecycle validation, audit, and demo seed
- [x] 03-06-PLAN.md - Student self-check and scenario frontend flows
- [ ] 03-07-PLAN.md - Adult/admin frontend and final E2E/security verification

### Phase 4: SOS Workflow & Adult Support Portals

**Goal:** Students can send confirmed SOS alerts and linked teachers/parents can support them through a visible status workflow.  
**Depends on:** Phase 3  
**Requirements:** SOS-01, SOS-02, SOS-03, SOS-04, SOS-05, SOS-06, TEACH-01, TEACH-02, TEACH-03, PARENT-01, PARENT-02, PARENT-03  
**UI hint**: yes  
**Status:** Pending

**Success criteria:**
1. Student can access a visible SOS button, confirm before sending, and see status progress.
2. Confirmed SOS alert stores student identity, class, school, timestamp, severity, source, and optional note.
3. Linked teachers and parents receive in-app notifications for SOS alerts.
4. Teacher can view linked students, warning summaries, and manage SOS status through received, supporting, and completed states.
5. Parent can view linked student SOS status and permitted latest self-check/support summaries.

**Plans:** TBD

### Phase 5: Supportive Chatbot Gateway & Guardrails

**Goal:** Students can chat with a backend-only supportive bot that detects high-risk content and escalates toward SOS/trusted adults safely.  
**Depends on:** Phase 4  
**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, ADMIN-04  
**UI hint**: yes  
**Status:** Pending

**Success criteria:**
1. Student can chat with a supportive bot through the Python backend.
2. Frontend never receives or exposes the freemodel.dev API key.
3. Chatbot presents itself as supportive first response only, not therapist, doctor, or diagnostic tool.
4. Backend detects high-risk messages before and after LLM response.
5. High-risk chat returns supportive escalation guidance and suggests SOS/trusted adult instead of unrestricted advice.

**Plans:** TBD

### Phase 6: Aggregate Reports & Privacy Hardening

**Goal:** Admins can view privacy-limited aggregate reporting without exposing raw sensitive student data.  
**Depends on:** Phase 5  
**Requirements:** ADMIN-05, ADMIN-06  
**UI hint**: yes  
**Status:** Pending

**Success criteria:**
1. Admin can view aggregate reports for user counts, self-check usage, risk-level distribution, SOS counts, and popular scenarios.
2. Reports avoid raw sensitive exports.
3. Reports avoid exposing identifiable mental-health detail beyond authorized purpose.
4. Adult/admin dashboards remain support-oriented, not surveillance or risk leaderboards.

**Plans:** TBD

## Traceability

| Requirement | Phase | Status |
|---|---|---|
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
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |
| TEST-03 | Phase 3 | Pending |
| TEST-04 | Phase 3 | Pending |
| TEST-05 | Phase 3 | Pending |
| TEST-06 | Phase 3 | Pending |
| SCEN-01 | Phase 3 | Pending |
| SCEN-02 | Phase 3 | Pending |
| SCEN-03 | Phase 3 | Pending |
| SCEN-04 | Phase 3 | Pending |
| SCEN-05 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |
| SOS-01 | Phase 4 | Pending |
| SOS-02 | Phase 4 | Pending |
| SOS-03 | Phase 4 | Pending |
| SOS-04 | Phase 4 | Pending |
| SOS-05 | Phase 4 | Pending |
| SOS-06 | Phase 4 | Pending |
| TEACH-01 | Phase 4 | Pending |
| TEACH-02 | Phase 4 | Pending |
| TEACH-03 | Phase 4 | Pending |
| PARENT-01 | Phase 4 | Pending |
| PARENT-02 | Phase 4 | Pending |
| PARENT-03 | Phase 4 | Pending |
| CHAT-01 | Phase 5 | Pending |
| CHAT-02 | Phase 5 | Pending |
| CHAT-03 | Phase 5 | Pending |
| CHAT-04 | Phase 5 | Pending |
| CHAT-05 | Phase 5 | Pending |
| CHAT-06 | Phase 5 | Pending |
| ADMIN-04 | Phase 5 | Pending |
| ADMIN-05 | Phase 6 | Pending |
| ADMIN-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

## Assumptions

- The roadmapper proposed a Phase 0 safety foundation; this roadmap normalizes it to Phase 1 so GSD commands can start with `/gsd-discuss-phase 1`.
- Safety/privacy comes before code-heavy flows because research identifies it as a prerequisite for real student psychological data.
- Chatbot intentionally comes after SOS foundation.
- Adult portals are grouped with SOS because teacher/parent value is support workflow, not surveillance.
- Admin user management is grouped with identity/auth; admin content management is grouped with the content it controls; reports are last due privacy risk.

---
*Roadmap created: 2026-05-20*
