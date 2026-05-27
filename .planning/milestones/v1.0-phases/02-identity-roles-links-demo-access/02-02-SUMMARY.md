---
phase: 02-identity-roles-links-demo-access
plan: 02
subsystem: backend-auth
tags: [fastapi, auth, sessions, csrf, cors, privacy, authorization]

requires:
  - phase: 02-identity-roles-links-demo-access
    plan: 01
    provides: FastAPI backend scaffold and identity schema
provides:
  - Backend-owned email/password login and logout APIs
  - HttpOnly opaque session cookie backed by hashed DB session tokens
  - Authenticated current-user and backend dashboard route metadata
  - Privacy acknowledgement persistence and student privacy gate
  - Student, teacher, and parent portal data APIs limited by active links
  - Exact-origin credentialed CORS and CSRF request checks
affects: [phase-02-frontend-foundation, phase-02-demo-seed-admin, phase-03-student-features]

tech-stack:
  added: [argon2-cffi, FastAPI routers, Pydantic schemas, SQLAlchemy auth services]
  patterns: [opaque-session-cookie, hashed-session-token, deny-by-default-authorization, privacy-gated-student-dashboard, exact-origin-cors]

key-files:
  created:
    - backend/app/core/security.py
    - backend/app/core/sessions.py
    - backend/app/core/authorization.py
    - backend/app/services/audit.py
    - backend/app/services/privacy.py
    - backend/app/api/auth.py
    - backend/app/api/me.py
    - backend/app/api/privacy.py
    - backend/app/api/student.py
    - backend/app/api/teacher.py
    - backend/app/api/parent.py
    - backend/app/schemas/auth.py
    - backend/app/schemas/profile.py
    - backend/tests/test_authorization_security.py
    - backend/tests/test_auth_privacy_portals.py
  modified:
    - backend/app/main.py
    - backend/app/core/config.py
    - backend/app/db/models.py
    - backend/tests/test_schema_models.py

key-decisions:
  - "Use random opaque cookie tokens and store only SHA-256 token hashes in the sessions table."
  - "Require exact configured Origin or same-site Fetch Metadata for state-changing requests."
  - "Return privacy_acknowledgement_required plus notice_version from /api/auth/me and return 409 privacy_ack_required for gated student dashboard data."
  - "Keep login rate limiting in-process for the MVP plan, but key by both email and email+IP to reduce IP rotation bypass."

patterns-established:
  - "Backend returns role dashboard route instead of relying on frontend role guesses."
  - "Teacher/parent portal endpoints only query active student_adult_links and do not expose raw wellbeing data."
  - "Audit metadata validation rejects forbidden secret and raw-sensitive keys recursively."

requirements-completed: [AUTH-01, AUTH-03, AUTH-04]

duration: 54 min
completed: 2026-05-20
---

# Phase 02 Plan 02: Auth, Privacy, and Portal API Summary

**Backend-owned authentication and role portal API foundation is complete.**

## Performance

- **Duration:** 54 min
- **Started:** 2026-05-20T10:18:00Z
- **Completed:** 2026-05-20T11:12:00Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments

- Added Argon2 password hashing/verification and generic invalid-login responses.
- Added login throttling before password verification with five failed attempts per five-minute window.
- Added DB-backed opaque sessions using HttpOnly cookies and hashed session tokens.
- Added backend authorization helpers with deny-by-default role and active relationship checks.
- Added exact-origin CORS and CSRF checks for mutating cookie-auth requests.
- Added `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/privacy/acknowledgements`, `/api/student/profile`, `/api/teacher/students`, and `/api/parent/students`.
- Added privacy acknowledgement gating for student dashboard data.
- Added tests for security controls, auth flows, role routing, privacy acknowledgement, CORS, CSRF, and linked-only adult portal data.

## Task Commits

1. **Task 1: Security controls, sessions, authorization, and audit service** - `b98019e` (feat)
2. **Task 2: Auth, privacy, current-user, and role portal APIs** - `64c4c22` (feat)

## Files Created/Modified

- `backend/app/core/security.py` - Argon2 hashing and login rate limiter.
- `backend/app/core/sessions.py` - Opaque session token creation, cookie handling, current-user dependency, and CSRF helper.
- `backend/app/core/authorization.py` - Deny-by-default role and relationship authorization.
- `backend/app/services/audit.py` - Metadata-only audit event recorder with forbidden key validation.
- `backend/app/services/privacy.py` - Current notice version and privacy acknowledgement service.
- `backend/app/api/*.py` - Auth, current-user, privacy, student, teacher, and parent routers.
- `backend/app/schemas/*.py` - Auth/session and profile response schemas.
- `backend/alembic/versions/20260520_0002_session_token_hash.py` - Migration adding `sessions.token_hash`.
- `backend/tests/test_authorization_security.py` and `backend/tests/test_auth_privacy_portals.py` - Security and API behavior tests.

## Decisions Made

- Stored only a hash of the browser session token in the database so a leaked session row ID is not a bearer credential.
- Enforced `__Host-` session cookie guard through settings and cookie tests while keeping `beyou_session` usable on HTTP localhost.
- Made `/api/auth/me` the frontend source of truth for `dashboard_route` and privacy acknowledgement status.
- Returned no unlinked student data from teacher/parent endpoints instead of exposing a specific unlinked-resource endpoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Security hardening] Hashed session cookie tokens instead of using session IDs as bearer tokens**
- **Found during:** Rubber-duck pre-implementation critique
- **Issue:** Using `sessions.id` directly as the cookie value would make the DB primary key an active bearer token.
- **Fix:** Added random token generation, `sessions.token_hash`, and lookup by token hash.
- **Files modified:** `backend/app/db/models.py`, `backend/app/core/sessions.py`, `backend/alembic/versions/20260520_0002_session_token_hash.py`
- **Verification:** `python -m alembic upgrade head`; backend auth/security tests pass.
- **Committed in:** `b98019e`

---

**2. [Security hardening] Tightened CSRF contract for mutating requests**
- **Found during:** Rubber-duck pre-implementation critique
- **Issue:** Allowing mutating requests with neither `Origin` nor safe Fetch Metadata leaves ambiguous browser/client cases.
- **Fix:** Mutating requests now require exact configured `Origin` or same-site Fetch Metadata, and reject cross-site/none fetch metadata.
- **Files modified:** `backend/app/core/sessions.py`, `backend/tests/test_auth_privacy_portals.py`
- **Verification:** CSRF bad-origin tests pass.
- **Committed in:** `b98019e`, `64c4c22`

---

**3. [Reliability hardening] Throttled session last-seen writes**
- **Found during:** Rubber-duck pre-implementation critique
- **Issue:** Updating `last_seen_at` on every authenticated request would add unnecessary DB writes.
- **Fix:** `last_seen_at` is updated only when stale by more than 60 seconds.
- **Files modified:** `backend/app/core/sessions.py`
- **Committed in:** `b98019e`

---

**Total deviations:** 3 auto-fixed security/reliability hardenings
**Impact on plan:** The API surface remains the same, with stronger session and CSRF behavior than originally specified.

## Issues Encountered

- No blocking implementation issues after the Plan 02-01 database port fix.

## User Setup Required

None - existing local PostgreSQL Compose service remains sufficient.

## Next Phase Readiness

Auth/session/privacy APIs are ready for Plan 02-03 demo seed and admin user/link management APIs.

---
*Phase: 02-identity-roles-links-demo-access*
*Completed: 2026-05-20*
