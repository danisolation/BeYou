# Phase 2: Identity, Roles, Links & Demo Access - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20  
**Phase:** 02-identity-roles-links-demo-access  
**Areas discussed:** Authentication and sessions, Role model and portal routing, Privacy acknowledgement, Student-adult links, Admin user management, Demo accounts and demo data, Authorization and audit

---

## Authentication and Sessions

| Option | Description | Selected |
|---|---|---|
| Backend-owned opaque sessions | FastAPI verifies passwords and stores revokable server-side sessions in HttpOnly cookies. | ✓ |
| Stateless JWT in browser storage | Simpler stateless tokens but weaker revocation and higher XSS exposure if stored outside cookies. | |
| OAuth/SSO | Strong for production schools but explicitly out of v1 scope. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Aligns with privacy-first student data handling and avoids exposing tokens to frontend storage.

---

## Role Model and Portal Routing

| Option | Description | Selected |
|---|---|---|
| Four primary roles with role-specific portals | `student`, `teacher`, `parent`, `admin` with separate dashboards and backend guards. | ✓ |
| Multi-role accounts | Flexible but creates ambiguous MVP routing and permission edge cases. | |
| Single generic dashboard | Simpler UI but weak demo clarity and poor support for role-specific access. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Matches roadmap and seeded demo expectations.

---

## Privacy Acknowledgement

| Option | Description | Selected |
|---|---|---|
| Gate students after first login | Show Phase 1 privacy notice before dashboard and persist acknowledgement. | ✓ |
| Passive link only | Easier but does not satisfy Phase 1 placement intent. | |
| Full legal consent workflow | Better for real pilot but deferred until legal/school review. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Uses Phase 1 privacy notice and audit event `privacy_acknowledged`.

---

## Student-Adult Links

| Option | Description | Selected |
|---|---|---|
| Admin-managed active/revokable links | Admin creates/revokes teacher/parent links for students. | ✓ |
| Invite codes/self-claiming | Useful later, but adds verification and abuse-prevention scope. | |
| Static hardcoded links | Fast demo but not enough for ADMIN-01 and future portals. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Keeps v1 manageable and auditable while supporting linked adult portals.

---

## Admin User Management

| Option | Description | Selected |
|---|---|---|
| Soft delete/disable for real accounts | Preserves audit trail and avoids orphaning sensitive future records. | ✓ |
| Physical delete by default | Satisfies simple CRUD wording but risks audit/data integrity gaps. | |
| No delete action | Too limited for ADMIN-01. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** UI can present delete while implementation marks deleted/disabled for safety.

---

## Demo Accounts and Demo Data

| Option | Description | Selected |
|---|---|---|
| Deterministic dev/demo seeds with `is_demo` | Seeds all four roles and a linked demo group; visible banner and badge. | ✓ |
| Manual demo account creation | Slower and less repeatable. | |
| Production-like seeds | Unsafe because demo data could be confused with real student records. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Carries Phase 1 demo separation policy into implementation.

---

## Authorization and Audit

| Option | Description | Selected |
|---|---|---|
| Backend deny-by-default with metadata-only audit | Enforce role + relationship + purpose checks and log safe metadata. | ✓ |
| Frontend route guards only | Explicitly forbidden by Phase 1. | |
| Broad admin override | Too risky for student privacy unless constrained by purpose/audit. | |

**User's choice:** Auto-selected recommended default.  
**Notes:** Directly consumes Phase 1 authorization and audit contracts.

---

## the agent's Discretion

- Exact schema/table names.
- Exact frontend route file structure.
- Exact dependency versions.
- Exact seed script organization.
- Exact form layout and shadcn component selection, subject to UI-SPEC.

## Deferred Ideas

- OAuth/SSO and social login.
- Self-service password reset via email.
- Email/Zalo/SMS invitations for student-adult links.
- Multi-role accounts.
- Production legal consent workflow for real school pilot.
- External SOS delivery and real-time notification channels.
