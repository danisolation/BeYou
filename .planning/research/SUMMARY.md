# Project Research Summary

**Project:** BeYou - Tu Tin La Minh  
**Domain:** Web app ho tro hoc sinh THPT Viet Nam nhan dien ap luc, self-check suc khoe tinh than, luyen tinh huong hoc duong, chat ho tro co guardrails, va gui SOS in-app.  
**Synthesized:** 2026-05-20  
**Overall confidence:** Medium-High

## Executive Summary

BeYou nen duoc xay nhu mot ung dung ho tro an toan va giao duc ky nang cho hoc sinh THPT, khong phai ung dung tri lieu, cong cu chan doan, hay he thong giam sat hoc sinh. Chuyen gia thuong xay san pham dang nay bang cach uu tien privacy-by-default, role/relationship-based authorization, noi dung non-clinical, va quy trinh escalation ro rang khi co rui ro an toan.

Huong tiep can khuyen nghi la modular monolith: FastAPI Python backend, PostgreSQL, Next.js frontend, HttpOnly cookie sessions, RBAC ket hop relationship checks, audit log, va LLM gateway backend-only cho freemodel.dev. V1 nen demo du day du core flows: login theo vai tro, student dashboard, self-check, scenarios, chatbot guardrails, SOS in-app, teacher/parent portals, admin CMS co ban.

Rui ro lon nhat khong nam o UI ma nam o safety/privacy: chatbot dua loi khuyen nguy hiem, nguoi lon xem qua nhieu du lieu rieng tu, SOS chi la nut bam khong co workflow, va du lieu tam ly hoc sinh bi luu/log qua muc. Giam thieu bang cach lam foundation an toan truoc: data classification, consent/privacy copy, authorization policy tests, audit trail, LLM guardrails, va SOS status lifecycle.

## Key Findings

### 1. Recommended Stack

- **Backend:** Python 3.12+ voi FastAPI, Pydantic v2, Uvicorn.
- **Database:** PostgreSQL voi SQLAlchemy 2.x, Alembic, psycopg 3.
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- **Server state/forms:** TanStack Query, react-hook-form, Zod.
- **Auth/session:** Email/password, Argon2 password hashing, opaque session ID in HttpOnly Secure SameSite cookie.
- **LLM:** freemodel.dev qua Python backend only, dat sau provider abstraction.
- **Testing:** pytest, pytest-asyncio, Ruff, Vitest, Playwright.

### 2. Table-Stakes Features for V1

Must-have for MVP demo:

1. Auth + seeded demo accounts.
2. Role-based portals: student, teacher, parent, admin.
3. Backend-enforced role + relationship + purpose authorization.
4. Student dashboard calm/mobile-first.
5. Short self-check tests with scoring, risk level, advice, and history.
6. Non-diagnostic result language.
7. Peer-pressure/school scenarios with feedback.
8. Chatbot through backend with non-therapy disclaimer and high-risk guardrails.
9. SOS in-app alerts to linked teacher/parent.
10. SOS status workflow: sent -> received -> supporting -> completed.
11. Teacher portal: managed students, warning summaries, SOS alerts.
12. Parent portal: linked student alerts and permitted support summaries.
13. Admin CMS: users, tests, scenarios, chatbot content.
14. Audit log for sensitive actions.
15. Clear student-friendly privacy/visibility notice.

Should-have if time allows:

- Small coping skills content library.
- Basic aggregate reports with privacy filters.
- Content workflow: draft -> reviewed -> published -> archived.
- Trusted adult plan as v1.5 candidate.

Defer to v2+:

- SMS/Zalo/email/push notifications.
- Human counselor handoff.
- Personalized learning paths.
- Daily mood check-ins.
- Multi-school tenancy.
- Anonymous reporting/community features.
- Advanced escalation routing.
- Native mobile app.

Never build:

- Chatbot that claims to be therapist/doctor or diagnoses students.
- Self-check labels such as clinical diagnosis.
- Parent/teacher access to full raw chat by default.
- Risk leaderboards or ranking students by mental-health risk.
- Public social feed for student mental states.
- LLM calls from frontend.
- Default training on student data.
- Auto-calling police/emergency services without policy/legal process.
- SOS gamification.
- Raw mental-health data export in MVP.

### 3. Architecture Findings

Recommended architecture: **modular monolith**.

Major backend modules:

- **Auth Module:** login, password hash, session lifecycle.
- **Authorization Module:** role + relationship + purpose checks for every sensitive endpoint.
- **User/Role Module:** user profiles and account status.
- **Student Link Module:** student-teacher-parent relationships; central to access control.
- **Assessment Module:** tests, questions, attempts, scoring, results.
- **Scenario Module:** scenario content, choices, feedback, attempts.
- **Chatbot Module:** chat sessions, safety checks, provider abstraction.
- **SOS Module:** alert source of truth, recipients, status lifecycle.
- **Notification Module:** in-app delivery layer.
- **Reports Module:** aggregate summaries only.
- **Audit/Safety Logging:** append-only metadata for sensitive actions.

Key patterns:

- Backend is the source of truth for privacy and authorization.
- Frontend never receives fields user is not allowed to see.
- Scoring and risk levels are computed on backend.
- SOS is its own domain model, not just a notification.
- Chatbot is backend-only with pre-check and post-check guardrails.
- Audit logs store metadata, not unnecessary raw sensitive content.
- Reports are aggregate-by-default and should suppress small groups.

### 4. Highest-Priority Pitfalls

1. **Chatbot becomes "AI therapist".**
   - Prevention: define as supportive first response only; no diagnosis; high-risk templates; red-team tests.
2. **SOS is only a UI button.**
   - Prevention: implement recipients, status lifecycle, timestamps, student-visible status, and audit trail.
3. **Teacher/parent/admin permissions too broad.**
   - Prevention: role + relationship + purpose checks; limited summaries; no raw chat by default.
4. **Too much sensitive data collected or logged.**
   - Prevention: data classification, minimization, no raw chat logs by default, retention decision before real pilot.
5. **No consent/assent or visibility clarity for minors.**
   - Prevention: student-friendly privacy notice explaining who sees what and when safety overrides privacy.
6. **Self-check looks like medical diagnosis.**
   - Prevention: call it self-check; use support-oriented risk levels; expert review before production use.
7. **LLM prompt injection/data leakage.**
   - Prevention: backend-only LLM gateway, no PII unless required, fixed prompt templates, output validation, rate limits.

## Implications for Roadmap

### Recommended Phase Structure

#### Phase 0: Safety, Privacy, Product Policy Foundation

**Rationale:** Must be done before coding high-risk flows. The MVP may handle real student psychological data.  
**Delivers:**

- Data classification.
- Privacy/visibility rules.
- Consent/assent copy for demo.
- RBAC + relationship access matrix.
- Chatbot safety policy.
- SOS workflow definition.
- Demo vs real data separation plan.

**Features covered:** privacy notice, consent copy, authorization rules, safety boundaries.  
**Pitfalls to avoid:** over-collection, unclear privacy, AI therapist framing, weak SOS policy.  
**Research flag:** Needs legal/expert review before real student pilot; not a blocker for offline MVP demo.

#### Phase 1: Technical Foundation, Auth, Authorization, Audit

**Rationale:** Every other feature depends on identity, roles, links, and privacy enforcement.  
**Delivers:**

- FastAPI + PostgreSQL + Next.js skeleton.
- User model, roles, seeded demo accounts.
- Login/session with HttpOnly cookie.
- Argon2 password hashing.
- Student links.
- Authorization service.
- Base audit logging.
- Protected layouts per role.

**Features covered:** auth, RBAC, student-teacher-parent linkage, seeded demo users.  
**Pitfalls to avoid:** role-only checks, JWT localStorage, no audit, mixed demo/real data.

#### Phase 2: Student Dashboard + Self-Checks

**Rationale:** Provides first meaningful student value and creates risk summary data needed by adult portals.  
**Delivers:**

- Student dashboard.
- Active tests.
- Attempts, answers, scoring.
- Risk level/advice.
- Student history.
- Limited teacher/parent summaries.

**Features covered:** mental well-being self-check, peer-pressure self-check, history, risk level.  
**Pitfalls to avoid:** diagnostic language, frontend scoring, raw answers exposed to adults.

#### Phase 3: Scenarios + Admin Content Management

**Rationale:** Lower-risk than chatbot and useful for validating CMS/content patterns before AI.  
**Delivers:**

- Scenario library.
- Choices and feedback.
- Attempt history.
- Admin CRUD for scenarios/tests.
- Basic content status workflow.

**Features covered:** school-pressure scenarios, feedback, admin CMS.  
**Pitfalls to avoid:** unreviewed sensitive content, medicalized language, poor localization.

#### Phase 4: SOS + In-App Notifications

**Rationale:** SOS depends on auth, links, audit, and adult portals. It must be a workflow, not a simple alert.  
**Delivers:**

- SOS alert model.
- Recipient resolution from student links.
- In-app notifications.
- Status flow: sent -> received -> supporting -> completed.
- Student-visible status.
- Teacher/parent action screens.
- Audit trail.

**Features covered:** SOS alerts, teacher/parent response, status tracking.  
**Pitfalls to avoid:** no owner, no fallback messaging, no audit, alert fatigue.

#### Phase 5: Chatbot Gateway + Guardrails

**Rationale:** Highest-risk product surface; should come after SOS and safety foundation exist.  
**Delivers:**

- Chat sessions/messages.
- freemodel.dev backend provider abstraction.
- Pre-check and post-check safety rules.
- High-risk escalation response.
- SOS suggestion, not automatic SOS.
- Rate limits and red-team tests.

**Features covered:** supportive chatbot, guardrails, high-risk detection.  
**Pitfalls to avoid:** AI therapist behavior, prompt injection, raw transcript exposure, frontend API key leak.

#### Phase 6: Reports, Hardening, Pilot Readiness

**Rationale:** Reports are useful but easy to make privacy-invasive; harden after core flows exist.  
**Delivers:**

- Aggregate reports.
- Admin summaries.
- Audit review UI.
- Small-group suppression.
- Privacy/security test pass.
- Pilot readiness checklist.

**Features covered:** aggregate reports, admin monitoring, security hardening.  
**Pitfalls to avoid:** re-identification, exports, risk leaderboards, surveillance dashboard.

## Roadmap Guidance

### Must Be Early

- Privacy/safety policy.
- Data classification.
- Auth/session.
- Role + relationship authorization.
- Student links.
- Audit log.
- Demo vs real data separation.
- Non-clinical copy standards.

### Must Be Deferred

- External notifications.
- Human counselor handoff.
- Multi-school tenancy.
- Personalized learning paths.
- Anonymous/community features.
- Auto-escalation beyond linked adults.
- Long-term transcript retention.
- Production analytics on sensitive data.

### Must Never Be Built

- AI therapist or diagnosis bot.
- Self-check as clinical diagnosis.
- Adult surveillance dashboard.
- Student risk leaderboard.
- Raw chat access by default for adults/admins.
- Frontend LLM integration.
- Hidden data sharing.
- Default model training on student data.
- SOS as gamified interaction.
- Automatic emergency contact without defined legal/school policy.

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | High | Recommendations align with mature FastAPI/PostgreSQL/Next.js/security patterns. freemodel.dev details are Medium due to limited public docs. |
| Features | Medium | Core flows are clear from project brief and feature research; exact self-check content requires expert review. |
| Architecture | Medium-High | Modular monolith, policy authorization, backend-only LLM, and SOS domain model are strong choices for MVP. |
| Pitfalls | Medium-High | Safety/privacy pitfalls are well identified; legal obligations in Viet Nam need expert confirmation before real pilot. |
| Overall | Medium-High | Strong enough for roadmap and MVP demo. Not sufficient alone for production deployment with real students. |

## Open Questions and Dependencies

These are **not blockers for MVP demo with seeded/demo data**, but **are blockers before real student pilot**:

1. Legal review under Viet Nam personal data protection rules, especially sensitive personal data and minors.
2. Consent/assent model: student, parent/guardian, school responsibilities.
3. School escalation process: who receives SOS, expected response time, fallback if no adult is online.
4. Retention/deletion policy for self-check results, SOS records, chat metadata, and possible transcripts.
5. Whether raw chatbot transcripts are stored at all.
6. Whether teacher/parent can see any student-provided SOS message verbatim.
7. Expert review of self-check questions, scoring, scenario content, and chatbot high-risk responses.
8. Emergency guidance wording for Viet Nam context.
9. Production deployment security: HTTPS/HSTS, backups, encryption at rest, secret management.
10. freemodel.dev API contract, data handling terms, retention, and model safety characteristics.

## Sources

- `.planning/PROJECT.md`
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- FastAPI docs: https://fastapi.tiangolo.com/
- Pydantic docs: https://docs.pydantic.dev/latest/
- SQLAlchemy docs: https://docs.sqlalchemy.org/en/20/
- Alembic docs: https://alembic.sqlalchemy.org/en/latest/
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev/
- Tailwind CSS docs: https://tailwindcss.com/docs
- shadcn/ui docs: https://ui.shadcn.com/docs
- PostgreSQL docs: https://www.postgresql.org/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP Top 10 for LLM/GenAI Apps: https://genai.owasp.org/llm-top-10/
- freemodel.dev public site: https://freemodel.dev/
- Vietnam Decree 13/2023/ND-CP personal data protection: https://vanban.chinhphu.vn/
- Tong dai Quoc gia Bao ve Tre em 111: https://tongdai111.vn/
- WHO adolescent mental health fact sheet: https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
