---
phase: 35-role-dashboard-consistency-pass
plan: 02
type: execute
wave: 2
depends_on:
  - 35-01
files_modified:
  - frontend/app/(authenticated)/student/page.tsx
autonomous: true
requirements:
  - ROLE-01
must_haves:
  truths:
    - "Student dashboard uses harmonized header, privacy boundary, cards, status, loading, error, and empty patterns."
    - "Student SOS remains the strongest red/destructive action."
    - "Student-owned flows remain available."
  artifacts:
    - path: "frontend/app/(authenticated)/student/page.tsx"
      provides: "Student dashboard consistency pass"
  key_links:
    - from: "frontend/app/(authenticated)/student/page.tsx"
      to: "/api/student/profile"
      via: "existing apiFetch call"
      pattern: "apiFetch<StudentProfile>\\(\"/api/student/profile\"\\)"
    - from: "frontend/app/(authenticated)/student/page.tsx"
      to: "Student SOS confirmation"
      via: "existing local state"
      pattern: "Xác nhận gửi tín hiệu hỗ trợ"
---

<objective>
Harmonize Student dashboard presentation while preserving student-first privacy and SOS safety.

Purpose: Satisfy ROLE-01 without backend/API/auth/session/data-loading changes.
Output: Student dashboard uses Phase 34 primitives and Phase 35 rhythm.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md
@.planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
@frontend/app/(authenticated)/student/page.tsx
@frontend/components/ui-primitives.tsx
@frontend/components/empty-state.tsx
@frontend/components/demo-guide-card.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Convert Student top rhythm to PageHeader plus privacy boundary</name>
  <files>frontend/app/(authenticated)/student/page.tsx</files>
  <read_first>
    frontend/app/(authenticated)/student/page.tsx
    frontend/components/ui-primitives.tsx
    frontend/components/demo-guide-card.tsx
    .planning/phases/35-role-dashboard-consistency-pass/35-CONTEXT.md
    .planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
  </read_first>
  <behavior>
    - Student route still calls `/api/student/profile`, `listStudentSosAlerts()`, and `getMoodCheckInReminder()`.
    - Header shows `Vai trò học sinh`.
    - Privacy guidance appears near top with copy about student data being private by default.
  </behavior>
  <action>
    In `frontend/app/(authenticated)/student/page.tsx`, update the primitive import to include `PageHeader`, `PrivacyBoundaryCard`, and `StatusBadge`. Replace the current top `SurfaceCard className="bg-secondary"` welcome block with `PageHeader` using `eyebrow="Vai trò học sinh"`, `title={`Xin chào, ${profile.full_name.split(" ")[0]}`}`, and description `Peerlight AI giúp em theo dõi trạng thái, luyện phản hồi thực tế và gọi người lớn tin tưởng khi cần.`. Put the existing Demo badge beside/inside header actions without changing `DemoBadge`. Keep the privacy review `Link` with exact label `Ai có thể xem thông tin của em?` and href `/privacy?review=true`, styled with `min-h-11`. Add `PrivacyBoundaryCard` immediately after `PageHeader` with title `Thông tin của em là riêng tư theo mặc định` and description `Người lớn chỉ thấy thông tin trong phạm vi em cho phép hoặc khi có SOS cần hỗ trợ; câu trả lời tự kiểm tra, mood note và trò chuyện riêng tư không tự động được mở.`. Preserve D-03 route-owned fetching and all existing API/service calls.
  </action>
  <acceptance_criteria>
    - `grep -n "PageHeader" frontend/app/(authenticated)/student/page.tsx` finds an import and usage.
    - `grep -n "PrivacyBoundaryCard" frontend/app/(authenticated)/student/page.tsx` finds an import and usage.
    - `grep -n "Vai trò học sinh" frontend/app/(authenticated)/student/page.tsx` finds header copy.
    - `grep -n "/api/student/profile" frontend/app/(authenticated)/student/page.tsx` still finds the existing API path.
    - `grep -n "Ai có thể xem thông tin của em?" frontend/app/(authenticated)/student/page.tsx` still finds the privacy link.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/role-dashboards.test.tsx</automated>
  </verify>
  <done>Student dashboard top hierarchy follows Phase 35 contract and keeps student privacy link/data ownership.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Harmonize Student status surfaces without diluting SOS</name>
  <files>frontend/app/(authenticated)/student/page.tsx</files>
  <read_first>
    frontend/app/(authenticated)/student/page.tsx
    frontend/components/ui-primitives.tsx
    frontend/components/empty-state.tsx
    .planning/phases/35-role-dashboard-consistency-pass/35-UI-SPEC.md
  </read_first>
  <behavior>
    - SOS panel keeps `Gửi SOS hỗ trợ`, `Xác nhận gửi tín hiệu hỗ trợ`, `Xác nhận gửi SOS`, `Ở lại trang này`.
    - Empty SOS state renders `Chưa có tín hiệu SOS nào`.
    - SOS/high-risk uses red/danger, not neutral/accent.
  </behavior>
  <action>
    Convert `MoodReminderCard` wrapper from local `<section className="rounded-3xl border...">` to `SurfaceCard` while preserving exact labels `Nhắc nhở tùy chọn`, `Mở check-in`, `Nhắc lại sau`, `Bỏ qua hôm nay`, `Cài đặt nhắc nhở`. Wrap the SOS panel in `SurfaceCard` or keep the `section` only if it retains `border-2 border-[#F3C0C0] bg-white p-5 sm:p-6`; do not remove red button classes `bg-red-600` and `hover:bg-red-700`. In `StudentSosStatusList`, replace the severity `<span className="rounded-full bg-secondary...">` with `StatusBadge tone={alert.severity === "urgent" ? "sos" : "danger"}` so SOS remains red. Convert `LinkedAdultGroup` non-empty wrapper to `SurfaceCard`; keep `EmptyState heading={title}` and body `Chưa có người lớn hỗ trợ được liên kết trong mục này.`. Do not remove flows for privacy review, mood check-in, test tâm lý, scenarios, support plan, chat, notification preferences, SOS confirmation, or SOS history per D-07.
  </action>
  <acceptance_criteria>
    - `grep -n "StatusBadge" frontend/app/(authenticated)/student/page.tsx` finds import and usage.
    - `grep -n "Gửi SOS hỗ trợ" frontend/app/(authenticated)/student/page.tsx` still finds Student primary SOS CTA.
    - `grep -n "bg-red-600" frontend/app/(authenticated)/student/page.tsx` still finds SOS button red styling.
    - `grep -n "Chưa có tín hiệu SOS nào" frontend/app/(authenticated)/student/page.tsx` still finds Student SOS empty state.
    - `grep -n "/student/notification-preferences" frontend/app/(authenticated)/student/page.tsx` still finds notification preference flow.
  </acceptance_criteria>
  <verify>
    <automated>npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/phase20-responsive-smoke-ui.test.tsx</automated>
  </verify>
  <done>Student cards/status/empty surfaces are primitive-backed while SOS stays visually strongest and all student-owned flows remain.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Student route → Student APIs | Existing route-owned student data calls must remain unchanged. |
| Student UI → linked adults | Student copy must clarify what adults can and cannot see. |
| Student SOS UI → safety workflow | SOS confirmation and red urgency must remain clear. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-35-02-01 | Information Disclosure | Student privacy copy | mitigate | Add explicit `PrivacyBoundaryCard` copy that raw self-check/mood/chat are not automatically opened. |
| T-35-02-02 | Tampering / Safety UX | SOS panel | mitigate | Preserve exact red CTA and confirmation copy; use `StatusBadge` danger/sos for SOS statuses. |
| T-35-02-03 | Information Disclosure / Elevation | browser storage | mitigate | Do not touch auth/session helpers; Phase 35 tests reject token storage strings. |
| T-35-02-04 | Denial of Service | loading/error accessibility | mitigate | Keep `LoadingState role="status"` and `ErrorState role="alert"` unchanged. |
</threat_model>

<verification>
Run:
`npm --prefix frontend run test -- tests/phase35-role-dashboard-consistency.test.tsx tests/phase34-final-regression.test.tsx tests/role-dashboards.test.tsx tests/phase20-responsive-smoke-ui.test.tsx`
</verification>

<success_criteria>
ROLE-01 is satisfied: Student dashboard has harmonized shell/cards/status/loading/error/empty patterns while preserving student-first privacy and support copy.
</success_criteria>

<output>
After completion, create `.planning/phases/35-role-dashboard-consistency-pass/35-02-SUMMARY.md`
</output>
