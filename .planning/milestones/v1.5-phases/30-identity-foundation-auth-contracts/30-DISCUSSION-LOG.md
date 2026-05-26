# Phase 30: Identity Foundation & Auth Contracts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25T10:25:00Z
**Phase:** 30-identity-foundation-auth-contracts
**Mode:** `--auto`
**Areas discussed:** Auth provider readiness, External identity mapping, Shared session contract, Demo/password coexistence, Authorization privacy boundaries, Operations UI metadata

---

## Auth provider readiness

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only static readiness | Config-derived provider enabled/label/mode/status with no secrets or network IdP check | ✓ |
| Live IdP discovery | Contact issuer/discovery endpoint during readiness | |
| Full provider setup UI | Let admins configure provider details in app | |

**User's choice:** Auto-selected metadata-only static readiness.
**Notes:** Recommended because Phase 30 is a foundation phase and no pilot school IdP is selected yet.

---

## External identity mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Provider+subject mapping to existing user | Link provider subject metadata to an internal user; unknown identities deny/pending | ✓ |
| Email auto-merge | Link by email automatically | |
| Auto-provision users from claims | Create users/roles from provider claims | |

**User's choice:** Auto-selected provider+subject mapping to existing user.
**Notes:** Required by IDENT-02 and avoids duplicate/over-privileged users from unverified claims.

---

## Shared session contract

| Option | Description | Selected |
|--------|-------------|----------|
| Extend current backend sessions | Add safe auth method/provider metadata to existing server sessions | ✓ |
| Browser OAuth/JWT token storage | Store provider/access tokens in frontend state/localStorage | |
| Parallel SSO session model | Separate session path for future SSO | |

**User's choice:** Auto-selected extending current backend sessions.
**Notes:** Preserves no browser token storage and keeps account status/privacy/role routing centralized.

---

## Demo/password coexistence

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve password + demo modes with safe capability metadata | Keep email/password and demo login where allowed; hide/disable demo entry in production pilot | ✓ |
| Remove demo entry now | Eliminate one-click demo role entry | |
| Always show demo entry and rely only on backend denial | Backend blocks unsafe demo login, but UI may confuse operators | |

**User's choice:** Auto-selected preserving password + demo modes with safe capability metadata.
**Notes:** Matches IDENT-03 and Phase 28/29 demo-vs-pilot separation.

---

## Authorization privacy boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Claims are identity metadata only | App role, active relationship, active account, SOS signal, and privacy acknowledgement remain authoritative | ✓ |
| Trust school/class/group claims for adult visibility | Use IdP claims to broaden adult access | |
| Provider role mapping | Let IdP groups assign app roles directly | |

**User's choice:** Auto-selected claims are identity metadata only.
**Notes:** Required by IDENT-06 and existing support-not-surveillance constraints.

---

## Operations UI metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Admin operations metadata panels | Show provider readiness, mapping/session buckets, and safe remediation only | ✓ |
| Raw identity diagnostics | Show raw claims, subjects, emails, or token details | |
| No UI in Phase 30 | Backend-only contract with no operator visibility | |

**User's choice:** Auto-selected admin operations metadata panels.
**Notes:** Matches UI hint and IDENT-01 while preserving metadata-only operations.

---

## the agent's Discretion

- Exact model/table names, enum values, migration filename, settings names, and UI layout.
- Exact split of backend/frontend tests, as long as IDENT-01 through IDENT-07 are covered.
- Whether provider subject is hash-only or has an additional safe display key, as long as raw identifiers are not exposed.

## Deferred Ideas

- Full OAuth/OIDC redirect/callback implementation.
- SAML, SCIM, automatic group provisioning, MFA, password reset, and multi-school tenancy.
- Raw identity claim inspection/export.
