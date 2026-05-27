---
phase: 06-aggregate-reports-privacy-hardening
artifact: UI-SPEC
created: 2026-05-21
status: self-verified
---

# Phase 06 UI-SPEC: Aggregate Reports & Privacy Hardening

## Screen inventory

1. Admin dashboard card linking to `/admin/reports`.
2. Admin reports page at `/admin/reports`.

## Visual contract

- Use existing card language: `rounded-3xl bg-white p-6 shadow-sm`, `space-y-6`, `grid gap-4 md:grid-cols-2`, and approved spacing such as `p-4`, `p-5`, `p-6`.
- Keep calming BeYou colors already in Tailwind tokens: white surfaces, secondary soft backgrounds, accent for constructive highlights, red only for warnings/errors.
- Do not introduce third-party UI/analytics registries.

## Vietnamese copy contract

Required page title: `Báo cáo tổng hợp riêng tư`.

Required privacy note copy:

- `Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư. Trang này không hiển thị câu trả lời tự kiểm tra, tin nhắn chatbot, ghi chú SOS hay danh sách học sinh theo nguy cơ.`
- `Các nhóm nhạy cảm có ít hơn 3 bản ghi sẽ được ẩn để tránh nhận diện gián tiếp.`
- `Dùng báo cáo để cải thiện hỗ trợ chung, không dùng để xếp hạng hoặc giám sát từng học sinh.`

Required suppression label: `Đã ẩn để bảo vệ riêng tư (<3)`.

Empty state must be specific, not generic:

- `Chưa có đủ dữ liệu tổng hợp trong phạm vi này. BeYou vẫn giữ nguyên ranh giới riêng tư và sẽ hiển thị xu hướng khi nhóm đủ lớn.`

## Interaction contract

- Reports load automatically with `demo_scope=all`.
- Admin can switch scope among `Tất cả dữ liệu`, `Chỉ dữ liệu demo`, and `Chỉ dữ liệu thật`.
- Loading state: `Đang tải báo cáo tổng hợp...`.
- Error state: `Chưa tải được báo cáo tổng hợp. Hãy thử lại từ cổng quản trị.`
- No export/download button.
- No per-student links or drilldowns from aggregate buckets.

## Content sections

1. Overview cards: users, active links/linked students, self-check completions, SOS alerts, scenario attempts, chatbot high-risk signals.
2. User counts: by role/status/demo status.
3. Self-check aggregates: completions by test and risk-level distribution.
4. SOS aggregates: counts by status/severity/source.
5. Scenario aggregates: popular scenarios by aggregate count.
6. Chatbot safety aggregates: high-risk and SOS-suggested signal totals.
7. Privacy notes shown near top and near suppressed buckets.

## Data rendering rules

- Use `count` only when backend returns a number.
- If `suppressed=true`, render the required suppression label and never infer the hidden value.
- Do not render IDs, emails, student names, raw text, SOS notes, chatbot messages, or self-check answer snapshots.
- Demo badges/labels must be visible when scope or buckets distinguish demo data.

## Self-checker result

- Spacing: PASS — only existing Tailwind spacing patterns.
- Typography/color: PASS — existing BeYou classes and calm palette.
- Copy: PASS — Vietnamese, warm, non-clinical, privacy-respecting.
- States: PASS — specific loading/error/empty/suppressed states.
- Safety/privacy: PASS — no raw exports, drilldowns, or risk leaderboard.
- Dependencies: PASS — no new third-party services.
