---
phase: 35-role-dashboard-consistency-pass
plan: 05
type: execute
wave: 3
depends_on:
  - 35-02
  - 35-03
  - 35-04
files_modified:
  - frontend/tests/phase35-role-dashboard-consistency.test.tsx
  - .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md
autonomous: false
requirements:
  - ROLE-01
  - ROLE-02
  - ROLE-03
  - ROLE-04
must_haves:
  truths:
    - "All four dashboards pass integrated automated privacy/safety/UI regression checks."
    - "Human visual walkthrough requirement is captured for desktop and mobile."
    - "No Phase 35 work pulls in backend/API/auth/session/database/cache/performance changes."
  artifacts:
    - path: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      provides: "Final Phase 35 integrated regression coverage"
    - path: ".planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md"
      provides: "Human visual walkthrough checklist/evidence template"
  key_links:
    - from: "Phase 35 dashboard files"
      to: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      via: "targeted Vitest suite"
      pattern: "ROLE-01|ROLE-02|ROLE-03|ROLE-04"
---

<objective>
Run final integrated regression and prepare visual walkthrough evidence.

Purpose: Close Phase 35 with automated proof plus human-visible dashboard cohesion check.
Output: Final Phase 35 test assertions and visual walkthrough artifact.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md
@.planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
@.planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-VERIFICATION.md
@frontend/tests/phase35-role-dashboard-consistency.test.tsx
@frontend/tests/phase34-final-regression.test.tsx
@frontend/tests/role-dashboards.test.tsx
@frontend/tests/phase20-responsive-smoke-ui.test.tsx
@frontend/tests/auth-portals.test.tsx
@frontend/tests/phase32-release-gates-ui.test.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Finalize Phase 35 integrated assertions</name>
  <files>frontend/tests/phase35-role-dashboard-consistency.test.tsx</files>
  <read_first>
    frontend/tests/phase35-role-dashboard-consistency.test.tsx
    frontend/app/(authenticated)/student/page.tsx
    frontend/components/adult-student-list.tsx
    frontend/app/(authenticated)/teacher/page.tsx
    frontend/app/(authenticated)/parent/page.tsx
    frontend/app/(authenticated)/admin/page.tsx
    .planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
  </read_first>
  <behavior>
    - Final test maps ROLE-01, ROLE-02, ROLE-03, ROLE-04 by explicit strings.
    - Final test rejects Phase 35 boundary violations.
  </behavior>
  <action>
    Extend `frontend/tests/phase35-role-dashboard-consistency.test.tsx` with a `const PHASE35_REQUIREMENTS = ["ROLE-01", "ROLE-02", "ROLE-03", "ROLE-04"];` assertion or equivalent. Add final source assertions for exact imports/strings: Student source contains `PageHeader`, `PrivacyBoundaryCard`, `Vai trò học sinh`, `Gửi SOS hỗ trợ`, `Chưa có tín hiệu SOS nào`; Adult source contains `PrivacyBoundaryCard`, `Vai trò giáo viên`, `Vai trò phụ huynh`, `Xem và cập nhật SOS`, `Xem trạng thái SOS`, `đồng hành/read-only`; Admin source contains `Vai trò quản trị`, `Vận hành metadata-only`, `Mở bảng vận hành metadata`, `Mở bảng metadata`. Add a boundary test that scans modified dashboard files and fails if they contain backend/db/cache/performance scope strings: `alembic`, `migration`, `CREATE INDEX`, `no-store`, `cache`, `revalidate`, `pagination`, `batching`, `SQL`, `schema push`.
  </action>
  <acceptance_criteria>
    - `grep -n "PHASE35_REQUIREMENTS" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds requirement coverage.
    - `grep -n "Vai trò học sinh" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Student final assertion.
    - `grep -n "đồng hành/read-only" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Parent final assertion.
    - `grep -n "Mở bảng vận hành metadata" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Admin final assertion.
    - `grep -n "CREATE INDEX" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds out-of-scope boundary assertion.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/phase20-responsive-smoke-ui.test.tsx tests/auth-portals.test.tsx tests/phase32-release-gates-ui.test.tsx</automated>
  </verify>
  <done>Integrated Phase 35 assertions prove requirement coverage and scope boundaries.</done>
</task>

<task type="auto">
  <name>Task 2: Run lint/build regression gate</name>
  <files>frontend/tests/phase35-role-dashboard-consistency.test.tsx</files>
  <read_first>
    frontend/package.json
    frontend/tests/phase35-role-dashboard-consistency.test.tsx
    frontend/app/(authenticated)/student/page.tsx
    frontend/components/adult-student-list.tsx
    frontend/app/(authenticated)/admin/page.tsx
  </read_first>
  <action>
    Run the targeted suite first, then run frontend lint and production build. Do not change backend files, database files, API clients, auth/session helpers, caching config, or package dependencies. If lint/build fails due to Phase 35 touched frontend files, fix only those frontend presentation/test issues. If failures point to pre-existing unrelated files, record the exact failing command/output in the summary and do not broaden Phase 35 scope.
  </action>
  <acceptance_criteria>
    - Command output for targeted Vitest suite exits 0.
    - Command output for `npm --prefix frontend run lint` exits 0 or the summary records exact unrelated failure.
    - Command output for `npm --prefix frontend run build` exits 0 or the summary records exact unrelated failure.
    - `git diff --name-only` contains no backend files, no migration files, no package dependency changes unless a pre-existing formatter touched lockfiles; do not accept lockfile changes for Phase 35.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/phase20-responsive-smoke-ui.test.tsx tests/auth-portals.test.tsx tests/phase32-release-gates-ui.test.tsx && npm --prefix frontend run lint && npm --prefix frontend run build</automated>
  </verify>
  <done>Frontend Phase 35 regression, lint, and build gates are complete or unrelated failures are precisely documented.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human visual dashboard walkthrough</name>
  <files>.planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md</files>
  <read_first>
    .planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
    .planning/phases/34-shared-ui-primitives-role-shell-harmonization/34-VERIFICATION.md
    frontend/app/(authenticated)/student/page.tsx
    frontend/app/(authenticated)/teacher/page.tsx
    frontend/app/(authenticated)/parent/page.tsx
    frontend/app/(authenticated)/admin/page.tsx
  </read_first>
  <what-built>Student, Teacher, Parent, and Admin dashboard consistency pass with automated regression coverage.</what-built>
  <how-to-verify>
    1. Start the frontend through the normal project workflow.
    2. Open Student dashboard at desktop width and mobile width. Expected: `Vai trò học sinh`, Student privacy boundary, demo guide, rich wellbeing grid, quick table, red `Gửi SOS hỗ trợ`, SOS confirmation, SOS history/empty, linked adults.
    3. Open Teacher dashboard at desktop/mobile widths. Expected: `Vai trò giáo viên`, adult privacy boundary, demo guide, notifications, linked student cards, `Xem và cập nhật SOS` only where SOS exists/route data supports it.
    4. Open Parent dashboard at desktop/mobile widths. Expected: `Vai trò phụ huynh`, read-only/supportive copy, `Xem trạng thái SOS`, no Teacher update posture.
    5. Open Admin dashboard at desktop/mobile widths. Expected: `Vai trò quản trị`, `Vận hành metadata-only`, `Mở bảng vận hành metadata`, no raw exports, no risk leaderboard, no per-student drilldown, no raw audit browser, no destructive reset.
    6. Confirm Vietnamese support tone is visible and Student SOS remains visually strongest red action.
  </how-to-verify>
  <action>
    Create `.planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` with checklist headings: `Student dashboard`, `Teacher dashboard`, `Parent dashboard`, `Admin dashboard`, `Desktop/mobile widths`, `Privacy/SOS/Admin redlines`, and `Human result`. Include expected strings exactly as listed in this checkpoint. Mark human result as `pending` until user approval. Do not include screenshots or raw student data.
  </action>
  <acceptance_criteria>
    - `grep -n "Student dashboard" .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` finds the Student checklist.
    - `grep -n "Gửi SOS hỗ trợ" .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` finds Student SOS visual check.
    - `grep -n "Xem và cập nhật SOS" .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` finds Teacher check.
    - `grep -n "Xem trạng thái SOS" .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` finds Parent check.
    - `grep -n "Vận hành metadata-only" .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md` finds Admin metadata check.
  </acceptance_criteria>
  <verify>
    <automated>Test-Path .planning/phases/35-role-dashboard-consistency-pass/35-VISUAL-WALKTHROUGH.md</automated>
  </verify>
  <resume-signal>Type `approved` if the walkthrough matches expectations, or describe exact dashboard issues.</resume-signal>
  <done>Visual walkthrough artifact exists and human review is approved or issues are recorded for follow-up.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| automated tests → role dashboards | Regression suite must catch privacy/safety drift. |
| human walkthrough → visual cohesion | Human verifies product feel without collecting sensitive screenshots/data. |
| Phase 35 scope → later phases | Prevent accidental backend/API/DB/cache/performance work. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-35-05-01 | Information Disclosure | integrated role dashboards | mitigate | Final tests scan all touched dashboard files for raw-data and token redlines. |
| T-35-05-02 | Tampering | scope boundaries | mitigate | Tests reject backend/db/cache/performance terms in Phase 35 touched dashboard files. |
| T-35-05-03 | Safety UX | visual walkthrough | mitigate | Human checklist verifies SOS remains visually strongest and load failures are not success-shaped. |
| T-35-05-04 | Denial of Service | accessibility | mitigate | Regression suite includes loading/error role assertions and responsive smoke tests. |
| T-35-05-05 | Information Disclosure | walkthrough evidence | mitigate | Visual walkthrough artifact records checklist only; no screenshots or raw student data. |
</threat_model>

<verification>
Run:
`npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/phase20-responsive-smoke-ui.test.tsx tests/auth-portals.test.tsx tests/phase32-release-gates-ui.test.tsx`
`npm --prefix frontend run lint`
`npm --prefix frontend run build`
Then complete the human walkthrough checkpoint.
</verification>

<success_criteria>
ROLE-01, ROLE-02, ROLE-03, and ROLE-04 pass automated checks and visual walkthrough evidence is prepared without Phase 36/37/38 scope creep.
</success_criteria>

<output>
After completion, create `.planning/phases/35-role-dashboard-consistency-pass/35-05-SUMMARY.md`
</output>
