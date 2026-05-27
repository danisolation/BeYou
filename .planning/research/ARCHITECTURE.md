# Architecture Research: v1.6 Cross-Role UI Consistency & Production Performance

**Project:** Peerlight AI
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Researched:** 2026-05-26

## Existing Architecture Context

Peerlight AI has a FastAPI/PostgreSQL backend with SQLAlchemy/Alembic, cookie sessions, role/relationship authorization, readiness/operations metadata, and Next.js role portals. v1.5 added explicit runtime modes, production-pilot readiness, deployment guardrails, split smoke profiles, identity contracts, and metadata-only pilot operations.

v1.6 should modify existing surfaces rather than introduce a parallel architecture.

## Proposed Build Order

### Phase 33: Cross-role UI and performance baseline audit

**New artifacts**
- UI inventory/audit artifact in the phase directory.
- Performance baseline artifact with endpoint/route/query/payload candidates.

**Modified code likely**
- Tests only initially, plus small helpers if needed for safe measurement.

**Data flow**
- Record current role route behavior and backend endpoint timing without changing production behavior.

### Phase 34: Shared UI primitives and role shell consistency

**New/modified frontend modules**
- Shared lightweight components for page sections, cards, status badges, loading/error/empty states, privacy boundary callouts, and responsive table wrappers.
- Role dashboard pages updated to consume primitives while preserving role-specific copy and permission boundaries.

**Constraints**
- Components accept explicit safe props, not raw backend objects.
- No generic "render all metadata keys" component.

### Phase 35: Backend and DB performance instrumentation

**New/modified backend modules**
- Safe timing/query-count helpers in tests or service layer.
- Targeted instrumentation for slow endpoints and operations dashboard sections.

**Constraints**
- Timing metadata must be aggregate-only.
- No request bodies, emails, notes, transcripts, raw IDs, provider claims, or secrets in logs/operations.

### Phase 36: Query, index, and endpoint optimization

**Likely backend targets**
- Admin users and links list endpoints.
- Teacher/parent linked-student and SOS-signal checks.
- Adult summaries and history endpoints that may load broad data then slice in Python.
- Admin operations dashboard buckets.

**Data-flow changes**
- Batch relationship/SOS/user lookups.
- Push filtering, limiting, and ordering into SQL.
- Add indexes only for verified predicates and orderings.

**Migration constraints**
- Alembic migrations and SQLAlchemy model metadata must stay in sync.
- Schema drift check should run after index changes.

### Phase 37: Frontend data loading and route responsiveness

**Likely frontend targets**
- Student dashboard, teacher dashboard, parent dashboard, admin dashboard, operations page, and role-specific history/support pages.

**Data-flow changes**
- Reduce fetch waterfalls.
- Introduce scoped loading/error/empty states.
- Keep sensitive credentialed fetches no-store or scope cache keys to role/user/resource/reason/policy if caching is introduced.

### Phase 38: Final UI/performance release gates

**New/modified tests**
- Role UI consistency smoke tests.
- Privacy redline tests for new shared components and performance metadata.
- Backend route/query/payload regression tests for optimized endpoints.
- README/operator docs for performance evidence and remaining production constraints.

## Architecture Rules

1. Shared UI should be primitive-first, not role-meaning-first.
2. Role-specific authorization and privacy copy stay at role page/view-model boundaries.
3. Performance observability must be metadata-only.
4. Query optimization must preserve permission checks and audit semantics.
5. Frontend data loading improvements must not cache sensitive data across roles, users, relationships, policies, or runtime modes.
6. Success evidence must distinguish local deterministic gates, public demo behavior, and live production-pilot constraints.

## Files to Inspect During Planning

| Area | Candidate files |
|---|---|
| Role shells/pages | `frontend/app/(authenticated)/**/page.tsx`, `frontend/app/(authenticated)/layout.tsx` |
| Shared frontend | `frontend/components/**`, `frontend/lib/api.ts`, role API clients |
| Backend APIs | `backend/app/api/admin_*`, `backend/app/api/teacher.py`, `backend/app/api/parent.py`, student APIs |
| Services | `backend/app/services/users.py`, `links.py`, `adult_summaries.py`, `admin_operations.py`, `sos.py`, reports/history services |
| DB schema | `backend/app/db/models.py`, `backend/alembic/versions/*` |
| Tests | role UI tests, auth/privacy tests, operations tests, phase32 release gates |

## Roadmap Starting Point

Continue phase numbering from v1.5. The next milestone should start at Phase 33 unless the user explicitly resets numbering.
