---
phase: 29
slug: deployment-guardrails-smoke-profiles
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-25
---

# Phase 29 — UI Design Contract

> Visual and interaction contract for Deployment Guardrails & Smoke Profiles. Generated for the Phase 29 planning gate and verified before execution planning.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none; extend existing handmade Tailwind cards and panels |
| Icon library | `lucide-react` is installed, but Phase 29 UI does not require icons |
| Font | Inter, `ui-sans-serif`, system sans |

Phase 29 must extend the existing admin operations surface at `frontend/app/(authenticated)/admin/operations/page.tsx` rather than creating a new design system. The UI must keep the current rounded metadata-card pattern: `rounded-3xl bg-white p-6 shadow-sm` for panels, `rounded-2xl bg-secondary p-4` for grouped metadata, and compact status badges.

---

## Phase 29 UI Surface

| Surface | Required contract |
|---------|-------------------|
| Admin operations header | Keep title `Vận hành metadata-only`; add deployment/smoke wording only in body copy or dedicated panels, not as a surveillance dashboard. |
| Deployment guardrails panel | Add or preserve a panel titled `Deployment guardrails` with Vietnamese description `Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn.` |
| Smoke profiles panel | Add or preserve a panel titled `Smoke profiles` with separate cards for `Demo smoke` and `Production pilot smoke`. |
| Readiness/smoke status | Use `pass`, `warn`, and `fail` badges. `ready`, `degraded`, and `not_ready` values may appear only as backend readiness values, not as new visual status classes. |
| Remediation display | Remediation text appears below evidence in `text-label`; it must be actionable and must not include secret values. |
| Command display | Commands are displayed in a `rounded-2xl bg-secondary px-3 py-2 text-label` block, matching the existing smoke checklist. |

The deployment panels must be operator-focused. They may show mode labels, counts, safe booleans, command names, HTTP status, and pass/warn/fail evidence. They must not show raw URLs beyond public frontend/backend hostnames already documented in README, and must never show connection strings, cookie names/values, credentials, provider secrets, raw emails, raw UUIDs, notes, transcripts, answers, SOS notes, free-text reasons, exports, or risk drilldowns.

Primary visual focal point: the `Deployment guardrails` panel is the visual anchor immediately after the privacy boundary and filters. Within that panel, pass/warn/fail badges are the scan targets; remediation text stays secondary. The `Smoke profiles` panel is the second focal point and must show `Demo smoke` and `Production pilot smoke` side by side on wider screens.

---

## Spacing Scale

Declared values must stay on Tailwind's 4px scale.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline status badge gaps and compact metadata separators |
| sm | 8px | Badge groups, label-to-value spacing |
| md | 16px | Card internal vertical rhythm, `space-y-4`, form gaps |
| lg | 24px | Panel padding `p-6`, page section gaps `space-y-6` |
| xl | 32px | Multi-panel layout gaps where already present |
| 2xl | 48px | Reserved for page-level breaks; not needed in Phase 29 admin panels |
| 3xl | 64px | Not used inside deployment guardrail panels |

Exceptions: none. Do not add arbitrary pixel spacing outside existing border colors and status backgrounds.

---

## Typography

Use existing Tailwind font tokens from `frontend/tailwind.config.ts`.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | `text-body` (`clamp(0.95rem, 0.9rem + 0.25vw, 1rem)`) | 400 | 1.6 |
| Label | `text-label` (`clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem)`) | 600 for labels/statuses, 400 for metadata | 1.5 |
| Heading | `text-heading` (`clamp(1.125rem, 1.02rem + 0.45vw, 1.25rem)`) | 600 | 1.25 |
| Display | Use only existing page/header display when already present; new Phase 29 guardrail/smoke cards should prefer `text-heading` or `text-body` | 600 maximum in new deployment panels | 1.12 when existing `text-display` is reused |

Phase 29 must not introduce any new font weights beyond 400 and 600 in deployment guardrail or smoke profile UI. Do not introduce monospace command blocks unless the existing UI already has a matching pattern. Commands can remain `text-label` inside secondary rounded blocks for consistency.

---

## Color

Use existing app colors from `frontend/app/globals.css` and `frontend/tailwind.config.ts`.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FCFF` | Page background and calm admin page context |
| Surface | `#FFFFFF` | Main panels and metric cards |
| Secondary (30%) | `#EAF7F3` | Metadata groups, command blocks, safe explanatory callouts |
| Accent (10%) | `#2CA58D` | Section labels, primary filter button, pass badge border/text |
| Accent dark | `#1F7F6F` | Pass badge text |
| Warning | `#F59E0B` | `warn` badge border and warning callout emphasis |
| Destructive | `#DC2626` | `fail` badge text and blocking deployment errors only |
| Line | `#D7EFE8` | Card borders |

Accent reserved for: section labels, primary form submit, pass status badges, focus outlines, and safe metadata highlights. Do not use accent for every command or every link in deployment panels.

Status mapping must remain:

| Status | Classes |
|--------|---------|
| `pass` or `covered` | `border-accent bg-secondary text-accent-dark` |
| `warn` | `border-warning bg-[#FFF8E8] text-[#6B4A00]` |
| `fail`, `blocking`, or unknown status | `border-[#F3C0C0] bg-white text-red-700` |

---

## Copywriting Contract

Human-facing UI copy should be Vietnamese-first and operator-safe. CLI command names can stay English.

| Element | Copy |
|---------|------|
| Deployment panel title | `Deployment guardrails` |
| Deployment panel description | `Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn.` |
| Smoke panel title | `Smoke profiles` |
| Smoke panel description | `Tách smoke public demo khỏi production pilot để không tạo tự tin sai từ tài khoản demo.` |
| Demo smoke card title | `Demo smoke` |
| Demo smoke body | `Dùng tài khoản demo đã seed để kiểm tra landing, đăng nhập theo vai trò và dashboard public demo.` |
| Pilot smoke card title | `Production pilot smoke` |
| Pilot smoke body | `Yêu cầu readiness ready và không phụ thuộc tài khoản demo hoặc dữ liệu walkthrough.` |
| Empty state heading/body | `Chưa có kết quả guardrail.` / `Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.` |
| Loading state | `Đang tải dữ liệu vận hành...` |
| Error state | `Chưa tải được dữ liệu vận hành. Hãy thử lại từ cổng quản trị.` |
| Blocking remediation prefix | `Cần xử lý trước pilot:` |
| Privacy note | `Không hiển thị secret, cookie value, connection string, email người dùng hoặc dữ liệu riêng tư của học sinh.` |

Avoid phrases that imply clinical monitoring, student ranking, or raw-data access. Do not use "risk leaderboard", "xếp hạng nguy cơ", "xuất dữ liệu thô", or free-text incident notes in Phase 29 UI.

---

## Interaction Contract

1. Deployment guardrail results are read-only metadata cards. Phase 29 UI must not add a destructive deploy, rollback, reset, export, or secret-reveal button.
2. If commands are shown, they are copyable text only if implemented with an accessible button labelled `Sao chép lệnh`; otherwise plain text is acceptable.
3. Filters already present on the operations page must continue to work for audit events and must not filter away deployment guardrail panels.
4. `Demo smoke` and `Production pilot smoke` must be visually separate cards. A combined "production smoke" label is not enough after Phase 29.
5. Pilot smoke card must state that it requires readiness `ready` and does not depend on demo users.
6. Guardrail failures must show one remediation sentence, not a stack trace.
7. Any new status badge text must be keyboard-readable plain text, not icon-only.

---

## Data Privacy and Metadata Contract

Allowed fields for deployment/smoke UI:

- Runtime mode labels: `local_demo`, `public_demo`, `production_pilot`
- Safe status values: `pass`, `warn`, `fail`, `ready`, `degraded`, `not_ready`
- Safe category keys such as `vercel_frontend`, `render_backend`, `frontend_api_target`, `cors_cookie_contract`, `demo_smoke`, `pilot_smoke`
- Counts, booleans, command names, route paths, HTTP status classes, and public documented hostnames
- Remediation text that names env var keys but not values

Forbidden fields:

- Database URLs or connection strings
- Cookie names, cookie values, session IDs, CSRF tokens, auth tokens
- Provider credentials, SMTP credentials, API keys, OAuth secrets
- Raw emails, raw user IDs, raw alert IDs, raw delivery IDs, raw audit resource IDs
- Student notes, chatbot transcripts, self-check answers, SOS notes, mood private notes
- Free-text reasons, exports, risk leaderboards, per-student drilldowns

If an API returns a forbidden field, the UI must not render it. Prefer removing the field in backend schemas during implementation.

---

## Loading, Empty, Error, and Degraded States

| State | UI contract |
|-------|-------------|
| Loading | Preserve existing page loading copy `Đang tải dữ liệu vận hành...` in a rounded white card. |
| Empty guardrails | Show `Chưa có kết quả guardrail.` and the next step `Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.` |
| Warning/degraded | Use amber `warn` badge and remediation copy. Do not block reading other metadata panels. |
| Blocking failure | Use red `fail` badge, prefix remediation with `Cần xử lý trước pilot:`, and keep the card readable without expanding raw details. |
| API error | Preserve existing generic admin error text; do not show network stack traces or response bodies. |

---

## Responsive Layout

Use the existing operations page layout rules:

- Page section spacing: `space-y-6`
- Metric card grid: `grid gap-4 md:grid-cols-3` or `lg:grid-cols-2` for panels
- Deployment guardrail cards: single column on mobile, two columns at `lg` if there are separate backend/frontend groups
- Smoke profile cards: single column on mobile, two columns at `sm` or `lg` only when both cards remain readable
- Cards must include `min-width: 0` by relying on global CSS and use `break-all` only for safe command text if it can overflow
- No horizontal overflow at 320px viewport

---

## Accessibility Contract

- Status badge text must include the literal status (`pass`, `warn`, `fail`) and not rely on color alone.
- Any copy button must have an `aria-label` with the command purpose, for example `aria-label="Sao chép lệnh demo smoke"`.
- Focus styles must use existing global `focus-visible` outline; do not remove outlines.
- Deployment panels must be reachable in normal document order after privacy boundary and filters.
- Command text must be visible as text; do not hide the command behind hover-only UI.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed for Phase 29 |

Phase 29 must not initialize shadcn or add a third-party UI registry. If implementation later needs an icon, use installed `lucide-react` directly and keep the UI understandable without the icon.

---

## Implementation Acceptance Checks

The future Phase 29 implementation should be considered UI-compliant only if these checks can pass:

1. `frontend/app/(authenticated)/admin/operations/page.tsx` contains `Deployment guardrails`.
2. `frontend/app/(authenticated)/admin/operations/page.tsx` contains `Smoke profiles`.
3. `frontend/app/(authenticated)/admin/operations/page.tsx` contains `Demo smoke`.
4. `frontend/app/(authenticated)/admin/operations/page.tsx` contains `Production pilot smoke`.
5. `frontend/app/(authenticated)/admin/operations/page.tsx` contains `không phụ thuộc tài khoản demo` or equivalent Vietnamese text in the pilot smoke card.
6. No Phase 29 UI code renders any of these strings as labels: `DATABASE_URL`, `SESSION_COOKIE_NAME`, `SMTP_PASSWORD`, `FREEMODEL_API_KEY`, `resource_id`, `student.demo@beyou.local`.
7. Frontend operations tests assert demo smoke and pilot smoke are displayed separately.
8. Frontend operations tests assert forbidden secret/cookie/raw identifier strings are absent from rendered operations output.
9. `npm --prefix frontend run lint` exits 0.
10. `npm --prefix frontend run build` exits 0.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-25
