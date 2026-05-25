# Phase 30: Identity Foundation & Auth Contracts - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-selected AI defaults

<domain>
## Phase Boundary

Phase 30 prepares Peerlight AI for a future production school OAuth/SSO integration while preserving the current backend-owned email/password and demo login model. It should add provider-readiness metadata, an OAuth/SSO-ready external identity mapping contract, safe auth-method session metadata, and UI/API visibility needed by operators.

This phase does **not** implement a full OAuth/OIDC/SAML login callback, SCIM provisioning, multi-school tenancy, automatic role/group authorization from IdP claims, MFA, or password-reset flows. Those remain future work unless a real pilot school provider is selected.

</domain>

<decisions>
## Implementation Decisions

### Auth provider readiness
- **D-01:** Add metadata-only auth provider readiness to admin operations, not a public secret-bearing config surface.
- **D-02:** Provider readiness should be static/config-derived in this phase: configured/enabled state, provider label, mode, and last check/status should be safe strings or booleans only. No outbound IdP discovery/network check is required yet.
- **D-03:** Provider config may include placeholder fields needed to prove the contract, but secrets, client secrets, raw issuer secrets, tokens, and full callback payloads must not be exposed in readiness, operations, logs, tests, or frontend state.

### External identity mapping
- **D-04:** Add a backend-owned external identity mapping contract keyed by provider plus subject, linked to an existing internal user. Do not auto-create privileged users from claims.
- **D-05:** Do not rely on unverified email auto-merge. Verified email can be stored or surfaced only as safe metadata/hashes for review, never as the sole linking authority.
- **D-06:** Unknown, unlinked, disabled, or deprovisioned external identities should resolve to safe denial or pending-review states, not automatic app access.
- **D-07:** Store only the minimum identity metadata required for linking/audit, such as provider key, subject hash, status, linked user id, timestamps, and safe display labels. Avoid raw claims, raw tokens, full emails, school/class claim dumps, or provider payloads.

### Shared session/auth contract
- **D-08:** All auth methods must converge on the existing backend session-cookie model: create/revoke server sessions, set HttpOnly cookies, and let frontend use `credentials: include`; no browser token storage.
- **D-09:** Extend session/auth metadata to record safe auth method/provider fields for email/password, demo password, and future SSO without exposing provider tokens or raw identifiers.
- **D-10:** Continue using one user response path (`LoginResponse` / `/api/auth/me`) so account status, privacy acknowledgement requirements, notice version, and role dashboard routing stay consistent across auth methods.

### Demo and password coexistence
- **D-11:** Preserve existing email/password login for local demo, public demo, and non-demo admin/operator use.
- **D-12:** Preserve seeded demo login in `local_demo` and `public_demo`, while production pilot can disable demo login and public demo entry safely.
- **D-13:** Add a safe auth capability/config metadata path if needed so the login UI can hide or disable demo role entry in production pilot without leaking secrets or raw deployment config.

### Authorization and privacy boundaries
- **D-14:** External identity claims, school/class metadata, provider groups, or email domains must never grant adult student visibility.
- **D-15:** App-owned role, active account status, active relationship, and student-sent SOS remain the source of authorization truth.
- **D-16:** Session revocation and disabled/deleted account handling must apply equally to password and future SSO sessions.
- **D-17:** Student privacy acknowledgement routing remains mandatory for student sessions regardless of auth method.

### Operations UI and metadata
- **D-18:** Use the admin operations dashboard as the UI anchor for provider readiness and identity contract metadata, following Phase 28/29 metadata-only panel patterns.
- **D-19:** Show counts/statuses/labels only: enabled state, provider mode/label, mapping status buckets, session auth-method buckets, and safe remediation. Do not add raw identity exports, claim drilldowns, token viewers, or per-student identity browsing.
- **D-20:** Keep operations UI backward-compatible with partial/older dashboard payloads using safe default arrays/objects where needed, as established by the Phase 29 regression fix.

### the agent's Discretion
- Choose exact table/model names (`ExternalIdentity`, `AuthIdentity`, etc.), enum names, and migration identifiers that fit current SQLAlchemy/Alembic conventions.
- Choose whether provider subject is stored as a hash-only value or with a separate safe display key, as long as raw identifiers do not leak to operations/frontend.
- Choose exact auth provider settings names and readiness key names that fit `Settings`, readiness, and admin operations patterns.
- Choose the minimal UI card layout and test fixtures that preserve existing operations page style.
- Choose the test split across backend auth/session/model tests and frontend operations/auth UI tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 30 goal, dependency on Phase 28, success criteria, and v1.5 phase sequence.
- `.planning/REQUIREMENTS.md` — IDENT-01 through IDENT-07 acceptance criteria.
- `.planning/PROJECT.md` — product privacy principles, support-not-surveillance constraints, and validated v1.5 runtime/deploy decisions.

### v1.5 research and prior phase decisions
- `.planning/research/SUMMARY.md` — identity scope recommendation and OAuth/SSO deferral boundary.
- `.planning/research/ARCHITECTURE.md` — backend-owned auth/session architecture, provider mapping guidance, and no-browser-token requirement.
- `.planning/research/PITFALLS.md` — identity pitfalls: duplicate users, over-privileged claims, skipped privacy/status gates, and adult visibility broadening.
- `.planning/phases/28-runtime-mode-production-readiness-foundation/28-CONTEXT.md` — runtime modes, production-pilot readiness, demo-login policy, and identity placeholder boundary.
- `.planning/phases/29-deployment-guardrails-smoke-profiles/29-VERIFICATION.md` — verified deployment/smoke foundation that Phase 30 must preserve.

### Existing implementation references
- `backend/app/core/config.py` — current `Settings`, runtime mode, demo-login flags, cookie/origin settings.
- `backend/app/api/auth.py` — password login, demo-login denial, production-pilot auth config guard, shared login response.
- `backend/app/api/me.py` — `/api/auth/me` response path reused by active sessions.
- `backend/app/core/sessions.py` — server-side session creation, revocation, loading, cookie setting, CSRF/same-site mutation guard.
- `backend/app/core/authorization.py` — app-owned role, active relationship, SOS-gated adult visibility, and deny-by-default permission model.
- `backend/app/db/models.py` — `User`, `Session`, role/status enums, links, privacy acknowledgement, and current schema patterns.
- `backend/app/schemas/auth.py` — `LoginRequest`, `UserSessionResponse`, and `LoginResponse` frontend-facing auth contract.
- `backend/app/schemas/admin_operations.py` — metadata-only operations dashboard response pattern.
- `backend/app/services/admin_operations.py` — operations sanitization, runtime/deploy metadata builders, and forbidden metadata keys.
- `backend/tests/test_auth_privacy_portals.py` — existing auth/session/demo/pilot regression patterns.
- `frontend/lib/auth.ts` — cookie-authenticated auth client, `AuthUser` shape, no browser token storage.
- `frontend/app/login/page.tsx` — email/password login and demo role entry UI.
- `frontend/app/(authenticated)/layout.tsx` — `/api/auth/me`, role dashboard routing, privacy acknowledgement redirect, and logout flow.
- `frontend/app/(authenticated)/admin/operations/page.tsx` — reusable admin operations panel/card pattern and partial-payload fallback behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Settings` (`backend/app/core/config.py`): add provider-readiness and future SSO contract settings here.
- `create_session`, `load_session`, `revoke_session`, `get_current_user` (`backend/app/core/sessions.py`): centralize all auth methods on the current cookie session model.
- `_login_response()` (`backend/app/api/auth.py`): reuse for password and future SSO paths so privacy acknowledgement and role routing stay identical.
- `require_permission()` (`backend/app/core/authorization.py`): keep external identity data out of authorization decisions.
- `AdminOperationsDashboardResponse` and builders: extend with identity/auth provider metadata using safe schemas.
- Existing frontend `apiFetch` + `credentials: include` pattern: keep auth frontend token-free.

### Established Patterns
- Backend routers stay thin and delegate to services/helpers.
- SQLAlchemy models live in `backend/app/db/models.py`; migrations live under `backend/alembic/versions`.
- Pydantic schemas define API response contracts under `backend/app/schemas`.
- Admin operations responses expose status/count/boolean metadata only and sanitize forbidden fields.
- Tests use targeted pytest fixtures plus frontend Vitest fixtures to lock privacy and no-token behavior.
- English machine keys plus Vietnamese user/operator copy is acceptable.

### Integration Points
- Add identity provider metadata to `Settings`, readiness/admin operations services, and admin operations schemas.
- Add external identity mapping model/migration and service helpers that resolve linked/pending/disabled/deprovisioned identities without creating users automatically.
- Extend session creation/model metadata for auth method/provider while keeping cookies HttpOnly and backend-owned.
- Extend `UserSessionResponse` / `AuthUser` only with safe fields if frontend needs them.
- Add login/auth capability metadata for hiding demo role entry in production pilot if needed.
- Add backend tests for mapping safety, no email auto-merge, session metadata, disabled/deprovisioned denial, account status/session revocation/privacy routing, and adult visibility boundaries.
- Add frontend tests for no browser token storage, demo entry visibility/copy, operations identity metadata, and safe absence of raw provider/user identifiers.

</code_context>

<specifics>
## Specific Ideas

- Phase 30 should feel like a safe contract/foundation phase, not a full SSO provider launch.
- Prefer provider labels and status buckets over raw issuer/client/subject/email display in UI.
- Keep current public demo login usable unless runtime/auth metadata says demo entry is disabled.
- Maintain the existing student-first Vietnamese UX: denial/pending messages should be safe, calm, and non-technical.

</specifics>

<deferred>
## Deferred Ideas

- Full OAuth/OIDC redirect/callback implementation — future work after a pilot school selects a provider.
- SAML, SCIM, district provisioning, automatic group-to-role mapping, and multi-school tenancy — future milestones.
- MFA, password reset, email verification, and enterprise IdP discovery UX — useful later but outside Phase 30.
- Admin raw identity claim inspection or identity exports — intentionally out of scope because they conflict with metadata-only operations.

</deferred>

---

*Phase: 30-identity-foundation-auth-contracts*
*Context gathered: 2026-05-25*
