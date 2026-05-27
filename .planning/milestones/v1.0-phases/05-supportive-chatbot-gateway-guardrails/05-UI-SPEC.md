# Phase 05 UI-SPEC: Supportive Chatbot Gateway & Guardrails

**Status:** Approved by self-check  
**Language:** Vietnamese user-facing copy  
**Design intent:** Warm, calm student support. Safety escalation is clear without sounding clinical or punitive.

## Screens and Components

### Student dashboard chat entry
- Location: visible on `/student`, near existing wellbeing quick actions and before/near SOS support.
- Container: rounded card, `p-6`, mobile-first.
- Title: `Trò chuyện với BeYou`
- Body: `Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.`
- Boundary copy: `BeYou không thay thế chuyên gia tư vấn hay bác sĩ.`
- CTA: `Mở trò chuyện`
- Must not mention provider name or API keys.

### Student chat page `/student/chat`
- Header title: `Trò chuyện với BeYou`
- Intro/support copy:
  - `BeYou không thay thế chuyên gia tư vấn hay bác sĩ. Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.`
  - `Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou.`
- Chat container: `rounded-3xl bg-white p-6 shadow-sm`, `space-y-4`.
- Message bubbles:
  - Student: right-aligned soft accent background.
  - Bot: left-aligned secondary background.
  - High-risk bot message: soft red border only, not full red page.
- Input label: `Điều em muốn chia sẻ`
- Input placeholder: `Viết vài dòng theo cách em thấy thoải mái...`
- Submit button: `Gửi chia sẻ`
- Sending state: `Đang gửi...`
- Loading history state: `Đang tải cuộc trò chuyện...`
- Empty state must be specific, not generic: `Chưa có tin nhắn nào. Em có thể bắt đầu bằng một điều nhỏ đang làm em bận lòng.`
- Error copy: `Chưa gửi được tin nhắn. Hãy thử lại hoặc dùng SOS nếu em đang cần hỗ trợ ngay.`

### Student high-risk escalation state
- Heading: `Mình muốn ưu tiên sự an toàn của em ngay lúc này`
- Guidance copy: `Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou để người lớn được liên kết biết em cần hỗ trợ.`
- Boundary copy: `BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.`
- CTA to dashboard SOS: `Đi tới SOS hỗ trợ`
- Secondary copy: `Nếu có người lớn tin cậy ở gần em, hãy nói với họ rằng em cần được ở cùng và được lắng nghe ngay bây giờ.`

### Admin dashboard chat safety entry
- Add card on `/admin`.
- Title: `Cấu hình chatbot an toàn`
- Body: `Quản lý từ khóa nguy cơ và lời nhắc hỗ trợ mà không hiển thị khóa API hay tắt lớp bảo vệ.`
- CTA/count label: `Cài đặt an toàn`

### Admin chatbot config page `/admin/chatbot`
- Header: `Cấu hình chatbot an toàn`
- Privacy/security copy: `Khóa API chỉ được đọc bởi backend. Trang này không hiển thị hoặc lưu khóa API ở trình duyệt.`
- Sections:
  1. `Từ khóa nguy cơ cao` — textarea/list editor for newline-separated keywords.
  2. `Lời nhắn khi cần ưu tiên an toàn` — textarea for escalation guidance.
  3. `Thông tin provider` — read-only provider status such as fallback/real provider configured; no secrets.
- Save button: `Lưu cấu hình an toàn`
- Saving state: `Đang lưu...`
- Success copy: `Đã lưu cấu hình an toàn. Guardrail backend vẫn luôn bật.`
- Error copy: `Chưa lưu được cấu hình. Hãy giữ ít nhất một từ khóa nguy cơ và thử lại.`

## Accessibility and States

- Buttons use `min-h-11`.
- Use semantic `h1`, `h2`, `label`, `textarea`, and `button`.
- Spacing tokens: `p-6`, `p-4`, `gap-4`, `space-y-6`, `space-y-4`.
- No third-party registry or new UI dependency.
- High-risk content must be text-first; color is supportive cue, not sole signal.

## Privacy and Safety Guardrails

- Do not expose API keys, provider request payloads, or raw server prompts.
- Do not render raw chat transcripts in adult/admin pages.
- Do not claim BeYou is a therapist, doctor, diagnostic tool, or emergency dispatcher.
- Do not promise absolute confidentiality.
- Do not add student risk rankings or surveillance language.

## Self-Validation

- No generic empty state.
- Valid spacing tokens used.
- Student-facing copy is Vietnamese, warm, non-clinical, and supportive.
- Admin copy explicitly says secrets are backend-only.
- High-risk state routes toward existing SOS/trusted-adult flow without external automation.

