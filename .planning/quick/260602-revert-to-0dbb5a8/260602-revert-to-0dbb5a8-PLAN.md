# Quick Task 260602-revert-to-0dbb5a8: Revert về commit 0dbb5a8 - Plan

**Date:** 2026-06-02

## Problem

Người dùng yêu cầu khôi phục trạng thái mã nguồn (revert) về chính xác commit `0dbb5a8ff18268adeeb2b1743e01235207aab35e` (abbreviated `0dbb5a8`).
Các commit từ sau `0dbb5a8` đến HEAD hiện tại bao gồm:
- `c350749`: Refactor code structure for improved readability and maintainability
- `582ea28`: style: improve code formatting and readability across multiple dashboard pages
- `b8b1199`: v1.6: Align student dashboard quickAction images with mockups, clean parent, teacher and admin dashboard cards to text-only formats and icon-only layouts to strictly conform to the 8 user-image spec.

Yêu cầu là loại bỏ các thay đổi này và quay lại trạng thái chuẩn chỉnh của commit `0dbb5a8ff18268adeeb2b1743e01235207aab35e`.

## Solution

Khôi phục trạng thái của nhánh bằng cách thực hiện lệnh Git Reset về commit mong muốn:

1. **Git Reset về commit `0dbb5a8ff18268adeeb2b1743e01235207aab35e`**:
   - Sử dụng lệnh `git reset --hard 0dbb5a8ff18268adeeb2b1743e01235207aab35e` để đưa toàn bộ code quay về đúng trạng thái tại điểm commit đó.
   - Nhánh `main` sẽ trỏ trực tiếp về commit này.

2. **Dọn dẹp các tệp untracked (nếu có)**:
   - Nếu có các tệp không được kiểm soát bởi git phát sinh trong quá trình trước, dọn dẹp để đảm bảo một cây thư mục làm việc sạch sẽ.

3. **Ghi nhận tác vụ Quick Task trong GSD**:
   - Tạo thư mục `.planning/quick/260602-revert-to-0dbb5a8/`
   - Tạo tệp `260602-revert-to-0dbb5a8-PLAN.md` và `260602-revert-to-0dbb5a8-SUMMARY.md` để ghi nhận việc khôi phục này.
   - Cập nhật bảng "Quick Tasks Completed" trong tệp `.planning/STATE.md` để lưu lại vết hoạt động cứu hộ này.

## Verification

- Chạy toàn bộ test suite frontend: `npm run test` để đảm bảo 100% test vượt qua trên phiên bản khôi phục.
- Chạy toàn bộ test suite backend để đảm bảo API hoạt động ổn định.
- Chạy biên dịch frontend `npm run build` để kiểm tra khả năng build tĩnh hoàn hảo.
