# Feature Landscape: v1.5 Production Pilot Readiness & Identity

**Project:** Peerlight AI
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Researched:** 2026-05-25
**Confidence:** High for current repo state and milestone scope.

## Context

Peerlight AI already has strong privacy foundations: cookie sessions, role/relationship authorization, SOS-only adult visibility, student-owned mood notes, reason-gated adult support reads, metadata-only admin operations, public demo, and production smoke. v1.5 should make one real school pilot safe by separating demo from production, hardening deploy configuration, preparing identity contracts, and proving privacy boundaries still hold.

## Table Stakes

| Feature | Why expected | Testable acceptance |
|---|---|---|
| Explicit runtime mode | Demo and pilot have different safety rules. | Backend/admin readiness reports masked mode; production pilot fails if demo seed is enabled. |
| Production readiness can pass without demo seed | Real pilot cannot rely on demo accounts. | With safe production config and demo seed disabled, `/health/ready` returns ready. |
| Separate demo seeding from production boot | Avoid accidental demo data in real school pilot. | Production profile/start command does not invoke demo seeding. |
| Deployment guardrail script | Prevent root-dir, origin, cookie, and env drift. | Guard validates Render root/backend command, Vercel root/frontend config, API URL, CORS origins, and cookie requirements. |
| Separate demo and pilot smoke | Demo smoke and real pilot readiness have different success criteria. | Demo smoke uses seeded roles; pilot smoke does not require demo accounts and requires readiness ready. |
| OAuth/SSO-ready identity model | Schools often require IdP later. | User/session/auth schemas can represent provider, subject, auth method, and email verification metadata. |
| Preserve password/demo login | Public demo and local development still need email/password. | Existing login remains working in demo mode. |
| Identity linking guardrails | Avoid duplicate or over-privileged accounts. | No auto-merge by unverified email; external subject mapping is unique and admin-reviewable. |
| Admin launch checklist | School pilot needs repeatable safe-launch evidence. | Admin operations shows runtime, demo seed, readiness, migrations, origin/cookie, smoke, and privacy-regression status. |
| Metadata-only pilot monitoring | Operators need health, not surveillance. | Operations exposes counts/status/timestamps/categories only. |
| Rollback and handoff guidance | Pilot launch needs safe recovery steps. | Docs/admin panel describe deploy rollback, readiness verification, contact/handoff, and no destructive DB resets by default. |
| Privacy regression release gate | Identity/deploy changes can weaken boundaries. | Tests prove SOS-only adult visibility, reason gates, mood-note privacy, operations sanitization, and no browser tokens. |

## Differentiators

| Differentiator | Value |
|---|---|
| Demo-safe vs production-safe readiness | Makes clear when the app is only demo-ready versus real-pilot-ready. |
| Production smoke without seeded accounts | Lets production readiness pass with demo seed disabled. |
| Deployment drift detection | Prevents Vercel/Render config mistakes from becoming launch outages. |
| SSO-ready without premature IdP coupling | Prepares school identity without overbuilding. |
| Metadata-only school launch operations | Gives school/admin confidence without raw-data monitoring. |

## Future / Deferred

| Feature | Why defer |
|---|---|
| Full OAuth/OIDC sign-in | Needs selected school IdP, redirect URIs, claim mapping, logout behavior, and incident plan. |
| SAML/SCIM provisioning | Enterprise-heavy; better after first pilot. |
| Multi-school tenancy | Deferred until single-school production safety is stable. |
| Zalo/SMS/push reminders | Needs provider governance, retries, dead letters, message privacy review. |
| Counselor handoff workflow | Valuable but separate from production/identity foundation. |
| Full incident-response platform | Too broad for v1.5. |

## Anti-Features

- Running demo seed during production pilot boot.
- Public demo credentials available in production pilot mode.
- Production smoke requiring seeded demo accounts.
- Wildcard credentialed CORS.
- Insecure production cookies.
- Browser-stored OAuth/access tokens.
- Auto-linking SSO users by unverified email.
- Admin access to OAuth tokens, raw claims, password hashes, raw student content, or raw identifiers.
- Risk leaderboards, per-student risk ranking, raw exports, or adult browsing before SOS.
- Automatic SOS from mood/reminder signals.

## MVP Recommendation

1. Runtime mode and readiness split.
2. Deployment guardrails and smoke profiles.
3. Identity foundation without full provider coupling.
4. School pilot operations checklist and safe monitoring.
5. Privacy regression gate across identity/deploy/operations.

