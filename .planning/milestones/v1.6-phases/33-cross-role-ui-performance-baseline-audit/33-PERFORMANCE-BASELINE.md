# Phase 33 Performance Baseline

## Scope Boundary

Phase 33 records baseline evidence only. Measurement is local, deterministic, and test-side:

- Frontend route evidence comes from `frontend/scripts/phase33-frontend-baseline.mjs`, which scans selected route source files and prints aggregate JSON to stdout only.
- Backend API evidence comes from `backend/tests/test_phase33_performance_baseline.py`, which measures TestClient duration, serialized payload byte count, status category, and SQL query-count candidates in memory.
- No production runtime logging, APM, analytics, schema changes, migrations, indexes, caching, pagination, batching, backend fixes, frontend fixes, or UI changes are introduced here.
- Findings below are candidates routed to later phases, not Phase 33 implementation instructions.

## Evidence Table

| Environment | Route/API | Command/source | Duration/cold-warm note | Payload bytes | Waterfall count | Waterfall source | Query-count/candidate | Privacy check | Severity | Candidate follow-up phase |
|---|---|---|---|---|---:|---|---|---|---|---|
| local deterministic | `/student` | `node scripts/phase33-frontend-baseline.mjs` | local static scan; `.next` build evidence unavailable until `npm --prefix frontend run build` | unavailable | 1 | static-fetch-proxy | frontend fetch candidate | aggregate route/source/counts only | P2 | Phase 37 |
| local deterministic | `/teacher` | `node scripts/phase33-frontend-baseline.mjs` | local static scan; `.next` build evidence unavailable until `npm --prefix frontend run build` | unavailable | 1 | static-fetch-proxy | frontend fetch candidate | aggregate route/source/counts only | P2 | Phase 37 |
| local deterministic | `/parent` | `node scripts/phase33-frontend-baseline.mjs` | local static scan; `.next` build evidence unavailable until `npm --prefix frontend run build` | unavailable | 1 | static-fetch-proxy | frontend fetch candidate | aggregate route/source/counts only | P2 | Phase 37 |
| local deterministic | `/admin` | `node scripts/phase33-frontend-baseline.mjs` | local static scan; `.next` build evidence unavailable until `npm --prefix frontend run build` | unavailable | 1 | static-fetch-proxy | frontend fetch candidate | aggregate route/source/counts only | P2 | Phase 37 |
| local deterministic | `/admin/operations`, `/admin/users`, `/admin/links`, `/admin/reports` | `node scripts/phase33-frontend-baseline.mjs` | local static scan; selected admin subroutes present | unavailable | 0 | static-fetch-proxy | frontend fetch candidate; imported API helpers counted where directly scanned | aggregate route/source/counts only | P2 | Phase 37 |
| local deterministic | `/api/auth/me`, `/api/student/profile`, `/api/student/sos-alerts`, `/api/student/reminders/mood-check-in` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected in test-side structures | payloadBytes collected in memory only | unavailable | unavailable | queryCountCandidate collected with SQLAlchemy event listener | aggregate status/duration/bytes/query counts only | P2 | Phase 38 |
| local deterministic | `/api/teacher/students`, `/api/parent/students` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected in test-side structures | payloadBytes collected in memory only | unavailable | unavailable | linked-student plus SOS-signal query candidate | aggregate status/duration/bytes/query counts only | P1 | Phase 36 |
| local deterministic | `/api/teacher/support-overview`, `/api/parent/support-overview` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected in test-side structures | payloadBytes collected in memory only | unavailable | unavailable | support overview per-student query candidate | aggregate status/duration/bytes/query counts only | P1 | Phase 36 |
| local deterministic | `/api/{role}/students/{student}/support-summary` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected with reason gate preserved | payloadBytes collected in memory only | unavailable | unavailable | broad support summary load candidate | aggregate status/duration/bytes/query counts only | P1 | Phase 36 |
| local deterministic | `/api/admin/users`, `/api/admin/links` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected in test-side structures | payloadBytes collected in memory only | unavailable | unavailable | full-list and link hydration candidates | aggregate status/duration/bytes/query counts only | P1 | Phase 36 |
| local deterministic | `/api/admin/operations/dashboard`, `/api/admin/reports/aggregate` | `python -m pytest tests/test_phase33_performance_baseline.py -q` | local warm TestClient timings collected in test-side structures | payloadBytes collected in memory only | unavailable | unavailable | operations bucket/report aggregate candidates | aggregate status/duration/bytes/query counts only | P1 | Phase 36 |
| public demo if available | selected frontend role routes and backend APIs | not run in Phase 33 local execution | public demo must be labeled separately if later measured | unavailable | unavailable | unavailable | unavailable | must not be treated as production-pilot proof | P2 | Phase 38 |
| Render/Vercel cold | selected frontend role routes and backend APIs | not run in Phase 33 local execution | cold-start evidence unavailable in local deterministic run | unavailable | unavailable | unavailable | unavailable | no external load or stress test run | P2 | Phase 38 |
| Render/Vercel warm | selected frontend role routes and backend APIs | not run in Phase 33 local execution | warm deployed evidence unavailable in local deterministic run | unavailable | unavailable | unavailable | unavailable | no external load or stress test run | P2 | Phase 38 |
| live production-pilot unavailable unless safe pilot readiness exists | selected frontend role routes and backend APIs | constrained until safe pilot URLs/configuration and `/health/ready=ready` exist | unavailable by design | unavailable | unavailable | unavailable | unavailable | live pilot evidence remains separate from public demo proof | P2 | Phase 38 |

## Hotspot Queue

| Candidate | Why it is queued as candidate only | Severity | Candidate follow-up phase |
|---|---|---|---|
| Admin users/links full-list and link hydration | Admin users currently list all users; admin links list all links and hydrate linked users per link. Phase 33 records this as a likely unbounded/N+1 candidate without changing behavior. | P1 | Phase 36 |
| Teacher/Parent linked students and SOS checks | Adult linked-student lists iterate linked students and check SOS/permission gates per student. Safety gates must remain intact while Phase 36 evaluates batching. | P1 | Phase 36 |
| Support overview per-student queries | Support overview can combine latest self-check, latest SOS, and open SOS count per linked student. This is a query-count candidate, not a conclusion. | P1 | Phase 36 |
| Support summary broad loads | Adult summary paths preserve reason gates and summary-only privacy; broad recent summary/support-plan/mood loads are queued for SQL-side filtering review. | P1 | Phase 36 |
| Operations dashboard buckets | Operations dashboard builds many metadata-only sections. Candidate optimization must keep sanitizer and metadata-only framing. | P1 | Phase 36 |
| Frontend role fetch waterfalls | Student, Teacher, Parent, and Admin dashboards show static request-producing candidates; Phase 37 should reduce avoidable waterfalls without browser token storage or unsafe caching. | P2 | Phase 37 |
| Baseline-to-post-optimization comparison | Phase 38 should compare this baseline with optimized evidence and decide final release gate thresholds or accepted constraints. | P2 | Phase 38 |

Severity guide:

- `P0`: privacy risk, unbounded sensitive data exposure, or evidence that a safety gate is weakened.
- `P1`: likely N+1/unbounded query or production-visible slowness candidate.
- `P2`: payload/waterfall/build-size concern that is visible but not safety-critical.

## Candidate Routing Queue

Phase 33 records performance candidate routing only. The rows below are handoff queues for downstream plans and do not authorize Phase 33 optimization, pagination, batching, caching, indexing, migration, schema, backend behavior, frontend behavior, UI, production logging, analytics, or APM changes.

### Phase 36

| Candidate | Why it is routed here | Safe evidence label |
|---|---|---|
| Admin users/links full-list and link hydration | Backend/database hot-path work owns bounded list and hydration candidates while preserving admin metadata-only serialization. | endpoint/status/duration/payload/query-count labels only |
| Teacher/Parent linked students and SOS checks | Backend/database work owns linked-student and SOS-signal query-count candidates while preserving active relationship and SOS-only visibility gates. | endpoint/role/query-count labels only |
| Support overview and support summary broad loads | Backend/database work owns SQL-side filtering and query-count candidate review while preserving reason gates and summary-only adult boundaries. | endpoint/role/query-count labels only |
| Operations dashboard buckets | Backend/database work owns expensive metadata aggregation candidates while preserving operations sanitizers. | endpoint/status/query-count labels only |

### Phase 37

| Candidate | Why it is routed here | Safe evidence label |
|---|---|---|
| Student, Teacher, Parent, and Admin route fetch waterfalls | Frontend loading/render work owns static fetch candidate comparison and perceived loading behavior. | route/source/count labels only |
| Build evidence follow-up | Frontend route/build review belongs with downstream render and bundle comparison work. | route/build-availability labels only |

### Phase 38

| Candidate | Why it is routed here | Safe evidence label |
|---|---|---|
| Baseline-to-post-optimization comparison | Release gates own final threshold decisions, accepted constraints, and comparison evidence after Phases 36 and 37. | environment/command/metric labels only |
| Public demo, deployed cold/warm, and live production-pilot constraints | Release gates own environment distinction and must not treat public demo evidence as live production-pilot proof. | environment labels only |

## Environment Constraints

- `local deterministic`: completed via Node helper and pytest helper on the local repository; evidence is repeatable and aggregate-only.
- `public demo if available`: not measured in this plan; future public demo evidence must not be labeled as live production-pilot evidence.
- `Render/Vercel cold`: not measured in this plan; no external load or stress testing was run.
- `Render/Vercel warm`: not measured in this plan; warm deployed evidence remains a later comparison input.
- `live production-pilot unavailable unless safe pilot readiness exists`: constrained until safe pilot URLs/configuration and readiness are available.

## Privacy Redlines

Allowed evidence:

- route/API labels
- status categories
- duration or cold/warm labels
- payload byte counts
- fetch/waterfall counts
- query-count candidates
- command/source names
- follow-up phase routing

Forbidden evidence:

- raw request or response bodies
- raw identifiers, mail addresses, names, private notes, transcripts, self-check or scenario answers
- provider claims, secrets, token-like values, browser storage, cookies, or auth headers
- free-text access reasons
- raw exports, risk ranking lists, per-student drilldowns, or raw audit browsers

## Commands Used

```powershell
powershell -NoProfile -Command "Push-Location frontend; node --test scripts/phase33-frontend-baseline.test.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node scripts/phase33-frontend-baseline.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; Pop-Location"
cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_phase33_performance_baseline.py -q
```

Final Phase 33 fail-fast verification also passed:

```powershell
npm --prefix frontend run test -- tests/phase33-ui-inventory.test.tsx
cd frontend; node --test scripts/phase33-frontend-baseline.test.mjs
cd frontend; node --test scripts/phase33-artifact-redline.test.mjs
cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_phase33_performance_baseline.py -q
```

Phase 33 records baseline and routing only. Backend/database optimization belongs to Phase 36, frontend loading/render/build work belongs to Phase 37, and final release gates/comparisons belong to Phase 38.
