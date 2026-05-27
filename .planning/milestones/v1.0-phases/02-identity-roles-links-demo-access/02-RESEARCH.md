# Phase 2: Identity, Roles, Links & Demo Access - Research

**Researched:** 2026-05-20  
**Domain:** FastAPI + Next.js identity/auth, role portals, student-adult links, demo access  
**Confidence:** HIGH for Phase 2 planning-critical decisions; MEDIUM for exact dependency versions because they should be rechecked immediately before implementation

<user_constraints>

## User Constraints (from CONTEXT.md)

> Source note: The following constraints are copied from `D:\BeYou\.planning\phases\02-identity-roles-links-demo-access\02-CONTEXT.md`; this source tag applies to the entire section. [VERIFIED: 02-CONTEXT.md]

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

- OAuth/SSO and social login.
- Self-service password reset via email.
- Email/Zalo/SMS invitations for student-adult links.
- Multi-role accounts.
- Production legal consent workflow for real school pilot.
- External SOS delivery and real-time notification channels.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| AUTH-01 | User can log in with email and password. | Use FastAPI auth endpoints, Argon2id password hashes, opaque DB sessions, and HttpOnly cookies. [VERIFIED: REQUIREMENTS.md] [CITED: OWASP Password Storage Cheat Sheet] [CITED: OWASP Session Management Cheat Sheet] |
| AUTH-02 | System provides seeded demo accounts for student, teacher, parent, and admin roles. | Use deterministic seed script gated to dev/demo contexts and mark users, sessions, links, and audit events with `is_demo`. [VERIFIED: 01-DEMO-DATA-POLICY.md] |
| AUTH-03 | User lands in the correct role-based portal after login. | Backend `/auth/me` should return the authenticated role; frontend routes `/student`, `/teacher`, `/parent`, `/admin` are convenience only. [VERIFIED: 02-CONTEXT.md] [VERIFIED: 02-UI-SPEC.md] |
| AUTH-04 | Student profile stores required school context including name, class, school, and linked support adults. | Store school/class on student profile and expose linked adults through relationship-checked API endpoints. [VERIFIED: REQUIREMENTS.md] [VERIFIED: 02-CONTEXT.md] |
| AUTH-05 | Admin can create and manage active links between students, teachers, and parents. | Use `student_adult_links` with `teacher`/`parent` relationship type, status, timestamps, actor metadata, `is_demo`, and audit events. [VERIFIED: 02-CONTEXT.md] [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| AUTH-06 | Admin can manage user role, account status, and basic profile information. | Use admin-only user CRUD endpoints with soft-delete/disable behavior for real accounts and metadata-only audit events for role/status changes. [VERIFIED: REQUIREMENTS.md] [VERIFIED: 02-CONTEXT.md] |
| ADMIN-01 | Admin can create, edit, disable, and delete user accounts. | Implement admin user management UI and API with confirmation dialogs for disable/delete/role-change actions. [VERIFIED: REQUIREMENTS.md] [VERIFIED: 02-UI-SPEC.md] |

</phase_requirements>

## Project Constraints (from copilot-instructions.md)

- Backend must be Python. [VERIFIED: copilot-instructions.md]
- Planned backend stack is Python 3.12+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy 2.x, Alembic, PostgreSQL, and psycopg 3. [VERIFIED: copilot-instructions.md]
- Planned frontend stack is Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, react-hook-form, and Zod. [VERIFIED: copilot-instructions.md]
- Use HttpOnly opaque sessions rather than `localStorage` JWTs. [VERIFIED: copilot-instructions.md]
- CORS must allowlist exact frontend origins when credentials are used. [VERIFIED: copilot-instructions.md]
- Logs must not contain passwords, tokens, raw chat, full assessment answers, session cookies, or API keys. [VERIFIED: copilot-instructions.md]
- Do not make direct repository edits outside a GSD workflow unless explicitly asked to bypass it. [VERIFIED: copilot-instructions.md]
- No project skills were found in `.github/skills/` or `.agents/skills/`. [VERIFIED: project directory scan]

## Summary

Phase 2 should create the first runnable BeYou application scaffold as a two-app monorepo: `backend/` for FastAPI and `frontend/` for Next.js. [VERIFIED: 02-CONTEXT.md] [VERIFIED: project root scan] The backend must be the source of truth for users, sessions, roles, student-adult links, privacy acknowledgements, authorization, and audit events. [VERIFIED: 02-CONTEXT.md]

Use PostgreSQL with SQLAlchemy 2.x and Alembic migrations for the identity schema because Phase 2 data is relational: users, profiles, sessions, acknowledgements, audit events, and student-adult links all need referential integrity and queryable relationships. [VERIFIED: copilot-instructions.md] [CITED: SQLAlchemy ORM Quickstart] [CITED: Alembic Tutorial] Use server-managed opaque sessions in the database and send only the random session ID via an HttpOnly cookie; this matches Phase 2 locked decisions and OWASP session guidance. [VERIFIED: 02-CONTEXT.md] [CITED: OWASP Session Management Cheat Sheet]

The highest-risk planning area is not the UI scaffold; it is ensuring every backend endpoint uses deny-by-default role + relationship + purpose authorization, and that audit logs stay metadata-only. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml]

**Primary recommendation:** Plan Phase 2 as backend-first contracts and migrations, then seed deterministic demo data, then build the Next.js role portals against those APIs. [VERIFIED: 02-CONTEXT.md]

## Standard Stack

### Core

| Library / Tool | Verified Version | Purpose | Why Standard |
|---|---:|---|---|
| Python | 3.12.7 available locally | Backend runtime | Project requires Python backend; local Python 3.12 is available. [VERIFIED: environment audit] [VERIFIED: PROJECT.md] |
| FastAPI | 0.136.1, published 2026-04-23 | Backend API framework | Supports API routing, dependency injection, OpenAPI generation, and Pydantic models. [VERIFIED: PyPI registry] [CITED: FastAPI docs] |
| Pydantic | 2.13.4, published 2026-05-06 | Request/response validation | FastAPI uses Pydantic models for validation and serialization. [VERIFIED: PyPI registry] [CITED: Pydantic docs] |
| SQLAlchemy | 2.0.49, published 2026-04-03 | ORM and schema models | Use typed ORM models for users, sessions, links, audit logs, and acknowledgements. [VERIFIED: PyPI registry] [CITED: SQLAlchemy docs] |
| Alembic | 1.18.4, published 2026-02-10 | Database migrations | Standard migration tool for SQLAlchemy projects. [VERIFIED: PyPI registry] [CITED: Alembic docs] |
| PostgreSQL | Use Docker local service; `psql` not installed locally | Primary database | Planned stack already selects PostgreSQL for relational identity and authorization data. [VERIFIED: copilot-instructions.md] [VERIFIED: environment audit] |
| psycopg | 3.3.4, published 2026-05-01 | PostgreSQL driver | Modern PostgreSQL adapter compatible with SQLAlchemy. [VERIFIED: PyPI registry] [CITED: psycopg docs] |
| argon2-cffi | 25.1.0, published 2025-06-03 | Password hashing | OWASP recommends Argon2id as first-choice password hashing with minimum parameters. [VERIFIED: PyPI registry] [CITED: OWASP Password Storage Cheat Sheet] |
| Next.js | 16.2.6, published 2026-05-07 | Frontend framework | Planned frontend stack and supports role route structure. [VERIFIED: npm registry] [CITED: Next.js docs] |
| React | 19.2.6, published 2026-05-06 | UI runtime | Required by Next.js frontend. [VERIFIED: npm registry] [CITED: React docs] |
| TypeScript | 6.0.3, published 2026-04-16 | Type safety | Planned stack; useful for typed API contracts and role enums. [VERIFIED: npm registry] |
| Tailwind CSS | 4.3.0, published 2026-05-08 | Styling | Planned stack and supports utility-first implementation of Phase 2 UI contract. [VERIFIED: npm registry] [CITED: Tailwind Next.js install docs] |
| shadcn CLI | 4.7.0, published 2026-05-05 | UI component installation | UI spec requires official shadcn/ui components once frontend scaffold exists. [VERIFIED: npm registry] [VERIFIED: 02-UI-SPEC.md] [CITED: shadcn Next.js install docs] |

### Supporting

| Library | Verified Version | Purpose | When to Use |
|---|---:|---|---|
| httpx | 0.28.1, published 2024-12-06 | Backend async HTTP client and test client support | Use for API tests and future external calls. [VERIFIED: PyPI registry] |
| pytest | 9.0.3, published 2026-04-07 | Backend tests | Use for auth/session/link/authorization tests. [VERIFIED: PyPI registry] [CITED: pytest docs] |
| pytest-asyncio | 1.3.0, published 2025-11-10 | Async backend tests | Use for async FastAPI/database tests if async SQLAlchemy is used. [VERIFIED: PyPI registry] |
| ruff | 0.15.13, published 2026-05-14 | Python lint/format | Use for backend code quality. [VERIFIED: PyPI registry] |
| TanStack Query | 5.100.11, published 2026-05-18 | Frontend server-state | Use for `/auth/me`, dashboard profile, users, and links API state. [VERIFIED: npm registry] [CITED: TanStack Query docs] |
| react-hook-form | 7.76.0, published 2026-05-16 | Frontend forms | Use for login, privacy acknowledgement, admin user forms, and link forms. [VERIFIED: npm registry] [CITED: react-hook-form docs] |
| Zod | 4.4.3, published 2026-05-04 | Frontend validation schemas | Use for role/status/form validation mirroring backend contracts. [VERIFIED: npm registry] [CITED: Zod docs] |
| lucide-react | 1.16.0, published 2026-05-14 | Icons | UI spec selects lucide-react. [VERIFIED: npm registry] [VERIFIED: 02-UI-SPEC.md] |
| Playwright | 1.60.0, published 2026-05-11 | E2E browser tests | Use for login, privacy gate, role routing, and admin flows. [VERIFIED: npm registry] [CITED: Playwright docs] |
| Vitest | 4.1.7, published 2026-05-20 | Frontend unit tests | Use for route guard and component-level logic. [VERIFIED: npm registry] [CITED: Vitest docs] |
| sonner | 2.0.7, published 2025-08-02 | Toast notifications | UI spec allows toast or sonner; use sonner with shadcn conventions. [VERIFIED: npm registry] [VERIFIED: 02-UI-SPEC.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Argon2id via `argon2-cffi` | bcrypt | bcrypt is acceptable only if Argon2 is impractical; OWASP says Argon2id is first-choice and bcrypt has a 72-byte password limit consideration. [CITED: OWASP Password Storage Cheat Sheet] |
| Opaque DB sessions | JWT access tokens in localStorage | LocalStorage token storage is explicitly forbidden by Phase 2 decisions; DB sessions are revocable and match backend-owned auth. [VERIFIED: 02-CONTEXT.md] |
| PostgreSQL | SQLite | SQLite is simpler but does not match planned stack or long-term relational authorization/reporting needs. [VERIFIED: copilot-instructions.md] |
| shadcn official components | Third-party shadcn registry blocks | Phase 2 UI spec approves only official shadcn components and no third-party registry blocks. [VERIFIED: 02-UI-SPEC.md] |

**Installation:**

```bash
# backend
cd backend
python -m venv .venv
python -m pip install fastapi uvicorn pydantic sqlalchemy alembic psycopg argon2-cffi httpx pytest pytest-asyncio ruff python-multipart

# frontend
cd frontend
npm install next react react-dom typescript tailwindcss shadcn @tanstack/react-query react-hook-form zod lucide-react sonner
npm install -D vitest @playwright/test
```

**Version verification:** Package versions above were checked against PyPI and npm registries during this research. [VERIFIED: PyPI registry] [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
D:\BeYou\
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── me.py
│   │   │   ├── admin_users.py
│   │   │   └── admin_links.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── sessions.py
│   │   │   └── authorization.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── audit.py
│   │   │   ├── users.py
│   │   │   ├── links.py
│   │   │   └── privacy.py
│   │   ├── seeds/
│   │   │   └── demo_seed.py
│   │   └── main.py
│   ├── tests/
│   ├── pyproject.toml
│   └── docker-compose.yml
└── frontend/
    ├── app/
    │   ├── (public)/login/page.tsx
    │   ├── (authenticated)/layout.tsx
    │   ├── (authenticated)/privacy/page.tsx
    │   ├── (authenticated)/student/page.tsx
    │   ├── (authenticated)/teacher/page.tsx
    │   ├── (authenticated)/parent/page.tsx
    │   └── (authenticated)/admin/
    │       ├── page.tsx
    │       ├── users/page.tsx
    │       └── links/page.tsx
    ├── components/
    ├── lib/
    │   ├── api.ts
    │   ├── auth.ts
    │   └── routes.ts
    └── tests/
```

This layout follows FastAPI’s documented pattern of splitting larger applications into routers and modules. [CITED: FastAPI Bigger Applications docs] It also matches Next.js app routing conventions. [CITED: Next.js docs]

### Pattern 1: Backend-Owned Opaque Session Auth

**What:** Store session records server-side and set only a random session ID in a cookie. [VERIFIED: 02-CONTEXT.md] [CITED: OWASP Session Management Cheat Sheet]  
**When to use:** Every authenticated route in Phase 2. [VERIFIED: 02-CONTEXT.md]

Recommended session table fields:

```text
sessions:
- id: UUID / opaque random identifier
- user_id: FK users.id
- created_at
- expires_at
- last_seen_at
- revoked_at nullable
- user_agent_hash nullable
- ip_prefix_hash nullable
- is_demo
```

Do not store session IDs in audit logs or frontend storage. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] [VERIFIED: 02-CONTEXT.md]

### Pattern 2: Deny-by-Default Authorization Function

**What:** Centralize role + relationship + purpose checks in backend code before each protected operation. [VERIFIED: 01-AUTHORIZATION-POLICY.yml]  
**When to use:** All account/profile/link/privacy endpoints and all role portal data endpoints. [VERIFIED: 02-CONTEXT.md]

```python
# Source: Phase 1 authorization policy + FastAPI dependency pattern
def require_permission(actor, resource_type: str, action: str, *, purpose: str, student_id: str | None = None):
    if not actor:
        raise HTTPException(status_code=401)

    if resource_type == "student_adult_link" and actor.role == "admin" and purpose == "admin_operations":
        return

    if student_id and actor.role in {"teacher", "parent"}:
        if not has_active_link(actor.id, student_id, actor.role):
            raise HTTPException(status_code=403)

    raise HTTPException(status_code=403)
```

This should be implemented as a real service with tests rather than scattered `if role == ...` checks. [VERIFIED: 01-AUTHORIZATION-POLICY.yml]

### Pattern 3: Demo Seed as Explicit Command

**What:** Seed deterministic demo users and links only when a dev/demo environment flag allows it. [VERIFIED: 01-DEMO-DATA-POLICY.md]  
**When to use:** Local demo setup, CI fixtures, and MVP demo environments. [VERIFIED: 02-CONTEXT.md]

Recommended demo users:

| Role | Email | Notes |
|---|---|---|
| student | `student.demo@beyou.local` | Fictional name, school, class, linked teacher and parent. [VERIFIED: 02-CONTEXT.md] |
| teacher | `teacher.demo@beyou.local` | Linked to demo student. [VERIFIED: 02-CONTEXT.md] |
| parent | `parent.demo@beyou.local` | Linked to demo student. [VERIFIED: 02-CONTEXT.md] |
| admin | `admin.demo@beyou.local` | Can manage demo accounts and links. [VERIFIED: 02-CONTEXT.md] |

Use fixed non-secret demo passwords only in local/demo fixtures; do not use real credentials. [VERIFIED: 02-CONTEXT.md]

### Pattern 4: Privacy Gate Before Student Dashboard

**What:** After login, student and demo-student users must acknowledge the Phase 1 privacy notice before seeing the dashboard. [VERIFIED: 02-CONTEXT.md] [VERIFIED: 02-UI-SPEC.md]  
**When to use:** First student login or when no acknowledgement exists for the current notice version. [VERIFIED: 02-CONTEXT.md]

Persist:

```text
privacy_acknowledgements:
- id
- user_id
- notice_version
- acknowledged_at
- is_demo
```

Also emit `privacy_acknowledged` audit event with metadata only. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml]

## Database Schema Recommendation

Use the following first migration tables. [VERIFIED: 02-CONTEXT.md] [CITED: SQLAlchemy docs] [CITED: Alembic docs]

| Table | Key Fields | Planning Notes |
|---|---|---|
| `users` | `id`, `email`, `password_hash`, `role`, `status`, `full_name`, `school`, `class_name`, `is_demo`, timestamps | `school` and `class_name` required for student role at validation layer. [VERIFIED: 02-CONTEXT.md] |
| `sessions` | `id`, `user_id`, `expires_at`, `revoked_at`, `last_seen_at`, `is_demo` | Store opaque sessions server-side; cookie holds only session ID. [VERIFIED: 02-CONTEXT.md] |
| `privacy_acknowledgements` | `id`, `user_id`, `notice_version`, `acknowledged_at`, `is_demo` | Required before student dashboard access. [VERIFIED: 02-CONTEXT.md] |
| `student_adult_links` | `id`, `student_id`, `adult_id`, `relationship_type`, `status`, `created_by`, `revoked_by`, timestamps, `is_demo` | `relationship_type` exactly `teacher` or `parent`; active/revoked status. [VERIFIED: 02-CONTEXT.md] |
| `audit_events` | `id`, `actor_id`, `actor_role`, `action`, `resource_type`, `resource_id`, `timestamp`, `reason`, `status`, `metadata_summary`, `is_demo` | Must exclude passwords, tokens, session cookies, raw chat, and raw self-check answers. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] |

Recommended enums:

```text
role = student | teacher | parent | admin
account_status = active | disabled | deleted
relationship_type = teacher | parent
link_status = active | revoked
purpose_key = admin_operations | support_not_surveillance | demo_walkthrough
```

## API Surface Recommendation

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Verify email/password, create session, set cookie. [VERIFIED: 02-CONTEXT.md] |
| `POST` | `/api/auth/logout` | Session | Revoke session and clear cookie. [CITED: OWASP Session Management Cheat Sheet] |
| `GET` | `/api/auth/me` | Session | Return user id, role, status, demo flag, privacy gate status, correct dashboard route. [VERIFIED: 02-UI-SPEC.md] |
| `POST` | `/api/privacy/acknowledgements` | Student session | Store notice acknowledgement and audit event. [VERIFIED: 02-CONTEXT.md] |
| `GET` | `/api/student/profile` | Student session | Return own profile and linked adults. [VERIFIED: 02-UI-SPEC.md] |
| `GET` | `/api/teacher/students` | Teacher session | Return linked students only. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| `GET` | `/api/parent/students` | Parent session | Return linked students only. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| `GET/POST/PATCH` | `/api/admin/users` | Admin session | Manage users, roles, status, basic profile. [VERIFIED: REQUIREMENTS.md] |
| `GET/POST/PATCH` | `/api/admin/links` | Admin session | Create/revoke student-adult links. [VERIFIED: REQUIREMENTS.md] |

## Frontend Route and UX Recommendation

| Route | Surface | Required Behavior |
|---|---|---|
| `/login` | Public login | Only public app surface in Phase 2; no session token in localStorage. [VERIFIED: 02-UI-SPEC.md] |
| `/privacy` | Privacy gate/review | Student/demo-student acknowledgement gate; later access as read-only review link. [VERIFIED: 02-UI-SPEC.md] |
| `/student` | Student dashboard | Shows name, email, school, class, linked adults, demo badge, privacy link. [VERIFIED: 02-UI-SPEC.md] |
| `/teacher` | Teacher dashboard | Shows linked students only; no raw wellbeing/chat/SOS data. [VERIFIED: 02-UI-SPEC.md] |
| `/parent` | Parent dashboard | Shows linked children only; no hidden monitoring language. [VERIFIED: 02-UI-SPEC.md] |
| `/admin` | Admin dashboard | Entry cards and counts for users/links/demo users; no wellbeing reports in Phase 2. [VERIFIED: 02-UI-SPEC.md] |
| `/admin/users` | User management | Create/edit/disable/delete demo-only accounts; role/status visible. [VERIFIED: 02-UI-SPEC.md] |
| `/admin/links` | Link management | Create/revoke active student-teacher/student-parent links. [VERIFIED: 02-UI-SPEC.md] |

Use the exact Phase 2 Vietnamese UI copy for login, privacy gate, role dashboards, admin actions, errors, and destructive confirmations. [VERIFIED: 02-UI-SPEC.md]

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---|---|---|---|
| Password hashing | Custom SHA/hash/salt code | `argon2-cffi` Argon2id | OWASP recommends slow adaptive hashing; SHA-style fast hashes are unsuitable for password storage. [CITED: OWASP Password Storage Cheat Sheet] |
| Session token storage | LocalStorage JWT auth | Server-side opaque sessions with HttpOnly cookie | Phase 2 forbids localStorage tokens and OWASP recommends cookies with security attributes for session IDs. [VERIFIED: 02-CONTEXT.md] [CITED: OWASP Session Management Cheat Sheet] |
| CSRF protection | “SameSite only” as the entire defense | SameSite + Origin/Fetch Metadata checks or CSRF token for mutating requests | OWASP treats SameSite as defense-in-depth and recommends CSRF mitigations for stateful software. [CITED: OWASP CSRF Prevention Cheat Sheet] |
| Authorization | Scattered role checks in route handlers | Central authorization service consuming Phase 1 policy | Phase 1 requires deny-by-default role, relationship, and purpose checks. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| Audit logging | Free-form log messages | Structured metadata-only `audit_events` table | Phase 1 forbids raw sensitive audit fields. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] |
| UI components | Third-party shadcn registry blocks | Official shadcn/ui components only | Phase 2 registry safety allows official components and no third-party blocks. [VERIFIED: 02-UI-SPEC.md] |
| Demo separation | Color-only demo styling | `is_demo` field + banner + `Demo` badge | Phase 1 says demo indicators must not rely only on color. [VERIFIED: 01-DEMO-DATA-POLICY.md] |

**Key insight:** Phase 2’s complexity is authorization and data boundaries, not login form rendering. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] [VERIFIED: 02-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Frontend-only role routing

**What goes wrong:** A teacher or parent can call an API for an unlinked student if the backend trusts frontend navigation. [VERIFIED: 01-AUTHORIZATION-POLICY.yml]  
**How to avoid:** Every protected endpoint must call backend authorization with actor role, resource type, relationship, and purpose. [VERIFIED: 01-AUTHORIZATION-POLICY.yml]

### Pitfall 2: Logging secrets or sensitive content

**What goes wrong:** Passwords, tokens, cookies, raw chat, or self-check answers leak through logs or audit payloads. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml]  
**How to avoid:** Use structured metadata-only audit logs and sanitize request/exception logging. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml]

### Pitfall 3: Demo data mixed with real data

**What goes wrong:** Demo student records appear as real student records, undermining trust and future pilot readiness. [VERIFIED: 01-DEMO-DATA-POLICY.md]  
**How to avoid:** Add `is_demo` to users, sessions, links, acknowledgements, and audit events; show banner and badge. [VERIFIED: 01-DEMO-DATA-POLICY.md]

### Pitfall 4: Admin “delete” breaks future audit history

**What goes wrong:** Physical deletion can orphan future sensitive records and remove accountability context. [VERIFIED: 02-CONTEXT.md]  
**How to avoid:** Soft-delete/disable real accounts; allow physical deletion only for clearly demo-only records if audit intent remains intact. [VERIFIED: 02-CONTEXT.md]

### Pitfall 5: Cookie auth without CSRF planning

**What goes wrong:** Browser automatically sends cookies on requests, so mutating endpoints can be exposed to CSRF if no mitigation exists. [CITED: OWASP Session Management Cheat Sheet] [CITED: OWASP CSRF Prevention Cheat Sheet]  
**How to avoid:** Use SameSite=Lax, verify Origin/Fetch Metadata, and add session-bound CSRF tokens if frontend/API deployment is cross-origin. [CITED: OWASP CSRF Prevention Cheat Sheet]

## Code Examples

### Password Hashing

```python
# Source: argon2-cffi docs + OWASP Password Storage Cheat Sheet
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

password_hasher = PasswordHasher()

def hash_password(plain_password: str) -> str:
    return password_hasher.hash(plain_password)

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, plain_password)
    except VerifyMismatchError:
        return False
```

Use Argon2id through `argon2-cffi`; do not write custom hashing logic. [CITED: argon2-cffi docs] [CITED: OWASP Password Storage Cheat Sheet]

### Secure Session Cookie

```python
# Source: FastAPI response cookies docs + OWASP Session Management Cheat Sheet
response.set_cookie(
    key="__Host-beyou_session",
    value=session_id,
    httponly=True,
    secure=settings.environment == "production",
    samesite="lax",
    path="/",
    max_age=settings.session_max_age_seconds,
)
```

Use `Secure` in production; OWASP recommends Secure, HttpOnly, and explicit SameSite cookie attributes for session cookies. [CITED: FastAPI response cookies docs] [CITED: OWASP Session Management Cheat Sheet]

### Metadata-Only Audit Event

```python
# Source: Phase 1 audit event catalog
audit.record(
    actor_id=admin.id,
    actor_role=admin.role,
    action="student_adult_link_created",
    resource_type="student_adult_link",
    resource_id=str(link.id),
    reason="admin_operations",
    status="success",
    metadata_summary={
        "student_id": str(student.id),
        "adult_id": str(adult.id),
        "relationship_type": link.relationship_type,
        "is_demo": link.is_demo,
    },
    is_demo=link.is_demo,
)
```

Do not include passwords, tokens, session cookies, raw chat content, or full self-check answers. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml]

## Test Strategy

Nyquist validation is explicitly disabled in `.planning/config.json`, so this section is advisory and should not block planning. [VERIFIED: config.json]

### Backend tests

| Area | Required Tests |
|---|---|
| Login | Valid login creates session cookie; invalid login returns generic error; disabled/deleted accounts cannot log in. [VERIFIED: 02-UI-SPEC.md] |
| Passwords | Password hashes are not plaintext; verification succeeds/fails correctly. [CITED: OWASP Password Storage Cheat Sheet] |
| Sessions | `/auth/me` works with valid session; expired/revoked session fails; logout revokes session. [CITED: OWASP Session Management Cheat Sheet] |
| Privacy gate | Student without acknowledgement is gated; acknowledgement persists notice version and emits audit event. [VERIFIED: 02-CONTEXT.md] |
| Authorization | Teacher/parent can view linked students only; wrong role and unlinked access return 403. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| Admin users | Admin can create/edit/disable/soft-delete users; non-admin cannot. [VERIFIED: REQUIREMENTS.md] |
| Links | Admin can create/revoke valid links; invalid role pairings are rejected; link audit events are emitted. [VERIFIED: 02-CONTEXT.md] |
| Demo seed | Seed script creates four demo roles and one linked student-teacher-parent group with `is_demo=true`. [VERIFIED: 02-CONTEXT.md] |

### Frontend tests

| Area | Required Tests |
|---|---|
| Login | Form labels, invalid login copy, disabled submit when fields empty, no localStorage token. [VERIFIED: 02-UI-SPEC.md] |
| Role routing | Student/teacher/parent/admin route to correct portals from backend role. [VERIFIED: 02-UI-SPEC.md] |
| Unauthorized route | Wrong role portal shows Vietnamese unauthorized state and link to correct dashboard. [VERIFIED: 02-UI-SPEC.md] |
| Privacy gate | Student must check acknowledgement before continuing. [VERIFIED: 02-UI-SPEC.md] |
| Demo indicators | Demo banner and `Demo` badge appear and do not rely only on color. [VERIFIED: 01-DEMO-DATA-POLICY.md] |
| Admin management | Create/edit/disable/delete demo user dialogs and link revoke confirmation work. [VERIFIED: 02-UI-SPEC.md] |
| Accessibility | Labels, keyboard navigation, focus-trapped dialogs, 44px touch targets. [VERIFIED: 02-UI-SPEC.md] |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Python | FastAPI backend | Yes | 3.12.7 via `python`; 3.13.7 via `py` | Use `python` 3.12 for consistency. [VERIFIED: environment audit] |
| Node.js | Next.js frontend | Yes | v22.17.0 | None needed. [VERIFIED: environment audit] |
| npm | Frontend package install | Yes | 10.9.2 | None needed. [VERIFIED: environment audit] |
| Git | GSD/document workflow | Yes | 2.52.0.windows.1 | None needed. [VERIFIED: environment audit] |
| Docker | PostgreSQL local service | Yes | 29.4.2; daemon reachable | Use Docker Compose for Postgres. [VERIFIED: environment audit] |
| `psql` | Direct DB shell | No | — | Use Docker exec or application migrations. [VERIFIED: environment audit] |
| `pg_isready` | DB readiness checks | No | — | Use Docker healthcheck or app startup retry. [VERIFIED: environment audit] |
| Redis | Optional cache/rate-limit | No | — | Do not require Redis in Phase 2; use Postgres sessions. [VERIFIED: environment audit] |

**Missing dependencies with no fallback:** None identified for Phase 2 if Postgres runs in Docker. [VERIFIED: environment audit]

**Missing dependencies with fallback:** `psql`, `pg_isready`, and Redis are absent; use Docker/application migrations and avoid Redis in Phase 2. [VERIFIED: environment audit]

## Security Domain

Security enforcement is enabled by default because `.planning/config.json` does not explicitly disable it. [VERIFIED: config.json]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---:|---|
| V2 Authentication | Yes | Email/password with Argon2id, generic login errors, disabled account blocking. [CITED: OWASP ASVS project] [CITED: OWASP Password Storage Cheat Sheet] |
| V3 Session Management | Yes | Server-side opaque sessions, HttpOnly/Secure/SameSite cookies, logout revocation. [CITED: OWASP ASVS project] [CITED: OWASP Session Management Cheat Sheet] |
| V4 Access Control | Yes | Backend deny-by-default role + relationship + purpose checks. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| V5 Input Validation | Yes | Pydantic backend schemas and Zod/react-hook-form frontend validation. [CITED: Pydantic docs] [CITED: Zod docs] |
| V6 Cryptography | Yes | Use established password hashing library; never hand-roll crypto. [CITED: OWASP Password Storage Cheat Sheet] |
| V7 Error Handling and Logging | Yes | Metadata-only audit logs; no secrets or raw sensitive content in logs. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] |
| V8 Data Protection | Yes | Demo/real separation, privacy acknowledgement, minimized adult views. [VERIFIED: 01-DEMO-DATA-POLICY.md] [VERIFIED: 01-DATA-CLASSIFICATION.yml] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Credential stuffing/brute force | Spoofing | Rate-limit login and use generic failure messages. [CITED: OWASP Authentication guidance] |
| Session theft via XSS | Information Disclosure | HttpOnly cookies and no localStorage tokens. [CITED: OWASP Session Management Cheat Sheet] |
| CSRF on admin mutations | Tampering | SameSite=Lax plus Origin/Fetch Metadata or CSRF tokens. [CITED: OWASP CSRF Prevention Cheat Sheet] |
| IDOR on student IDs | Elevation of Privilege | Relationship check for every student-scoped resource. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| Sensitive data leakage in logs | Information Disclosure | Metadata-only audit table and sanitized application logging. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] |
| Demo data mistaken as real | Information Disclosure / Repudiation | `is_demo`, persistent banner, and `Demo` badge. [VERIFIED: 01-DEMO-DATA-POLICY.md] |

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Store JWTs in localStorage | HttpOnly cookie carrying opaque session ID | Reduces token theft exposure and allows server-side revocation. [VERIFIED: 02-CONTEXT.md] [CITED: OWASP Session Management Cheat Sheet] |
| Passwords hashed with fast general-purpose hashes | Argon2id / modern adaptive password hashing | Slows offline cracking and matches OWASP recommendation. [CITED: OWASP Password Storage Cheat Sheet] |
| Frontend route guards as authorization | Backend deny-by-default authorization | Prevents IDOR and privacy bypasses. [VERIFIED: 01-AUTHORIZATION-POLICY.yml] |
| Free-form audit logs | Structured metadata-only audit events | Prevents raw sensitive content from entering audit storage. [VERIFIED: 01-AUDIT-EVENT-CATALOG.yml] |
| Demo-only visual color cue | Text banner + `Demo` badge + `is_demo` metadata | Avoids color-only accessibility and real/demo confusion. [VERIFIED: 01-DEMO-DATA-POLICY.md] |

**Deprecated/outdated for this phase:**

- `localStorage` auth tokens: forbidden by Phase 2 decision. [VERIFIED: 02-CONTEXT.md]
- Self-service email password reset: deferred because external email delivery is out of scope. [VERIFIED: 02-CONTEXT.md]
- Multi-role accounts: deferred to avoid ambiguous portal and authorization behavior. [VERIFIED: 02-CONTEXT.md]
- Adult invite codes or self-claim links: deferred; links are admin-managed in v1. [VERIFIED: 02-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Docker Compose will be acceptable for local PostgreSQL even though `psql` is not installed. [ASSUMED] | Environment Availability | Planner may need to add a PostgreSQL installation task instead of relying on Docker. |
| A2 | The frontend and backend can be scaffolded as sibling `frontend/` and `backend/` directories. [ASSUMED] | Architecture Patterns | Planner may need to choose a different monorepo layout if user has hosting constraints. |

## Resolved Planning Decisions

1. **Real-account physical delete:**  
   - What we know: Context prefers soft delete/disabled status for real accounts and allows physical deletion only for clearly demo-only records. [VERIFIED: 02-CONTEXT.md]  
   - Decision: Plan soft delete for all real accounts; allow physical delete only for `is_demo=true`.

2. **CSRF mitigation:**  
   - What we know: OWASP recommends CSRF mitigations for stateful software, and Phase 2 uses cookie sessions. [CITED: OWASP CSRF Prevention Cheat Sheet]  
   - Decision: Start with SameSite=Lax plus Origin/Fetch Metadata checks; add session-bound CSRF token only if frontend/API deployment becomes cross-origin.

3. **Admin create/change-password path:**  
   - What we know: Email reset is out of scope, but context allows an admin password-reset/change-password path if no email delivery is required. [VERIFIED: 02-CONTEXT.md]  
   - Decision: Include admin-created account password setup for demo/local users only; do not add self-service reset, email reset, or any flow that exposes real credentials in logs, UI, or docs.

## Sources

### Primary / HIGH Confidence

- `D:\BeYou\.planning\phases\02-identity-roles-links-demo-access\02-CONTEXT.md` — locked Phase 2 decisions. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\02-identity-roles-links-demo-access\02-UI-SPEC.md` — approved Phase 2 UI contract. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\01-safety-privacy-policy-foundation\01-AUTHORIZATION-POLICY.yml` — deny-by-default backend authorization. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\01-safety-privacy-policy-foundation\01-AUDIT-EVENT-CATALOG.yml` — metadata-only audit event requirements. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\01-safety-privacy-policy-foundation\01-DEMO-DATA-POLICY.md` — demo marker/banner/seed restrictions. [VERIFIED: file read]
- `D:\BeYou\.planning\phases\01-safety-privacy-policy-foundation\01-DATA-CLASSIFICATION.yml` — account/profile/link sensitivity classes. [VERIFIED: file read]
- PyPI registry — current backend package versions. [VERIFIED: PyPI registry]
- npm registry — current frontend package versions. [VERIFIED: npm registry]
- OWASP Password Storage Cheat Sheet — Argon2id and password hashing guidance. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html]
- OWASP Session Management Cheat Sheet — cookie/session guidance. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html]
- OWASP CSRF Prevention Cheat Sheet — CSRF guidance for stateful software. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html]

### Official Docs / HIGH-MEDIUM Confidence

- FastAPI docs — routers, cookies, response models, SQL database patterns. [CITED: https://fastapi.tiangolo.com/]
- Pydantic docs — validation models. [CITED: https://docs.pydantic.dev/latest/]
- SQLAlchemy docs — ORM model patterns. [CITED: https://docs.sqlalchemy.org/en/20/]
- Alembic docs — migration workflow. [CITED: https://alembic.sqlalchemy.org/en/latest/]
- argon2-cffi docs — Python Argon2 implementation. [CITED: https://argon2-cffi.readthedocs.io/en/stable/]
- Next.js docs — app framework and routing. [CITED: https://nextjs.org/docs]
- shadcn/ui docs — Next.js installation. [CITED: https://ui.shadcn.com/docs/installation/next]
- Tailwind CSS docs — Next.js installation. [CITED: https://tailwindcss.com/docs/installation/framework-guides/nextjs]
- Playwright, Vitest, TanStack Query, react-hook-form, Zod docs — testing/forms/server-state references. [CITED: official docs URLs verified reachable]

### Tertiary / LOW Confidence

- None used as authoritative sources.

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| User constraints | HIGH | Directly read Phase 2 context and Phase 1 policy artifacts. |
| Standard stack | HIGH | Project stack is already planned and package versions were verified against registries. |
| Architecture | HIGH | Matches FastAPI, Next.js, Phase 1 contracts, and Phase 2 UI contract. |
| Security | HIGH | Backed by Phase 1 contracts and OWASP cheat sheets. |
| Environment | HIGH | Local tools were probed directly. |
| Exact implementation details | MEDIUM | Schema/route names are recommended by research but left to planner discretion. |

**Research date:** 2026-05-20  
**Valid until:** 2026-06-19 for stack direction; re-check package versions immediately before implementation.

## RESEARCH COMPLETE
