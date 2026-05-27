---
phase: 23
slug: selective-mood-note-sharing-revocation
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-22
---

# Phase 23 - UI Design Contract

> Visual and interaction contract for selective mood-note sharing and revocation.

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Existing React/Tailwind components only |
| Icon library | lucide-react available; use only if needed for non-essential affordances |
| Font | Inter, ui-sans-serif, system-ui |

Use the existing BeYou design language: calm Vietnamese copy, rounded `rounded-3xl` cards, `bg-secondary` hero/support panels, `bg-white` content cards, `text-display`, `text-heading`, `text-body`, `text-label`, `EmptyState`, and `DemoBadge` where demo data is present.

No third-party registry blocks are allowed in this phase.

## Spacing Scale

Declared values must remain multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline text spacing |
| sm | 8px | Button/icon gaps, checkbox label spacing |
| md | 16px | Form field gaps, card inner groups |
| lg | 24px | Card padding, section spacing |
| xl | 32px | Page groups, modal/confirmation blocks |
| 2xl | 48px | Major page separation |
| 3xl | 64px | Reserved for page-level whitespace only |

Exceptions:
- Interactive controls must have at least `44px` effective touch target height.
- Inline badges may be `min-h-6` only when not primary actions.
- Student share/revoke actions must remain visually near the related mood-history card, not in a detached page-level action area.

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label | 14px via `text-label` | 400 | 1.5 |
| Body | 16px via `text-body` | 400 | 1.6 |
| Heading | 20px via `text-heading` | 600 | 1.25 |
| Display | 32px via `text-display` | 600 | 1.12 |

Rules:
- Use only two emphasis weights for new UI: normal body `400`, semibold `600`.
- Do not introduce dense legal-style copy. Consent copy must be short, explicit, and supportive.
- Adult UI must not use alarming/risk-score wording.

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FCFF` / app background | Page background and calm whitespace |
| Secondary (30%) | `#EAF7F3` / `bg-secondary` | Hero panels, privacy reminders, nested consent panels |
| Surface | `#FFFFFF` / `bg-white` | Mood cards, adult shared-note cards, form containers |
| Accent (10%) | `#2CA58D` | Primary consent CTA, selected adult chips, focus ring, active-share status |
| Warning | `#F59E0B` | Non-blocking caution copy only, such as "kiem tra lai truoc khi chia se" |
| Destructive | `#DC2626` | Revoke access action only |

Accent reserved for:
- Primary CTA: `Chia sẻ ghi chú`
- Selected adult state
- Active share status badge
- Focus-visible outline
- Success confirmation text or border

Destructive reserved for:
- `Thu hồi quyền xem`
- Confirmation button for revocation only

Do not use destructive color for mood states, student distress labels, trend labels, or adult summary counts.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Student primary CTA | `Chia sẻ ghi chú` |
| Student secondary CTA | `Xem trước trước khi chia sẻ` |
| Student cancel CTA | `Giữ riêng tư` |
| Student revoke CTA | `Thu hồi quyền xem` |
| Adult section heading | `Ghi chú được học sinh đồng ý chia sẻ` |
| Adult aggregate section heading | `Xu hướng check-in cảm xúc` |
| Empty state heading | `Chưa có check-in nào để chia sẻ` |
| Empty state body | `Khi em có check-in cảm xúc, em có thể tự chọn chia sẻ ghi chú riêng tư hoặc phần tóm tắt em tự viết với người lớn tin cậy. Không bắt buộc phải chia sẻ.` |
| Error state | `Chưa cập nhật được quyền chia sẻ. Hãy kiểm tra lại lựa chọn rồi thử lại.` |
| Destructive confirmation | `Thu hồi quyền xem: Người lớn này sẽ không còn xem được nội dung đã chia sẻ. Lịch sử kiểm tra chỉ lưu thông tin thao tác, không lưu nội dung ghi chú.` |

Required Vietnamese consent preview copy:
- `Em sắp chia sẻ ghi chú này với: {adultNames}.`
- `Nội dung được chia sẻ: {private note / phần tóm tắt em tự viết}.`
- `Vẫn riêng tư: các check-in khác, ghi chú khác, điểm số chi tiết và những gì em không chọn chia sẻ.`
- `Em có thể thu hồi quyền xem trong lịch sử check-in bất cứ lúc nào.`
- `Việc chia sẻ này không gửi thông báo ngoài ứng dụng, không tạo SOS và không tạo điểm rủi ro.`

Adult boundary copy:
- `Phần này chỉ hiển thị nội dung học sinh đã chủ động đồng ý chia sẻ.`
- `Xu hướng check-in bên dưới là tóm tắt tổng hợp; không thay thế việc lắng nghe học sinh.`
- `Nếu quyền chia sẻ bị thu hồi, nội dung sẽ không còn hiển thị.`

Forbidden copy:
- Không dùng `nguy cơ`, `điểm rủi ro`, `giám sát`, `cảnh báo người lớn`, `chẩn đoán`, `tuân thủ`.
- Không hứa gửi thông báo cho người lớn.
- Không gợi ý hệ thống tự tạo SOS.

## Student Mood History Layout Contract

Surface: `frontend/app/(authenticated)/student/mood-check-ins/history/page.tsx`

Page structure:
1. Existing hero card remains at top:
   - `rounded-3xl bg-secondary p-6 shadow-sm`
   - Update body copy to say Phase 23 allows student-controlled selective sharing.
2. Existing mood check-in cards remain `rounded-3xl bg-white p-6 shadow-sm`.
3. Share controls appear only inside cards where:
   - Check-in belongs to current student.
   - `private_note` exists, or the student can write a summary in the share flow.
   - The check-in is not merely aggregate/trend data.
4. Cards without `private_note` still allow summary-only sharing, but the private-note scope is disabled with text-label helper:
   - `Check-in này không có ghi chú riêng tư; em vẫn có thể tự viết tóm tắt nếu muốn chia sẻ.`

Per-card layout:
- Header row: trend label, DemoBadge if demo, active-share badge if applicable.
- Metadata row: timestamp as existing.
- Mood details grid remains unchanged.
- Private note panel remains inside `bg-secondary`.
- New share panel appears below private note with `mt-4 rounded-2xl border border-[#D7EFE8] bg-white p-4` or nested `bg-secondary` when confirming.
- When active, the share panel and consent preview are the visual anchor of the check-in card; supporting history details remain visually quieter.

Share panel states:
1. No active shares:
   - Button: `Chia sẻ ghi chú`
   - Helper: `Chỉ những người lớn em chọn mới xem được ghi chú này.`
2. Draft/selecting adults:
   - Checkbox list or multi-select list of currently linked adults.
   - Each adult row must show display name and relationship label.
   - No email/contact identifiers.
   - Disabled state for stale relationships must not appear if backend filters correctly; if returned, show disabled with `Liên kết này không còn hoạt động`.
   - On cards without `private_note`, default scope is `student_summary` and the private-note option is disabled.
3. Preview:
   - Show selected adult names.
   - Show content scope.
   - Show what remains private.
   - Show revocation path.
   - Primary button: `Xác nhận chia sẻ`
   - Secondary button: `Sửa lựa chọn`
4. Success:
   - `Đã lưu quyền chia sẻ. Em có thể thu hồi trong thẻ check-in này bất cứ lúc nào.`
5. Active shares:
   - List adult names with status badge `Đang được chia sẻ`.
   - Per-adult action: `Thu hồi quyền xem`
   - Optional all-action: `Thu hồi tất cả` only when more than one active share exists.
6. Revocation confirmation:
   - Inline confirmation panel preferred over modal.
   - Must name adult(s).
   - Must say access is removed after revocation.
   - Must say audit remains metadata-only.

Student summary scope:
- If supported, provide a textarea labeled:
  `Tóm tắt em muốn chia sẻ thay cho ghi chú đầy đủ`
- Helper:
  `Em tự viết phần này. BeYou không tự tạo diễn giải hay chẩn đoán.`
- Scope choices:
  - `Chia sẻ ghi chú riêng tư`
  - `Chia sẻ phần tóm tắt em tự viết`
- Default selected scope: private note when `private_note` exists; otherwise student-authored summary.

## Adult Support Summary Layout Contract

Surfaces:
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx`
- `frontend/app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx`

Adult UI must clearly separate:
1. Existing privacy boundary card.
2. Existing support plan card.
3. New explicitly shared notes card.
4. Existing aggregate mood trend card.

Order:
1. Header
2. Privacy boundary
3. Support plan
4. `Ghi chú được học sinh đồng ý chia sẻ`
5. `Xu hướng check-in cảm xúc`

Shared notes card:
- Container: `rounded-3xl bg-white p-6 shadow-sm`
- Heading: `Ghi chú được học sinh đồng ý chia sẻ`
- Intro copy: `Chỉ hiển thị những nội dung học sinh đã chủ động chọn chia sẻ với bạn.`
- Each note item:
  - `rounded-2xl bg-secondary p-4`
  - Timestamp
  - Scope label:
    - `Ghi chú riêng tư được chia sẻ`
    - `Tóm tắt học sinh tự viết`
  - Content text
  - Consent reminder: `Nội dung này có thể không còn hiển thị nếu học sinh thu hồi quyền xem.`
- Empty state inside card:
  `Học sinh chưa chia sẻ ghi chú cảm xúc nào với bạn, hoặc quyền chia sẻ đã được thu hồi.`

Aggregate trend card:
- Keep existing heading `Xu hướng check-in cảm xúc`.
- Add label before counts: `Tóm tắt tổng hợp`.
- Must not visually merge with shared-note content.
- Do not expose private notes inside trend summary.

## Components and Interaction Contracts

Required reusable frontend concepts:
- `MoodShareControls`
- `SharePreviewPanel`
- `ActiveShareList`
- `RevokeShareConfirmation`
- `AdultSharedMoodNotesCard`

Buttons:
- Primary: accent background, white or high-contrast text, semibold.
- Secondary: white background, `border-[#D7EFE8]`.
- Destructive: destructive text/border by default; destructive filled only in final confirmation.
- Disabled buttons must include visible disabled style and not rely on color alone.

Forms:
- Adult selection uses native checkboxes or accessible buttons with `aria-pressed`.
- Textarea for student summary must have visible label and helper text.
- Validation errors must be placed near fields and announced via `role="alert"`.

Loading:
- Student history initial load may keep existing `Đang tải lịch sử check-in...`.
- Share mutation loading: `Đang lưu quyền chia sẻ...`.
- Revoke mutation loading: `Đang thu hồi quyền xem...`.
- Adult shared notes loading may be covered by existing summary page load.

Error:
- Share/revoke failure: `Chưa cập nhật được quyền chia sẻ. Hãy thử lại hoặc quay lại sau.`
- Adult read failure keeps existing EmptyState pattern: `Chưa tải được tóm tắt hỗ trợ`.

## Accessibility Contract

- All share/revoke controls keyboard reachable.
- Focus order must follow visual order inside each mood card.
- Consent preview must move focus to preview heading when opened.
- Revocation confirmation must move focus to confirmation heading when opened.
- Use `aria-live="polite"` for success messages.
- Use `role="alert"` for errors.
- Adult checkbox rows must expose adult name and relationship in accessible label.
- Destructive confirmation must not be triggered by a single click; require second explicit confirmation.
- Color is never the only signal for active, selected, error, or destructive states.
- Touch targets: minimum 44px height for primary/secondary/destructive actions.

## Responsive Behavior

Mobile `<640px`:
- Single-column cards.
- Adult selection list full width.
- Primary/secondary buttons stack vertically with full width.
- Active share rows stack: adult name/status above revoke action.
- Preview copy remains readable; no horizontal scrolling.

Tablet/Desktop `>=768px`:
- Mood details may keep existing `md:grid-cols-3`.
- Adult shared note items remain one column to avoid dense sensitive content.
- Form actions may align horizontally with `flex-wrap`.

Max width:
- Adult support summary keeps existing `mx-auto max-w-[960px]`.
- Student mood history can remain existing section width inherited from authenticated layout.

## Privacy and Safety Invariants

Must hold in UI:
- Share controls appear only for own check-ins; private-note scope appears only when private note exists, while summary scope requires student-authored text before preview.
- Adult names are shown to the student before save.
- Content scope is shown before save.
- What remains private is shown before save.
- Revocation path is shown before save.
- Revocation is visible next to active shares.
- Adult shared-note section is separate from aggregate mood trend.
- No external notification copy.
- No SOS creation copy.
- No adult alert copy.
- No risk score copy.
- No audit UI displays raw private note, raw summary text, contact identifiers, or free-text reasons.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable - `components.json` absent |
| third-party | none | not applicable |

## Acceptance Checks

- [ ] Student mood history shows `Chia sẻ ghi chú` only for shareable own check-ins.
- [ ] Student can select one or more linked adults.
- [ ] Preview names selected adults.
- [ ] Preview states exact content scope.
- [ ] Preview states what remains private.
- [ ] Preview states revocation path.
- [ ] Sharing success shows active share status in the same check-in card.
- [ ] Student can revoke per adult.
- [ ] Student can revoke all only when multiple active shares exist.
- [ ] Revocation confirmation names the affected adult(s).
- [ ] Adult support summary has a separate shared-note section.
- [ ] Adult aggregate mood trend remains visually separate from shared notes.
- [ ] Revoked shares disappear from adult shared-note section.
- [ ] Empty states do not pressure students to share.
- [ ] All user-facing copy is Vietnamese.
- [ ] No UI copy mentions external notifications, automatic SOS, alerts, diagnosis, monitoring, or risk scoring.
- [ ] Error and success states are accessible and screen-reader friendly.
- [ ] Mobile layout has no horizontal overflow at 320px.

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
