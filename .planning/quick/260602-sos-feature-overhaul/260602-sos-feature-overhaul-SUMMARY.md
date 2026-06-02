# Quick Task 260602-sos-feature-overhaul: Đồng bộ và hoàn thiện tính năng SOS - Summary

**Completed:** 2026-06-02
**Commit:** b179b26

## Problem

Tính năng cứu trợ khẩn cấp (SOS) trước đây có những thiếu sót làm giảm hiệu quả thực tế:
1. Học sinh chỉ gửi SOS sơ sài thông qua một form tĩnh, không thể đính kèm lời nhắn chi tiết, không chọn được mức độ khẩn cấp (`urgent` / `support`), và hoàn toàn không thể theo dõi tiến độ hỗ trợ thời gian thực (vốn rất quan trọng để xoa dịu lo âu của học sinh).
2. Trang SOS của Giáo viên và Phụ huynh bị lỗi không nhận diện được `alert.student_name` (vì backend trả về đối tượng sinh động `student.full_name`) và hiển thị sai trạng thái `alert.status` (vì backend dùng `current_status` kết hợp trường cập nhật động `events`).
3. Khuyết thiếu các hàm API lấy danh sách SOS an toàn cho Giáo viên/Phụ huynh trong client helper.

## Solution

Đã hoàn thành xuất sắc cải tiến và khắc phục toàn diện tính năng liên lạc khẩn cấp SOS:

1. **Tái thiết kế trang SOS Học sinh (Student SOS Page)** tại [frontend/app/(authenticated)/student/sos/page.tsx](frontend/app/(authenticated)/student/sos/page.tsx):
   - **Form gửi SOS thông minh**: Học sinh linh hoạt bổ sung ghi chú notes (tối đa 500 ký tự) mô tả tình huống, lựa chọn giữa mức độ Khẩn cấp (`urgent`) hoặc Cần hỗ trợ (`support`), và xem trước danh sách những người lớn đáng tin cậy sẽ nhận được thông báo.
   - **Bản đồ Theo dõi Tiến độ Trực quan (Step Tracker)**: Chuyển đổi linh hoạt sang giao diện tracking động khi có tín hiệu đang kích hoạt (chưa `completed`). Học sinh có thể theo dõi tiến độ xử lý qua 4 bước: `Đã gửi` -> `Đã nhận` -> `Đang hỗ trợ` -> `Đã hoàn thành`.
   - **Nhật ký cập nhật (Activity Timeline)**: Hiển thị dòng thời gian tích hợp ghi nhận từng thời điểm giáo viên nhận tín hiệu, bắt đầu tư vấn, và hoàn thành hỗ trợ.
   - **Tài nguyên hỗ trợ & Đóng tín hiệu**: Bổ sung card tài nguyên khẩn cấp (Tổng đài Quốc gia Bảo vệ Trẻ em 111, Cứu thương 115) giúp trang bị kỹ năng tự vệ tâm lý, đi kèm nút kết thúc hỗ trợ an toàn để học sinh chủ động giải tỏa SOS khi đã ổn định.

2. **Cập nhật API Helper** tại [frontend/lib/sos-api.ts](frontend/lib/sos-api.ts):
   - Triển khai thành công `listTeacherSosAlerts()` và `listParentSosAlerts()` trả về mảng dữ liệu SOS chính xác thông qua cookie session bảo mật tuyệt đối.

3. **Khắc phục triệt để đồng bộ dữ liệu giao diện Giáo viên và Phụ huynh**:
   - Sửa đổi [frontend/app/(authenticated)/teacher/sos-alerts/page.tsx](frontend/app/(authenticated)/teacher/sos-alerts/page.tsx) và [frontend/app/(authenticated)/parent/sos-alerts/page.tsx](frontend/app/(authenticated)/parent/sos-alerts/page.tsx).
   - Truy vấn tên học sinh chuẩn xác bằng `alert.student?.full_name` kèm giá trị mặc định phòng ngừa lỗi `Học sinh ẩn danh`.
   - Đồng nhất việc lọc, kết xuất trạng thái bằng `alert.current_status`. Giáo viên có thể thay đổi trạng thái SOS trực tuyến và thông tin được cập nhật mượt mà tức thì lên màn hình theo dõi của học sinh.

## Files Modified

| File | Change |
|------|--------|
| [frontend/app/(authenticated)/student/sos/page.tsx](frontend/app/(authenticated)/student/sos/page.tsx) | Thiết kế lại hoàn toàn trang SOS học sinh hỗ trợ notes, độ khẩn cấp, xem trước người nhận, Live tracking progress bar, timeline sự kiện và tài nguyên cứu trợ. |
| [frontend/lib/sos-api.ts](frontend/lib/sos-api.ts) | Định nghĩa bổ sung API mappers `listTeacherSosAlerts` và `listParentSosAlerts` để phục vụ Adult views. |
| [frontend/app/(authenticated)/teacher/sos-alerts/page.tsx](frontend/app/(authenticated)/teacher/sos-alerts/page.tsx) | Khắc phục lỗi đọc và lọc trạng tháiSOS, hiển thị chính xác tên học sinh và nâng cấp bảng cập nhật trạng thái SOS. |
| [frontend/app/(authenticated)/parent/sos-alerts/page.tsx](frontend/app/(authenticated)/parent/sos-alerts/page.tsx) | Đồng bộ trường dữ liệu tên học sinh và trạng thái SOS cứu hộ, hiển thị chế độ read-only tuyệt đối an toàn. |

## Verification

- **Frontend tests**: Chạy `npm run test` -> 33/33 files test, 169/169 unit tests passed thành công 100%!
  - Gồm test suite `tests/phase4-sos-ui.test.tsx` (5/5 tests passed) xác thực việc hiển thị ghi chú, mức độ khẩn cấp, thay đổi trạng thái và live tracking cho học sinh.
  - Gồm test suite `tests/phase35-role-dashboards-ui.test.tsx` (2/2 tests passed) xác thực hiển thị SOS-alerts trên trang Giáo viên/Phụ huynh.
- **Backend tests**: Chạy `pytest backend/tests/test_phase4_sos_backend.py` -> 4/4 tests passed hoàn toàn lộng lẫy dưới chế độ `RUNTIME_MODE=local_demo`.
- **Lint & Build check**: `npm run lint` và `npm run build` không xuất hiện bất kỳ cảnh báo lỗi cấu trúc hay kiểu dữ liệu TypeScript nào.
