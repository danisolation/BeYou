# Technology Stack Research: v1.6 Cross-Role UI Consistency & Production Performance

**Project:** Peerlight AI
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Researched:** 2026-05-26

## Current Stack

| Layer | Current stack | v1.6 implications |
|---|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest, ruff | Optimize query shape, indexes, endpoint payloads, and safe timing evidence without adding raw-data observability. |
| Frontend | Next.js 16, TypeScript, React, Testing Library/Vitest, direct ESLint CLI | Harmonize role UI through shared lightweight components and tokens; avoid large new client libraries. |
| Deployment | Render backend, Vercel frontend, cookie-authenticated cross-origin API | Measure production slowness as frontend + network + Render cold/warm backend + DB latency, not only local tests. |
| Quality gates | pytest, ruff, Vitest, lint, build, Node smoke/guard scripts | Add targeted UI consistency and performance regression gates using existing tooling first. |

## Recommended Additions

Prefer using existing dependencies and project conventions before adding packages.

1. Backend measurement helpers
   - Add safe per-endpoint/service timing metadata in tests or logs with no raw student content, IDs, emails, notes, transcripts, provider claims, or secrets.
   - Use query-count/endpoint-duration regression tests for known slow routes where practical.

2. SQLAlchemy query optimization patterns
   - Batch or join lookups for admin links, teacher/parent student lists, adult summaries, operations dashboard buckets, and history endpoints.
   - Add indexes only when tied to observed predicates/orderings.
   - Keep Alembic/model schema synchronized and run schema drift checks after migrations.

3. Frontend shared UI primitives
   - Small shared components for page shell sections, cards, table wrappers, loading/error/empty states, section headings, status badges, and privacy boundary callouts.
   - Role-specific copy and safe DTOs remain outside generic primitives.

4. Frontend performance patterns
   - Reduce role dashboard fetch waterfalls with scoped API helpers and route-level loading states.
   - Split heavy role-specific panels rather than importing admin/operations code into student routes.
   - Use Next build output and targeted smoke tests as baseline before/after evidence.

## What Not To Add

- No new broad UI framework or design-system rewrite unless existing primitives cannot support the role surfaces.
- No browser token storage, OAuth access-token handling, or raw identity claim viewers.
- No raw SQL/query observability that prints student data, emails, notes, transcripts, or secrets.
- No generic client cache for role-sensitive data unless cache keys and invalidation preserve user, role, relationship, reason, policy, and runtime boundaries.
- No raw exports, risk leaderboards, per-student drilldowns, or destructive reset controls as a side effect of performance instrumentation.

## Integration Points

| Area | Files/surfaces to inspect | Likely stack action |
|---|---|---|
| Role UI shell | `frontend/app/(authenticated)/*`, shared components | Extract small primitives and align layout/copy states. |
| API helpers | `frontend/lib/*api*`, `frontend/lib/api.ts` | Standardize loading/error contracts and avoid duplicate fetch waterfalls. |
| Admin operations | `backend/app/services/admin_operations.py`, operations UI | Keep timing/performance metadata aggregate-only and sanitized. |
| Adult/student lists | teacher/parent/admin APIs and services | Batch relationship/SOS/user lookups and add bounded lists. |
| Histories/summaries | self-check, scenario, mood, support summaries | Push limits/filtering to SQL; avoid Python slicing after loading all rows. |

## Quality Gates

- Backend targeted performance/privacy tests for optimized routes.
- Frontend role smoke tests for shared loading/error/empty states and responsive role dashboards.
- Build/lint/tests remain mandatory.
- Performance evidence must include explicit constraints when live production-pilot measurement is unavailable.
