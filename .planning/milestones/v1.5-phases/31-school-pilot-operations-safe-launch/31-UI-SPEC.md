---
phase: 31
slug: school-pilot-operations-safe-launch
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 31 — UI Design Contract

> Visual and interaction contract for School Pilot Operations & Safe Launch.
> UI anchor: existing admin operations page at `/admin/operations`.

## Design System

| Property | Value |
|----------|-------|
| Tool | none — manual Tailwind Peerlight AI patterns |
| Preset | not applicable |
| Component library | existing local React/Tailwind panels/cards only |
| Icon library | none required for this phase |
| Font | Inter/system sans via `app/globals.css` |

Source: existing `frontend/app/globals.css`, `frontend/tailwind.config.ts`, admin operations page.

## Spacing Scale

Use the existing 4/8-based Tailwind spacing already present in the admin operations page.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | inline badge/icon gaps only |
| sm | 8px | compact label spacing, stacked metadata rows |
| md | 16px | card internal gaps, checklist item spacing |
| lg | 24px | panel padding, form/card padding |
| xl | 32px | grouped panel separation |
| 2xl | 48px | major page sections |
| 3xl | 64px | page-level breathing room only |

Exceptions:
- Interactive controls must keep `min-h-11` / 44px touch target.
- Rounded containers follow existing `rounded-2xl` for inner cards and `rounded-3xl` for panels.

## Typography

Use existing Tailwind text roles.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label | clamp 13-14px | 600 when used as section label/status, 400 otherwise | 1.5 |
| Body | clamp 15.2-16px | 400 | 1.6 |
| Heading | clamp 18-20px | 600 | 1.25 |
| Display | clamp 28-37.6px | 650 | 1.12 |

Rules:
- Do not introduce additional type sizes for Phase 31.
- Checklist labels use Heading or Body + semibold, never display size.
- Evidence/remediation text uses Body or Label only.

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant 60% | `#FFFFFF`, page gradient over `#F8FCFF` | Main panels, metric cards, dashboard surfaces |
| Secondary 30% | `#EAF7F3` | Privacy boundary blocks, metadata buckets, command/evidence containers |
| Accent 10% | `#2CA58D` / `#1F7F6F` | Page eyebrow, safe/pass status emphasis, primary filter CTA only |
| Warning | `#F59E0B` with `#FFF8E8` surface | `warn` / `needs_review` launch states |
| Destructive | `#DC2626` | Errors and destructive-action warnings only |

Accent reserved for:
- Page eyebrow: `Vận hành pilot an toàn`
- Pass/ready badges
- Primary button: `Áp dụng bộ lọc`
- Privacy/support boundary emphasis

Do not use red for normal pilot blockers unless the state is `fail`, `blocked`, or an error.

## Page Anchor and Information Architecture

Phase 31 must extend the existing `/admin/operations` page. Do not add a new route.

Preserve existing page order where possible, but add pilot launch panels near the top after the privacy boundary section and before existing deployment guardrails.

Required new dashboard sections:

1. **Production pilot launch status**
   - Overall launch status card.
   - Status enum: `ready`, `needs_review`, `blocked`.
   - Copy must clarify this is readiness metadata, not an approval workflow.

2. **Launch checklist**
   - Checklist cards/items for:
     - runtime mode
     - readiness status
     - migrations/static checks
     - origins/cookies
     - demo seed/login state
     - identity readiness
     - smoke evidence
     - privacy regression status
     - baseline content
     - school policy setup
   - Each item displays:
     - safe label
     - status badge
     - evidence text
     - remediation text when present
     - optional safe command string
   - No tables.

3. **Demo/real data safety**
   - Aggregate counts/statuses only.
   - Must show whether production pilot is blocked or flagged when demo users, demo links, or walkthrough/config rows are active unexpectedly.
   - Allowed fields: counts, statuses, safe bucket labels.
   - No raw user, link, content, school, class, email, ID, note, answer, transcript, SOS reason, provider subject, or claim values.

4. **Baseline setup guidance**
   - Static/checklist metadata for:
     - baseline self-check content published
     - baseline scenario content published
     - mood/check-in config present
     - school privacy policy defaults present
     - in-app-only reminder channel boundary
     - admin contact/handoff documented as metadata status only
     - demo seeding disabled for real pilot

5. **Rollback and handoff guidance**
   - Guidance cards for:
     - redeploy last known good frontend/backend
     - revert config to last known good values
     - rerun readiness/guardrails/smoke
     - notify school owner
     - escalate incident
     - avoid destructive DB reset
     - avoid raw data export defaults
   - This panel is informational only; no destructive buttons.

## Component Contracts

Reuse existing local component patterns from `page.tsx`.

### StatusBadge

Allowed status labels:
- `ready`
- `needs_review`
- `blocked`
- `pass`
- `warn`
- `fail`
- `covered`

Mapping:
- `ready`, `pass`, `covered`: accent border, secondary background, accent-dark text.
- `needs_review`, `warn`: warning border/background/text.
- `blocked`, `fail`: red/destructive text on white or light red surface.

### Panel

Use:

```tsx
<section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
```

### Inner card/checklist item

Use:

```tsx
<article className="rounded-2xl border border-[#D7EFE8] p-4">
```

or secondary metadata block:

```tsx
<div className="rounded-2xl bg-secondary p-4">
```

### MetricCard

Use for summary counts/statuses only:
- Launch status
- Blocking checks
- Demo data signals
- Baseline setup count
- Handoff guidance count

No metric card may represent a student, class, school group, risk rank, or individual incident.

## Copywriting Contract

Vietnamese-first, support-oriented, operational, non-surveillance.

| Element | Copy |
|---------|------|
| Page eyebrow | `Vận hành pilot an toàn` |
| Page title | `Sẵn sàng mở pilot trường học` |
| Page intro | `Theo dõi readiness, checklist launch, an toàn dữ liệu demo/thật và hướng dẫn rollback bằng metadata. Trang này không mở nội dung riêng tư của học sinh.` |
| Primary CTA | `Áp dụng bộ lọc` |
| Empty launch checklist | `Chưa có checklist pilot. Hãy kiểm tra readiness và tải lại trang vận hành.` |
| Empty data safety | `Chưa có metadata an toàn dữ liệu pilot. Không có dữ liệu thô được hiển thị.` |
| Empty baseline | `Chưa có metadata thiết lập baseline. Hãy xác nhận nội dung, chính sách và cấu hình pilot trước khi mở cho trường.` |
| Empty handoff | `Chưa có hướng dẫn handoff. Hãy dùng quy trình rollback an toàn trong README và kiểm tra lại readiness.` |
| Loading state | `Đang tải metadata vận hành pilot...` |
| Error state | `Chưa tải được metadata pilot. Hãy thử lại từ cổng quản trị hoặc kiểm tra readiness backend.` |
| Blocked launch | `Pilot đang bị chặn. Hãy xử lý các mục fail trước khi dùng với dữ liệu học sinh thật.` |
| Needs review | `Pilot cần rà soát thêm. Các mục warn không mở dữ liệu riêng tư nhưng cần xác nhận trước launch.` |
| Ready launch | `Pilot sẵn sàng theo metadata hiện tại. Vẫn cần xác nhận vận hành với trường trước khi mở thực tế.` |
| Destructive confirmation | None in this phase — do not add destructive launch/reset/export actions. |

Tone rules:
- Say `metadata`, `readiness`, `hướng xử lý`, `handoff hỗ trợ`.
- Do not say `giám sát học sinh`, `xếp hạng nguy cơ`, `điều tra`, `theo dõi cá nhân`.
- Do not imply this UI approves launch legally or clinically.
- Do not claim Peerlight AI diagnoses, treats, or replaces professional support.

## Responsive Layout

Mobile first.

### 320-639px
- Single column.
- Panels stacked.
- Checklist items full width.
- Long command/evidence text wraps.
- No horizontal tables.
- Buttons and inputs `min-h-11`.

### 640-1023px
- Metric cards may use 2 columns.
- Checklist/data-safety cards may use 2 columns only when content remains readable.

### 1024px+
- Preserve existing `lg:grid-cols-2` pattern for paired panels.
- Summary metrics may use 3-column grid where already established.
- Pilot launch status should span full width near top.

No raw JSON viewer, no dense table, no drilldown column.

## Loading, Empty, Error States

### Loading
- Use existing rounded white card.
- Copy: `Đang tải metadata vận hành pilot...`
- Do not show stale pilot launch status while loading a new filter result unless clearly marked.

### Empty
Each new panel must have a Vietnamese empty state:
- Launch checklist empty
- Data safety empty
- Baseline setup empty
- Rollback/handoff empty

Empty states must state that no raw data is displayed.

### Error
- Use red/destructive text only for fetch failure.
- Copy must include next step.
- Do not display server exception details, stack traces, raw payloads, or request URLs.

## Accessibility Requirements

- All new sections use semantic `<section>` with visible `<h2>`.
- Status badges must be text labels, not color-only indicators.
- Checklist items must expose label + status in visible text.
- Filter controls keep existing labels and `aria-label`.
- Any command strings are static text, not auto-run buttons.
- Touch targets at least 44px.
- Focus visible uses existing global outline.
- Do not introduce hover-only content.
- Do not introduce animated status changes that ignore `prefers-reduced-motion`.
- Ensure warning/destructive colors have text labels for meaning.

## Forbidden UI Patterns

Phase 31 must not add:

- Export buttons or download actions.
- Raw JSON viewers.
- Raw payload/debug panels.
- Per-student drilldowns.
- Risk leaderboards.
- Rank/sort by risk.
- Links to student detail from operations.
- Raw emails.
- Raw user IDs, link IDs, provider subjects, claim values.
- Raw notes.
- Raw SOS notes.
- Raw SOS reasons or free-text reasons.
- Raw chatbot transcripts.
- Raw self-check answers.
- Raw scenario answers.
- Raw school/class/group claims.
- Destructive DB reset.
- One-click launch approval workflow.
- Any action that deletes, resets, exports, or opens real student records.

Allowed:
- Aggregate counts.
- Safe enum statuses.
- Safe command names.
- Sanitized evidence strings.
- Non-sensitive remediation copy.
- Metadata bucket labels.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not applicable |

No `components.json` exists. Do not initialize shadcn in this phase because the UI anchor is the existing page.

## Test Hooks

Frontend Vitest should extend existing operations UI tests.

Required test hooks/text:

- `Sẵn sàng mở pilot trường học`
- `Production pilot launch status`
- `Launch checklist`
- `Demo/real data safety`
- `Baseline setup`
- `Rollback và handoff`
- `Pilot đang bị chặn`
- `Pilot cần rà soát thêm`
- `Pilot sẵn sàng theo metadata hiện tại`
- `Chưa có checklist pilot`
- `Chưa có metadata an toàn dữ liệu pilot`

Recommended stable selectors only if necessary:
- `data-testid="pilot-launch-status"`
- `data-testid="pilot-launch-checklist"`
- `data-testid="pilot-data-safety"`
- `data-testid="pilot-baseline-setup"`
- `data-testid="pilot-handoff-guidance"`

Tests must assert absence of:
- export/download buttons
- raw JSON viewer
- drilldown links
- raw emails
- raw IDs
- raw notes
- transcripts
- answers
- SOS notes/reasons
- claim/provider subject strings
- risk leaderboard/ranking language

## Acceptance Criteria

1. Admin operations page remains the only Phase 31 UI route.
2. Page renders production pilot launch status near the top.
3. Launch checklist covers runtime, readiness, migrations/static checks, origins/cookies, seed state, identity readiness, smoke evidence, privacy regression, baseline content, and school policy setup.
4. Demo/real data safety renders counts/statuses only.
5. Production pilot is visually `blocked` or `needs_review` when active demo accounts, demo links, or walkthrough/config rows appear unexpectedly.
6. Baseline setup guidance covers content, policy, in-app-only reminders, handoff metadata, and demo-seed-disabled expectation.
7. Rollback/handoff guidance covers safe redeploy, config rollback, readiness recheck, school contact, incident escalation, and explicitly avoids destructive reset/raw export defaults.
8. Vietnamese copy is support-oriented and metadata-only.
9. Responsive layout works from 320px width without horizontal overflow.
10. Loading, empty, and error states are present for Phase 31 panels.
11. Accessibility requirements are met with semantic headings, visible text statuses, and 44px touch targets.
12. Forbidden UI patterns are absent.
13. Existing Phase 11, 25, 29, and 30 operations UI contracts remain compatible with optional payload sections.
14. API type additions for `pilot_launch`, `pilot_data_safety`, and `pilot_handoff` are optional/backwards-compatible.
15. Tests prove sensitive fields and forbidden UI labels do not render.

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
