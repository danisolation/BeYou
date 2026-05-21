# Phase 2: Identity, Roles, Links & Demo Access - Context

**Gathered:** 2026-05-20  
**Status:** Ready for planning  
**Mode:** Autonomous defaults selected by agent

<domain>

## Phase Boundary

Phase 2 delivers the first runnable BeYou identity foundation: email/password login, seeded demo accounts, role-aware portals for student/teacher/parent/admin, student profile school/class context, admin user management, and active student-teacher-parent links. It must consume Phase 1 privacy, authorization, audit, and demo-data contracts before later self-check, SOS, chatbot, and reporting flows are built.

Out of scope for this phase: OAuth/SSO, external email/Zalo/SMS delivery, self-check content, SOS workflow implementation, chatbot integration, and aggregate reporting.

</domain>

<decisions>

## Implementation Decisions

### Authentication and Sessions

- **D-01:** Use email/password for v1 with backend-owned authentication. The Python backend is the source of truth for users, password verification, sessions, roles, and authorization.
- **D-02:** Prefer server-managed opaque sessions stored in the backend/database and delivered to the browser via `HttpOnly`, `Secure` in production, `SameSite=Lax` cookies. Do not store auth tokens in `localStorage`.
- **D-03:** Hash passwords with a modern password hashing library (`argon2id` preferred, `bcrypt` acceptable if project constraints make argon2 impractical). Never log or commit passwords, tokens, reset secrets, or session cookie values.
- **D-04:** No self-service password reset or email verification in v1 because external email delivery is out of scope. Admin-created accounts and seeded demo accounts are enough for the MVP. The planner may include an admin password-reset/change-password path if it can be implemented without email delivery.

### Role Model and Portal Routing

- **D-05:** Use four roles exactly for v1: `student`, `teacher`, `parent`, `admin`.
- **D-06:** Each account has one primary role in v1. Multi-role accounts are deferred to avoid ambiguous portal and authorization behavior.
- **D-07:** After login, route users to role-specific portals: student dashboard, teacher dashboard, parent dashboard, and admin dashboard. Frontend routing is a convenience only; backend API authorization must enforce the role on every protected endpoint.
- **D-08:** Include a small shared authenticated layout that preserves Phase 1 privacy notice access and demo indicators across role portals.

### Privacy Acknowledgement

- **D-09:** Implement the Phase 1 privacy notice gate after first login and before dashboard access for student/demo student accounts.
- **D-10:** Persist privacy acknowledgement metadata with notice version, user id, timestamp, and `is_demo`; record a `privacy_acknowledged` audit event.
- **D-11:** Keep a dashboard/profile link labeled `Ai có thể xem thông tin của em?` so students can review the privacy notice later without re-acknowledgement.

### Student Profiles and Adult Links

- **D-12:** Student profile stores required school context: full name, email, role, school, class, and linked support adults. Grade can be included if useful, but school and class are required.
- **D-13:** Adult links are admin-managed in v1. Students, teachers, and parents do not self-claim links or use invite codes in Phase 2.
- **D-14:** Model links as active/revokable relationships between a student and an adult account with relationship type `teacher` or `parent`, status, timestamps, actor metadata, and `is_demo`.
- **D-15:** Teachers and parents can view only their linked students/children. The backend must require role + relationship checks for student-scoped resources.

### Admin User Management

- **D-16:** Admin can create users, edit basic profile fields, change roles, disable accounts, mark accounts deleted, and manage student-adult links.
- **D-17:** Prefer soft delete / disabled status for real accounts to preserve audit trails and avoid orphaning sensitive future records. Physical deletion is acceptable only for clearly demo-only records if the implementation can keep audit intent intact.
- **D-18:** Role changes, account disables/deletes, and link create/revoke operations must produce metadata-only audit events (`role_changed`, `student_adult_link_created`, `student_adult_link_revoked`).

### Demo Accounts and Demo Data

- **D-19:** Seed deterministic demo accounts for all roles: student, teacher, parent, and admin. Demo seed data must be limited to dev/demo contexts and must set `is_demo: true`.
- **D-20:** Seed at least one linked demo student-teacher-parent group so role portals can show the complete identity/linking flow without real student data.
- **D-21:** Demo sessions and demo records must show the Phase 1 banner `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.` and `Demo` badge. Demo separation must not rely only on color.
- **D-22:** Do not commit real credentials. Demo credentials may be documented only as non-secret local/demo fixtures intended for seeded demo use.

### Authorization and Audit

- **D-23:** Apply Phase 1 `deny_by_default` authorization and `frontend_only_privacy_enforcement: forbidden`. Backend APIs must enforce role, relationship, and purpose checks.
- **D-24:** Phase 2 authorization scope covers account/profile resources, role portals, student-adult links, demo records, and privacy acknowledgement. Wellbeing, SOS, and chatbot resource authorization is prepared by contracts but implemented in later feature phases.
- **D-25:** Audit logs remain metadata-only and must forbid raw sensitive content, passwords, tokens, session cookies, and API keys.

### the agent's Discretion

- The agent may choose exact database schema names, route structure, form layouts, dependency versions, migration tooling, and seed script organization as long as Phase 1 contracts and the decisions above are honored.
- The agent may choose whether to scaffold frontend and backend in one plan or split into multiple plans, but the result must support end-to-end login and role portal demo flow.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Phase Scope

- `.planning/PROJECT.md` — Product vision, Python backend requirement, v1 auth/demo constraints, privacy-first principle.
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-06 and ADMIN-01 requirements; Phase 1 SAFE requirements now complete.
- `.planning/ROADMAP.md` — Phase 2 goal, dependencies, success criteria, and requirement mapping.
- `.planning/STATE.md` — Current milestone progress and next action.

### Phase 1 Contracts Consumed by Phase 2

- `.planning/phases/01-safety-privacy-policy-foundation/01-CONTEXT.md` — Locked privacy, audit, demo, and non-clinical safety decisions.
- `.planning/phases/01-safety-privacy-policy-foundation/01-DATA-CLASSIFICATION.yml` — Data class/resource keys for account/profile, relationship links, demo records, and future sensitive resources.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUTHORIZATION-POLICY.yml` — Deny-by-default backend authorization contract and role/relationship/purpose rules.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUDIT-EVENT-CATALOG.yml` — Metadata-only audit event catalog for role changes, link changes, privacy acknowledgement, and demo access.
- `.planning/phases/01-safety-privacy-policy-foundation/01-DEMO-DATA-POLICY.md` — `is_demo`, banner, badge, seed restrictions, and real pilot legal/school review gate.
- `.planning/phases/01-safety-privacy-policy-foundation/01-PRIVACY-NOTICE.vi.md` — Student-facing privacy notice content and acknowledgement label.
- `.planning/phases/01-safety-privacy-policy-foundation/01-UI-SPEC.md` — Calming visual system, demo indicator rules, privacy notice placement, and student-facing copy tone.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- No application source code exists yet. Phase 2 will likely introduce the first backend/frontend scaffold.
- Planning artifacts from Phase 1 are reusable contracts and should be treated as source-of-truth inputs.

### Established Patterns

- Backend stack is planned as Python/FastAPI.
- Frontend stack is planned as Next.js + TypeScript + Tailwind + shadcn/ui.
- Planning artifacts use paired Markdown/YAML contracts when a rule must be both human-readable and machine-consumable.
- Privacy/security behavior should be backend-enforced, not frontend-only.

### Integration Points

- Future Phase 3 self-checks will depend on Phase 2 users, student profiles, and privacy acknowledgement.
- Future Phase 4 SOS portals will depend on Phase 2 student-adult links and adult role dashboards.
- Future Phase 5 chatbot guardrails will depend on Phase 2 sessions and student identity context.
- Future Phase 6 reports will depend on Phase 2 admin role and demo/real separation.

</code_context>

<specifics>

## Specific Ideas

- Keep demo experience complete enough to show student, teacher, parent, and admin roles in one seeded scenario.
- Keep admin workflows practical for MVP: create/edit/disable/delete users and create/revoke links, without adding external invitations or email delivery.
- Keep student/adult UI language supportive and privacy-limited, carrying forward Phase 1's anti-surveillance direction.

</specifics>

<deferred>

## Deferred Ideas

- OAuth/SSO and social login.
- Self-service password reset via email.
- Email/Zalo/SMS invitations for student-adult links.
- Multi-role accounts.
- Production legal consent workflow for real school pilot.
- External SOS delivery and real-time notification channels.

</deferred>

---

*Phase: 02-identity-roles-links-demo-access*
*Context gathered: 2026-05-20*
