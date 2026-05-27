# Phase 38: UI/Performance Release Gates - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

v1.6 closes only when UI consistency, backend/frontend performance evidence, privacy redlines, and production constraints are verified and documented.

Phase 38 is a release-gate verification phase — no new features. It runs existing test suites, confirms prior Phase 33–37 evidence remains valid, documents commands and constraints, and creates the final v1.6 release evidence artifact.

Requirements: QA-01, QA-02, QA-03, QA-04, QA-05

</domain>

<decisions>
## Implementation Decisions

### Evidence Format
Release evidence lives in a single `38-RELEASE-EVIDENCE.md` artifact recording all gate results, commands run, pass/fail status, and production constraint disclaimers.

### Backend Gates (QA-01)
Run full backend test suite (`cd backend && python -m pytest`) and ruff lint. Verify Phase 36 bounded/batched tests pass. Record pass counts and any failures.

### Frontend Gates (QA-02)
Run full frontend test suite (`npm --prefix frontend run test`), lint (`npm --prefix frontend run lint`), and production build (`npm --prefix frontend run build`). Record pass counts and build output.

### Performance Evidence (QA-03)
Compare Phase 33 baseline artifact with Phase 36/37 post-optimization evidence. Record improvements or document accepted external constraints (e.g., live Render cold-start cannot be measured locally).

### Privacy Redline Gates (QA-04)
Run Phase 37 integration redline tests and grep-based privacy scans for raw identifiers, emails, notes, transcripts, secrets, exports, browser tokens in new v1.6 source files.

### Documentation (QA-05)
Update README with v1.6 evidence summary, commands matrix, remaining production constraints, and `smoke:pilot` separation from `smoke:demo`.

### Production Constraint Handling
Live `smoke:pilot` evidence remains documented as "constrained" — requires safe production URLs and HTTPS configuration that don't exist in local/demo environments. This is not a failure; it's an accepted documented constraint.

### No New Features
Phase 38 must not introduce new product features, new API endpoints, new UI components, new database migrations, or new privacy-sensitive surfaces.

</decisions>

<code_context>
## Existing Code Insights

Prior phase evidence and test artifacts:
- Phase 33: `33-UI-INVENTORY.md`, `33-PERFORMANCE-BASELINE.md`, baseline helper tests
- Phase 34: `34-VERIFICATION.md`, shared UI primitives, role shell regression tests
- Phase 35: `35-VERIFICATION.md`, role dashboard consistency tests
- Phase 36: `36-VERIFICATION.md`, backend hot-path tests (56/56), `36-SCHEMA-INDEX-DECISION.md`
- Phase 37: `37-VERIFICATION.md`, `37-FRONTEND-EVIDENCE.md`, frontend integration redline tests

Existing test commands:
- Backend: `cd backend && python -m pytest`
- Backend lint: `cd backend && ruff check .`
- Frontend: `npm --prefix frontend run test`
- Frontend lint: `npm --prefix frontend run lint`
- Frontend build: `npm --prefix frontend run build`
- Deploy guards: `npm --prefix frontend run guard:deploy`
- Demo smoke: `npm --prefix frontend run smoke:demo`
- Baseline helper: `cd frontend && node --test scripts/phase33-frontend-baseline.test.mjs`

</code_context>

<specifics>
## Specific Ideas

- Reuse Phase 32 (v1.5) release gate pattern: run all suites, record counts, document constraints
- Privacy grep gates should check v1.6-new files for prohibited markers
- Performance comparison should be table-based (baseline vs post-optimization)
- README update should be additive, not a full rewrite

</specifics>

<deferred>
## Deferred Ideas

- Live smoke:pilot evidence (requires production environment)
- Render/Vercel cold-start performance profiling (external dependency)

</deferred>
