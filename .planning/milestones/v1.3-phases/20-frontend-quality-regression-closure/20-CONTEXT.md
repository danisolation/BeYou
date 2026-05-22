# Phase 20: Frontend Quality & Regression Closure - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Autonomous defaults selected by agent

<domain>
## Phase Boundary

Close v1.3 frontend quality gaps by replacing the broken Next 16 lint command, preserving existing test/build gates, and adding automated responsive/demo-readiness coverage for critical routes and role entry points.

</domain>

<decisions>
## Implementation Decisions

- Replace `next lint` with direct ESLint CLI because Next 16 no longer supports the old command shape.
- Use Next's flat ESLint config packages instead of inventing custom rule sets.
- Keep `--max-warnings=0` so lint remains a strong regression gate.
- Disable `react-hooks/set-state-in-effect` because the existing app intentionally loads remote data from effects and fixing that rule would require a broad refactor outside this phase.
- Add Vitest/jsdom responsive smoke coverage for semantic role-entry availability across representative mobile, tablet, and desktop viewport widths.

</decisions>

<code_context>
## Existing Code Insights

- `frontend/package.json` still used `next lint`, which fails on Next 16 by treating `lint` as a project directory.
- The repo already uses Vitest and Testing Library for component-level regression tests.
- Playwright config exists, but its web server path depends on local Docker/backend setup, making it too heavy for the required fast regression gate.
- Existing route/dashboard tests already mock APIs and can be extended with a targeted responsive smoke test.

</code_context>

<specifics>
## Specific Ideas

- Add `frontend/eslint.config.mjs` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Add required ESLint packages to `frontend/package.json` and lockfile.
- Remove lint warnings in existing tests so `npm --prefix frontend run lint` passes cleanly.
- Add `frontend/tests/phase20-responsive-smoke-ui.test.tsx` covering public entry, login role shortcuts, and student/teacher/parent/admin dashboards at mobile/tablet/desktop widths.
- Run lint, full frontend tests, and production build.

</specifics>

<deferred>
## Deferred Ideas

- True browser layout overflow checks in Playwright once CI/local environment setup is made lighter.
- Revisit `react-hooks/set-state-in-effect` with a larger data-loading refactor.
- Track Next/PostCSS advisory until a non-breaking stable Next release resolves it.

</deferred>
