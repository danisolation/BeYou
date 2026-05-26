# Phase 32: Privacy, Security & Release Gates - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** AI defaults approved by user / autonomous

<domain>
## Phase Boundary

Phase 32 is the final v1.5 release-gate phase for Peerlight AI. It verifies that the runtime-mode, deployment guardrail, identity foundation, privacy authorization, and school-pilot operations work from Phases 28-31 hold together as a safe release candidate.

This phase is primarily verification, regression hardening, and release-readiness evidence. It should add or tighten tests, smoke/guard scripts, documentation gates, and verification artifacts where gaps exist. It should not add new product behavior, raw-data admin views, OAuth/OIDC callbacks, multi-school tenancy, destructive reset/export actions, or per-student risk drilldowns.

</domain>

<decisions>
## Implementation Decisions

### Release-gate strategy
- **D-01:** Treat Phase 32 as a release candidate gate, not a feature expansion phase.
- **D-02:** Build a requirement-to-gate matrix for QA-01 through QA-06 and make every gate either executable, covered by an existing automated regression, or explicitly documented as constrained by missing live pilot credentials/configuration.
- **D-03:** Prefer strengthening existing targeted test suites and smoke/guard scripts over introducing a separate test framework.
- **D-04:** Keep gate outputs metadata-only: pass/fail/status, command names, counts, safe remediation, and documentation links only.
- **D-05:** Preserve existing product behavior unless a regression is discovered directly in the release gates.

### Runtime/readiness gates
- **D-06:** QA-01 must verify production-pilot readiness semantics from Phase 28: runtime mode is explicit, demo seed/login are blocked or no-op in production pilot, deployment config is compatible, and public/admin readiness surfaces do not leak secrets.
- **D-07:** Public readiness remains minimal and may be `degraded`/`not_ready` for public demo states; production-pilot readiness is stricter and must fail unsafe pilot configurations.
- **D-08:** Secret masking gates should reject database URLs, cookie values, provider secrets, token-like strings, raw origins containing credentials, and placeholder secret leakage in public/admin readiness or operations output.

### Deployment and smoke gates
- **D-09:** QA-02 must cover Vercel/Render deployment guardrails, frontend/backend API base alignment, CORS/cookie compatibility, and demo/pilot smoke profile behavior.
- **D-10:** Use local deterministic smoke/guard tests for deploy configuration and smoke profile semantics. Live smoke commands may be run only when the required public/demo or pilot environment variables are present and safe.
- **D-11:** If a real production-pilot URL, school IdP, or pilot credentials are absent, document that live pilot smoke is constrained and rely on fixture-based/script tests plus readiness/admin metadata gates.
- **D-12:** Do not require real student accounts, real school domains, or secrets to complete Phase 32 verification.

### Identity/auth gates
- **D-13:** QA-03 must verify Phase 30 identity contracts: provider metadata is safe, mappings deny unknown/disabled/deprovisioned identities, sessions carry safe auth-method metadata, privacy acknowledgement routing still applies, and no browser token storage is introduced.
- **D-14:** External identity claims, domains, groups, school/class data, and provider metadata must not broaden authorization. App-owned role, account status, active relationship, and SOS/student sharing gates remain authoritative.
- **D-15:** Full OAuth/OIDC/SAML/SCIM implementation remains out of scope; the gate verifies the contract foundation only.

### Cross-role privacy gates
- **D-16:** QA-04 must verify cross-role privacy invariants across the full v1.5 surface: SOS-only adult visibility, active relationship checks, reason-gated adult access, selective mood-note sharing, student-owned data controls, and privacy acknowledgement routing.
- **D-17:** Tests should explicitly reject regressions that let adult/admin roles view raw private notes, chatbot transcripts, self-check answers, SOS notes, free-text reasons, raw emails, raw IDs, provider subjects, or unshared mood notes.
- **D-18:** Existing backend and frontend privacy suites are the source of truth; strengthen them only where QA coverage is missing.

### Operations/readiness privacy gates
- **D-19:** QA-05 must verify Phase 31 operations/readiness surfaces stay metadata-only and reject raw sensitive data, export/reset controls, risk leaderboards, drilldowns, and surveillance-shaped copy.
- **D-20:** Admin operations may show aggregate counts, readiness status, checklist status, safe command names, and operator remediation. It must not show per-student rows, raw contact details, raw provider claims, notes, transcripts, answers, incident free text, or destructive actions.
- **D-21:** Documentation and UI copy should keep the support-not-surveillance framing and avoid language that implies ranking students by risk.

### Final verification gate
- **D-22:** QA-06 should run the broadest practical release gate set: backend pytest, backend ruff, frontend tests, frontend lint, frontend build, Node smoke/guard tests, deployment guard command, relevant smoke commands, docs grep/privacy grep, and targeted requirement assertions.
- **D-23:** If an existing full-suite gate fails from an unrelated external dependency or missing live service, isolate it, document the constraint in verification, and still run deterministic local substitutes. Do not silently mark constrained gates as passed.
- **D-24:** Release evidence belongs in `32-VERIFICATION.md` with exact command names, outcomes, constraints, and requirement mapping.

### the agent's Discretion
- Choose the exact plan split, test files, grep commands, and verification command ordering.
- Add small helper scripts only if they reduce duplicate gate logic and fit existing `package.json` / pytest patterns.
- Decide whether to add Phase 32-specific test files or extend existing Phase 28-31/privacy tests, prioritizing maintainability.
- Update README only where release-gate commands or operator verification guidance changes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 32 goal, dependencies, success criteria, and milestone sequencing.
- `.planning/REQUIREMENTS.md` — QA-01 through QA-06 acceptance criteria.
- `.planning/PROJECT.md` — project privacy principles, v1.5 milestone state, and support-not-surveillance constraints.
- `.planning/research/SUMMARY.md` — v1.5 research synthesis and release-readiness guidance.
- `.planning/research/PITFALLS.md` — release pitfalls around readiness leakage, demo data, identity overreach, and privacy regressions.

### Prior locked decisions
- `.planning/phases/28-runtime-mode-production-readiness-foundation/28-CONTEXT.md` — runtime modes, production-pilot readiness, demo seed/login boundaries, and secret masking.
- `.planning/phases/29-deployment-guardrails-smoke-profiles/29-VERIFICATION.md` — verified deploy guardrails and smoke profile foundation.
- `.planning/phases/30-identity-foundation-auth-contracts/30-CONTEXT.md` — identity provider, mapping, session metadata, and no-browser-token boundaries.
- `.planning/phases/31-school-pilot-operations-safe-launch/31-CONTEXT.md` — metadata-only operations, pilot launch checklist, rollback/handoff, and raw-data redlines.
- `.planning/phases/31-school-pilot-operations-safe-launch/31-VERIFICATION.md` — latest verified release-gate style and Phase 31 command set.

### Existing implementation references
- `backend/app/core/config.py` — runtime mode, auth/demo/identity/cookie/origin settings.
- `backend/app/services/readiness.py` — readiness checks and public/admin masking behavior.
- `backend/app/seeds/demo_seed.py` — demo seed no-op/blocking behavior.
- `backend/app/api/auth.py` and `backend/app/api/me.py` — login, demo-login policy, privacy acknowledgement routing, and shared auth response.
- `backend/app/core/sessions.py` — backend-owned HttpOnly sessions and auth-method metadata.
- `backend/app/core/authorization.py` — app-owned role/relationship/SOS/reason gates.
- `backend/app/services/admin_operations.py` — metadata-only operations dashboard and sanitizer.
- `frontend/app/login/page.tsx` — login/demo role entry and no-token frontend auth path.
- `frontend/app/(authenticated)/layout.tsx` — `/api/auth/me`, role routing, privacy acknowledgement redirect, and logout.
- `frontend/app/(authenticated)/admin/operations/page.tsx` — operations UI panels and privacy-safe metadata rendering.
- `frontend/scripts/deployment-guardrails.mjs` — Vercel/Render/API/CORS/cookie deploy guard command.
- `frontend/scripts/demo-smoke.mjs`, `frontend/scripts/pilot-smoke.mjs`, `frontend/scripts/production-smoke.mjs`, and `frontend/scripts/smoke-profiles.test.mjs` — smoke profile behavior.
- `render.yaml`, `frontend/package.json`, `backend/pyproject.toml`, `backend/.env.example`, and `README.md` — release command/config surfaces.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Backend tests already cover major privacy/runtime/auth/operations areas: `test_phase7_readiness.py`, `test_demo_seed.py`, `test_auth_privacy_portals.py`, `test_phase24_reason_access.py`, `test_phase25_admin_policy_operations.py`, and `test_phase31_school_pilot_operations.py`.
- Frontend tests already cover auth, admin operations, privacy UI, and v1.5 operations panels: `auth-portals.test.tsx`, `phase11-operations-ui.test.tsx`, `phase25-admin-policy-operations-ui.test.tsx`, and `phase31-school-pilot-operations-ui.test.tsx`.
- Node scripts already provide deploy/smoke guard foundations under `frontend/scripts`.
- Admin operations already exposes safe command strings such as `npm --prefix frontend run guard:deploy`, `npm --prefix frontend run smoke:demo`, and `npm --prefix frontend run smoke:pilot`.

### Established Patterns
- Tests are phase-targeted and additive; do not rewrite older suites unless directly needed for a regression.
- Backend APIs use Pydantic schemas and service helpers; routers stay thin.
- Frontend uses `apiFetch` with `credentials: include`; no local/session storage token auth.
- Admin and readiness surfaces expose metadata/status only and recursively sanitize unsafe keys/strings.
- README documents operator commands and should stay concise and command-oriented.
- Verification reports use explicit requirement IDs and exact command outcomes.

### Integration Points
- Add Phase 32 backend tests if a QA gate lacks an explicit assertion.
- Add Phase 32 frontend/Vitest tests if browser-facing privacy/auth/operations gates lack explicit coverage.
- Add or refine npm scripts only when existing scripts cannot express the release gates clearly.
- Add README release-gate command guidance if new or clarified commands become part of QA-06.
- Use `32-VERIFICATION.md` as the final evidence map for QA-01 through QA-06.

</code_context>

<specifics>
## Specific Ideas

- Implement a single Phase 32 release-gate matrix that references exact tests/commands for QA-01..QA-06.
- Add negative privacy assertions with forbidden phrases/fields rather than relying only on positive UI/backend rendering checks.
- Prefer deterministic local smoke profile tests over live pilot dependencies when no real production-pilot environment exists.
- Keep all Phase 32 copy and verification evidence focused on "ready to support a safe pilot", not "ready to monitor students".

</specifics>

<deferred>
## Deferred Ideas

- Full OAuth/OIDC/SAML/SCIM provider integration after a real school IdP is selected.
- Multi-school tenancy and school/domain provisioning.
- Live real-student pilot smoke using school credentials.
- External incident/ticketing integrations, counselor handoff workflow, notification providers, and raw exports.
- Destructive database reset/cleanup tools and per-student risk leaderboards.

</deferred>

---

*Phase: 32-privacy-security-release-gates*
*Context gathered: 2026-05-26*
