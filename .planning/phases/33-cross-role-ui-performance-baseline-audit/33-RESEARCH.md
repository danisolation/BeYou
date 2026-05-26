# Phase 33: Cross-Role UI & Performance Baseline Audit - Research

**Status:** Complete
**Source:** `gsd-phase-researcher` draft saved by orchestrator after file-write gate approval

## RESEARCH COMPLETE

## User Constraints

Locked Phase 33 decisions from `33-CONTEXT.md`:

- Create two execution artifacts: `33-UI-INVENTORY.md` and `33-PERFORMANCE-BASELINE.md`. `[VERIFIED: 33-CONTEXT.md]`
- UI inventory covers Student dashboard, SOS, mood check-ins, self-checks, chat, support plan; Teacher/Parent dashboards, support summaries, SOS details; Admin dashboard, operations, users, links, reports. `[VERIFIED: 33-CONTEXT.md]`
- Audit happy/loading/error/empty/blocked/privacy/responsive/keyboard/focus/status-alert states. `[VERIFIED: 33-CONTEXT.md]`
- Severity: P0 privacy/SOS/a11y, P1 consistency/state drift, P2 polish. `[VERIFIED: 33-CONTEXT.md]`
- Performance baseline includes frontend role routes and backend hot paths: `/api/auth/me`, student profile/SOS/reminders, teacher/parent students/support overview/support summary, admin users/links/operations/reports. `[VERIFIED: 33-CONTEXT.md]`
- Evidence must be aggregate-only and must not include raw bodies, IDs, emails, names, notes, transcripts, answers, provider claims, secrets, free-text reasons, exports, risk leaderboards, drilldowns, or browser tokens. `[VERIFIED: 33-CONTEXT.md]`
- Measurement must be ephemeral/test-side only; no production runtime logging. `[VERIFIED: 33-CONTEXT.md]`
- Findings route to Phases 34, 35, 36, 37, or 38; Phase 33 must not fix them. `[VERIFIED: 33-CONTEXT.md]`

## Project Constraints

- Communicate in Vietnamese. `[VERIFIED: copilot-instructions.md]`
- Backend is Python/FastAPI; frontend is Next.js/TypeScript. `[VERIFIED: copilot-instructions.md]`
- Cookie-authenticated frontend calls; no browser token storage. `[VERIFIED: copilot-instructions.md + frontend/lib/api.ts]`
- Admin operations must remain metadata-only; no raw exports, risk leaderboards, per-student drilldowns, or destructive reset controls. `[VERIFIED: copilot-instructions.md]`
- Protected layouts should block child rendering before privacy/wrong-role redirects. `[VERIFIED: copilot-instructions.md + frontend/app/(authenticated)/layout.tsx]`
- No direct repo edits outside GSD workflow unless explicitly bypassed. `[VERIFIED: copilot-instructions.md]`

## Standard Stack

Use existing stack only; do not add a new observability/APM/UI framework.

| Area | Tooling | Version / Evidence |
|---|---|---|
| Frontend app | Next.js, React, TypeScript, Tailwind, Vitest/jsdom | Next `16.2.6`, React `19.2.6`, Vitest `4.1.7`, Tailwind `3.4.19` via `npm ls`. `[VERIFIED: npm ls]` |
| Backend app | FastAPI, SQLAlchemy, Alembic, pytest, ruff | FastAPI `0.136.1`, SQLAlchemy `2.0.49`, Alembic `1.18.4`, pytest `9.0.3`, ruff `0.15.13` via installed metadata. `[VERIFIED: local package metadata]` |
| Measurement | Test-side helpers/scripts | Required because Phase 33 forbids production runtime logging. `[VERIFIED: 33-CONTEXT.md]` |

## Exact Frontend Routes to Inventory

Primary route files found:

- Shell: `frontend/app/(authenticated)/layout.tsx` - skip link, role shell, student nav, privacy redirect, wrong-role handling, logout. `[VERIFIED: codebase view]`
- Student:
  - `/student` -> `student/page.tsx`
  - `/student/chat`
  - `/student/mood-check-ins`
  - `/student/mood-check-ins/history`
  - `/student/self-checks`
  - `/student/self-checks/history`
  - `/student/self-checks/results/[attemptId]`
  - `/student/support-plan`
- Teacher:
  - `/teacher`
  - `/teacher/sos-alerts/[alertId]`
  - `/teacher/students/[studentId]/self-check-summaries`
  - `/teacher/students/[studentId]/support-summary`
- Parent:
  - `/parent`
  - `/parent/sos-alerts/[alertId]`
  - `/parent/students/[studentId]/self-check-summaries`
  - `/parent/students/[studentId]/support-summary`
- Admin:
  - `/admin`
  - `/admin/operations`
  - `/admin/users`
  - `/admin/links`
  - `/admin/reports`

Key UI drift candidates:

- Student shell is richer than non-student role shell. `[VERIFIED: layout.tsx]`
- Teacher and Parent share `RoleStudentList` from `teacher/page.tsx`, and Parent imports it cross-route. `[VERIFIED: parent/page.tsx + teacher/page.tsx]`
- Loading states are mostly plain text across dashboards. `[VERIFIED: student/page.tsx, teacher/page.tsx, parent/page.tsx, admin/page.tsx]`
- Existing reusable components include `EmptyState`, `DemoGuideCard`, `DemoBadge`. `[VERIFIED: imports in route files]`
- Admin users/links pages currently render names/emails in UI; Phase 33 artifacts must classify these fields instead of copying sample values. `[VERIFIED: admin users/links pages + 33-CONTEXT.md]`

## Exact Backend APIs / Services to Baseline

API mount facts:

- `/api/auth/me` is implemented by `backend/app/api/me.py`. `[VERIFIED: codebase view]`
- Routers are mounted in `backend/app/main.py`; backend router paths should not double-prefix `/api`. `[VERIFIED: main.py + copilot-instructions.md]`

Hot paths:

| Scope | Endpoint(s) | Implementation files | Baseline concern |
|---|---|---|---|
| Auth | `/api/auth/me` | `api/me.py`, `api/auth.py` | Session/current user cost. `[VERIFIED: codebase view]` |
| Student profile | `/api/student/profile` | `api/student.py` | Linked adult join and privacy acknowledgement check. `[VERIFIED: codebase view]` |
| Student SOS | `/api/student/sos-alerts` | `api/sos.py`, `services/sos.py` | SOS list limit 50 plus status events per alert candidate. `[VERIFIED: services/sos.py]` |
| Teacher students | `/api/teacher/students` | `api/teacher.py` | Loop checks SOS signal and permission per student. `[VERIFIED: api/teacher.py]` |
| Parent students | `/api/parent/students` | `api/parent.py` | Same pattern as teacher. `[VERIFIED: api/parent.py]` |
| Support overview | `/api/teacher/support-overview`, `/api/parent/support-overview` | `services/sos.py` | Per-student latest self-check, latest SOS, open SOS count candidates. `[VERIFIED: services/sos.py]` |
| Support summary | `/api/{role}/students/{id}/support-summary` | `api/adult_summaries.py`, `services/adult_summaries.py` | Support plan, mood, shared note, reason gate paths. `[VERIFIED: services/adult_summaries.py]` |
| Admin users | `/api/admin/users` | `api/admin_users.py`, `services/users.py` | `list_users` returns all ordered users; no pagination yet. `[VERIFIED: services/users.py]` |
| Admin links | `/api/admin/links` | `api/admin_links.py`, `services/links.py` | `list_links` returns all links and `_link_response` does per-link `db.get` hydration. `[VERIFIED: api/admin_links.py + services/links.py]` |
| Admin operations | `/api/admin/operations/dashboard` | `api/admin_operations.py`, `services/admin_operations.py` | Multi-section metadata dashboard with audit, readiness, smoke, identity, session summaries. `[VERIFIED: services/admin_operations.py]` |
| Admin reports | `/api/admin/reports` | `api/admin_reports.py`, frontend reports route | Aggregate privacy report route is in scope. `[VERIFIED: main.py + frontend admin reports page]` |

## Recommended Plan Split

1. Inventory scaffold
   - Add or run a Phase 33 UI inventory checklist/test helper that enumerates route/state matrix.
   - Output later to `33-UI-INVENTORY.md`.
   - Do not refactor UI.

2. Frontend route/request baseline
   - Use Vitest/jsdom mocks to count `fetch` calls per role dashboard and selected subroutes.
   - Use `npm --prefix frontend run build` for route/build evidence.
   - Avoid real browser tokens and avoid raw response capture.

3. Backend timing/payload/query candidate baseline
   - Use pytest/TestClient or direct service calls with seeded/demo test data.
   - Measure duration with test-side timing only.
   - Measure payload bytes from serialized response length, but store only endpoint, status category, byte count, and duration.
   - Count SQL statements test-side if feasible using SQLAlchemy event listeners, but record only aggregate count per endpoint.

4. Redline artifact gate
   - Add a script/test that scans generated Phase 33 artifacts for forbidden markers/language.
   - It must reject raw IDs/emails/names/notes/transcripts/answers/provider claims/secrets/token-like strings/export/risk-leaderboard/drilldown/browser-token language.

5. Routing queue
   - Every finding must route to Phase 34, 35, 36, 37, or 38.

## Recommended Verification Commands

Windows-safe commands:

```powershell
npm --prefix frontend run test -- tests/role-dashboards.test.tsx
npm --prefix frontend run test -- tests/phase20-responsive-smoke-ui.test.tsx
npm --prefix frontend run test -- tests/phase32-release-gates-ui.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run build

cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_phase32_release_gates.py -q
.\.venv\Scripts\python.exe -m pytest tests/test_admin_users_links.py tests/test_phase14_adult_support_summaries.py tests/test_phase4_sos_backend.py -q
.\.venv\Scripts\python.exe -m ruff check .
```

## Environment Availability

| Dependency | Available | Version |
|---|---:|---|
| Node | yes | `v22.17.0` `[VERIFIED: local probe]` |
| npm | yes | `10.9.2` `[VERIFIED: local probe]` |
| Python | yes | `3.12.7` `[VERIFIED: local probe]` |
| git | yes | `2.52.0.windows.1` `[VERIFIED: local probe]` |
| curl | yes | available `[VERIFIED: local probe]` |
| frontend `node_modules` | yes | present `[VERIFIED: local probe]` |
| backend `.venv` | yes | present `[VERIFIED: local probe]` |

## Common Pitfalls

- Treating public demo smoke as production-pilot evidence. `[VERIFIED: REQUIREMENTS.md + STATE.md]`
- Copying raw payloads into performance artifacts. `[VERIFIED: 33-CONTEXT.md]`
- Adding production logging/APM in Phase 33. `[VERIFIED: 33-CONTEXT.md]`
- Fixing UI or performance during baseline. `[VERIFIED: 33-CONTEXT.md]`
- Optimizing by weakening privacy acknowledgement, role checks, reason gates, audit, or safety copy. `[VERIFIED: REQUIREMENTS.md]`

## Open Questions (RESOLVED)

1. RESOLVED: Phase 33 will create the lightest repeatable test-side helpers/scripts/tests because redline gates and baseline evidence need repeatability. `[DECIDED BY PLAN 33-01/33-02/33-03]`
2. RESOLVED: Screenshots are optional only for unclear UI drift; the required artifact remains a text route/state/category matrix with aggregate-only evidence. `[DECIDED BY 33-CONTEXT.md + PLAN 33-01]`
