# Phase 73: Security Polish & Release Gates - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning
**Mode:** Auto-generated (--auto, no user clarification needed)

<domain>
## Phase Boundary

Ensure zero regression on privacy boundaries, metadata serialization, and release checklist for v2.4 (Phases 71-72: external notification helpers + multi-school tenant schema). This is the v2.4 final release-gate phase, mirroring v1.5 Phase 32 pattern.

Scope:
- Audit metadata-only invariants for new v2.4 surfaces (SMTP readiness, tenant schema scaffolding)
- Verify privacy sanitizer covers any new operations buckets from Phase 71-72
- Run full release gates: backend pytest, frontend vitest, lint, build, smoke:demo, smoke:pilot, release-gates
- Document v2.4 release-gate matrix in REQUIREMENTS or phase artifact

Out of scope: new features, UI changes, multi-school tenant UI, OAuth callback UI, raw data admin views, destructive reset/export actions.

</domain>

<decisions>
## Implementation Decisions

### D1: Reuse v1.5 Phase 32 release-gate pattern
Follow `backend/tests/test_phase32_release_gates.py` + `frontend/scripts/release-gates.test.mjs` + `frontend/tests/phase32-release-gates-ui.test.tsx` structure. Add Phase 73 equivalents only where new v2.4 surfaces exist.

### D2: Single plan covering all 3 stacks
Backend + frontend + docs gates in one PLAN since SECURE-01 is the only requirement. Avoid over-splitting.

### D3: No new product surfaces
This phase only adds tests, sanitizer redlines, doc updates. No new API, no new UI component, no new admin panel.

### D4: Live smoke:pilot constraint policy
If live pilot URLs not safe/ready, mark constrained with deterministic substitute (same as Phase 32). Do not fail gate on live-env unavailability.

### D5: Privacy grep gates extended
Add grep checks for new v2.4 tokens (SMTP-related raw addresses, tenant_id raw exposure) in operations output.

</decisions>

<code_context>
## Existing Code Insights

- `backend/tests/test_phase32_release_gates.py` — pattern for backend release gates
- `frontend/scripts/release-gates.test.mjs` — pattern for Node deploy/smoke gates
- `frontend/tests/phase32-release-gates-ui.test.tsx` — pattern for frontend UI privacy gates
- `backend/app/services/operations_sanitizer.py` (assumed location) — sanitizer to verify
- Phase 71 added SMTP config readiness; verify dispatch metadata redacts recipient emails
- Phase 72 added tenant_id columns; verify schema does NOT expose tenant_id raw in any current operations output (forward-compat safety)
- README `Privacy, security, and release gates` section — extend with v2.4 row

</code_context>

<specifics>
## Specific Ideas

1. **Backend release-gate test** `backend/tests/test_phase73_release_gates.py`:
   - SMTP recipient email redaction in dispatch log output (NOTIFY-02)
   - SMTP config readiness returns explicit status without leaking credentials (NOTIFY-01)
   - Tenant schema migration does not break existing operations sanitizer
   - Re-assert all v1.5/v2.x privacy invariants still hold

2. **Frontend release-gate test** `frontend/tests/phase73-release-gates-ui.test.tsx`:
   - Defense-in-depth: any new v2.4 operations metadata renders without raw email/tenant exposure
   - Existing Phase 32 UI gates still pass

3. **Node release-gate script** extension to `frontend/scripts/release-gates.test.mjs`:
   - Add Phase 73 row asserting deterministic gate command list documented

4. **Docs**: Update README v2.4 privacy/release-gate matrix row + Phase 73 plan adds VERIFICATION.md with constraint policy.

</specifics>

<deferred>
## Deferred Ideas

- Multi-school tenant runtime separation enforcement (v2.6+)
- OAuth callback UI (per Phase 30 contract, defer)
- Visual regression tests (planned for v2.5 Phase 81 per draft roadmap)
- axe-core a11y CI gate (planned for v2.5)

</deferred>
