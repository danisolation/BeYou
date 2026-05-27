# Feature Landscape: v1.6 Cross-Role UI Consistency & Production Performance

**Project:** Peerlight AI
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Researched:** 2026-05-26

## Category 1: Cross-Role UI System

**Table stakes**
- Shared spacing, typography, section headings, cards, table wrappers, badges, buttons, forms, and loading/error/empty states across Student, Teacher, Parent, and Admin.
- Shared role dashboard layout rhythm while preserving role-specific privacy/safety copy.
- Responsive behavior for mobile, tablet, and desktop role dashboards.
- Accessible focus, skip-link, status, and error announcement behavior.

**Differentiators**
- Peerlight AI role boundary callouts that explain what each role can and cannot see.
- Vietnamese-first supportive copy for students and support-not-surveillance copy for adults/admins.
- Consistent critical-action styling where red remains reserved for SOS/high-risk states.

**Anti-features**
- Generic role UI that erases Student vs Teacher vs Parent vs Admin responsibilities.
- Shared components that render arbitrary object keys or raw metadata.

## Category 2: Role Dashboard Consistency

**Table stakes**
- Student, Teacher, Parent, and Admin dashboards have consistent header, primary action, status panel, guidance card, and empty/error/loading treatment.
- Teacher and Parent remain similar where they both support students, but Teacher-only status actions and Parent read-only posture remain visible.
- Admin operations remains clearly metadata-only and operational, not a surveillance dashboard.

**Differentiators**
- Unified role-specific walkthrough/help affordances that match the public demo and authenticated dashboards.
- Dashboard cards clearly distinguish "no data", "access blocked", "reason required", and "loading".

**Anti-features**
- Broad linked-student browsing for adults.
- Admin risk leaderboard, per-student drilldown, raw export, or raw audit browser.

## Category 3: Production Performance Baseline

**Table stakes**
- Establish baseline endpoint timings, payload sizes, query counts, and frontend route load evidence before optimization.
- Separate cold-start, warm backend, database, network, and frontend render/fetch contributions where possible.
- Record demo vs production-pilot constraints honestly.

**Differentiators**
- A repeatable production-like smoke/performance checklist that operators can run after deploy.
- Safe aggregate timing panels or logs that help diagnose slowness without raw sensitive data.

**Anti-features**
- Declaring production performance fixed from localhost-only results.
- Logging raw student content, emails, provider claims, notes, transcripts, query params, or secrets.

## Category 4: Database and Backend Optimization

**Table stakes**
- Identify and fix N+1 lookups, unbounded list endpoints, Python-side slicing after large DB loads, and missing indexes tied to real query predicates.
- Add pagination/limits to admin users/links and history-like endpoints where needed.
- Preserve authorization, reason gates, active relationship checks, SOS-only visibility, audit, and metadata sanitization.

**Differentiators**
- Endpoint-specific tests that prove bounded result sizes and privacy invariants after optimization.
- Alembic/schema drift checks for every index/migration change.

**Anti-features**
- Removing safety checks or audit records to pass latency goals.
- Adding speculative wide indexes or indexing raw sensitive text.

## Category 5: Frontend Data Loading and Render Performance

**Table stakes**
- Reduce duplicate fetches and dashboard waterfalls.
- Standardize route-level and component-level loading/error/empty states.
- Keep credentialed API calls cookie-based with no browser token storage.
- Avoid bundle bloat from shared components imported across every role.

**Differentiators**
- Per-role performance smoke that validates dashboard responsiveness and copy states.
- Lightweight lazy loading for heavy admin/operations panels where it improves route cost.

**Anti-features**
- Generic client-side caching for sensitive data without scoped keys and invalidation.
- Cross-role page imports that couple dashboards and increase client bundles.

## Category 6: Verification Gates

**Table stakes**
- Full backend tests/lint and frontend tests/lint/build remain passing.
- Targeted UI consistency tests cover all four roles.
- Targeted performance gates capture query/payload/route regressions for optimized areas.
- Privacy grep/redline gates continue to reject raw exports, risk leaderboards, raw notes, transcripts, answers, provider claims, browser tokens, and per-student drilldowns.

**Differentiators**
- A compact operator-facing v1.6 performance evidence section in README or operations docs.

**Anti-features**
- Speed-only gates that incentivize bypassing privacy, authorization, or safety copy.
