# Phase 28: Runtime Mode & Production Readiness Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 28 - Runtime Mode & Production Readiness Foundation
**Areas discussed:** AI-default approval for runtime modes, readiness semantics, demo seed handling, and masking boundaries

---

## AI Defaults Gate

| Option | Description | Selected |
|---|---|---|
| Dùng AI defaults và tạo CONTEXT.md | Lock recommended defaults from v1.5 research and prior phases. | ✓ |
| Thảo luận runtime mode naming | Discuss alternative runtime mode names before context creation. | |
| Thảo luận readiness/HTTP semantics | Discuss whether to change current status vocabulary or HTTP behavior. | |
| Thảo luận demo seed handling | Discuss whether production pilot seed handling should fail fast, no-op, or use a separate start command. | |

**User's choice:** Dùng AI defaults và tạo CONTEXT.md.

**Notes:** User had already approved v1.5 scope and prefers autonomous AI decisions. Defaults were based on Phase 7 readiness decisions, Phase 19 demo/pilot operations decisions, and v1.5 research.

---

## Decisions Captured

- Runtime modes are `local_demo`, `public_demo`, and `production_pilot`.
- Existing readiness status vocabulary and HTTP behavior are preserved.
- Public demo can remain not-ready/degraded when demo seed is intentionally enabled.
- Production pilot readiness is strict and fails unsafe seed/login/cookie/origin/DB/migration/placeholder-secret states.
- Public readiness remains status-only; admin readiness remains masked and metadata-only.
- Phase 28 stays backend/config/readiness focused; deployment guardrails, identity contracts, pilot operations UI, and release gates are deferred to later v1.5 phases.

## the agent's Discretion

- Exact Python type/enum/helper boundaries for runtime mode.
- Exact seed no-op vs fail-fast mechanics, provided production pilot never creates demo data.
- Exact test file organization and helper names.

## Deferred Ideas

- Deployment guardrails/smoke split — Phase 29.
- Identity/OAuth/SSO contracts — Phase 30.
- Pilot operations dashboard/checklist — Phase 31.
- Full privacy/security release gates — Phase 32.
