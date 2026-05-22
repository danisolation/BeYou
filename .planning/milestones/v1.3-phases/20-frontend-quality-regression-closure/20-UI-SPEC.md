# Phase 20 UI Spec: Frontend Quality & Regression Closure

**Created:** 2026-05-22
**Status:** Implemented

## Surfaces

- Public landing/demo role entry
- Login demo role shortcuts
- Student dashboard
- Teacher dashboard
- Parent dashboard
- Admin dashboard

## UX Requirements

- Critical role entry points remain accessible at mobile, tablet, and desktop viewport widths.
- Public demo entry keeps manual login and four one-step demo role buttons reachable.
- Login keeps four demo shortcut buttons and required email/password fields reachable.
- Student, teacher, parent, and admin dashboards keep primary navigation/support links present after API data loads.

## Responsive Contract

- Automated smoke coverage exercises representative widths: 375, 768, and 1280 pixels.
- Coverage verifies semantic availability of links/buttons rather than screenshots.
- Existing responsive utility classes and touch-friendly minimum target sizes remain unchanged.

## Privacy/Safety Contract

- Responsive tests use demo metadata only.
- No raw student private content, cookies, secrets, exports, or risk drilldowns are introduced.
