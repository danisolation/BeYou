---
phase: 35
slug: role-dashboard-consistency-pass
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 35 - UI Design Contract

## Design System

| Property | Value |
|----------|-------|
| Tool | none - reuse existing manual Tailwind Peerlight AI primitives |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react where already used |
| Font | Inter, ui-sans-serif, system-ui |
| Primary primitives | `PageHeader`, `SurfaceCard`, `EntryCard`, `StatusBadge`, `ResponsiveTable`, `LoadingState`, `ErrorState`, `PrivacyBoundaryCard`, `EmptyState`, `DemoGuideCard`, `AdultStudentList` |
| Source | Phase 34 approved UI-SPEC, Phase 34 verification, current `frontend/components/ui-primitives.tsx` |

Phase 35 must not introduce shadcn, a new UI framework, global theming migration, or new data-fetching architecture. It is a presentation/content organization pass only.

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, tight inline gaps |
| sm | 8px | Compact badge/nav/card internal gaps |
| md | 16px | Default element spacing, mobile card padding, form padding |
| lg | 24px | Desktop card padding and dashboard section spacing |
| xl | 32px | Page grid gaps and major dashboard clusters |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing only |

Exceptions:
- Existing `p-5` / 20px dashboard cards may remain where already used, but touched cards should move toward `p-4` mobile or `p-6` desktop.
- All links, buttons, badges used as controls, and confirmation actions must keep `min-h-11` / 44px minimum target.
- Tables must remain horizontally scrollable through `ResponsiveTable` or equivalent `overflow-x-auto`.

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label | 14px | 400 or 600 | 1.5 |
| Body | 16px | 400 | 1.5 |
| Heading | 20px | 600 | 1.25 |
| Display | 36px | 600 | 1.12 |

Rules:
- New Phase 35 presentation work may use only weights 400 and 600.
- Only four font-size tokens are allowed in new dashboard work: 14px, 16px, 20px, and 36px.
- Copy must remain Vietnamese-first, supportive, concise, non-diagnostic, and role-specific.
- Do not use typography to make adult/admin surfaces feel more important than the Student safety surface.

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant 60% | `#F8FCFF` background + `#FFFFFF` surfaces | App background, main dashboard cards, neutral panels |
| Secondary 30% | `#EAF7F3` | Page headers, privacy/data-boundary guidance, subtle grouped content |
| Accent 10% | `#2CA58D` | Primary supportive CTA, active nav/role label, safe status, focus treatment, Peerlight brand tone |
| Warning | `#F59E0B` | Non-SOS caution only |
| Destructive/SOS | `#DC2626`, red-600/red-700 | SOS, urgent/high-risk, true errors, SOS confirmation/error |

Accent is reserved for:
- Primary non-danger role action
- Active dashboard/role state
- Safe/supportive status badge
- Focus outline
- Supportive links

Red/destructive is reserved for:
- Student SOS entry and confirmation
- Open/urgent/high-risk SOS status
- Teacher SOS handling/update affordance
- Parent SOS read-only status
- True load/action errors

Do not normalize SOS/high-risk into neutral or accent badges.

## Copywriting Contract

| Element | Contract |
|---------|----------|
| Global dashboard tone | Vietnamese-first, calm, supportive, privacy-explicit, non-diagnostic |
| Student primary CTA | `Gửi SOS hỗ trợ` remains the strongest red CTA; supportive primary action may remain `Thử check-in` in demo guide |
| Teacher primary CTA | `Xem và cập nhật SOS` for SOS handling; `Xem tóm tắt hỗ trợ` for summary access |
| Parent primary CTA | `Xem trạng thái SOS` for read-only SOS; `Xem tóm tắt hỗ trợ` for summary access |
| Admin primary CTA | `Mở bảng vận hành metadata` or `Mở bảng quản trị metadata` for metadata-only operations |
| Student empty state | `Chưa có tín hiệu SOS nào` / `Khi cần, em có thể gửi tín hiệu để người lớn tin tưởng biết em cần hỗ trợ.` |
| Adult empty state | `Chưa có học sinh được liên kết` plus role-specific body explaining that no linked/SOS-eligible student means no student details are shown |
| Admin empty/loading count state | Use scoped `LoadingState`; no zero-count success UI on primary load failure |
| Error state | `Không thể tải thông tin` + `Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn.` with `role="alert"` |
| Loading state | `Đang tải thông tin...` with `role="status"` |
| Student SOS confirmation | Preserve `Xác nhận gửi tín hiệu hỗ trợ`, `Xác nhận gửi SOS`, and `Ở lại trang này` |
| Destructive actions | No new destructive reset/export controls. Existing SOS confirmation is the only destructive-prominence flow in Phase 35 |

## Dashboard Rhythm Contract

All four role dashboards must follow this hierarchy:

1. Role-aware `PageHeader` or equivalent header surface.
2. Visible privacy/data-boundary guidance near the top.
3. Demo/walkthrough card where applicable.
4. Primary role action/status cards.
5. Secondary lists, tables, histories, or metadata panels.
6. Scoped loading, error, and empty states in-place.

Required rhythm:
- Use `space-y-6` for dashboard-level vertical rhythm.
- Use `grid gap-4 sm:grid-cols-2 xl:grid-cols-3` for primary card grids unless role content requires `lg:grid-cols-2`.
- Use `SurfaceCard` or `EntryCard` for dashboard cards.
- Use `ResponsiveTable` for tables.
- Use `StatusBadge` for safe/warning/danger/SOS labels.
- Preserve `DemoGuideCard` rhythm for role walkthroughs.
- Preserve route-owned data fetching and existing API paths.

Do not:
- Move auth, privacy acknowledgement, wrong-role handling, or route ownership out of authenticated layout/route pages.
- Add Phase 36 backend/DB optimization.
- Add Phase 37 frontend caching, fetch-waterfall optimization, or new loading architecture.
- Introduce cross-role route imports.

## Role Contracts

### Student Dashboard

Student remains the richest and primary self-support dashboard.

Must preserve:
- Student-first privacy copy.
- Student-owned flows: privacy review, mood check-in, test tâm lý, scenarios, support plan, chat, notification preferences, SOS confirmation, SOS history.
- SOS red/destructive prominence.
- Confirmation copy explaining that private self-check answers, mood notes, and chat are not automatically opened.
- Linked adult groups as supportive visibility, not surveillance.

Required organization:
1. Student header/welcome surface with privacy review link.
2. Demo guide.
3. Optional mood reminder.
4. Rich wellbeing action grid.
5. Quick wellbeing table.
6. SOS panel with red priority.
7. SOS status list.
8. Linked teacher/parent groups.

### Teacher Dashboard

Teacher must feel visually sibling-like to Parent through `AdultStudentList`, while preserving Teacher SOS handling posture.

Must preserve:
- Route-owned `/api/teacher/students`.
- Teacher support overview and notifications.
- Active relationship and SOS-only visibility semantics.
- Teacher CTA: `Xem và cập nhật SOS`.
- Copy that frames the teacher as coordinating support, not monitoring.

Required organization:
1. `PageHeader` with `Vai trò giáo viên`.
2. Adult privacy/data-boundary card.
3. Demo guide.
4. Notification card.
5. Linked student cards.
6. Per-student support overview with red SOS action only when SOS exists.

### Parent Dashboard

Parent must remain visually sibling-like to Teacher through `AdultStudentList`, while preserving read-only/supportive posture.

Must preserve:
- Route-owned `/api/parent/students`.
- Parent support overview and notifications.
- SOS-only visibility and summary-only support boundaries.
- Parent CTA: `Xem trạng thái SOS`.
- Copy that frames the parent as supportive/read-only, not updating or investigating.

Required organization:
1. `PageHeader` with `Vai trò phụ huynh`.
2. Adult privacy/data-boundary card.
3. Demo guide.
4. Notification card.
5. Linked student cards.
6. Per-child support overview with read-only SOS status.

### Admin Dashboard

Admin must feel part of the same product while staying metadata-only.

Must preserve:
- Existing Admin route destinations: operations, reports, chatbot, mood check-ins, content, privacy policy, users, links.
- Existing API paths for counts: `/api/admin/users`, `/api/admin/links`.
- Metadata-only copy.
- No raw exports, raw audit browsers, destructive reset controls, risk leaderboards, or per-student drilldowns.

Required organization:
1. `PageHeader` with `Vai trò quản trị`.
2. Metadata-only demo guide.
3. Entry-card grid using `EntryCard`.
4. Scoped loading/error for count surfaces.
5. Operations language must say "metadata-only" or equivalent privacy boundary.

## State/A11y/Responsive Contract

| State/Behavior | Requirement |
|----------------|-------------|
| Loading | Use `LoadingState` with `role="status"` and `aria-live="polite"` for primary dashboard loading |
| Error | Use `ErrorState` with `role="alert"` for primary dashboard load failure; do not render success-shaped empty/zero states on failure |
| Empty | Use role-specific `EmptyState`; empty must explain privacy/data boundary, not generic "no data" |
| SOS action errors | Use visible red text with `role="alert"` |
| SOS success | Use `role="status"` |
| Focus | Preserve global `:focus-visible` accent outline |
| Touch targets | All interactive controls must be at least `min-h-11` |
| Skip link | Authenticated shell skip-link behavior must remain unchanged |
| Responsive | Cards stack on mobile; grids expand at `sm`, `lg`, or `xl`; tables remain horizontally scrollable |
| Reduced motion | Do not add required motion; existing reduced-motion CSS must remain effective |
| Tables | Use `ResponsiveTable` or equivalent overflow wrapper |
| Adult lists | Do not expose raw private student content in list or empty states |

Human verification required:
- Open Student, Teacher, Parent, and Admin dashboards on desktop and mobile widths.
- Confirm they feel like one Peerlight AI product.
- Confirm Student SOS remains visually strongest.
- Confirm Teacher/Parent are sibling-like but role-distinct.
- Confirm Admin remains metadata-only.
- Confirm Vietnamese support tone and privacy boundaries remain visible.

## Privacy/Safety Redlines

Do not add UI affordances, links, labels, cards, tables, or controls for:

- raw exports
- raw audit browsers
- destructive reset controls
- risk leaderboards
- per-student risk drilldowns
- raw self-check answers in adult/admin surfaces
- private notes in adult/admin surfaces
- chat transcripts in adult/admin surfaces
- raw student identifiers beyond existing route-owned display contracts
- emails/IDs in new admin metadata surfaces unless already present and required by existing route
- provider claims
- secrets
- request bodies
- free-text access reasons
- browser token storage
- OAuth/SSO token handling
- surveillance framing

Preserve:
- Student privacy acknowledgement routing
- Wrong-role blocking
- Backend-owned HttpOnly cookie auth
- No browser token storage
- Active relationship checks
- SOS-only adult visibility
- Controlled reason gates on protected subroutes
- Teacher SOS update posture
- Parent read-only posture
- Admin metadata-only operations
- Accessible status/error announcements
- SOS/high-risk red semantics

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable - Phase 35 explicitly reuses manual Tailwind primitives |
| third-party | none | not applicable |

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved by gsd-ui-checker on 2026-05-26
