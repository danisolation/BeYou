# Phase 35: Role Dashboard Consistency Pass - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `35-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 35-role-dashboard-consistency-pass
**Areas discussed:** Cross-role dashboard structure, Student dashboard, Teacher/Parent dashboards, Admin dashboard, states/accessibility/responsive behavior
**Mode:** Autonomous smart discuss. The user has a standing preference to defer design decisions to the agent and prefer autonomous execution, so recommended safe defaults were selected without additional prompts.

---

## Cross-Role Dashboard Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Primitive-backed shared rhythm | Use Phase 34 primitives to align header, boundary, cards, status, tables, loading/error/empty states while keeping role data local. | Yes |
| Full dashboard redesign | Rebuild all role dashboards with a new information architecture. | No |
| Leave dashboards mostly as-is | Only add narrow tests and defer presentation cleanup. | No |

**User's choice:** Auto-selected recommended approach: primitive-backed shared rhythm.
**Notes:** This best matches Phase 35 scope and avoids moving Phase 36/37 work forward.

---

## Student Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve rich Student-first dashboard with cleaner primitive rhythm | Keep all current Student flows and SOS prominence, harmonize cards/status sections with primitives. | Yes |
| Simplify Student dashboard to match adult/admin density | Reduce student action density for visual parity. | No |
| Add new Student dashboard capabilities | Add new filters/actions/content beyond current route behavior. | No |

**User's choice:** Auto-selected recommended approach: preserve rich Student-first dashboard with cleaner primitive rhythm.
**Notes:** Student is the primary self-support surface; parity should not erase Student-first privacy/support meaning.

---

## Teacher and Parent Dashboards

| Option | Description | Selected |
|--------|-------------|----------|
| Sibling adult dashboards with distinct role copy | Refine `AdultStudentList` so Teacher/Parent feel aligned while Teacher retains SOS handling and Parent remains read-only. | Yes |
| One generic adult dashboard copy | Use identical copy/CTA language for Teacher and Parent. | No |
| Split Teacher/Parent completely again | Duplicate adult presentation back into route pages. | No |

**User's choice:** Auto-selected recommended approach: sibling adult dashboards with distinct role copy.
**Notes:** This preserves Phase 34's neutral adult presentation while meeting ROLE-02 and ROLE-03.

---

## Admin Dashboard and Operations Surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only dashboard consistency | Harmonize entry cards/counts/links while preserving no raw exports, no risk leaderboards, no drilldowns, no destructive reset controls. | Yes |
| Add admin data exploration controls | Add richer drilldowns/export-like controls for operational insight. | No |
| Defer Admin consistency | Leave Admin aside until release gates. | No |

**User's choice:** Auto-selected recommended approach: metadata-only dashboard consistency.
**Notes:** ROLE-04 requires harmonized admin surfaces without weakening support-not-surveillance boundaries.

---

## States, Accessibility, and Responsive Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Test-backed consistency gate | Add Phase 35 tests for all role dashboards, privacy copy, accessible states, responsive/table behavior, no-token storage, and unsafe Admin controls. | Yes |
| Manual-only visual pass | Rely on visual review without automated regression coverage. | No |
| Broad E2E/browser visual suite | Add heavy browser visual regression tooling now. | No |

**User's choice:** Auto-selected recommended approach: test-backed consistency gate.
**Notes:** A human visual walkthrough remains necessary for product feel, but automated tests should guard privacy and accessibility invariants.

---

## the agent's Discretion

- Exact component boundaries and prop names.
- Whether Phase 35 uses a new dedicated test file or extends Phase 34 role-dashboard tests.
- Exact card ordering and spacing within the Phase 34 UI-SPEC rhythm.
- The minimal safe route/component touch set required to satisfy ROLE-01 through ROLE-04.

## Deferred Ideas

- Backend/database optimization: Phase 36.
- Frontend fetch/render/caching optimization: Phase 37.
- Final release evidence and post-optimization comparison: Phase 38.
- New UI framework/theming, analytics/APM, SSO, multi-school tenancy, external notifications, raw exports, risk leaderboards, raw audit browsers, per-student drilldowns, and destructive reset controls: out of scope.
