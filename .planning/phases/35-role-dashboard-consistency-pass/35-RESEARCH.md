# Phase 35: Role Dashboard Consistency Pass - Research

**Researched:** 2026-05-26  
**Domain:** Next.js/React role dashboard presentation consistency, privacy-preserving UI, Vitest regression gates  
**Confidence:** HIGH — based on project planning artifacts, current implementation files, and local package/version inspection.

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Cross-Role Dashboard Structure
- **D-01:** Use a consistent dashboard hierarchy across all roles: role-aware `PageHeader`, visible privacy/data-boundary guidance, demo/walkthrough card where applicable, primary role action/status cards, and secondary lists/tables.
- **D-02:** Reuse Phase 34 presentation primitives (`PageHeader`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `ResponsiveTable`, `LoadingState`, `ErrorState`, `PrivacyBoundaryCard`, enhanced `EmptyState`) rather than creating a new design system or UI framework.
- **D-03:** Keep route-owned data fetching and existing API paths unchanged. Dashboard consistency is presentation/content organization only, not a data-loading or backend performance phase.
- **D-04:** Prefer small, route-local refactors and neutral shared components only when they remove duplicated presentation safely. Shared code must live under `frontend/components/` and must not import role route pages, API clients, auth helpers, or business-rule logic unless the module is intentionally route-owned.

#### Student Dashboard
- **D-05:** Preserve Student-first privacy and support copy. The dashboard should keep clear ownership language: student data is private by default, adult visibility is permission/SOS bounded, and Peerlight AI is supportive/non-diagnostic.
- **D-06:** Keep SOS as the strongest visual priority and preserve red/destructive styling only for SOS, urgent, high-risk, or true error states. Do not normalize SOS into neutral status cards.
- **D-07:** Harmonize Student cards and linked-adult/status sections with shared primitives, but do not remove the current student-owned flows: privacy review, mood check-in, test tâm lý, scenarios, support plan, chat, notification preferences, SOS confirmation, and SOS history.
- **D-08:** Student dashboard may show a richer set of actions than adult/admin dashboards because it is the primary self-support surface.

#### Teacher and Parent Dashboards
- **D-09:** Keep Teacher and Parent dashboards visually sibling-like through the neutral `AdultStudentList`, but preserve distinct role copy: Teacher can coordinate and update SOS status; Parent remains read-only/supportive.
- **D-10:** Preserve SOS-only adult visibility, active relationship checks, summary-only support posture, and controlled reason gates on protected subroutes. Phase 35 must not expose raw self-check answers, private notes, chat transcripts, raw identifiers, or per-student risk drilldowns.
- **D-11:** Adult empty states should remain supportive and bounded: no linked/SOS-eligible students means no student details, not a generic "no data" dashboard.
- **D-12:** Adult notification and support-overview cards should use consistent density and status badges while keeping SOS/high-risk visual semantics red/danger.

#### Admin Dashboard and Operations Surfaces
- **D-13:** Admin dashboard consistency should emphasize metadata-only operations. Harmonize entry cards, counts, and operations links without adding raw exports, raw audit browsers, destructive reset controls, risk leaderboards, or per-student drilldowns.
- **D-14:** Preserve existing Admin route destinations and copy for users, links, operations, reports, content, chatbot safety, mood check-ins, and privacy policy controls.
- **D-15:** Admin count/loading/error states may use shared primitives, but admin performance concerns like bounded user/link results or N+1 reduction are deferred to Phase 36.

#### States, Accessibility, and Responsive Behavior
- **D-16:** All four dashboards must use clear scoped loading, error, and empty states; primary dashboard load failures should render `ErrorState` with `role="alert"` rather than misleading empty or zero-count UI.
- **D-17:** Preserve keyboard/focus behavior, `min-h-11` targets, responsive grids, horizontal overflow for tables, accessible `role="status"` and `role="alert"` announcements, and the authenticated shell's skip-link behavior.
- **D-18:** Add or extend Phase 35 frontend tests to prove role-specific privacy boundaries, dashboard consistency, no cross-role route imports, no browser token storage, SOS red semantics, and Admin metadata-only redlines.
- **D-19:** Include visual walkthrough acceptance as a Phase 35 verification item because "feels like one product" cannot be fully proven by static tests alone.

### the agent's Discretion
- Choose exact component extraction boundaries and prop names as long as shared components remain presentation-only and role pages keep data ownership.
- Choose the minimum safe dashboard adoption set that satisfies ROLE-01 through ROLE-04 without pulling Phase 36/37 work forward.
- Choose whether to extend Phase 34 tests or add a dedicated `phase35-role-dashboard-consistency.test.tsx` file for traceability.
- Choose exact card ordering and spacing within the Phase 34 UI-SPEC hierarchy, provided Student-first safety, adult support-not-surveillance, Parent read-only, Teacher SOS handling, and Admin metadata-only posture remain visible.

### Deferred Ideas (OUT OF SCOPE)
- Backend pagination, batching, query/index changes, Admin count optimization, and adult summary SQL filtering belong to Phase 36.
- Frontend request waterfall reduction, caching/no-store policy changes, route-level data-loading optimization, skeleton strategy beyond existing states, and bundle review belong to Phase 37.
- Final UI/performance release evidence, post-optimization comparison, docs matrix, and live production-pilot constraints belong to Phase 38.
- New UI framework, shadcn migration, global theming system, analytics/APM, provider SSO, multi-school tenancy, external notifications, raw exports, risk leaderboards, raw audit browsers, per-student drilldowns, and destructive reset controls remain out of scope.
- Phase 34 human visual rhythm walkthrough remains accepted as a human review item; Phase 35 should incorporate a fresh visual dashboard walkthrough rather than blocking code planning on Phase 34.

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ROLE-01 | Student dashboard uses harmonized shell, cards, status surfaces, loading/error/empty patterns while preserving student-first privacy and support copy. | Student route already uses `LoadingState`, `ErrorState`, `SurfaceCard`, `EntryCard`, `ResponsiveTable`, `EmptyState`, and SOS confirmation copy; plan should finish rhythm consistency without changing Student-owned flows. |
| ROLE-02 | Teacher dashboard uses harmonized UI patterns while preserving SOS-only student visibility, active relationship checks, and teacher-specific SOS status actions. | Teacher page owns `/api/teacher/students` and passes teacher-specific CTA `Xem và cập nhật SOS` into neutral `AdultStudentList`; plan should refine shared presentation only. |
| ROLE-03 | Parent dashboard uses harmonized UI patterns while preserving read-only support posture, SOS-only student visibility, and summary-only privacy boundaries. | Parent page owns `/api/parent/students` and passes parent-specific CTA `Xem trạng thái SOS`; plan should keep Parent read-only copy distinct from Teacher. |
| ROLE-04 | Admin dashboard and operations surfaces use harmonized metadata-only panels without adding unsafe controls. | Admin dashboard uses `PageHeader`, `DemoGuideCard`, `EntryCard`, `LoadingState`, `ErrorState`, `/api/admin/users`, and `/api/admin/links`; plan should strengthen metadata-only copy and redline tests, not add new operations capabilities. |

## 1. Phase Implementation Summary

Phase 35 should be a presentation/content-organization pass over the four role dashboards, not a backend/API/auth/performance phase. The safest implementation is to reuse the Phase 34 primitives and preserve route-owned fetching while aligning dashboard rhythm: role-aware header, visible privacy/data-boundary card, demo guide, primary cards, secondary lists/tables, and scoped loading/error/empty states. [VERIFIED: `.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md`, `.planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md`]

Primary recommendation: create a dedicated Phase 35 frontend regression test first, then make small route-local UI refinements in Student, shared AdultStudentList, and Admin dashboard surfaces; do not introduce new dependencies, new API calls, caching, shadcn, data loaders, exports, drilldowns, or admin reset controls. [VERIFIED: `35-CONTEXT.md`, `35-UI-SPEC.md`, `frontend/components/ui-primitives.tsx`, current route files]

## 2. Current Dashboard Architecture by Role

### Shared primitive foundation

`frontend/components/ui-primitives.tsx` exports `PageHeader`, `Section`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `ResponsiveTable`, `LoadingState`, `ErrorState`, and `PrivacyBoundaryCard`. `LoadingState` uses `role="status"` and `aria-live="polite"`, while `ErrorState` uses `role="alert"`. [VERIFIED: `frontend/components/ui-primitives.tsx`]

`EmptyState` supports route-provided heading/body/action/children/className and should remain the main empty-state surface for Phase 35. [VERIFIED: `frontend/components/empty-state.tsx`]

`DemoGuideCard` already uses `SurfaceCard`, supports role-specific steps/actions, and keeps action links at `min-h-11`. [VERIFIED: `frontend/components/demo-guide-card.tsx`]

### Authenticated shell

`frontend/app/(authenticated)/layout.tsx` owns auth loading, `getCurrentUser`, privacy acknowledgement redirect, wrong-role blocking, logout, active role labels, skip link, student navigation, and non-student role navigation. Phase 35 should not move this ownership into dashboard components. [VERIFIED: `frontend/app/(authenticated)/layout.tsx`]

The shell already displays role-boundary copy for Student, Teacher, Parent, and Admin and filters role navigation to the active role. [VERIFIED: `frontend/app/(authenticated)/layout.tsx`, `frontend/tests/role-dashboards.test.tsx`]

### Student dashboard

`frontend/app/(authenticated)/student/page.tsx` is a client component with route-local `useEffect` and `Promise.all` for `/api/student/profile`, `listStudentSosAlerts()`, and `getMoodCheckInReminder()`. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`]

The Student dashboard already renders `LoadingState` on primary load, `ErrorState` on primary load failure, and `EmptyState` if no profile is available. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`, `frontend/tests/phase34-final-regression.test.tsx`]

The Student dashboard contains the core flow order: welcome/privacy link, demo guide, optional mood reminder, wellbeing card grid, quick wellbeing table, SOS panel, SOS status list, and linked adult groups. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`, `35-UI-SPEC.md`]

SOS confirmation copy and red button styling are present and tested; Phase 35 must preserve `Gửi SOS hỗ trợ`, `Xác nhận gửi tín hiệu hỗ trợ`, `Xác nhận gửi SOS`, and `Ở lại trang này`. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`, `frontend/tests/phase34-final-regression.test.tsx`, `35-UI-SPEC.md`]

Likely Student improvement seam: convert remaining local rounded card sections, especially `MoodReminderCard`, SOS panel, and `LinkedAdultGroup`, toward existing primitives while keeping the red SOS panel visually strongest. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`, `35-CONTEXT.md`, `35-UI-SPEC.md`]

### Teacher dashboard

`frontend/app/(authenticated)/teacher/page.tsx` owns `/api/teacher/students`, `getTeacherSupportOverview()`, and `getNotifications()`, then delegates presentation to `AdultStudentList`. [VERIFIED: `frontend/app/(authenticated)/teacher/page.tsx`]

Teacher passes role context `teacher`, summary CTA `Xem tóm tắt hỗ trợ`, SOS base path `/teacher/sos-alerts`, and SOS CTA `Xem và cập nhật SOS`. [VERIFIED: `frontend/app/(authenticated)/teacher/page.tsx`]

Teacher must remain able to coordinate/update SOS status while avoiding raw self-check answers, private notes, chat transcripts, raw identifiers, or surveillance framing. [VERIFIED: `35-CONTEXT.md`, `35-UI-SPEC.md`, `.planning/REQUIREMENTS.md`]

### Parent dashboard

`frontend/app/(authenticated)/parent/page.tsx` owns `/api/parent/students`, `getParentSupportOverview()`, and `getNotifications()`, then delegates presentation to `AdultStudentList`. [VERIFIED: `frontend/app/(authenticated)/parent/page.tsx`]

Parent passes role context `parent`, summary CTA `Xem tóm tắt hỗ trợ`, SOS base path `/parent/sos-alerts`, and SOS CTA `Xem trạng thái SOS`. [VERIFIED: `frontend/app/(authenticated)/parent/page.tsx`]

Parent must remain read-only/supportive and summary-only; it should not gain Teacher-style status update language. [VERIFIED: `35-CONTEXT.md`, `35-UI-SPEC.md`, `.planning/REQUIREMENTS.md`]

### Adult shared presentation

`frontend/components/adult-student-list.tsx` is the neutral Teacher/Parent presentation component and contains `PageHeader`, adult boundary card, `DemoGuideCard`, notification list, linked student cards, support overview, and SOS CTAs. [VERIFIED: `frontend/components/adult-student-list.tsx`]

Adult list currently displays linked student `full_name`, `email`, school, class, relationship/link status, summary links, and support/SOS overview. Phase 35 should not add more raw fields and should avoid increasing adult visibility beyond existing route-owned contracts. [VERIFIED: `frontend/components/adult-student-list.tsx`, `35-UI-SPEC.md`]

Likely Adult improvement seam: strengthen use of `PrivacyBoundaryCard` or consistent `SurfaceCard` density, align notification empty state with `EmptyState`, and keep Teacher/Parent sibling-like while preserving CTA distinction. [VERIFIED: `frontend/components/adult-student-list.tsx`, `35-CONTEXT.md`, `35-UI-SPEC.md`]

### Admin dashboard

`frontend/app/(authenticated)/admin/page.tsx` is a client component with route-local `Promise.all` for `/api/admin/users` and `/api/admin/links` count surfaces. [VERIFIED: `frontend/app/(authenticated)/admin/page.tsx`]

Admin dashboard already uses `PageHeader`, `DemoGuideCard`, `EntryCard`, `LoadingState`, and `ErrorState`, and links to operations, reports, chatbot, mood check-ins, content, privacy policy, users, and links. [VERIFIED: `frontend/app/(authenticated)/admin/page.tsx`]

Admin dashboard must stay metadata-only and must not add raw exports, raw audit browsers, risk leaderboards, per-student drilldowns, or destructive reset controls. [VERIFIED: `35-CONTEXT.md`, `35-UI-SPEC.md`, `.planning/REQUIREMENTS.md`, `frontend/tests/phase32-release-gates-ui.test.tsx`]

## 3. Safe Implementation Seams and Files Likely to Change

| File | Safe change type | Planner cautions |
|---|---|---|
| `frontend/app/(authenticated)/student/page.tsx` | Align remaining local card sections with primitives; preserve current API calls, flow links, SOS confirmation, and red semantics. | Do not remove student-owned flows or make SOS less prominent. |
| `frontend/components/adult-student-list.tsx` | Refine neutral adult layout, boundary card, notification/empty/support card rhythm, and status badge usage. | Do not import role pages or add business logic/API calls. |
| `frontend/app/(authenticated)/teacher/page.tsx` | Minimal prop/copy adjustments only if shared adult component needs them. | Keep `/api/teacher/students` route ownership and teacher SOS update CTA. |
| `frontend/app/(authenticated)/parent/page.tsx` | Minimal prop/copy adjustments only if shared adult component needs them. | Keep `/api/parent/students` route ownership and read-only CTA. |
| `frontend/app/(authenticated)/admin/page.tsx` | Tighten metadata-only copy, count loading/error surfaces, and entry-card rhythm. | Do not add new admin operations or unsafe control labels. |
| `frontend/tests/phase35-role-dashboard-consistency.test.tsx` | Recommended new test file for traceable ROLE-01..ROLE-04 coverage. | Prefer this over overloading Phase 34 tests. |
| Existing tests listed below | Extend only where necessary for regression coverage. | Keep Phase 34/32 tests as backstop gates. |

Files that should normally not change in Phase 35: backend routes, database models/migrations, `frontend/lib/api.ts`, auth/session helpers, performance scripts, caching configuration, and authenticated layout auth/role ownership. [VERIFIED: `35-CONTEXT.md`, `35-UI-SPEC.md`, `.planning/ROADMAP.md`]

## 4. Privacy/Security Redlines and Threat Considerations

### Redlines planner must encode

- Do not add backend/API/auth changes, database optimization, frontend data-loading optimization, caching, shadcn/UI framework, raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, or destructive reset controls. [VERIFIED: user phase description, `35-CONTEXT.md`, `35-UI-SPEC.md`]
- Do not add browser token storage or OAuth/SSO token handling. Auth remains backend-owned cookie-authenticated API calls. [VERIFIED: `.planning/PROJECT.md`, `copilot-instructions.md`, `frontend/tests/auth-portals.test.tsx`, `frontend/tests/phase32-release-gates-ui.test.tsx`]
- Do not weaken privacy acknowledgement routing, wrong-role blocking, active relationship checks, SOS-only adult visibility, controlled reason gates, Teacher SOS posture, Parent read-only posture, or Admin metadata-only operations. [VERIFIED: `35-UI-SPEC.md`, `35-CONTEXT.md`, `frontend/app/(authenticated)/layout.tsx`]
- Do not expose raw self-check answers, private notes, chat transcripts, provider claims, secrets, request bodies, free-text access reasons, or new raw identifiers in adult/admin surfaces. [VERIFIED: `35-UI-SPEC.md`, `.planning/REQUIREMENTS.md`, `frontend/tests/phase32-release-gates-ui.test.tsx`]
- Do not normalize SOS/high-risk into neutral/accent badges; red/danger remains reserved for SOS, urgent/high-risk, and true error states. [VERIFIED: `35-UI-SPEC.md`, `frontend/components/ui-primitives.tsx`, `frontend/app/(authenticated)/student/page.tsx`, `frontend/components/adult-student-list.tsx`]

### Threat considerations

| Threat | STRIDE | Phase 35 mitigation |
|---|---|---|
| Cross-role data leakage via shared component imports | Information Disclosure | Shared code must stay under neutral `frontend/components/`; tests should reject Parent importing Teacher route page and reject route page imports inside primitives. |
| Browser token storage regression | Information Disclosure / Elevation of Privilege | Static tests should reject `localStorage.setItem`, `sessionStorage.setItem`, `access_token`, `refresh_token`, `id_token`; existing `apiFetch` credentials behavior remains cookie-based. |
| Surveillance framing in adult/admin copy | Information Disclosure / Repudiation harm | Adult copy must frame support, SOS, and summary-only boundaries; Admin copy must say metadata-only and avoid risk leaderboard/drilldown vocabulary. |
| Misleading success-shaped failure states | Tampering / Safety UX risk | Primary load failure must render `ErrorState` with `role="alert"` and must not show zero-count success UI. |
| SOS urgency dilution | Safety UX risk | Student SOS remains strongest red action; adult SOS statuses/actions remain danger/red when open or high-risk. |
| Accessibility regression | Denial of Service for keyboard/screen-reader users | Preserve skip link, focus-visible behavior, `min-h-11`, `role="status"`, `role="alert"`, and responsive overflow tables. |

## 5. Test Strategy

Recommended command set:

```bash
npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/phase20-responsive-smoke-ui.test.tsx tests/auth-portals.test.tsx tests/phase32-release-gates-ui.test.tsx
npm --prefix frontend run lint
npm --prefix frontend run build
```

Nyquist validation section is intentionally omitted because `.planning/config.json` sets `workflow.nyquist_validation` to `false`. [VERIFIED: `.planning/config.json`]

### ROLE-01..ROLE-04 test map

| Requirement | Test focus | Suggested assertions |
|---|---|---|
| ROLE-01 | Student dashboard rhythm/privacy/SOS | Renders privacy link, demo guide, wellbeing grid, quick table, red SOS CTA, SOS confirmation copy, `role="status"`/`role="alert"` states, and Student empty state. |
| ROLE-02 | Teacher dashboard rhythm/SOS handling | Renders Teacher boundary copy, route-owned teacher API path, `AdultStudentList`, `Xem và cập nhật SOS`, danger styling when SOS exists, and no raw private content. |
| ROLE-03 | Parent dashboard rhythm/read-only | Renders Parent boundary copy, route-owned parent API path, `AdultStudentList`, `Xem trạng thái SOS`, no update wording, and no raw private content. |
| ROLE-04 | Admin metadata-only | Renders metadata-only header/demo/entry cards/count states and rejects unsafe labels: export/download/raw audit/reset/drilldown/risk leaderboard/per-student detail. |

### Static regression gates

- No cross-role route imports: check that Parent does not import Teacher page and shared components do not import `@/app/(authenticated)/...` route pages. [VERIFIED: existing Phase 34 final regression pattern]
- No browser token storage: reject `localStorage.setItem`, `sessionStorage.setItem`, `access_token`, `refresh_token`, and `id_token` in touched files. [VERIFIED: existing auth/Phase 32 tests]
- No unsafe Admin controls: reject button/link labels matching `Export|Xuất|Download|Tải xuống|reset|drilldown|risk leaderboard|xếp hạng nguy cơ|Chi tiết học sinh`. [VERIFIED: existing Phase 32/34 tests]
- Accessible states: assert loading uses `role="status"` and load failures use `role="alert"`. [VERIFIED: `ui-primitives.tsx`, Phase 34 tests]
- Visual rhythm: assert representative dashboard sources/rendered DOM include `PageHeader` or equivalent header surface, privacy/data-boundary guidance, demo guide, primary card grid classes, and scoped empty/error/loading states. [VERIFIED: `35-UI-SPEC.md`]

### Human verification item

A human desktop/mobile walkthrough remains required because “feels like one Peerlight AI product” cannot be fully proven by static tests. The walkthrough should cover Student, Teacher, Parent, and Admin dashboards; confirm Student SOS remains visually strongest; confirm Teacher/Parent are sibling-like but role-distinct; confirm Admin is metadata-only; and confirm Vietnamese privacy/support tone remains visible. [VERIFIED: `35-UI-SPEC.md`, `34-VERIFICATION.md`]

## 6. Recommended Plan Breakdown with Waves/Dependencies

### Wave 0 — Safety test harness first

Create `frontend/tests/phase35-role-dashboard-consistency.test.tsx` before UI edits. Cover ROLE-01..ROLE-04, static redlines, no cross-role imports, no token storage, admin unsafe controls, accessible loading/error states, and representative rhythm assertions. Depend on current Phase 34 tests as regression baseline. [VERIFIED: `35-CONTEXT.md`, existing test files]

### Wave 1 — Student dashboard consistency

Refine `student/page.tsx` to use existing primitives more consistently for remaining local surfaces while preserving route-owned data fetching, privacy link, all student-owned flows, mood reminder semantics, quick table overflow, SOS confirmation, SOS history, linked adults, and red SOS prominence. Run Phase 35 test plus Phase 34 final regression after this wave. [VERIFIED: `frontend/app/(authenticated)/student/page.tsx`, `35-UI-SPEC.md`]

### Wave 2 — Teacher/Parent shared adult dashboard consistency

Refine `AdultStudentList` and only adjust Teacher/Parent route props if necessary. Keep route-owned `/api/teacher/students` and `/api/parent/students`, keep support overview and notifications in route pages, preserve Teacher update CTA and Parent read-only CTA, improve adult empty/notification/support card rhythm, and keep SOS/high-risk danger styling. Run Phase 35, role dashboard, responsive smoke, and auth portal tests. [VERIFIED: `frontend/components/adult-student-list.tsx`, teacher/parent page files, `35-UI-SPEC.md`]

### Wave 3 — Admin metadata-only dashboard consistency

Refine `admin/page.tsx` entry cards/count states/copy to match dashboard rhythm and explicitly maintain metadata-only operations. Do not touch backend admin APIs, operations backend, reports backend, or add new admin controls. Run Phase 35 plus Phase 32 release-gate UI tests. [VERIFIED: `frontend/app/(authenticated)/admin/page.tsx`, `frontend/tests/phase32-release-gates-ui.test.tsx`, `35-UI-SPEC.md`]

### Wave 4 — Integrated regression and visual walkthrough evidence

Run targeted frontend suite, lint, and build. Record human visual walkthrough requirement in verification notes: desktop/mobile, four roles, Student SOS priority, Teacher/Parent sibling distinction, Admin metadata-only, Vietnamese support tone. [VERIFIED: `34-VERIFICATION.md`, `35-UI-SPEC.md`, `package.json` scripts]

## 7. Explicit Out-of-Scope List for Phase 36/37/38 Boundaries

### Belongs to Phase 36

- Backend pagination, batching, query/index changes, Admin count optimization, adult summary SQL filtering, N+1 reduction, schema migrations, and database indexes. [VERIFIED: `.planning/ROADMAP.md`, `33-PERFORMANCE-BASELINE.md`, `35-CONTEXT.md`]

### Belongs to Phase 37

- Frontend request waterfall reduction, duplicate request elimination, caching/no-store policy changes, scoped cache keys/invalidation, route-level data-loading optimization, skeleton strategy beyond existing states, and bundle review. [VERIFIED: `.planning/ROADMAP.md`, `33-PERFORMANCE-BASELINE.md`, `35-CONTEXT.md`]

### Belongs to Phase 38

- Final UI/performance release evidence, post-optimization comparison, docs matrix, production/public demo evidence distinctions, milestone release gates, and live production-pilot constraints. [VERIFIED: `.planning/ROADMAP.md`, `33-PERFORMANCE-BASELINE.md`, `35-CONTEXT.md`]

### Remains out of v1.6 Phase 35 entirely

- shadcn migration, new UI framework, global theming rewrite, analytics/APM, provider SSO, multi-school tenancy, external Zalo/SMS/push delivery, raw exports, risk leaderboards, raw audit browsers, per-student drilldowns, destructive reset controls, and browser token storage. [VERIFIED: `.planning/REQUIREMENTS.md`, `35-CONTEXT.md`, `35-UI-SPEC.md`]

## Standard Stack

| Tool/library | Version/status | Purpose | Phase 35 guidance |
|---|---:|---|---|
| Next.js | 16.2.6 local install | App routing/client pages | Use existing route pages; no routing architecture change. |
| React | 19.2.6 local install | UI rendering | Continue client component patterns already present. |
| TypeScript | 6.0.3 local install | Type safety | Keep route/component prop contracts explicit. |
| Tailwind CSS | 3.4.19 local install | Styling | Reuse manual Peerlight AI Tailwind primitives; no shadcn/new framework. |
| Vitest | 4.1.7 local install | Frontend tests | Add dedicated Phase 35 regression test. |
| Testing Library | `@testing-library/react` 16.3.2, `user-event` 14.6.1 | Component assertions | Continue render/static assertions used by existing tests. |
| lucide-react | 1.16.0 local install | Existing icon usage | Use only where already aligned; no new icon dependency. |

No new package installation is recommended for Phase 35. [VERIFIED: `frontend/package.json`, local `npm --prefix frontend list --depth=0 --json`, `35-UI-SPEC.md`]

## Project Constraints from copilot-instructions.md

- Communicate in Vietnamese. [VERIFIED: `copilot-instructions.md`]
- Do not make direct repo edits outside GSD workflow unless explicitly asked to bypass it. [VERIFIED: `copilot-instructions.md`]
- Preserve backend-owned cookie authentication and no browser token storage. [VERIFIED: `copilot-instructions.md`]
- Operations/admin surfaces must be metadata-only and not student monitoring. [VERIFIED: `copilot-instructions.md`]
- Student-facing UI must remain supportive, calm, mobile-friendly, Vietnamese-first, and avoid heavy medicalized language. [VERIFIED: `copilot-instructions.md`]
- Teacher/parent visibility remains SOS-only for linked students who have sent SOS. [VERIFIED: `copilot-instructions.md`]
- Admin operations must not add raw exports, risk leaderboards, or per-student risk drilldowns. [VERIFIED: `copilot-instructions.md`]

## Sources

### Primary
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`
- `.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md`
- `.planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md`
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md`
- `.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md`
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-CONTEXT.md`
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-UI-SPEC.md`
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-VERIFICATION.md`
- `copilot-instructions.md`

### Implementation
- `frontend/components/ui-primitives.tsx`
- `frontend/components/empty-state.tsx`
- `frontend/components/demo-guide-card.tsx`
- `frontend/components/adult-student-list.tsx`
- `frontend/app/(authenticated)/layout.tsx`
- `frontend/app/(authenticated)/student/page.tsx`
- `frontend/app/(authenticated)/teacher/page.tsx`
- `frontend/app/(authenticated)/parent/page.tsx`
- `frontend/app/(authenticated)/admin/page.tsx`

### Test references
- `frontend/tests/phase34-final-regression.test.tsx`
- `frontend/tests/role-dashboards.test.tsx`
- `frontend/tests/phase20-responsive-smoke-ui.test.tsx`
- `frontend/tests/auth-portals.test.tsx`
- `frontend/tests/phase32-release-gates-ui.test.tsx`

## Metadata

**Confidence breakdown:**
- Scope/boundaries: HIGH — locked in Phase 35 context, UI-SPEC, roadmap, and requirements.
- Architecture: HIGH — verified against current dashboard/component source files.
- Test strategy: HIGH — based on existing Vitest patterns and Phase 32/34 regression gates.
- Visual cohesion: MEDIUM — static assertions can support it, but final acceptance requires human walkthrough.

**Research date:** 2026-05-26  
**Valid until:** 2026-06-25, unless Phase 36/37 changes dashboard data-loading or backend contracts first.
