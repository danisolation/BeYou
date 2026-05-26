# Phase 30: Identity Foundation & Auth Contracts - Research

**Researched:** 2026-05-25
**Domain:** Backend-owned authentication/session contracts, future OAuth/SSO identity mapping, metadata-only operations UI
**Confidence:** HIGH for repository architecture; MEDIUM for future OAuth/OIDC naming because no real identity provider is selected.

<user_constraints>

## User Constraints

### Locked Decisions

- Add metadata-only auth provider readiness to admin operations; no client IDs, raw URLs, raw claims, secrets, tokens, or exports.
- Add provider + subject external identity mapping linked to an existing internal user; do not auto-merge on unverified email.
- Unknown, unlinked, disabled, or deprovisioned external identities must deny or enter pending-review behavior; never privileged auto-create.
- Preserve existing backend-owned HttpOnly cookie sessions and extend safe auth method/provider metadata.
- Preserve email/password and demo login in demo modes; production pilot can disable public demo entry/login.
- External identity claims, school/class metadata, and provider groups never authorize adult visibility; app role + active relationship + student SOS remain authoritative.
- Operations UI shows safe provider, mapping, and session buckets only.

### The Agent's Discretion

- Choose exact table/model names, enum names, and migration identifiers that fit current SQLAlchemy/Alembic conventions.
- Choose whether provider subject is hash-only or has a separate safe display key, as long as raw identifiers do not leak to operations/frontend.
- Choose exact auth provider settings names and readiness key names that fit `Settings`, readiness, and admin operations patterns.
- Choose minimal UI card layout and test fixtures that preserve the existing operations page style.
- Choose the test split across backend auth/session/model tests and frontend operations/auth UI tests.

### Deferred Ideas

- Full OAuth/OIDC redirect/callback implementation.
- SAML, SCIM, district provisioning, automatic group-to-role mapping, and multi-school tenancy.
- MFA, password reset, email verification, and enterprise IdP discovery UX.
- Admin raw identity claim inspection or identity exports.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| IDENT-01 | Admin/operator can see configured auth provider readiness using metadata-only fields. | Extend `Settings`, readiness, admin operations schemas/services. |
| IDENT-02 | Backend supports provider+subject mapping to internal user without unverified email auto-merge. | Add `ExternalIdentity` model/migration with provider key + subject hash unique constraint. |
| IDENT-03 | Email/password and demo login continue in demo/local; production pilot can disable demo entry safely. | Existing `login()` already blocks demo users when production pilot or `ALLOW_DEMO_LOGIN=false`. |
| IDENT-04 | Sessions record safe auth metadata and use backend-owned HttpOnly cookies with no browser token storage. | Extend `Session` with `auth_method`, `auth_provider_key`; keep `apiFetch(credentials: "include")`. |
| IDENT-05 | All auth methods enforce status, revocation, privacy acknowledgement, role routing through one contract. | Reuse `_login_response()`, `/api/auth/me`, and `get_current_user()`. |
| IDENT-06 | External claims/groups never grant adult visibility. | Keep `require_permission()` based on app role + active relationship + SOS. |
| IDENT-07 | Unknown/unlinked/disabled/deprovisioned identities deny or pending-review without privileged auto-create. | Add resolver statuses; no user creation path in Phase 30. |

</phase_requirements>

## Summary

Phase 30 should be implemented as a contract/foundation phase, not a real OAuth/OIDC launch. The safest plan is to add static/config-derived provider readiness, a backend-owned external identity mapping table, safe auth method/provider metadata on sessions, and metadata-only operations UI panels.

The existing architecture already has the right center of gravity: `backend/app/api/auth.py` owns login response shape, `backend/app/core/sessions.py` owns opaque HttpOnly cookie sessions, `/api/auth/me` reuses `_login_response()`, and `backend/app/core/authorization.py` enforces app-owned adult visibility boundaries.

Primary recommendation: implement Phase 30 in four waves:

1. Schema and session metadata.
2. Identity resolver contract.
3. Readiness and operations metadata.
4. Frontend UI/tests and regression gates.

## Project Constraints

- Communicate with the user in Vietnamese.
- Backend stack is Python/FastAPI with SQLAlchemy/Alembic/PostgreSQL.
- Frontend stack is Next.js/React/TypeScript.
- Auth must remain cookie-authenticated with no browser token storage.
- Operations surfaces must stay metadata-only and must not expose raw exports, risk leaderboards, per-student drilldowns, secrets, notes, transcripts, or raw sensitive data.
- Teacher/parent visibility remains SOS-only for linked students.
- No new runtime dependency is required for Phase 30.

## Current Architecture Summary

### Backend files/functions to reuse

- `backend/app/api/auth.py`
  - `login()` validates password, account status, demo login policy, production-pilot cookie/origin safety, then calls `create_session()`.
  - `_login_response()` returns shared `LoginResponse` fields including privacy acknowledgement and dashboard route.
- `backend/app/api/me.py`
  - `/api/auth/me` returns `_login_response(db, current_user)`.
- `backend/app/core/sessions.py`
  - `create_session()` creates opaque session token, stores `token_hash`, sets HttpOnly cookie.
  - `get_current_user()` rejects missing/revoked/expired sessions and revokes if user is not active.
- `backend/app/db/models.py`
  - `User`, `Session`, `AccountStatus`, `UserRole`, `StudentAdultLink`, and `PrivacyAcknowledgement` are the identity/session base.
- `backend/app/core/authorization.py`
  - Adult support visibility requires app role, active link, and student SOS for support-not-surveillance reads.
- `backend/app/services/readiness.py`
  - Existing static readiness includes `identity_configuration`, currently tied to demo-login policy. Extend here.
- `backend/app/schemas/admin_operations.py` and `backend/app/services/admin_operations.py`
  - Existing dashboard is metadata-only with privacy notes, buckets, and sanitization. Extend here.

### Frontend files/types to reuse

- `frontend/lib/api.ts` always calls `fetch(..., credentials: "include")`.
- `frontend/lib/auth.ts` has `AuthUser`, `login()`, `getCurrentUser()`, and no token storage.
- `frontend/app/login/page.tsx` renders demo role shortcuts and email/password form.
- `frontend/app/(authenticated)/layout.tsx` handles `/api/auth/me`, privacy redirect, role mismatch, dashboard routing, and logout.
- `frontend/lib/admin-operations-api.ts` defines dashboard response types.
- `frontend/app/(authenticated)/admin/operations/page.tsx` renders metadata panels and tolerates partial arrays via fallbacks.

## Recommended Plan Decomposition / Waves

### Wave 1 - Backend schema + session metadata

1. Add constants/enums for auth methods: `password`, `demo_password`, and future `sso`.
2. Add nullable `Session.auth_method`, `Session.auth_provider_key`, and optionally `Session.external_identity_id`.
3. Update `create_session(db, user, response, settings, auth_method="password", auth_provider_key="local")`.
4. Add an Alembic migration after the current latest migration.

### Wave 2 - External identity mapping contract

1. Add model `ExternalIdentity` with:
   - `id`
   - `provider_key`
   - `provider_subject_hash`
   - `linked_user_id`
   - `status`: `linked`, `pending_review`, `disabled`, `deprovisioned`
   - optional safe metadata: `provider_label`, `email_verified`, `email_hash`, `display_label`
   - timestamps.
2. Add unique constraint on `(provider_key, provider_subject_hash)`.
3. Add helper/service such as `resolve_external_identity(db, provider_key, subject, email_verified=None)` returning safe statuses and never creating users.
4. Tests must prove unknown/unlinked/disabled/deprovisioned identities deny or enter pending review.

### Wave 3 - Provider readiness + operations metadata

1. Extend `Settings` with static safe fields:
   - `AUTH_PROVIDER_ENABLED`
   - `AUTH_PROVIDER_KEY`
   - `AUTH_PROVIDER_LABEL`
   - `AUTH_PROVIDER_MODE`
   - optionally `AUTH_PROVIDER_LAST_CHECK_STATUS` as a static placeholder.
2. Extend `evaluate_static_readiness_checks()` so `identity_configuration` reflects provider readiness and demo-login safety without exposing client IDs, secrets, issuer URLs, callback URLs, claims, or tokens.
3. Add `AuthProviderReadinessSummary`, `ExternalIdentityMappingSummary`, and `SessionAuthSummary` schemas to `admin_operations.py`.
4. Add operations buckets:
   - provider enabled/mode/status
   - mappings by status
   - sessions by auth method/provider
   - safe remediation text.

### Wave 4 - Frontend UI/types/tests

1. Extend `AdminOperationsDashboard` type with optional identity/auth fields and default to empty arrays/safe empty objects.
2. Add operations panels: "Auth provider readiness", "Identity mapping buckets", and "Session auth methods".
3. Add login UI capability metadata only if needed to hide demo entry in production pilot.
4. Add Vitest regression coverage for no raw identifiers, no exports, no browser tokens, and fallback behavior.

## Required Schema / Model Changes

| Change | File | Migration/Test Implication |
|---|---|---|
| Add session auth metadata | `backend/app/db/models.py::Session` | Alembic migration; update session creation tests. |
| Add external identity mapping table | `backend/app/db/models.py` | Alembic migration; model tests; resolver tests. |
| Add provider readiness settings | `backend/app/core/config.py` | Settings validation tests; readiness tests. |
| Add operations dashboard response fields | `backend/app/schemas/admin_operations.py` | Backend response tests + frontend type/tests. |

Recommended model name: `ExternalIdentity`. Recommended enum: `ExternalIdentityStatus`.

Recommended privacy-safe subject storage: store `provider_subject_hash = sha256(f"{provider_key}:{subject}:{server_secret}")` if a backend secret/pepper is available; otherwise at minimum hash provider+subject and never return raw subject.

## Backend API / Session / Auth Contract Design Considerations

- Do not add browser token exchange, OAuth callback, access-token storage, or localStorage/sessionStorage writes in Phase 30.
- Keep all successful auth paths converging on `create_session()` and `_login_response()`.
- Extend session metadata at creation time only with safe values: method/provider keys, not raw IdP subject, email, claims, groups, or tokens.
- For future SSO resolver, return safe outcomes:
  - `linked_active_user`
  - `pending_review`
  - `disabled_identity`
  - `deprovisioned_identity`
  - `linked_user_inactive`
  - `unknown_identity`
  without creating privileged accounts.
- Account status must still be checked by `get_current_user()`, and disabled/deleted users should revoke existing sessions.

## Operations Metadata Shape

Recommended addition to `AdminOperationsDashboardResponse`:

```python
class AuthProviderReadinessSummary(BaseModel):
    enabled: bool
    provider_key: str
    provider_label: str
    mode: str
    status: str
    last_check_status: str | None = None
    remediation: str | None = None

class IdentityMappingOperationsSummary(BaseModel):
    by_status: list[OperationCountBucket]
    pending_review_count: int
    disabled_count: int
    deprovisioned_count: int

class SessionAuthOperationsSummary(BaseModel):
    by_auth_method: list[OperationCountBucket]
    by_provider: list[OperationCountBucket]
```

Forbidden in operations/readiness/frontend: raw subject, raw email, raw claims, issuer/client secret, callback URL payloads, tokens, per-student identity drilldowns, exports.

## Frontend Admin Operations Implications

- Extend `frontend/lib/admin-operations-api.ts` with optional fields to preserve backward compatibility.
- Add one or more panels in `frontend/app/(authenticated)/admin/operations/page.tsx`.
- UI copy should stay Vietnamese, calm, and operational: for example, "San sang nha cung cap dang nhap" and "Lien ket danh tinh dang cho duyet" if the file uses ASCII-only strings; otherwise follow existing Vietnamese copy style.
- Tests should mirror `phase11-operations-ui.test.tsx` and `phase25-admin-policy-operations-ui.test.tsx`: render metadata, assert credentials include, assert no `RAW_`, email, token, subject, export, drilldown.

## Do Not Build

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| Browser auth persistence | localStorage/sessionStorage tokens | Existing HttpOnly opaque session cookie | Current contract and tests require no browser token storage. |
| Authorization from IdP groups | claim-to-role visibility | `require_permission()` app role + link + SOS | Prevents adult visibility expansion. |
| Raw identity inspection UI | claim viewer/export | status/count/label buckets | Metadata-only operations constraint. |
| User auto-provisioning | create privileged user from claims/email | pending-review/deny resolver | IDENT-07 forbids privileged auto-create. |
| Email auto-merge | match on unverified email | explicit provider+subject mapping | IDENT-02 forbids unverified email merge. |

## Common Pitfalls

1. Adding OAuth-like browser tokens too early.
   - Avoid by keeping Phase 30 contract-only and cookie-session-only.
2. Leaking raw provider identifiers in operations.
   - Avoid by hashing subject and exposing only counts/status/labels.
3. Treating provider groups as authorization.
   - Avoid by keeping `authorization.py` as source of truth.
4. Breaking demo login while adding pilot controls.
   - Preserve local/public demo behavior; only hide/disable demo entry when safe metadata says production pilot disallows it.
5. Forking `/api/auth/me` contract.
   - Avoid by reusing `_login_response()` for all auth methods.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Python | Backend tests/migrations | yes | 3.12.7 | none |
| Node | Frontend tests/build | yes | v22.17.0 | none |
| npm | Frontend scripts | yes | 10.9.2 | none |
| Alembic | DB migration | yes | 1.18.4 | none |
| pytest | Backend tests | yes | 8.4.2 | none |
| git | Verification/history | yes | 2.52.0.windows.1 | none |

## Validation Architecture

`workflow.nyquist_validation` is explicitly false; skip dedicated Nyquist validation artifacts.

Concrete commands to use after execution:

```powershell
Set-Location D:\BeYou\backend
python -m pytest tests\test_auth_privacy_portals.py -q
python -m pytest tests\test_phase7_readiness.py tests\test_phase25_admin_policy_operations.py -q
python -m pytest tests\test_authorization_security.py -q
python -m ruff check .

Set-Location D:\BeYou\frontend
npm run test -- --run tests\no-token-storage.test.ts
npm run test -- --run tests\auth-portals.test.tsx
npm run test -- --run tests\phase11-operations-ui.test.tsx tests\phase25-admin-policy-operations-ui.test.tsx
npm run lint
npm run build
```

## Security Domain

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | yes | Password/demo login plus future external identity resolver through backend session. |
| V3 Session Management | yes | Opaque HttpOnly cookie sessions with server-side revocation. |
| V4 Access Control | yes | Backend `require_permission()` role/link/SOS checks. |
| V5 Input Validation | yes | Pydantic request/response schemas. |
| V6 Cryptography | yes | Existing password hashing; subject hashing recommended for identity mapping. |

Known threat patterns:

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Token theft via browser storage | Information Disclosure | No browser token storage; HttpOnly cookie. |
| Privilege escalation via IdP groups | Elevation of Privilege | Ignore claims for adult visibility. |
| Account takeover via email auto-merge | Elevation of Privilege | Explicit provider+subject mapping; no unverified email merge. |
| Operations data leakage | Information Disclosure | Metadata-only buckets and sanitizer forbidden keys. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Exact model/enum names should be `ExternalIdentity`, `ExternalIdentityStatus`. | Schema/model changes | Low; naming can change in plan. |
| A2 | Provider subject should be hash-only, ideally with a server-side secret. | Schema/model changes | Medium; if no suitable secret exists, planner must choose stable hashing. |
| A3 | Resolver status names such as `pending_review` and `deprovisioned_identity` are recommended. | Backend design | Low; names can change if tests lock semantics. |

## Open Questions (RESOLVED)

1. Should Phase 30 expose a public `/api/auth/capabilities` endpoint for login UI demo visibility, or include it in existing readiness/operations only?
   - RESOLVED: include a minimal public-safe `/api/auth/capabilities` endpoint because the login UI needs to hide demo entry in production pilot. The endpoint returns only safe booleans/labels/modes and never exposes provider keys, client IDs, issuer/callback URLs, raw domains, secrets, tokens, cookies, or password hashes.
2. Should `UserSessionResponse` include auth method/provider?
   - RESOLVED: do not include auth method/provider in `UserSessionResponse` unless a future UI task explicitly needs it. Auth method/provider metadata remains operations-only by default; `/api/auth/me` and `LoginResponse` keep the shared account status, privacy acknowledgement, notice version, and dashboard route contract.

## Sources

- `.planning/phases/30-identity-foundation-auth-contracts/30-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `copilot-instructions.md`
- `backend/app/api/auth.py`
- `backend/app/api/me.py`
- `backend/app/core/sessions.py`
- `backend/app/core/authorization.py`
- `backend/app/db/models.py`
- `backend/app/core/config.py`
- `backend/app/services/readiness.py`
- `backend/app/services/admin_operations.py`
- `backend/app/schemas/admin_operations.py`
- `frontend/lib/api.ts`
- `frontend/lib/auth.ts`
- `frontend/app/login/page.tsx`
- `frontend/app/(authenticated)/layout.tsx`
- `frontend/app/(authenticated)/admin/operations/page.tsx`

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH.
- Architecture: HIGH.
- Pitfalls/security: HIGH for locked constraints; MEDIUM for future IdP resolver internals because no real provider is selected.

**Research date:** 2026-05-25
**Valid until:** 2026-06-24 for repo architecture; revisit when a real school IdP is selected.

