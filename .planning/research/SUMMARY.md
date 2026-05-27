# Research Summary: v1.6 Cross-Role UI Consistency & Production Performance

**Project:** Peerlight AI
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Synthesized:** 2026-05-26

## Executive Summary

v1.6 should improve perceived and actual production quality without adding broad new product features. The milestone should first establish a cross-role UI and performance baseline, then harmonize shared frontend primitives, optimize DB/backend hot paths, improve frontend data loading/render behavior, and close with regression gates that prove speed did not weaken privacy, role authorization, or metadata-only operations.

## Stack Additions

- Use existing Next.js/TypeScript/Vitest/ESLint and FastAPI/SQLAlchemy/Alembic/pytest/ruff first.
- Add small internal helpers/tests for timing, query count, payload size, and UI consistency where useful.
- Avoid new broad UI frameworks, browser token storage, raw observability exports, or generic client caching for sensitive role data.

## Feature Table Stakes

1. Cross-role UI consistency
   - Shared layout rhythm, spacing, cards, tables, forms, status badges, loading/error/empty states, responsive behavior, and accessible interactions.
   - Role-specific privacy boundary copy remains visible.

2. Production performance baseline
   - Endpoint timings, payload sizes, query count candidates, frontend route/bundle evidence, and explicit local/demo/live-pilot constraints.

3. DB/backend optimization
   - Bounded lists, batched relationship/SOS/user lookups, SQL-level filtering/limits, targeted indexes, schema drift checks, and privacy-preserving timing evidence.

4. Frontend data/render optimization
   - Reduced fetch waterfalls, safe no-store or scoped cache behavior, smaller shared primitives, and route-level loading/error/empty states.

5. Final regression gates
   - Backend tests/lint, frontend tests/lint/build, role UI consistency tests, performance regression tests, and privacy redline gates.

## Recommended Phase Order

| Phase | Name | Purpose |
|---|---|---|
| 33 | Cross-Role UI & Performance Baseline Audit | Inventory UI drift and production slowness candidates before changing behavior. |
| 34 | Shared UI Primitives & Role Shell Harmonization | Build small shared primitives and align four role dashboards without erasing role boundaries. |
| 35 | Safe Performance Instrumentation | Add aggregate-only timing/query/payload evidence for key backend/frontend paths. |
| 36 | DB & Backend Hot Path Optimization | Fix N+1/unbounded list/query/index issues with privacy and schema gates. |
| 37 | Frontend Data Loading & Render Optimization | Reduce waterfalls, improve perceived responsiveness, and avoid unsafe caching/bundle bloat. |
| 38 | UI/Performance Release Gates | Verify consistency, performance, build/test/lint, and privacy redlines before archive. |

## Watch Outs

- UI consistency must not erase Student vs Teacher vs Parent vs Admin privacy meaning.
- Shared components must not render arbitrary backend objects or metadata.
- Performance measurement must not rely only on localhost/public demo.
- DB indexes must be tied to observed queries and kept in Alembic/model sync.
- Caching must not leak role-sensitive or relationship-sensitive data.
- Speed gates must never reward bypassing authorization, reason gates, audit, or safety copy.

## Candidate Requirement Categories

- UI Consistency
- Role Dashboards
- Performance Baseline
- Backend/DB Performance
- Frontend Performance
- Regression Gates

## Deferred Beyond v1.6

- Provider-specific OAuth/OIDC/SAML/SCIM login.
- Counselor handoff workflow.
- External Zalo/SMS/push delivery.
- Multi-school tenancy.
- Full production-pilot launch evidence if safe live pilot URLs/readiness are still unavailable during v1.6.
