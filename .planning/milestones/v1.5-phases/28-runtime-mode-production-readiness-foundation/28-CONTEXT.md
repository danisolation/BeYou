# Phase 28: Runtime Mode & Production Readiness Foundation - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** AI defaults approved by user

<domain>
## Phase Boundary

Phase 28 delivers the backend runtime-mode and production-readiness foundation for v1.5. It makes local/demo vs public demo vs production pilot intent explicit, tightens readiness checks for production pilot, keeps public readiness minimal, preserves existing public demo behavior, and prevents unsafe demo seed/config/secret leakage from being treated as pilot-ready.

This phase does **not** implement deployment guard scripts or smoke split (Phase 29), identity provider contracts (Phase 30), school pilot operations UI/checklist (Phase 31), or full regression gates (Phase 32). It may create the backend contracts those later phases consume.

</domain>

<decisions>
## Implementation Decisions

### Runtime mode contract
- **D-01:** Add an explicit product/runtime mode contract with approved mode names `local_demo`, `public_demo`, and `production_pilot`.
- **D-02:** Keep existing `ENVIRONMENT` for platform/deployment semantics, but use the new runtime mode as the source of product intent for demo seeding, demo login allowance, and production pilot readiness expectations.
- **D-03:** Preserve backwards compatibility for local development defaults: missing runtime mode should behave like a safe local/demo development setup, not unexpectedly block local tests.

### Readiness semantics
- **D-04:** Preserve existing readiness status vocabulary: check statuses `pass`/`warn`/`fail` and overall statuses `ready`/`degraded`/`not_ready`.
- **D-05:** Preserve existing HTTP semantics: `/health/ready` returns HTTP 503 only for `not_ready`, otherwise HTTP 200.
- **D-06:** Public demo mode may remain `degraded` or `not_ready` when demo seeding is intentionally enabled; this is a valid demo state and should not be confused with production pilot readiness.
- **D-07:** Production pilot mode must fail readiness when demo seeding, demo login, insecure cookies, unsafe origins, missing DB/migration state, placeholder secrets, or incompatible mode/config combinations are detected.
- **D-08:** Production pilot mode can return `ready` only when demo seeding is disabled and required database, migration, origin, cookie, frontend API, and identity placeholder/config checks pass.

### Demo seed handling
- **D-09:** Public demo mode can continue to seed demo users and walkthrough data intentionally.
- **D-10:** Production pilot mode must not create demo users, demo links, or walkthrough data during boot.
- **D-11:** If demo seed code is invoked in production pilot mode, it must no-op safely or fail readiness with explicit remediation; downstream planning can choose exact fail-fast/no-op mechanics that best fit current startup behavior.

### Secret masking and metadata boundaries
- **D-12:** Public readiness remains minimal: overall status and generated timestamp only.
- **D-13:** Admin readiness may include check keys, categories, statuses, summaries, and remediation, but must never expose database URLs, secret names with values, cookie values, provider credentials, SMTP credentials, raw origins containing secrets, or token-like values.
- **D-14:** Internal status keys remain stable English tokens for tests/API consumers; operator-facing remediation can use concise Vietnamese where shown in admin surfaces.
- **D-15:** Reuse existing metadata-only operations principles; Phase 28 must not add raw student data, raw identifiers, exports, risk drilldowns, or surveillance-shaped readiness details.

### Scope routing
- **D-16:** Phase 28 is backend/API/config focused. Any new admin launch checklist UI belongs to Phase 31, while deploy guard scripts and smoke split belong to Phase 29.
- **D-17:** Identity provider data models and auth-provider contracts belong to Phase 30; Phase 28 can include placeholder readiness checks only when needed for production readiness compatibility.

### the agent's Discretion
- Choose exact field names and helper boundaries that fit current `Settings`, readiness service, and Pydantic schema conventions.
- Decide whether runtime mode is represented as a string literal, enum, or typed helper in Python.
- Decide whether production pilot seed safety is implemented by start-command separation, seed no-op, readiness failure, or a combination, as long as production pilot never creates demo data.
- Choose the minimal test layout that fits existing backend pytest patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 28 goal, requirements, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` — RUNTIME-01 through RUNTIME-05 acceptance criteria.
- `.planning/research/SUMMARY.md` — v1.5 research synthesis and recommended build order.
- `.planning/research/ARCHITECTURE.md` — runtime/readiness integration points and data-flow guidance.
- `.planning/research/STACK.md` — stack recommendations for runtime mode, deployment profiles, and identity placeholders.
- `.planning/research/PITFALLS.md` — failure modes to prevent in readiness, seed, config, and secret masking.

### Prior locked decisions
- `.planning/milestones/v1.1-phases/07-production-readiness-safe-operations-foundation/07-CONTEXT.md` — readiness surfaces, status semantics, masking rules, and backend service/schema patterns.
- `.planning/milestones/v1.3-phases/19-demo-pilot-operations-readiness/19-CONTEXT.md` — public demo readiness behavior, production smoke expectations, and metadata-only operations framing.
- `.planning/milestones/v1.4-phases/26-cross-role-privacy-regression-demo-readiness/26-CONTEXT.md` — v1.4 regression/demo readiness boundaries.

### Existing implementation references
- `backend/app/core/config.py` — current `Settings`, origin validation, demo seed flag, cookie settings, provider settings.
- `backend/app/services/readiness.py` — existing static readiness checks, DB/migration checks, status aggregation, HTTP status behavior.
- `backend/app/schemas/readiness.py` — public/admin readiness response shapes.
- `backend/app/main.py` — `/health`, `/health/live`, `/health/ready`, router wiring, and CORS configuration.
- `backend/app/seeds/demo_seed.py` — demo seed guard and current public demo data creation.
- `backend/app/api/admin_operations.py` — admin readiness/dashboard endpoint pattern.
- `backend/app/services/admin_operations.py` — metadata-only operations sanitizer, demo seed summary, connectivity summary, and smoke checklist.
- `backend/tests/test_phase7_readiness.py` — existing readiness/masking test patterns.
- `backend/tests/test_demo_seed.py` — current demo seed enable/disable tests.
- `render.yaml` — current Render backend deployment and public demo seed configuration.
- `backend/.env.example` — current backend environment example that needs v1.5 mode additions.
- `README.md` — current public demo readiness note and verification commands.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Settings` in `backend/app/core/config.py`: add runtime-mode and demo-login settings here to keep configuration centralized.
- `evaluate_static_readiness_checks()` in `backend/app/services/readiness.py`: extend with runtime-mode compatibility checks before DB/migration checks.
- `ReadinessCheck`, `ReadinessReport`, and `PublicReadinessResponse` in `backend/app/schemas/readiness.py`: likely reusable without major shape changes; add fields only if needed for safe mode metadata.
- `seed_demo_data()` in `backend/app/seeds/demo_seed.py`: already refuses when `ALLOW_DEMO_SEED=false`; extend for production-pilot mode safety.
- `get_admin_readiness()` in `backend/app/api/admin_operations.py`: existing authenticated admin detail endpoint can expose new safe readiness checks.
- `test_phase7_readiness.py` and `test_demo_seed.py`: use these as the model for Phase 28 targeted tests.

### Established Patterns
- Public readiness must not include detailed checks or sensitive config values.
- Detailed readiness belongs behind admin operations authorization.
- API routers stay thin and delegate to services.
- Pydantic schemas live under `backend/app/schemas`.
- Configuration validation should fail early for invalid cookie/origin settings.
- Metadata-only operations sanitization excludes email, raw IDs, notes, transcripts, free-text reasons, and secrets.
- English machine keys plus Vietnamese-safe operator copy is acceptable.

### Integration Points
- Extend `Settings` with runtime mode and any demo-login/production-pilot settings.
- Extend readiness static checks for runtime mode, demo login, seed state, cookie/origin mode compatibility, and placeholder secret compatibility.
- Update demo seed behavior so production pilot mode cannot create demo data.
- Update `.env.example`, `render.yaml`, and README notes only enough to document the new runtime/readiness distinction; broader deployment guard docs belong to Phase 29.
- Add or update backend tests for production pilot pass/fail, public demo behavior, secret masking, and seed no-op/failure behavior.

</code_context>

<specifics>
## Specific Ideas

- Approved default mode names: `local_demo`, `public_demo`, `production_pilot`.
- Treat public demo and production pilot as two different valid operating modes, not one overloaded `production` environment.
- Keep the public demo usable on Vercel/Render while making it explicit that real student pilot readiness requires different settings.
- Prefer small, composable readiness checks over one large mode validator so admin remediation remains clear.

</specifics>

<deferred>
## Deferred Ideas

- Deployment guardrail command, Vercel root validation, frontend env validation, and demo/pilot smoke split — Phase 29.
- OAuth/SSO identity mapping contracts and auth-provider metadata — Phase 30.
- Admin production pilot launch checklist UI, rollback/handoff panel, and demo/real data safety panel — Phase 31.
- Full milestone regression, grep gates, and release gate orchestration — Phase 32.
- Full OAuth/OIDC/SAML/SCIM implementation remains out of scope until a school identity provider is selected.

</deferred>

---

*Phase: 28-runtime-mode-production-readiness-foundation*
*Context gathered: 2026-05-25*
