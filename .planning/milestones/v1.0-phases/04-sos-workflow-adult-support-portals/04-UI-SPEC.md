# Phase 04 UI-SPEC: SOS Workflow & Adult Support Portals

**Status:** Approved by self-check  
**Language:** Vietnamese user-facing copy  
**Design intent:** Calm, direct support workflow. Red is reserved for SOS/urgent emphasis only.

## Screens and Components

### Student dashboard SOS card
- Location: visible on `/student`, near existing wellbeing quick actions.
- Container: rounded card, `p-6`, mobile-first, no generic empty state.
- Primary copy: `Gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.`
- CTA: `Gửi SOS hỗ trợ`
- Secondary boundary copy: `BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.`
- Emergency guidance copy: `Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc liên hệ nguồn hỗ trợ phù hợp tại nơi em sống.`

### Student SOS confirmation panel
- Triggered before submitting. Must be explicit; no one-click send.
- Heading: `Xác nhận gửi tín hiệu hỗ trợ`
- Body: `Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin cậy được liên kết với em sẽ nhận thông báo trong BeYou.`
- Severity options:
  - `Em cần người lớn liên hệ sớm`
  - `Em đang không an toàn ngay lúc này`
- Optional note label: `Điều em muốn người lớn biết lúc này (không bắt buộc)`
- Submit: `Xác nhận gửi SOS`
- Cancel: `Ở lại trang này`

### Student SOS status progress
- Route may be embedded on `/student`.
- Status labels:
  - `sent` → `Đã gửi`
  - `received` → `Đã nhận`
  - `supporting` → `Đang hỗ trợ`
  - `completed` → `Đã hoàn tất`
- Show latest 5 alerts with status, created time, severity label, optional note, and demo badge.
- Empty state must be specific: `Chưa có tín hiệu SOS nào. Khi cần, em có thể gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.`

### Adult notifications
- Teacher and parent dashboards show a `Thông báo hỗ trợ` section.
- Notification copy does not include raw self-check answers.
- CTA links to role-appropriate SOS/status area.
- Unread badge uses calm accent; urgent SOS can use a red border only.

### Teacher support portal
- Teacher dashboard keeps linked student cards and adds:
  - warning group labels `Cần quan tâm`, `Nguy cơ cao`
  - latest permitted self-check support summary
  - open SOS status
  - CTA `Xem và cập nhật SOS`
- Teacher SOS page/status controls:
  - Buttons: `Đánh dấu đã nhận`, `Đang hỗ trợ`, `Hoàn tất hỗ trợ`
  - Optional update note label: `Ghi chú hỗ trợ (không bắt buộc)`
  - Copy: `Cập nhật trạng thái để học sinh và phụ huynh biết tín hiệu đang được xử lý.`

### Parent support portal
- Parent dashboard shows linked child SOS status and latest permitted support summary.
- CTA: `Xem trạng thái SOS`
- Parent pages are read-only for SOS status.
- Copy: `Bạn đang xem trạng thái hỗ trợ và tóm tắt được phép xem, không phải câu trả lời riêng tư của học sinh.`

## Accessibility and States
- Buttons have `min-h-11`.
- Use semantic headings and buttons.
- Loading copy: `Đang tải thông tin...`
- Error copy: `Chưa tải được thông tin. Hãy thử lại từ trang chính.`
- Do not use placeholder-only empty states.

## Privacy and Safety Guardrails
- Do not render raw self-check answers, score breakdowns, or scenario history in adult SOS/support surfaces.
- Do not claim diagnosis, therapy, emergency dispatch, or absolute confidentiality.
- Demo data displays existing `Demo` badge/banner.

## Self-Validation
- Valid spacing tokens include `p-6`, `p-4`, `gap-4`, `space-y-6`.
- No third-party UI registry or external component dependency.
- Empty states are phase-specific.
- Student copy is supportive, Vietnamese, non-clinical, and not gamified.
- Adult copy supports students and avoids surveillance/ranking framing.
