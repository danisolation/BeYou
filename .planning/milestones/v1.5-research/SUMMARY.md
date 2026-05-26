# Research Summary: v1.5 Production Pilot Readiness & Identity

**Project:** Peerlight AI
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Synthesized:** 2026-05-25

## Executive Summary

v1.5 should move Peerlight AI from a public demo that works to a production-pilot-ready system for one real school. The milestone should not introduce a full enterprise identity platform or multi-school architecture. It should harden runtime modes, deployment configuration, production readiness, identity contracts, launch operations, and privacy regression gates while preserving current student-first privacy boundaries.

## Recommended Scope

| Theme | Build now | Defer |
|---|---|---|
| Runtime/readiness | Explicit demo vs production pilot modes; readiness can pass with demo seed disabled | Multi-environment platform automation |
| Deployment | Vercel/Render config guardrails, root-dir validation, smoke profiles | Terraform/Kubernetes |
| Identity | OAuth/SSO-ready provider contracts, identity mapping, auth provider discovery, demo/password preserved | Full OIDC/SAML/SCIM until provider selected |
| Operations | Admin launch checklist, safe data controls, metadata-only monitoring, rollback/handoff guidance | Full incident platform/SIEM |
| Privacy validation | Cross-role regression for identity/deploy/operations changes | New sensitive data-sharing features |

## Stack Additions

- Backend `RUNTIME_MODE` and mode-specific validation using existing settings stack.
- Demo and production pilot smoke modes.
- Deployment guard script for `render.yaml`, `frontend\vercel.json`, API URL, origins, cookies, and seed mode.
- Identity-account/provider metadata model and auth provider discovery.
- Frontend env validation using existing `zod`.
- Optional dependency/version pinning for reproducibility.

## Feature Table Stakes

1. Production readiness returns ready only when demo seed is disabled and required production settings are safe.
2. Public demo remains available, but demo seed/login is explicitly demo-mode-only.
3. Vercel root directory and Render backend config are validated before deploy/smoke.
4. Production pilot smoke does not require seeded demo users.
5. Identity contracts prepare OAuth/SSO while keeping backend-owned sessions and demo/password login.
6. Admin operations shows pilot launch status using safe metadata only.
7. Rollback/handoff guidance avoids raw exports and destructive demo-era reset habits.
8. Regression gates prove adult SOS-only visibility, mood-note privacy, reason gates, and operations sanitization remain intact.

## Architecture Guidance

Build phases in this order:

1. Runtime mode and readiness foundation.
2. Deployment guardrails and smoke split.
3. Production/demo data safety and seed controls.
4. Identity contracts and auth-provider metadata.
5. School pilot operations checklist and safe monitoring.
6. Privacy/security regression and docs.

## Watch Out For

- Demo smoke passing while production readiness is still `not_ready`.
- Render boot still invoking demo seed in production.
- Vercel deploying from repo root instead of `frontend`.
- OAuth/SSO claims becoming authorization.
- Email-only identity linking creating duplicate or wrong accounts.
- Adult visibility broadening by school/class claims.
- Operations/readiness leaking raw identifiers, emails, notes, transcripts, secrets, or free-text reasons.
- Pilot rollback instructions that suggest reseeding, truncating, or exporting raw student data.

## Requirement Seeds

- `RUNTIME-*`: explicit runtime mode, production readiness, demo seed safety.
- `DEPLOY-*`: Vercel/Render guardrails, env validation, smoke split, deploy docs.
- `IDENT-*`: identity provider contracts, account linking safety, auth method metadata, demo login preservation.
- `PILOT-*`: launch checklist, safe baseline data controls, metadata-only operations, rollback/handoff.
- `QA-*`: tests for readiness, deploy guards, identity contracts, no browser tokens, adult SOS-only access, operations sanitization, smoke profiles.

