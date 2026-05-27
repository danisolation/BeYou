# Domain Pitfalls: v1.5 Production Pilot Readiness & Identity

**Project:** Peerlight AI
**Milestone:** v1.5 Production Pilot Readiness & Identity
**Researched:** 2026-05-25
**Confidence:** High.

## Critical Pitfalls

| Pitfall | Failure mode | Prevention | Phase target |
|---|---|---|---|
| Demo readiness treated as production readiness | Smoke passes while `/health/ready` is not ready because demo seed is enabled. | Separate demo and pilot readiness; pilot requires `ready` and demo seed disabled. | Runtime/readiness, regression |
| Render startup still invokes demo seed | Future seed changes could write demo data in production. | Production pilot start command must not run demo seed; seed command is demo-only. | Runtime/deploy |
| Vercel root-directory drift | Frontend deploys from repo root and returns 404. | Guard project root = `frontend`; document dashboard setting; validate before smoke. | Deploy guardrails |
| Credentialed CORS/cookie drift | Login works in API but browser sessions fail. | Validate exact frontend origins, API URL, Secure/SameSite cookie flags, and credentialed preflight. | Deploy guardrails |
| Smoke gives false confidence | Demo smoke accepts 503 readiness or only fetches dashboard HTML. | Add pilot smoke requiring readiness ready and non-demo session checks when credentials exist. | Smoke/regression |
| OAuth creates duplicates/over-privileged users | Email or claims are trusted too broadly. | Use provider+subject mapping, verified email, admin-reviewed linking, app-owned roles. | Identity |
| Identity bypasses privacy acknowledgement/status | New callback path skips existing login response logic. | All auth methods use one session creation and `/api/auth/me` response path. | Identity/regression |
| Adult visibility broadens via school/class claims | Teachers see all class/school students. | Claims are profile metadata only; active relationship + SOS remains mandatory. | Identity/regression |
| Operations leak raw identifiers/content | Launch debugging asks for raw IDs, emails, notes, transcripts, reasons. | Reuse sanitizer; schema/grep tests for forbidden fields; counts/statuses only. | Operations/regression |
| Rollback destroys real data | Demo reset habits appear in pilot runbooks. | Pilot-safe rollback levels; no raw exports or destructive DB actions by default. | Operations |
| Readiness leaks secrets | Debug output prints env/secrets/cookies. | Public readiness minimal; admin readiness masked; tests for secret leakage. | Readiness/regression |

## Moderate Pitfalls

- Loose environment naming lets unsafe combinations pass.
- Demo/real separation relies only on `is_demo`.
- Account deprovisioning does not revoke sessions or SSO access.
- Pilot copy normalizes monitoring language instead of support language.
- Env examples drift from Render/Vercel config and smoke defaults.

## Highest-Priority Requirements to Add

1. Production readiness must fail if demo seeding is enabled for a real pilot.
2. Production pilot boot must not run demo seeding.
3. Vercel root directory and Render backend config must be validated.
4. Pilot smoke must require readiness ready and avoid demo-account dependency.
5. Identity foundation must add external identity mapping without replacing demo/password login.
6. All auth methods must enforce account status, session revocation, privacy acknowledgement, and role dashboard routing.
7. Adult visibility must remain active relationship plus SOS signal only.
8. Operations/readiness/rollback surfaces must remain metadata-only and export-free.

