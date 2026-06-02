# Quick Task 260602-sos-feature-overhaul: Đồng bộ và hoàn thiện tính năng SOS - Plan

**Date:** 2026-06-02

## Problem

Tính năng cứu trợ khẩn cấp (SOS) là một trong những tính năng cốt lõi (core feature) của Peerlight AI, cho phép học sinh gửi tín hiệu hỗ trợ khẩn cấp tới các người lớn đáng tin cậy (Giáo viên, Phụ huynh). Qua xem xét và đánh giá:
1. **Thiếu tính năng cho Học sinh**: Trang SOS của học sinh trước đây chỉ là một form gửi dữ liệu tĩnh, thiếu cơ chế theo dõi thời gian thực (Live tracking progress) giúp cập nhật trạng thái xử lý tín hiệu từ giáo viên (`sent` -> `received` -> `supporting` -> `completed`). Học sinh cũng không thể chọn mức độ khẩn cấp (`urgent` / `support`), bổ sung lời nhắn (notes) hay xem trước danh sách người lớn sẽ nhận được tín hiệu.
2. **Lỗi đồng bộ dữ liệu giao diện Giáo viên và Phụ huynh**: Trang danh sách SOS của Giáo viên (`frontend/app/(authenticated)/teacher/sos-alerts/page.tsx`) và Phụ huynh (`frontend/app/(authenticated)/parent/sos-alerts/page.tsx`) bị lỗi hiển thị trường `alert.student_name` (thực tế backend trả về mô hình lồng nhau `alert.student.full_name`) và `alert.status` (thực tế backend sử dụng trường `alert.current_status` kết hợp bảng nhật ký sự kiện `events`). Điều này khiến danh sách của người lớn không nhận diện được tên học sinh hoặc trạng thái xử lý thật từ API.
3. **Thiếu API Helper tích hợp**: Các hàm API cần lấy danh sách cảnh báo SOS dành riêng cho Giáo viên và Phụ huynh chưa được định nghĩa hoàn chỉnh trong [frontend/lib/sos-api.ts](frontend/lib/sos-api.ts).

## Solution

Thực hiện cải tiến toàn diện tính năng cứu trợ SOS trên cả hai đầu frontend & backend (đồng bộ trường dữ liệu):

1. **Phát triển trang SOS Học sinh đa tương tác (Student SOS Page)** at [frontend/app/(authenticated)/student/sos/page.tsx](frontend/app/(authenticated)/student/sos/page.tsx):
   - **Form gửi SOS thông minh**: Học sinh có thể chọn mức độ khẩn cấp (Nguy cơ khẩn cấp `urgent` / Cần hỗ trợ `support`), viết lời nhắn chi tiết (tối đa 500 ký tự) và theo dõi trực quan danh sách Người lớn Đáng tin cậy nhận cứu trợ.
   - **Giao diện Theo dõi Trực quan (Step Tracker & Timeline)**: Khi có tín hiệu SOS đang hoạt động (chưa hoàn thành), chuyển sang chế độ Tracking động hiển thị thanh tiến trình 4 bước (`sent` -> `received` -> `supporting` -> `completed`), dòng thời gian nhật ký cập nhật (timeline) kèm lời nhắc hướng dẫn tâm lý hữu ích, số điện thoại khẩn cấp quốc gia (111, 115).
   - **Nút thu hồi tín hiệu khẩn sửa đổi**: Cho phép học sinh chủ động giải tỏa tín hiệu khi đã an toàn thông qua nút "Đánh dấu Đã an toàn (Đóng tín hiệu SOS)".

2. **Cập nhật API Helper** tại [frontend/lib/sos-api.ts](frontend/lib/sos-api.ts):
   - Thêm các hàm `listTeacherSosAlerts()` và `listParentSosAlerts()` gọi endpoint API tương ứng `/teacher/sos-alerts` và `/parent/sos-alerts` qua trình bọc `apiFetch` bảo mật cookie.

3. **Cải tạo đồng bộ hóa dữ liệu trang Người lớn (Teacher & Parent SOS Lists)**:
   - Sửa đổi các tệp cấu trúc [frontend/app/(authenticated)/teacher/sos-alerts/page.tsx](frontend/app/(authenticated)/teacher/sos-alerts/page.tsx) và [frontend/app/(authenticated)/parent/sos-alerts/page.tsx](frontend/app/(authenticated)/parent/sos-alerts/page.tsx).
   - Chuyển đổi mã lấy tên học sinh: `alert.student_name` -> `alert.student?.full_name || 'Học sinh ẩn danh'`.
   - Chuyển đổi mã theo dõi trạng thái: `alert.status` -> `alert.current_status`.
   - Làm mượt mà trải nghiệm cập nhật trạng thái trực tuyến cho Giáo viên, đảm bảo tải lại và đồng bộ hóa tức thì sang trạng thái mới.

## Verification

- Chạy toàn bộ test suite frontend: `npm run test` để đảm bảo 100% test vượt qua (đặc biệt là `frontend/tests/phase4-sos-ui.test.tsx` và `frontend/tests/phase35-role-dashboards-ui.test.tsx`).
- Chạy toàn bộ test suite backend: `pytest backend/tests/test_phase4_sos_backend.py` đảm bảo hoạt động API đồng nhất tuyệt đối ở cả 2 môi trường.
- Kiểm tra tính tương thích và bảo trì code bằng lệnh chỉnh sửa mã lỗi `npm run lint`.
