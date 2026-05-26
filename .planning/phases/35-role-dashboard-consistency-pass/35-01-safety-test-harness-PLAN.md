---
phase: 35-role-dashboard-consistency-pass
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/tests/phase35-role-dashboard-consistency.test.tsx
autonomous: true
requirements:
  - ROLE-01
  - ROLE-02
  - ROLE-03
  - ROLE-04
must_haves:
  truths:
    - "Phase 35 has automated redline coverage before dashboard presentation edits."
    - "Tests cover Student privacy/SOS, Teacher SOS handling, Parent read-only posture, and Admin metadata-only boundaries."
  artifacts:
    - path: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      provides: "Phase 35 dashboard consistency and privacy/safety regression harness"
  key_links:
    - from: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      to: "frontend/app/(authenticated)/student/page.tsx"
      via: "render and source assertions"
      pattern: "StudentDashboardPage"
    - from: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      to: "frontend/components/adult-student-list.tsx"
      via: "render and source assertions"
      pattern: "AdultStudentList"
    - from: "frontend/tests/phase35-role-dashboard-consistency.test.tsx"
      to: "frontend/app/(authenticated)/admin/page.tsx"
      via: "render and source assertions"
      pattern: "AdminDashboardPage"
---

<objective>
Create the Phase 35 safety regression harness before presentation changes.

Purpose: Protect ROLE-01 through ROLE-04 while dashboard UI is harmonized.
Output: A dedicated Vitest file covering cross-role rhythm, privacy redlines, no browser token storage, no unsafe Admin controls, and accessible loading/error states.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md
@.planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
@.planning/phases/35-role-dashboard-consistency-pass/35-RESEARCH.md
@frontend/app/(authenticated)/student/page.tsx
@frontend/app/(authenticated)/teacher/page.tsx
@frontend/app/(authenticated)/parent/page.tsx
@frontend/app/(authenticated)/admin/page.tsx
@frontend/components/adult-student-list.tsx
@frontend/tests/phase34-final-regression.test.tsx
@frontend/tests/role-dashboards.test.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create Phase 35 cross-role dashboard regression harness</name>
  <files>frontend/tests/phase35-role-dashboard-consistency.test.tsx</files>
  <read_first>
    frontend/tests/phase34-final-regression.test.tsx
    frontend/tests/role-dashboards.test.tsx
    frontend/tests/phase32-release-gates-ui.test.tsx
    frontend/app/(authenticated)/student/page.tsx
    frontend/components/adult-student-list.tsx
    frontend/app/(authenticated)/admin/page.tsx
    .planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md
    .planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
  </read_first>
  <behavior>
    - Test Student dashboard renders `Ai có thể xem thông tin của em?`, `Gửi SOS hỗ trợ`, `Xác nhận gửi tín hiệu hỗ trợ`, `Xác nhận gửi SOS`, `Ở lại trang này`.
    - Test Teacher dashboard renders `Vai trò giáo viên`, `Xem và cập nhật SOS`, and no raw private-content labels.
    - Test Parent dashboard renders `Vai trò phụ huynh`, `Xem trạng thái SOS`, and does not render Teacher update wording as parent-only copy.
    - Test Admin dashboard renders `Vai trò quản trị`, `metadata-only`, and rejects unsafe labels.
  </behavior>
  <action>
    Create `frontend/tests/phase35-role-dashboard-consistency.test.tsx`. Use Testing Library/Vitest patterns from Phase 34 tests. Mock `fetch` by pathname with JSON responses for `/api/student/profile`, `/api/student/sos-alerts`, `/api/notifications/mood-check-in/reminder`, `/api/teacher/students`, `/api/parent/students`, `/api/admin/users`, and `/api/admin/links`. Include static `readFileSync(join(process.cwd(), path), "utf8")` checks for touched dashboard files. Per D-18, reject `localStorage.setItem`, `sessionStorage.setItem`, `access_token`, `refresh_token`, `id_token`, `Export`, `Xuất`, `Download`, `Tải xuống`, `reset`, `drilldown`, `risk leaderboard`, `xếp hạng nguy cơ`, `Chi tiết học sinh`, `raw audit`. Per D-03, assert source still contains `/api/student/profile`, `/api/teacher/students`, `/api/parent/students`, `/api/admin/users`, and `/api/admin/links`.
  </action>
  <acceptance_criteria>
    - `grep -n "describe(.*Phase 35" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds the Phase 35 suite.
    - `grep -n "localStorage.setItem" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds a forbidden-token assertion.
    - `grep -n "Xem và cập nhật SOS" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Teacher SOS coverage.
    - `grep -n "Xem trạng thái SOS" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Parent read-only SOS coverage.
    - `grep -n "metadata-only" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds Admin metadata-only coverage.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx</automated>
  </verify>
  <done>Phase 35 test file exists and passes with Phase 34 final regression before UI edits.</done>
</task>

<task type="auto">
  <name>Task 2: Add static import and redline coverage for shared presentation safety</name>
  <files>frontend/tests/phase35-role-dashboard-consistency.test.tsx</files>
  <read_first>
    frontend/tests/phase35-role-dashboard-consistency.test.tsx
    frontend/components/ui-primitives.tsx
    frontend/components/adult-student-list.tsx
    frontend/app/(authenticated)/teacher/page.tsx
    frontend/app/(authenticated)/parent/page.tsx
  </read_first>
  <action>
    Extend the new Phase 35 test file with static assertions: shared components under `frontend/components/` must not import `@/app/(authenticated)/student/page`, `@/app/(authenticated)/teacher/page`, `@/app/(authenticated)/parent/page`, `@/app/(authenticated)/admin/page`, `@/lib/auth`, or token strings. Assert `frontend/app/(authenticated)/parent/page.tsx` does not import `@/app/(authenticated)/teacher/page`. Per D-04 and D-10, keep adult shared code presentation-only and reject raw labels `raw self-check`, `private notes`, `chat transcripts`, `provider claims`, `request bodies`, `free-text access reasons`.
  </action>
  <acceptance_criteria>
    - `grep -n "@/app/(authenticated)/teacher/page" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds a negative assertion.
    - `grep -n "provider claims" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds adult/admin raw-data redline coverage.
    - `grep -n "@/lib/auth" frontend/tests/phase35-role-dashboard-consistency.test.tsx` finds shared import redline coverage.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/role-dashboards.test.tsx tests/auth-portals.test.tsx</automated>
  </verify>
  <done>Test harness blocks cross-role imports, browser token storage, and raw adult/admin data labels.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| route pages → shared components | Role-owned data is passed into neutral presentation components. |
| browser UI → session/API | Frontend must keep cookie-authenticated calls and avoid browser token storage. |
| adult/admin dashboards → student data | Adult/Admin surfaces must not expose raw private student content. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-35-01 | Information Disclosure | shared UI/component imports | mitigate | Static tests reject route-page imports in shared components and Parent importing Teacher route page. |
| T-35-02 | Information Disclosure / Elevation | browser storage | mitigate | Static tests reject `localStorage.setItem`, `sessionStorage.setItem`, `access_token`, `refresh_token`, `id_token`. |
| T-35-03 | Information Disclosure | adult/admin surfaces | mitigate | Static tests reject raw private-content labels, provider claims, request bodies, free-text reasons. |
| T-35-04 | Safety UX | SOS urgency | mitigate | Tests assert Student SOS copy and Teacher/Parent SOS CTAs remain role-specific. |
| T-35-05 | Denial of Service | accessibility states | mitigate | Tests assert `role="status"` loading and `role="alert"` error behavior through existing primitives. |
</threat_model>

<verification>
Run:
`npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/auth-portals.test.tsx`
</verification>

<success_criteria>
ROLE-01 through ROLE-04 have automated Phase 35 regression coverage before dashboard presentation edits begin.
</success_criteria>

<output>
After completion, create `.planning/phases/35-role-dashboard-consistency-pass/35-01-SUMMARY.md`
</output>
