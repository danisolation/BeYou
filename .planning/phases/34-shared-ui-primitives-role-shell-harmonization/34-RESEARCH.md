# Phase 34: Shared UI Primitives & Role Shell Harmonization - Research

**Researched:** 2026-05-26  
**Domain:** Next.js/React shared presentation primitives, authenticated role shell, privacy-safe UI harmonization  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Shared Primitive Scope
- Create small, composable primitives rather than a broad design-system rewrite: page header, section/card shell, entry card, status badge, responsive table wrapper, loading state, error state, empty state, and privacy/role boundary card.
- Keep primitives presentation-only. They may receive labels, tone, hrefs, and children, but must not import route pages, API clients, auth helpers, role-specific service modules, or business-rule logic.
- Reuse existing Peerlight AI visual tokens and class patterns (`rounded-3xl`, `bg-white`, `bg-secondary`, `text-display`, `text-heading`, `text-body`, `text-label`, `text-accent`) instead of introducing a new CSS framework or runtime theming layer.
- Preserve existing components where useful: extend or wrap `EmptyState`, align `DemoGuideCard` and dashboard cards with the new primitives, and avoid duplicating card/table/loading/error styles across route pages.

#### Role Shell and Navigation
- Harmonize the authenticated shell by extracting role metadata, role navigation, student navigation, skip-link, loading, wrong-role, and privacy-redirect surfaces into reusable helpers/components while keeping the shell as the single owner of auth/role routing.
- Keep the Student sidebar richer because it has more student-owned self-support routes; Teacher, Parent, and Admin should use a consistent compact role shell and active-role indicator without exposing other roles' links.
- Role-entry and navigation copy must always identify the active role and explain the data boundary in Vietnamese support tone.
- Do not create shared imports from Student pages into Teacher/Parent/Admin pages or from role pages into shared primitives. Shared code must live under neutral `components` or `lib` paths.

#### Privacy, Safety, and Copy Boundaries
- Preserve Student-first privacy copy, adult support-not-surveillance copy, Parent read-only posture, Teacher SOS handling posture, and Admin metadata-only posture.
- Do not weaken privacy acknowledgement redirects, wrong-role handling, active relationship checks, SOS-only adult visibility, controlled reason gates, or metadata-only operations boundaries.
- SOS/high-risk visual semantics stay distinct and cannot be normalized into neutral status colors; red/danger styling remains reserved for SOS or high-risk safety communication.
- UI copy should remain Vietnamese-first, supportive, concise, and non-diagnostic. Shared primitives can standardize structure, but role pages supply role-specific privacy meaning.

#### Accessibility and Responsive Behavior
- Preserve the skip link, keyboard-focusable controls, active-page `aria-current`, minimum 44px-ish touch targets via `min-h-11`, accessible loading/status/error announcements, and responsive overflow for tables/nav.
- Loading, error, empty, and status primitives should expose the right semantics (`role="status"` or `role="alert"` where appropriate) without forcing raw data into the DOM.
- Responsive table wrappers should use horizontal overflow and keep table semantics intact rather than converting sensitive tabular data into custom div grids.
- Tests must cover the new primitives and at least the authenticated shell behavior that Phase 34 changes.

#### Delivery and Verification Strategy
- Implement Phase 34 in small plans: first shared primitives, then shell/navigation harmonization, then route adoption/tests/docs.
- Prioritize routes/components identified by Phase 33: `AuthenticatedLayout`, Student dashboard shell/cards, Teacher/Parent `RoleStudentList`, Admin dashboard entry cards, and existing empty/demo guide components.
- Avoid production runtime logging, analytics, APM, new data fetching, new API contracts, or schema changes in this phase.
- Validate with targeted Vitest coverage plus lint/build if touched TypeScript/Next surfaces require it.

### the agent's Discretion

- Choose exact component/file names and prop shapes as long as they remain presentation-only and reusable.
- Choose the smallest route adoption set that proves the primitives and shell harmonization without accidentally moving Phase 35 dashboard-consistency work into Phase 34.
- Choose whether to update existing tests or add a Phase 34-specific test file for clearer traceability.

### Deferred Ideas (OUT OF SCOPE)

- Full Student/Teacher/Parent/Admin dashboard content redesign belongs to Phase 35.
- Backend pagination, batching, query/index changes, and admin/users link count optimization belong to Phase 36.
- Data loading, request waterfall reduction, caching, and route render optimization belong to Phase 37.
- Final performance thresholds, post-optimization comparison, and release documentation belong to Phase 38.
- New UI framework, theming system, raw analytics/APM, provider SSO, multi-school tenancy, external notifications, raw exports, risk leaderboards, per-student drilldowns, and destructive reset controls remain out of v1.6 Phase 34 scope.
</user_constraints>

## Project Constraints (from copilot-instructions.md)

- Communicate in Vietnamese with the user, but project UI copy remains Vietnamese-first by product contract. [VERIFIED: copilot-instructions.md]
- Do not make direct repository edits outside GSD workflow unless explicitly asked to bypass it. [VERIFIED: copilot-instructions.md]
- Protected layouts should block child rendering before redirecting privacy-blocked or wrong-role users. [VERIFIED: copilot-instructions.md]
- Cookie-authenticated frontend calls and no browser token storage are required. [VERIFIED: copilot-instructions.md]
- Privacy boundary: raw self-check answers and chatbot transcripts remain student-owned by default; adults see summaries and SOS workflow state only. [VERIFIED: copilot-instructions.md]
- Operations surfaces must stay metadata-only and must not add raw exports, risk leaderboards, or per-student risk drilldowns. [VERIFIED: copilot-instructions.md]
- No project skills were found under `.github/skills` or `.agents/skills`. [VERIFIED: filesystem probe]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIC-02 | Shared lightweight UI primitives exist for page headers, sections, cards, status badges, responsive table wrappers, loading states, error states, and empty states without importing role-specific business logic. | Use `frontend/components/ui-primitives.tsx` or small neutral component files; primitives accept presentation props only and never import route/API/auth modules. [VERIFIED: 34-CONTEXT.md, 34-UI-SPEC.md] |
| UIC-03 | Student, Teacher, Parent, and Admin screens keep role-specific privacy boundary copy while using consistent Peerlight AI visual rhythm and Vietnamese support tone. | Use shared structure but route-supplied copy; privacy/role boundary content must remain role-specific. [VERIFIED: 34-CONTEXT.md, 34-UI-SPEC.md, route source files] |
| UIC-04 | Cross-role UI changes preserve responsive behavior, keyboard focus, skip-link behavior, accessible status/error announcements, and SOS/high-risk color semantics. | Keep `min-h-11`, skip link, `aria-current`, table overflow, `role=status`, `role=alert`, and red SOS styling. [VERIFIED: 34-UI-SPEC.md, layout.tsx, student/page.tsx] |
| ROLE-05 | Shared role-entry, dashboard navigation, and guidance patterns make it clear which role is active and what data boundaries apply. | Extract role metadata/nav helpers while keeping `AuthenticatedLayout` as auth/role owner; add active role and boundary guidance copy. [VERIFIED: 34-CONTEXT.md, layout.tsx] |
</phase_requirements>

## Summary

Phase 34 should be planned as a **presentation-layer harmonization**, not a dashboard redesign or data-flow change. The project already uses Next.js client route pages, Tailwind classes, `lucide-react`, and Vitest; no new UI framework or shadcn initialization is allowed. [VERIFIED: 34-UI-SPEC.md, frontend/package.json, route source files]

The highest-value work is: create neutral shared primitives under `frontend/components/`, move Teacher/Parent shared adult presentation out of the Teacher route page, and lightly refactor `AuthenticatedLayout` helpers/components while preserving auth, privacy acknowledgement, wrong-role routing, skip link, role-specific navigation, and logout ownership. [VERIFIED: 34-CONTEXT.md, layout.tsx, teacher/page.tsx, parent/page.tsx]

**Primary recommendation:** Plan three waves: shared primitives first, role shell/adult shared presentation second, targeted adoption/tests third. [VERIFIED: 34-CONTEXT.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | installed/current `16.2.6` | App Router pages/layouts | Existing frontend framework and current installed dependency. [VERIFIED: npm list, npm registry] |
| React / React DOM | installed/current `19.2.6` | Client components | Existing UI runtime and current installed dependency. [VERIFIED: npm list, npm registry] |
| TypeScript | `latest` in package.json | Component prop contracts | Existing frontend typing model. [VERIFIED: frontend/package.json] |
| Tailwind CSS | installed `3.4.19`; registry latest is `4.3.0` | Manual Peerlight AI utility styling | UI contract explicitly says use existing manual Tailwind primitives and no new design system; do not upgrade Tailwind in Phase 34. [VERIFIED: npm list, npm registry, 34-UI-SPEC.md] |
| lucide-react | installed/current `1.16.0` | Existing shell icons | Existing dependency used by authenticated Student shell. [VERIFIED: npm list, npm registry, layout.tsx] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | installed/current `4.1.7` | Component/source regression tests | Add Phase 34 primitive/shell tests. [VERIFIED: npm list, npm registry, vitest.config.ts] |
| @testing-library/react | installed/current `16.3.2` | DOM-oriented component tests | Assert role copy, links, aria semantics, and no cross-role import regression. [VERIFIED: npm list, npm registry, existing tests] |
| @testing-library/user-event | `latest` in package.json | Interaction tests | Use for logout/nav/focus behavior if changing shell interaction. [VERIFIED: frontend/package.json, role-dashboards.test.tsx] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Tailwind primitives | shadcn/ui init | Explicitly out of scope and `shadcn_initialized: false`. [VERIFIED: 34-UI-SPEC.md] |
| Neutral `frontend/components/*` primitives | Importing from route pages | Parent currently imports from Teacher route; Phase 34 must remove this anti-pattern. [VERIFIED: parent/page.tsx] |
| Presentation-only props | Shared API/auth/data hooks in primitives | Violates locked decision that primitives must not import API clients/auth/business logic. [VERIFIED: 34-CONTEXT.md, 34-UI-SPEC.md] |

**Installation:** No new packages. Use existing dependencies only. [VERIFIED: 34-UI-SPEC.md, frontend/package.json]

**Version verification:**
- `next@16.2.6`, published 2026-05-07. [VERIFIED: npm registry]
- `react@19.2.6` / `react-dom@19.2.6`, published 2026-05-06. [VERIFIED: npm registry]
- `lucide-react@1.16.0`, published 2026-05-14. [VERIFIED: npm registry]
- `vitest@4.1.7`, published 2026-05-20. [VERIFIED: npm registry]
- `@testing-library/react@16.3.2`, published 2026-01-19. [VERIFIED: npm registry]
- `tailwindcss` installed is `3.4.19`; registry latest is `4.3.0`, but Phase 34 should keep Tailwind v3 project setup. [VERIFIED: npm list, npm registry, 34-UI-SPEC.md]

## Architecture Patterns

### Recommended Project Structure

```text
frontend/
├── components/
│   ├── ui-primitives.tsx          # PageHeader, Section, SurfaceCard, EntryCard, StatusBadge, ResponsiveTable, LoadingState, ErrorState
│   ├── empty-state.tsx            # enhanced EmptyState, preserving existing import path
│   ├── adult-student-list.tsx     # neutral Teacher/Parent shared presentation
│   ├── role-boundary-card.tsx     # optional split if not colocated with ui-primitives
│   ├── demo-guide-card.tsx        # align to SurfaceCard/EntryCard classes without behavior change
│   ├── demo-badge.tsx             # keep existing demo affordance
│   └── demo-banner.tsx            # keep existing demo affordance
├── app/(authenticated)/
│   ├── layout.tsx                 # remains auth/role/privacy owner
│   ├── student/page.tsx           # narrow primitive adoption only
│   ├── teacher/page.tsx           # data fetching remains here
│   ├── parent/page.tsx            # data fetching remains here
│   └── admin/page.tsx             # entry-card alignment only
└── tests/
    └── phase34-ui-primitives-role-shell.test.tsx
```

[VERIFIED: 34-CONTEXT.md, 34-UI-SPEC.md, existing source tree]

### Pattern 1: Presentation-only primitive props

**What:** Shared primitives receive text, tone, href/action props, children, and className escape hatches; they do not fetch data or decide authorization. [VERIFIED: 34-CONTEXT.md, 34-UI-SPEC.md]

**Example:**
```tsx
// Source: derived from 34-UI-SPEC.md and existing component class patterns
<SurfaceCard>
  <PageHeader
    eyebrow="Cổng giáo viên"
    title="Ranh giới hỗ trợ của giáo viên"
    description="Chỉ xem học sinh được liên kết và tín hiệu SOS được phép xem."
  />
</SurfaceCard>
```

### Pattern 2: Route-owned business logic, component-owned presentation

**What:** Teacher and Parent pages keep their own `apiFetch` / support overview calls, then pass arrays and copy to a neutral adult list component. [VERIFIED: teacher/page.tsx, parent/page.tsx, 34-CONTEXT.md]

**Planner instruction:** Move `RoleStudentList`, `PrivacyBoundaryCard`, `NotificationList`, and `SupportOverviewCard` presentation out of `teacher/page.tsx` into a neutral component module; leave `apiFetch("/api/teacher/students")`, `apiFetch("/api/parent/students")`, `getTeacherSupportOverview`, and `getParentSupportOverview` in route pages. [VERIFIED: teacher/page.tsx, parent/page.tsx]

### Pattern 3: Shell extraction without ownership transfer

**What:** Extract role labels, nav item rendering, boundary copy, loading/wrong-role/privacy redirect surfaces into helpers/components, but keep `AuthenticatedLayout` responsible for `getCurrentUser`, redirect decisions, logout, and expected-role matching. [VERIFIED: layout.tsx, 34-UI-SPEC.md]

### Anti-Patterns to Avoid

- **Broad design-system rewrite:** Phase 34 is explicitly lightweight primitives only. [VERIFIED: 34-CONTEXT.md]
- **Route-page imports across roles:** Parent currently imports `RoleStudentList` from Teacher; this must be replaced with neutral component import. [VERIFIED: parent/page.tsx]
- **Changing fetch timing/caching:** Phase 37 owns waterfall/loading optimization; Phase 34 should not change data fetching behavior. [VERIFIED: 34-CONTEXT.md, ROADMAP.md]
- **Normalizing SOS red into neutral status badges:** SOS/high-risk red styling must remain distinct. [VERIFIED: 34-UI-SPEC.md, student/page.tsx]
- **Putting auth/API imports in primitives:** Forbidden by Primitive Contract. [VERIFIED: 34-UI-SPEC.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full design system/theme runtime | New theme provider/token engine | Small Tailwind primitives using existing tokens | Runtime theming is out of scope. [VERIFIED: 34-UI-SPEC.md] |
| Custom table-as-div responsive UI | Div grids for table data | `ResponsiveTable` wrapper with `overflow-x-auto` and native `<table>` children | Contract requires table semantics remain intact. [VERIFIED: 34-UI-SPEC.md, student/page.tsx] |
| Role-specific duplicate cards | Repeated `rounded-3xl bg-white p-5 sm:p-6 shadow-sm` classes | `SurfaceCard` / `EntryCard` | These class patterns are duplicated across Student, Teacher, Parent, Admin pages. [VERIFIED: route source files] |
| Ad hoc loading/error text | Plain `<p>` with no semantic role | `LoadingState role="status"` and `ErrorState role="alert"` | UI contract requires accessible status/error announcements. [VERIFIED: 34-UI-SPEC.md] |
| Cross-role shared route code | Parent importing from Teacher route | Neutral `components/adult-student-list.tsx` | Phase 34 explicitly requires neutral shared presentation. [VERIFIED: parent/page.tsx, 34-UI-SPEC.md] |

**Key insight:** The risky complexity is not visual styling; it is preserving privacy/auth role boundaries while reducing duplicated presentation. [VERIFIED: 34-CONTEXT.md, copilot-instructions.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — Phase 34 changes presentation components and imports only; no renamed database keys or persisted IDs are in scope. [VERIFIED: 34-CONTEXT.md, ROADMAP.md] | None |
| Live service config | None — production logging/APM/analytics/service configuration changes are out of scope. [VERIFIED: 34-CONTEXT.md] | None |
| OS-registered state | None — no scheduled tasks/services/process registrations are in phase scope. [VERIFIED: 34-CONTEXT.md] | None |
| Secrets/env vars | None — no auth/session/API/env variable names should change. [VERIFIED: 34-CONTEXT.md, copilot-instructions.md] | None |
| Build artifacts / installed packages | No package changes required; frontend installed dependencies already support work. [VERIFIED: npm list, frontend/package.json] | Run normal frontend tests/lint/build after source changes; no reinstall planned. |

## Common Pitfalls

### Pitfall 1: Accidentally moving Phase 35 dashboard redesign into Phase 34
**What goes wrong:** Planner schedules broad dashboard content/card redesign instead of primitives and narrow adoption. [VERIFIED: ROADMAP.md, 34-CONTEXT.md]  
**How to avoid:** Limit adoption to shell, primitive proof points, Teacher/Parent presentation extraction, enhanced `EmptyState`, and low-risk EntryCard alignment. [VERIFIED: 34-CONTEXT.md]

### Pitfall 2: Breaking privacy redirect or wrong-role child blocking
**What goes wrong:** Shell refactor renders children before privacy/wrong-role gate surfaces. [VERIFIED: layout.tsx, copilot-instructions.md]  
**How to avoid:** Keep `privacyRedirectRequired ? ... : wrongRole ? ... : children` ordering and test it. [VERIFIED: layout.tsx, role-dashboards.test.tsx, phase32-release-gates-ui.test.tsx]

### Pitfall 3: Parent continues importing from Teacher route
**What goes wrong:** Shared adult presentation stays coupled to `app/(authenticated)/teacher/page`. [VERIFIED: parent/page.tsx]  
**How to avoid:** Add a static test that rejects `@/app/(authenticated)/teacher/page` imports in Parent. [VERIFIED: existing source-test pattern in phase32-release-gates-ui.test.tsx]

### Pitfall 4: Accessible loading/error semantics remain inconsistent
**What goes wrong:** Shared `LoadingState`/`ErrorState` exists but routes keep plain text states. [VERIFIED: student/page.tsx, teacher/page.tsx, parent/page.tsx, layout.tsx]  
**How to avoid:** Adopt primitives in shell and representative role pages; assert `role="status"` and `role="alert"` in Phase 34 tests. [VERIFIED: 34-UI-SPEC.md]

### Pitfall 5: StatusBadge makes SOS look harmless
**What goes wrong:** A generic green/neutral badge is applied to SOS/high-risk states. [VERIFIED: 34-UI-SPEC.md]  
**How to avoid:** Implement explicit `tone="sos" | "danger"` red variants and reserve them only for SOS/high-risk/destructive safety communication. [VERIFIED: 34-UI-SPEC.md, student/page.tsx]

## Code Examples

### Shared primitive shape

```tsx
// Source: 34-UI-SPEC.md + existing Tailwind class patterns
export function LoadingState({ message = "Đang tải thông tin..." }) {
  return (
    <div role="status" className="rounded-3xl bg-white p-5 text-body shadow-sm sm:p-6">
      {message}
    </div>
  );
}

export function ErrorState({ message = "Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn." }) {
  return (
    <div role="alert" className="rounded-3xl border border-[#F3C0C0] bg-white p-5 text-body text-red-700 shadow-sm sm:p-6">
      {message}
    </div>
  );
}
```

[VERIFIED: 34-UI-SPEC.md, existing component classes]

### Neutral adult presentation import

```tsx
// Source: parent/page.tsx anti-pattern and 34-UI-SPEC.md target
import { AdultStudentList } from "@/components/adult-student-list";
```

[VERIFIED: parent/page.tsx, 34-UI-SPEC.md]

### Responsive table wrapper

```tsx
// Source: existing QuickWellbeingTable pattern in student/page.tsx
export function ResponsiveTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
```

[VERIFIED: student/page.tsx, 34-UI-SPEC.md]

## State of the Art

| Old Approach | Current Phase 34 Approach | When Changed | Impact |
|--------------|---------------------------|--------------|--------|
| Page-local duplicated card/table/loading classes | Neutral lightweight primitives | Phase 34 | Reduces drift without design-system rewrite. [VERIFIED: 34-CONTEXT.md] |
| Parent imports shared presentation from Teacher route | Neutral `frontend/components/` adult presentation | Phase 34 | Removes cross-role route coupling. [VERIFIED: parent/page.tsx, 34-UI-SPEC.md] |
| Plain loading text | `LoadingState` with `role="status"` | Phase 34 | Improves accessible announcements. [VERIFIED: 34-UI-SPEC.md] |
| Varied error surfaces | `ErrorState` with `role="alert"` and Vietnamese safe recovery copy | Phase 34 | Aligns failure states without exposing raw data. [VERIFIED: 34-UI-SPEC.md] |

**Deprecated/outdated for this phase:**
- shadcn init or third-party UI registry usage is not applicable. [VERIFIED: 34-UI-SPEC.md]
- Runtime theming layer is out of scope. [VERIFIED: 34-CONTEXT.md]
- New frontend caching/data fetching changes are deferred to Phase 37. [VERIFIED: ROADMAP.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | No unverified assumptions used. | — | — |

## Open Questions

1. **Exact primitive file split**
   - What we know: `ui-primitives.tsx` or small component files are both allowed. [VERIFIED: 34-CONTEXT.md]
   - What's unclear: Planner may choose one file or multiple files.
   - Recommendation: Use one `ui-primitives.tsx` plus keep/enhance existing `empty-state.tsx` unless file size becomes unwieldy. [VERIFIED: existing component layout]

2. **Smallest adoption set**
   - What we know: Shell, Teacher/Parent shared presentation, existing empty/demo guide components, Student/Admin entry cards are prioritized. [VERIFIED: 34-CONTEXT.md]
   - What's unclear: Whether to touch every role page in Phase 34.
   - Recommendation: Do not touch every dashboard; prove primitives on representative surfaces and leave full dashboard consistency to Phase 35. [VERIFIED: ROADMAP.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Frontend tests/build | ✓ | `v22.17.0` | — [VERIFIED: environment probe] |
| npm | Package scripts/version checks | ✓ | `10.9.2` | — [VERIFIED: environment probe] |
| Next.js | Frontend app | ✓ | `16.2.6` installed | — [VERIFIED: npm list] |
| React | Components | ✓ | `19.2.6` installed | — [VERIFIED: npm list] |
| Vitest | Component tests | ✓ | `4.1.7` installed | — [VERIFIED: npm list] |
| Tailwind CSS | Styling | ✓ | `3.4.19` installed | Do not upgrade in Phase 34. [VERIFIED: npm list, 34-UI-SPEC.md] |

**Missing dependencies with no fallback:** None. [VERIFIED: environment probe]  
**Missing dependencies with fallback:** None. [VERIFIED: environment probe]

## Validation Architecture

Skipped because `.planning/config.json` explicitly sets `workflow.nyquist_validation` to `false`. [VERIFIED: .planning/config.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | `AuthenticatedLayout` keeps backend-owned session check via `getCurrentUser`; no token storage changes. [VERIFIED: layout.tsx, copilot-instructions.md] |
| V3 Session Management | yes | Cookie-authenticated API calls remain; no browser token storage. [VERIFIED: auth-portals.test.tsx, phase32-release-gates-ui.test.tsx] |
| V4 Access Control | yes | Role routing, wrong-role handling, active relationships, SOS-only adult visibility remain backend/page-owned, not primitive-owned. [VERIFIED: 34-CONTEXT.md] |
| V5 Input Validation | limited | Phase 34 should not add new data inputs except preserving existing SOS textarea/forms. [VERIFIED: student/page.tsx, 34-CONTEXT.md] |
| V6 Cryptography | no direct changes | No crypto/session implementation changes. [VERIFIED: 34-CONTEXT.md] |

### Known Threat Patterns for Phase 34 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-role data leakage via shared component imports | Information Disclosure | Neutral presentation components; no route/API/auth imports in primitives. [VERIFIED: 34-UI-SPEC.md] |
| Privacy gate bypass during shell refactor | Elevation/Information Disclosure | Keep `AuthenticatedLayout` as owner of privacy redirect and wrong-role handling. [VERIFIED: layout.tsx, 34-UI-SPEC.md] |
| Raw sensitive data exposure in UI copy/tests | Information Disclosure | Preserve redlines against raw IDs/emails/notes/transcripts/answers/provider claims/secrets/request bodies/free-text reasons/browser tokens. [VERIFIED: 34-UI-SPEC.md] |
| SOS severity diluted by generic status component | Safety/Integrity | Preserve red/danger SOS semantics; do not normalize to neutral badge. [VERIFIED: 34-UI-SPEC.md] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-CONTEXT.md` — locked implementation decisions, scope, delivery strategy. [VERIFIED: file read]
- `.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-UI-SPEC.md` — approved UI contract, primitives, copy, spacing/color/a11y redlines. [VERIFIED: file read]
- `.planning/REQUIREMENTS.md` — UIC-02, UIC-03, UIC-04, ROLE-05. [VERIFIED: file read]
- `.planning/ROADMAP.md` — Phase 34/35/36/37/38 boundaries. [VERIFIED: file read]
- `.planning/STATE.md` — milestone decisions and current Phase 34 focus. [VERIFIED: file read]
- `frontend/app/(authenticated)/layout.tsx` — current shell/auth/privacy/nav implementation. [VERIFIED: file read]
- `frontend/app/(authenticated)/student/page.tsx` — current Student cards/table/SOS/accessibility patterns. [VERIFIED: file read]
- `frontend/app/(authenticated)/teacher/page.tsx` and `parent/page.tsx` — current `RoleStudentList` route-coupling issue. [VERIFIED: file read]
- `frontend/app/(authenticated)/admin/page.tsx` — current admin entry card pattern. [VERIFIED: file read]
- Existing frontend tests listed in prompt — current testing patterns for role dashboards, responsive smoke, auth/no-token, release redlines. [VERIFIED: file read]

### Secondary (MEDIUM confidence)
- npm registry version queries for `next`, `react`, `react-dom`, `lucide-react`, `vitest`, `@testing-library/react`, `tailwindcss`. [VERIFIED: npm registry]
- Environment probes for Node/npm and installed frontend packages. [VERIFIED: environment probe]

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions verified from installed deps and npm registry. [VERIFIED: npm list, npm registry]
- Architecture: HIGH — constrained by approved UI spec and existing code. [VERIFIED: 34-UI-SPEC.md, route files]
- Pitfalls: HIGH — derived from locked decisions, UI inventory, and current source. [VERIFIED: 33-UI-INVENTORY.md, 34-CONTEXT.md, route files]

**Research date:** 2026-05-26  
**Valid until:** 2026-06-25 for project-specific architecture; re-check npm versions before package changes. [VERIFIED: current date + npm registry]
