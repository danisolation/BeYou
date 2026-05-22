# Phase 19: Demo/Pilot Operations Readiness - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Autonomous defaults selected by agent

<domain>
## Phase Boundary

Make the live demo and pilot operations state verifiable from metadata-only admin/operator surfaces and from a repeatable production smoke command. Cover demo seed readiness, frontend/backend connectivity, session/CORS contract, and role dashboard reachability without exposing secrets, cookie values, private student content, raw notes, transcripts, exports, or per-student risk drilldowns.

</domain>

<decisions>
## Implementation Decisions

- Extend the existing admin operations dashboard instead of creating a separate sensitive operations console.
- Keep operations data metadata-only: roles, counts, statuses, paths, command names, and remediation copy only.
- Treat public demo account emails/password as existing demo artifacts, but never print session cookies or secret values.
- Add a production smoke script under the frontend package so the command is easy to run from the repo root or CI.
- Seed demo mood check-in config so demo seed readiness covers current v1.2/v1.3 walkthrough surfaces.
- Preserve production readiness semantics: deployed `/health/ready` can report `not_ready` while demo seeding is intentionally enabled for public demo.

</decisions>

<code_context>
## Existing Code Insights

- `backend/app/services/admin_operations.py` already centralizes readiness, SOS delivery, v1.2 audit metadata, and privacy notes.
- `backend/app/api/admin_operations.py` builds the operations dashboard behind admin authorization.
- `backend/app/seeds/demo_seed.py` seeds four public demo accounts, adult links, self-check content, scenarios, attempts, and SOS workflow.
- `frontend/app/(authenticated)/admin/operations/page.tsx` already renders metadata-only operations panels and filters audit events.
- Frontend API helpers use cookie-authenticated `apiFetch`, so no token storage is needed.

</code_context>

<specifics>
## Specific Ideas

- Add dashboard sections for demo seed readiness, connectivity/session contract, and production smoke checklist.
- Count four demo roles, active demo adult links, published self-checks, published scenarios, and published demo mood config.
- Expose safe connectivity metadata: frontend origin, allowed-origin count, health paths, session cookie name/config flags, and allowed credentialed methods.
- Add `npm --prefix frontend run smoke:production` to check frontend reachability, backend live/readiness endpoints, credentialed CORS preflight, demo login/session cookies, and role dashboard routes.
- Add backend and frontend regression coverage for the new fields and panels.

</specifics>

<deferred>
## Deferred Ideas

- CI-scheduled production smoke after deploy.
- Operational alerting for readiness changes.
- Stronger production launch gate that disables public demo seeding when real pilot data is enabled.

</deferred>
