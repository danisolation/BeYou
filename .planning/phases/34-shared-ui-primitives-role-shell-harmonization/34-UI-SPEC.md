---
phase: 34
slug: shared-ui-primitives-role-shell-harmonization
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 34 - UI Design Contract

## Design System

| Property | Value |
|----------|-------|
| Tool | none - use existing manual Tailwind Peerlight AI primitives |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react |
| Font | Inter, ui-sans-serif, system-ui |

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, tight inline gaps |
| sm | 8px | Compact nav/card internal gaps |
| md | 16px | Default element spacing and form padding |
| lg | 24px | Section/card desktop padding |
| xl | 32px | Page grid gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: 12px compact nav padding is allowed where already used; legacy `p-5` surfaces should migrate toward 16px mobile or 24px desktop padding when touched; `min-h-11` / 44px minimum interactive target is required for links and buttons.

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 400 or 600 | 1.5 |
| Heading | 20px | 600 | 1.25 |
| Display | 36px | 600 | 1.12 |

Only weights 400 and 600 are allowed in new shared primitives.

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FCFF` background + `#FFFFFF` surfaces | App background, main cards, neutral panels |
| Secondary (30%) | `#EAF7F3` | Student shell/sidebar surfaces, subtle panels, grouped content |
| Accent (10%) | `#2CA58D` | Peerlight AI label, primary CTA, active nav, safe status, focus treatment |
| Warning | `#F59E0B` | Non-SOS caution only |
| Destructive/SOS | `#DC2626` / red-600/red-700 | SOS, high-risk, and true destructive safety communication only |

Accent reserved for: primary CTA, active role/nav state, Peerlight brand label, safe status badge, focus outline, supportive non-danger links.

Red/destructive reserved for: SOS entry, urgent/high-risk status, SOS confirmation/error. Do not normalize SOS/high-risk into neutral badges.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Mở cổng phù hợp` for role-boundary recovery; route pages may provide role-specific CTA such as `Xem tóm tắt hỗ trợ`, `Gửi SOS hỗ trợ`, or `Mở bảng vận hành metadata` |
| Empty state heading | Route-provided Vietnamese privacy copy, not a generic placeholder. Examples: Student `Chưa có tín hiệu hỗ trợ nào`; Teacher `Chưa có học sinh được liên kết`; Parent `Chưa có thông tin hỗ trợ được phép xem`; Admin `Chưa có metadata vận hành để hiển thị` |
| Empty state body | Route-provided role-boundary guidance. Examples: Student `Thông tin riêng tư của em chỉ hiển thị theo lựa chọn và xác nhận phù hợp.`; Teacher `Khi có liên kết và tín hiệu SOS được phép xem, tóm tắt hỗ trợ sẽ hiển thị tại đây.`; Parent `Peerlight AI chỉ hiển thị tóm tắt được phép xem, không mở nội dung riêng tư thô của con.`; Admin `Bảng này chỉ hiển thị metadata tổng hợp, không mở dữ liệu riêng tư thô.` |
| Loading state | `Đang tải thông tin...` with `role="status"` in shared primitive |
| Error state | `Chưa tải được thông tin. Hãy thử lại hoặc quay về cổng phù hợp để tiếp tục an toàn.` with `role="alert"` |
| Wrong-role state | `Không thể mở cổng này với vai trò hiện tại.` |
| Privacy redirect state | `Cần xác nhận quyền riêng tư trước khi vào cổng học sinh.` |
| Destructive confirmation | No new destructive reset/export controls. Existing SOS confirmation must remain: `Xác nhận gửi tín hiệu hỗ trợ` / `Ở lại trang này` |

Copy must remain Vietnamese-first, supportive, concise, non-diagnostic, and role-specific.

## Primitive Contract

Create presentation-only primitives for:

- `PageHeader`
- `Section`
- `SurfaceCard`
- `EntryCard`
- `StatusBadge`
- `ResponsiveTable`
- `LoadingState`
- `ErrorState`
- enhanced `EmptyState`
- `PrivacyBoundaryCard` / role-boundary guidance surface

The primary visual focal point is the `PageHeader` role label plus the page's primary CTA. The privacy or role-boundary card is the secondary anchor on role dashboards, followed by content cards/tables in consistent density.

Primitives may accept labels, tone, hrefs, actions, and children.

Primitives must not import:
- route pages
- API clients
- auth helpers
- role-specific service modules
- business-rule logic

## Role Shell Contract

- `AuthenticatedLayout` remains the owner of auth, privacy acknowledgement routing, wrong-role handling, logout, and role routing.
- Student shell may remain richer than Teacher/Parent/Admin shell.
- Teacher, Parent, Admin must use compact consistent active-role rhythm.
- Navigation must preserve skip link, `aria-current="page"`, horizontal overflow on mobile, and `min-h-11` targets.
- Parent must no longer import shared presentation from the Teacher route page; move adult shared presentation to neutral `frontend/components/` path.

## Privacy/Safety Redlines

Do not add UI affordances or display for:

- raw exports
- risk leaderboards
- per-student risk drilldowns
- raw audit browsers
- destructive reset controls
- raw IDs/emails/names/notes/transcripts/answers/provider claims/secrets/request bodies/free-text reasons/browser tokens

Preserve:
- privacy acknowledgement routing
- wrong-role handling
- no browser token storage
- active relationship gates
- SOS-only adult visibility
- controlled reason gates
- metadata-only admin operations
- accessible status/error announcements
- responsive behavior
- keyboard focus
- skip-link behavior

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| third-party | none | not applicable |

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved by gsd-ui-checker on 2026-05-26
