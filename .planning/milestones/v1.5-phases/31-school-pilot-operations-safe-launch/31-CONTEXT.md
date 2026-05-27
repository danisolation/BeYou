# Phase 31: School Pilot Operations & Safe Launch - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 31 extends the existing metadata-only admin operations surface so school operators can decide whether a real production pilot is safe to launch, monitor launch readiness, and follow rollback/handoff guidance without raw student data access. The phase must cover PILOT-01 through PILOT-05: launch checklist, demo/real data safety counts/statuses, login/session/readiness/audit/launch metadata, rollback and handoff guidance, and baseline content/school policy setup guidance for a real pilot.

It must not implement full OAuth/OIDC callbacks, multi-school tenancy, external notification delivery, counselor handoff workflow, destructive database reset, raw export, per-student drilldown, risk leaderboard, or any adult/admin expansion into raw private notes, chatbot transcripts, self-check answers, SOS notes, emails, free-text reasons, provider subjects, or raw identity claims.

</domain>

<decisions>
## Implementation Decisions

### Operations Surface
- Reuse the existing admin operations dashboard (`/api/admin/operations/dashboard` and `/admin/operations`) as the Phase 31 UI anchor instead of adding a new route.
- Add optional `pilot_launch`, `pilot_data_safety`, and `pilot_handoff` sections to preserve backwards compatibility with older operations payloads and tests.
- Use status cards/checklists/buckets that fit the existing rounded Peerlight AI admin style; avoid tables with raw identifiers.
- Keep all copy support-oriented and operational; emphasize "launch readiness" and "support handoff", not surveillance.

### Launch Checklist and Blocking Semantics
- Represent each launch requirement as metadata-only checklist items with enum-like keys, labels, `pass`/`warn`/`fail` statuses, evidence text, safe remediation, and optional command strings.
- Derive an overall launch status from checklist items: `ready` only when all blocking checks pass; `blocked` when required production pilot criteria fail; `needs_review` when non-blocking guidance needs operator attention.
- Include runtime mode, readiness, migrations/static checks through readiness summary, origin/cookie contract, demo seed/login policy, identity readiness, smoke profile evidence, privacy regression status, baseline content, and school policy setup.
- Do not persist launch approvals or create a new launch workflow in this phase; this is a metadata contract and UI readiness surface.

### Demo/Real Data Safety
- Add aggregate counts/statuses only for demo users, demo student-adult links, demo content/config rows, demo policy/consent/share state, and active real-user counts needed to detect public-demo data in production pilot mode.
- In `production_pilot`, any active demo account/link/walkthrough/config row should be flagged as a launch blocker or warning based on the existing product boundary that real pilots must not depend on demo users.
- Never expose raw emails, user IDs, link IDs, content titles, note text, provider subjects, school/class names, or drilldown links.

### Rollback, Handoff, and Baseline Guidance
- Add safe rollback/handoff guidance to README and the operations dashboard: redeploy last known good frontend/backend, revert config to last known good values, rerun readiness/guardrails/smoke, notify school owner, escalate incidents, and avoid destructive DB reset/raw export defaults.
- Add baseline setup guidance as checklist metadata: school policy defaults present, in-app-only reminder channels, baseline content published, admin contact/handoff documented, demo seeding disabled for real pilot.
- Guidance is static and metadata-only; no secrets, external contacts, incident ticket numbers, or real student data are stored.

### Privacy and Authorization
- Continue using existing admin-only operations authorization with `require_role(admin)` and `require_permission(... purpose="admin_operations")`.
- Continue recursive metadata sanitization and extend forbidden terms if Phase 31 introduces new metadata fields that might carry unsafe text.
- Preserve backend-owned HttpOnly cookie sessions and app-owned authorization boundaries from Phase 30.
- Add tests/grep gates that specifically reject raw emails, identifiers, notes, transcripts, answers, SOS notes, free-text reasons, exports, drilldowns, and risk ranking copy from Phase 31 operations surfaces.

### the agent's Discretion
The user prefers autonomous execution and delegates design decisions to the agent. Choose exact schema names, checklist keys, test placement, and copy as long as they satisfy PILOT-01 through PILOT-05 and existing Peerlight AI conventions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/services/admin_operations.py` already builds the metadata-only admin operations dashboard with readiness, runtime, demo seed, connectivity, deployment guardrails, smoke profiles, identity provider, identity mapping, session auth, SOS email, v1.2/v1.4 audit buckets, and sanitized recent audit events.
- `backend/app/schemas/admin_operations.py` owns the Pydantic response contract and already uses optional Phase 30 fields for backwards-compatible additions.
- `frontend/lib/admin-operations-api.ts` mirrors the dashboard contract and already marks Phase 30 fields optional.
- `frontend/app/(authenticated)/admin/operations/page.tsx` already renders operations panels, metric cards, status badges, bucket lists, smoke/guardrail panels, identity panels, and privacy boundary copy.
- README already documents runtime modes, guardrails, smoke profiles, and safe rollback; Phase 31 can extend this section rather than introducing a separate docs structure.

### Established Patterns
- Operations responses expose status/count metadata only. Existing sanitizer removes forbidden keys and recursively replaces unsafe string values.
- Public readiness remains status/time-only; admin operations is authenticated and metadata-only.
- `production_pilot` must disable demo seed/login, use secure `SameSite=None` cookies, exact HTTPS origins, current migrations, safe provider metadata, and no placeholder secrets.
- Frontend panels use nullish fallback arrays and optional payload fields to avoid crashes when backend payloads are partial or old.
- Tests live in targeted backend phase files plus frontend Vitest files; Phase 31 should add focused tests instead of rewriting older suites.

### Integration Points
- Backend additions should fit `build_operations_dashboard()` and return through `/api/admin/operations/dashboard`.
- Frontend additions should extend `AdminOperationsDashboard` types and render inside the existing admin operations page.
- Documentation should update `README.md` and planning artifacts only where directly tied to the launch/handoff behavior.
- Verification should reuse existing targeted gates: backend Phase 31 tests, frontend operations UI tests, ruff, frontend lint/build, and metadata privacy grep checks as needed.

</code_context>

<specifics>
## Specific Ideas

Use the existing operations dashboard as the single source of launch readiness truth for administrators. The UI should make clear that this is safe launch metadata, not an approval workflow and not a student monitoring tool.

</specifics>

<deferred>
## Deferred Ideas

- Full OAuth/OIDC/SAML/SCIM provider callback/provisioning remains deferred until a school IdP is selected.
- Multi-school tenancy remains deferred until single-school production safety is verified.
- Counselor handoff workflow and external notification providers remain deferred.
- One-click destructive database reset, raw export, and per-student risk drilldown remain explicitly out of scope.

</deferred>
