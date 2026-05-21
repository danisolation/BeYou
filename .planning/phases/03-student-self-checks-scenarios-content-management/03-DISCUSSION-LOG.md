# Phase 3: Student Self-Checks, Scenarios & Content Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21T09:54:59+07:00  
**Phase:** 03-student-self-checks-scenarios-content-management  
**Areas discussed:** Self-check content & scoring, Student result experience, Adult summary boundaries, Admin content workflow

---

## Self-check content & scoring

| Option | Description | Selected |
|--------|-------------|----------|
| 2 bài active: Sức khỏe cảm xúc + Áp lực bạn bè | Bám đúng core flow và đủ demo cho TEST/SCEN liên quan | ✓ |
| 1 bài tổng hợp wellbeing | Nhanh hơn nhưng demo ít rõ peer-pressure | |
| 3 bài: cảm xúc + áp lực bạn bè + quan hệ gia đình/trường lớp | Phong phú hơn nhưng tăng scope nội dung | |

**User's choice:** 2 bài active: Sức khỏe cảm xúc + Áp lực bạn bè.  
**Notes:** Seed content should be complete enough for demo without over-expanding content scope.

| Option | Description | Selected |
|--------|-------------|----------|
| Cộng điểm theo choice + threshold theo từng bài | Dễ quản trị, dễ test, minh bạch cho demo | ✓ |
| Có subscale theo nhóm câu hỏi | Hữu ích sau này nhưng admin UI và summary phức tạp hơn | |
| Có câu hỏi critical tự nâng risk level | Mạnh cho safety nhưng dễ lẫn với SOS/chatbot Phase 4/5 | |

**User's choice:** Cộng điểm theo choice + threshold theo từng bài.  
**Notes:** Backend owns score calculation.

| Option | Description | Selected |
|--------|-------------|----------|
| Lưu raw answers; học sinh xem lại bài của chính mình; người lớn chỉ summary | Khớp Phase 1 privacy policy | ✓ |
| Lưu raw answers nhưng chỉ backend dùng | Học sinh không xem lại chi tiết | |
| Không lưu raw answers, chỉ lưu score/summary | Riêng tư hơn nhưng mất lịch sử câu trả lời và khó audit/debug | |

**User's choice:** Lưu raw answers; học sinh xem lại bài của chính mình; người lớn chỉ summary.  
**Notes:** Adult raw-answer access remains out of scope.

| Option | Description | Selected |
|--------|-------------|----------|
| Threshold theo từng bài test, admin chỉnh được cùng nội dung test | Linh hoạt nhưng vẫn đơn giản | ✓ |
| Threshold global dùng chung cho mọi test | Dễ hơn nhưng không hợp nếu mỗi bài có số câu/điểm khác nhau | |
| Threshold cố định trong code | Ít lỗi admin nhưng không đạt ADMIN-02 đầy đủ | |

**User's choice:** Threshold theo từng bài test, admin chỉnh được cùng nội dung test.  
**Notes:** Thresholds are content-managed, not hard-coded.

---

## Student result experience

| Option | Description | Selected |
|--------|-------------|----------|
| Thông điệp hỗ trợ + risk label + next action | Giảm cảm giác bị chấm điểm/xếp loại | ✓ |
| Điểm số lớn trước, rồi mới lời khuyên | Rõ ràng nhưng dễ tạo cảm giác thi cử | |
| Risk label lớn trước | Nhanh để hiểu mức cần hỗ trợ nhưng có thể gây lo | |

**User's choice:** Thông điệp hỗ trợ + risk label + next action.  
**Notes:** Score exists but must not dominate the student result screen.

| Option | Description | Selected |
|--------|-------------|----------|
| Có, nhưng là thông tin phụ dưới risk label/advice | Đáp ứng TEST-04 nhưng không làm điểm số thành trọng tâm | ✓ |
| Không hiển thị số, chỉ risk label/advice | Nhẹ nhàng hơn nhưng không khớp rõ yêu cầu score | |
| Hiển thị số nổi bật và biểu đồ | Trực quan nhưng dễ tạo cảm giác bị đánh giá | |

**User's choice:** Có, nhưng là thông tin phụ dưới risk label/advice.  
**Notes:** Numeric score is secondary.

| Option | Description | Selected |
|--------|-------------|----------|
| Theo risk level với gợi ý phù hợp từng mức | `On dinh` positive content; middle states scenario/skill; `Can ho tro som` trusted adult and Phase 4 SOS preparation | ✓ |
| Một next action chung cho mọi mức | Đơn giản nhưng ít cá nhân hóa | |
| Cho học sinh tự chọn từ nhiều gợi ý | Linh hoạt nhưng UI phức tạp hơn | |

**User's choice:** Theo risk level: On dinh → nội dung tích cực; Can chu y/Nen tim ho tro → scenario/kỹ năng; Can ho tro som → nói với người lớn tin cậy + chuẩn bị cho SOS Phase 4.  
**Notes:** Do not implement SOS in Phase 3.

| Option | Description | Selected |
|--------|-------------|----------|
| Danh sách summary + trang chi tiết bài đã làm | Chỉ học sinh xem raw answers của mình | ✓ |
| Chỉ danh sách summary | Đơn giản hơn nhưng ít hữu ích cho tự nhìn lại | |
| History dạng biểu đồ xu hướng | Nên để Phase 6 reports/analytics | |

**User's choice:** Danh sách summary + trang chi tiết bài đã làm, chỉ học sinh xem raw answers của mình.  
**Notes:** Student self-review is allowed; adult detail is not.

---

## Adult summary boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Tên học sinh, ngày, loại test, risk label, advice summary, support suggestion; không raw answers/score chi tiết | Support-focused summary | ✓ |
| Thêm score số cụ thể | Minh bạch hơn nhưng dễ biến thành theo dõi điểm tâm lý | |
| Chỉ risk label + support suggestion | Riêng tư hơn nhưng ít ngữ cảnh để hỗ trợ | |

**User's choice:** Tên học sinh, ngày, loại test, risk label, advice summary, support suggestion; không raw answers/score chi tiết.  
**Notes:** Adult views are summary-only.

| Option | Description | Selected |
|--------|-------------|----------|
| Latest summary + một danh sách lịch sử ngắn chỉ summary | Đủ hỗ trợ, vẫn giữ riêng tư | ✓ |
| Chỉ latest summary | Tối giản và riêng tư nhất | |
| Toàn bộ lịch sử summary | Đầy đủ hơn nhưng tăng cảm giác bị theo dõi | |

**User's choice:** Latest summary + một danh sách lịch sử ngắn chỉ summary.  
**Notes:** Avoid surveillance-style full history.

| Option | Description | Selected |
|--------|-------------|----------|
| 5 lần gần nhất trong 30 ngày | Đủ nhận biết xu hướng gần đây mà không mở rộng quá mức | ✓ |
| 3 lần gần nhất | Riêng tư hơn nhưng ít ngữ cảnh | |
| 10 lần gần nhất trong 90 ngày | Nhiều dữ liệu hơn nhưng dễ thành giám sát | |

**User's choice:** 5 lần gần nhất trong 30 ngày.  
**Notes:** Summary-only limit applies to linked adult views.

| Option | Description | Selected |
|--------|-------------|----------|
| Ghi metadata-only sensitive_resource_read cho mỗi lần xem summary | Khớp Phase 1 audit và không chứa nội dung thô | ✓ |
| Chỉ ghi khi xem high-risk summary | Ít log hơn nhưng bỏ qua sensitive read bình thường | |
| Không audit adult summary reads trong Phase 3 | Nhanh hơn nhưng trái SAFE-04/Phase 1 | |

**User's choice:** Ghi metadata-only sensitive_resource_read cho mỗi lần xem summary.  
**Notes:** No raw answers in audit metadata.

---

## Admin content workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Draft / Published / Archived | Cho admin sửa an toàn, học sinh chỉ thấy published active | ✓ |
| Chỉ Active / Inactive | Đơn giản hơn nhưng khó phân biệt bản nháp và lưu trữ | |
| Published-only, sửa là áp dụng ngay | Nhanh nhất nhưng rủi ro với nội dung nhạy cảm | |

**User's choice:** Draft / Published / Archived.  
**Notes:** Student-facing lists only include published content.

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot nội dung/summary tại thời điểm làm; edit tạo bản cập nhật cho lượt sau | Giữ lịch sử nhất quán | ✓ |
| Sửa trực tiếp và lịch sử hiển thị nội dung mới | Đơn giản nhưng làm sai ngữ cảnh kết quả cũ | |
| Không cho sửa published, bắt archive và tạo bản mới thủ công | An toàn nhưng kém tiện | |

**User's choice:** Snapshot nội dung/summary tại thời điểm làm; edit tạo bản cập nhật cho lượt sau.  
**Notes:** Historical attempts/results must remain stable.

| Option | Description | Selected |
|--------|-------------|----------|
| 4 scenario: bị rủ rê/peer pressure, bị trêu chọc online, mâu thuẫn bạn bè, áp lực điểm số | Đủ đa dạng và sát học sinh THPT | ✓ |
| 2 scenario peer-pressure chính | Nhanh hơn nhưng demo SCEN hơi mỏng | |
| 6+ scenario nhiều chủ đề | Phong phú nhưng tăng scope content | |

**User's choice:** 4 scenario: bị rủ rê/peer pressure, bị trêu chọc online, mâu thuẫn bạn bè, áp lực điểm số.  
**Notes:** Keep seed scenario scope manageable.

| Option | Description | Selected |
|--------|-------------|----------|
| Constructive/risky label + feedback ngắn + recommended response + lesson + skill tag | Khớp SCEN-03/04 | ✓ |
| Chỉ đúng/sai + lời giải thích | Đơn giản nhưng hơi giống bài kiểm tra | |
| Feedback dài theo từng lựa chọn + nhiều kỹ năng liên quan | Sâu hơn nhưng admin UI phức tạp | |

**User's choice:** Constructive/risky label + feedback ngắn + recommended response + lesson + skill tag.  
**Notes:** Avoid punitive right/wrong framing.

---

## the agent's Discretion

- Exact table/schema names, route names, service boundaries, UI layout, validation details, and seed copy.
- Exact number of questions per seeded self-check, as long as TEST requirements can be demonstrated end-to-end.
- Plan splitting strategy for implementation.

## Deferred Ideas

- Self-check subscales and domain-level analytics.
- Critical-item auto-escalation.
- Trend charts, exports, and aggregate reports.
- Adult raw-answer access.
- Chatbot safety/content configuration.
- SOS workflow and in-app alert handling.
