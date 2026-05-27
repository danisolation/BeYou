---
phase: 3
slug: student-self-checks-scenarios-content-management
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-21
---

# Phase 3 - UI Design Contract

> Visual and interaction contract for Student Self-Checks, Scenarios & Content Management. Generated for planner/executor/checker consumption.

## Phase 3 UI Boundary and Surfaces

Phase 3 adds these UI surfaces only:

| Role | Surface | Purpose |
|---|---|---|
| Student | Self-check list | Browse published active self-checks |
| Student | Self-check question flow | Answer multiple-choice questions and submit |
| Student | Self-check result | See supportive message, risk/state label, next action, score as secondary |
| Student | Self-check history | Review own previous attempts |
| Student | Self-check detail | Review own completed attempt including raw answers |
| Student | Scenario list | Browse published school-pressure scenarios |
| Student | Scenario detail | Read situation and choose a response |
| Student | Scenario feedback | See constructive/risky feedback, recommended response, lesson, skill tag |
| Student | Scenario history | Review own scenario attempts |
| Teacher | Linked student self-check summaries | Summary-only latest + up to 5 recent attempts in last 30 days |
| Parent | Linked child self-check summaries | Summary-only latest + up to 5 recent attempts in last 30 days |
| Admin | Self-check content management | Create/edit tests, questions, choices, scores, thresholds, status |
| Admin | Scenario content management | Create/edit scenarios, choices, feedback, lesson, skill tags, status |

Out of scope: SOS workflow, chatbot, reports, analytics/trend charts, adult raw-answer access, exports, external notifications, clinical diagnosis.

## Design System

| Property | Value |
|---|---|
| Tool | Manual Tailwind implementation; no `components.json` detected |
| Preset | none |
| Component library | Existing custom Tailwind components; shadcn/ui not initialized |
| Icon library | `lucide-react` allowed if icons are needed |
| Font | Inter or system sans fallback |
| Existing primitives | `DemoBanner`, `DemoBadge`, `EmptyState`, `DestructiveConfirmDialog` |
| Card shape | `rounded-3xl bg-white p-6 shadow-sm` or `rounded-3xl bg-secondary p-6 shadow-sm` |
| Form controls | Minimum `min-h-11`, `rounded-2xl`, border `#CFE8E1` |

Continue Phase 1 visual system: calm background, secondary green cards, accent CTA, warning orange for caution, destructive red only for SOS/high-risk/destructive states.

## Typography

Use exactly these type sizes:

| Role | Size | Weight | Line Height | Usage |
|---|---:|---:|---:|---|
| Label | 14px | 400 | 1.5 | Metadata, helper text, badges |
| Body | 16px | 400 | 1.5 | Main reading text, questions, explanations |
| Heading | 20px | 600 | 1.2 | Card titles, section headings |
| Display | 28px | 600 | 1.2 | Page titles and result headline |

Rules:
- Only weights 400 and 600.
- Student result pages must be readable and non-clinical.
- Do not make numeric score larger than the supportive message or risk/state label.
- Vietnamese copy must be short, warm, and THPT-readable.

## Spacing

Use the existing 4/8-point scale:

| Token | Value | Usage |
|---|---:|---|
| xs | 4px | Badge/icon gaps |
| sm | 8px | Compact inline spacing |
| md | 16px | Form field gaps, card internals |
| lg | 24px | Mobile page/card padding |
| xl | 32px | Desktop page gaps |
| 2xl | 48px | Major section separation |
| 3xl | 64px | Page-level vertical rhythm |

Rules:
- Minimum touch target: 44px height/width.
- Student choice cards must have at least 16px padding.
- Question flow must use 24px vertical spacing between question, choices, and navigation.
- Mobile page padding: 16px.
- Desktop content max width: 960px for student flows, 1200px for admin tables/forms.

## Color

| Role | Value | Usage |
|---|---|---|
| Dominant 60% | `#F8FCFF` | App background |
| Secondary 30% | `#EAF7F3` | Calm cards, demo banner, privacy/support panels |
| Accent 10% | `#2CA58D` | Primary CTA, selected choices, constructive state, links |
| Foreground | `#12332E` | Main text |
| Border | `#CFE8E1` / `#D7EFE8` | Inputs and cards |
| Warning | `#F59E0B` | `Can chu y`, `Nen tim ho tro`, validation warnings |
| Destructive | `#DC2626` | High-risk/SOS/destructive delete/archive confirmation only |

Accent reserved for:
- `Bắt đầu tự kiểm tra`
- `Gửi câu trả lời`
- `Xem gợi ý tiếp theo`
- Selected answer state
- Constructive scenario feedback
- Admin save/publish actions

Destructive red reserved for:
- `Can ho tro som` emphasis only when safety-sensitive
- Hard delete of unused drafts
- Destructive confirmations
- Future SOS/high-risk states

Adult/admin surfaces must not use risk heatmaps, leaderboards, or alarm-heavy color gradients.

## Copywriting Contract

### Global loading, empty, and error copy

| State | Copy |
|---|---|
| Loading | `Đang tải thông tin...` |
| Empty state rule | Use the surface-specific empty-state heading/body defined for the current surface below. Do not render a generic placeholder empty state. |
| Fallback empty heading | `Chưa có nội dung phù hợp với vai trò này` |
| Fallback empty body | `Hãy kiểm tra lại bộ lọc hoặc quay về trang chính để chọn nội dung khác.` |
| Generic error | `Chưa tải được thông tin. Hãy thử lại.` |
| Privacy-limited note | `BeYou chỉ hiển thị phần tóm tắt được phép xem để hỗ trợ học sinh.` |
| Demo banner | `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.` |
| Demo badge | `Demo` |

### Student self-check copy

| Element | Exact copy |
|---|---|
| Self-check list title | `Tự kiểm tra cảm xúc` |
| Self-check list subtitle | `Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán.` |
| Primary CTA | `Bắt đầu tự kiểm tra` |
| Continue CTA | `Tiếp tục` |
| Back CTA | `Quay lại` |
| Submit CTA | `Gửi câu trả lời` |
| Result CTA | `Xem gợi ý tiếp theo` |
| History CTA | `Xem lịch sử tự kiểm tra` |
| Empty tests heading | `Chưa có bài tự kiểm tra đang mở` |
| Empty tests body | `Khi nhà trường bật nội dung phù hợp, em sẽ thấy các bài tự kiểm tra tại đây.` |
| Empty history heading | `Em chưa có lần tự kiểm tra nào` |
| Empty history body | `Sau khi hoàn thành một bài, kết quả và gợi ý của em sẽ xuất hiện ở đây.` |
| Submit error | `Chưa gửi được câu trả lời. Hãy kiểm tra lại và thử một lần nữa.` |

Required non-clinical risk/state labels:
- `On dinh`
- `Can chu y`
- `Nen tim ho tro`
- `Can ho tro som`

Student result must lead with:
1. supportive headline,
2. risk/state label,
3. suggested next action,
4. advice/positive content,
5. score as secondary metadata.

Score label: `Điểm tham khảo`  
Score helper: `Điểm này chỉ giúp BeYou chọn gợi ý phù hợp, không phải chẩn đoán.`

### Student result message patterns

| State | Supportive headline | Next action |
|---|---|---|
| `On dinh` | `Em đang có nhiều dấu hiệu ổn định.` | `Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.` |
| `Can chu y` | `Có một vài dấu hiệu em nên để ý thêm.` | `Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.` |
| `Nen tim ho tro` | `Em không cần tự xử lý mọi thứ một mình.` | `Hãy cân nhắc nói chuyện với giáo viên, phụ huynh hoặc một người lớn tin cậy.` |
| `Can ho tro som` | `Điều em đang trải qua đáng được hỗ trợ sớm.` | `Hãy tìm một người lớn tin cậy ở gần em. BeYou sẽ có nút SOS ở bước tiếp theo của sản phẩm.` |

Do not imply or present a diagnosis. The word `chẩn đoán` is allowed only in disclaimer copy such as `Kết quả không phải chẩn đoán.` or `Điểm này chỉ giúp BeYou chọn gợi ý phù hợp, không phải chẩn đoán.`

Do not use wording that says or implies the student has:
- `bệnh`
- `rối loạn`
- `nguy hiểm`
- `xếp hạng`
- `bị giám sát`

### Scenario copy

| Element | Exact copy |
|---|---|
| Scenario list title | `Tình huống luyện tập` |
| Scenario list subtitle | `Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn.` |
| Primary CTA | `Xem tình huống` |
| Choice CTA | `Chọn cách phản hồi này` |
| Feedback title | `Gợi ý sau lựa chọn của em` |
| Recommended response label | `Cách phản hồi nên thử` |
| Lesson label | `Điều em có thể rút ra` |
| Skill tag label | `Kỹ năng liên quan` |
| History CTA | `Xem lịch sử tình huống` |
| Empty scenarios heading | `Chưa có tình huống đang mở` |
| Empty scenarios body | `Khi có tình huống luyện tập mới, em sẽ thấy tại đây.` |
| Feedback error | `Chưa lưu được lựa chọn. Hãy thử lại.` |

Feedback framing:
- Use `Lựa chọn này có điểm tích cực...`
- Use `Lựa chọn này có thể khiến tình huống khó hơn...`
- Do not use simple punitive `Đúng/Sai` as the only feedback.

### Adult summary copy

| Element | Exact copy |
|---|---|
| Teacher section title | `Tóm tắt tự kiểm tra được phép xem` |
| Parent section title | `Tóm tắt hỗ trợ của con` |
| Latest summary label | `Tóm tắt gần nhất` |
| Recent summaries label | `Các lần gần đây` |
| Advice label | `Tóm tắt gợi ý` |
| Support suggestion label | `Gợi ý hỗ trợ` |
| Empty adult summary heading | `Chưa có tóm tắt tự kiểm tra` |
| Empty adult summary body | `Khi học sinh hoàn thành bài tự kiểm tra và bạn có quyền xem, phần tóm tắt hỗ trợ sẽ hiển thị tại đây.` |
| Privacy note | `Bạn đang xem phần tóm tắt được phép xem. Câu trả lời riêng tư và chi tiết điểm không hiển thị tại đây.` |

Adult language must use:
- `tóm tắt được phép xem`
- `gợi ý hỗ trợ`
- `học sinh cần được quan tâm`
- `hỗ trợ em`

Adult language must not use:
- `giám sát`
- `xếp hạng rủi ro`
- `học sinh nguy hiểm`
- `theo dõi bí mật`

### Admin content copy

| Element | Exact copy |
|---|---|
| Admin dashboard card title | `Nội dung tự kiểm tra và tình huống` |
| Admin dashboard card description | `Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh theo đúng phạm vi an toàn.` |
| Self-check admin title | `Quản lý bài tự kiểm tra` |
| Scenario admin title | `Quản lý tình huống` |
| Create test CTA | `Tạo bài tự kiểm tra` |
| Create scenario CTA | `Tạo tình huống` |
| Save draft CTA | `Lưu bản nháp` |
| Publish CTA | `Xuất bản` |
| Archive CTA | `Lưu trữ` |
| Delete draft CTA | `Xóa bản nháp chưa dùng` |
| Status label | `Trạng thái nội dung` |
| Draft label | `draft` |
| Published label | `published` |
| Archived label | `archived` |
| Admin save error | `Chưa lưu được nội dung. Hãy kiểm tra lại các trường bắt buộc và thử lại.` |
| Publish validation error | `Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm.` |

Destructive confirmation:
- Archive: `Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ.`
- Delete unused draft: `Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành.`
- Cancel: `Giữ nội dung`
- Confirm archive: `Lưu trữ nội dung`
- Confirm delete: `Xóa bản nháp`

## Student Self-Check Interactions

### List

Layout:
- Page title + subtitle.
- Card per published active test.
- Card fields: title, short description, estimated question count, `Demo` badge if applicable, CTA.
- Secondary link to history.

Card labels:
- `Số câu hỏi: {n}`
- `Trạng thái: Đang mở`
- CTA: `Bắt đầu tự kiểm tra`

Rules:
- Only published active tests appear.
- Demo records show `DemoBadge`.
- Empty state uses self-check empty copy above.

### Question flow

Layout:
- One question per screen on mobile.
- Desktop may show one question per card, still clear and calm.
- Progress text: `Câu {current} / {total}`.
- Multiple-choice answers displayed as large selectable cards.
- Selected choice uses accent border/background and text confirmation.

Controls:
- `Quay lại`
- `Tiếp tục`
- Final step: `Gửi câu trả lời`

Validation:
- If no answer selected: `Hãy chọn một câu trả lời phù hợp nhất với em trước khi tiếp tục.`
- Disable submit while request is pending.
- Pending submit text: `Đang gửi...`

Privacy reminder below submit:
`Câu trả lời chi tiết chỉ hiển thị cho em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt hỗ trợ khi có quyền.`

### Result

Visual hierarchy:
1. Large supportive headline.
2. State badge.
3. Next action panel.
4. Advice and positive content.
5. Score metadata.

Required fields:
- Test title
- Completion date
- Risk/state label
- Short comment
- Advice
- Positive content
- Suggested next action
- Score secondary

Score must appear in small metadata block:
`Điểm tham khảo: {score}`

CTA options:
- Primary: `Xem gợi ý tiếp theo`
- Secondary: `Làm bài khác`
- Secondary: `Xem lịch sử tự kiểm tra`

### History list

Fields:
- Date/time
- Test type
- Risk/state label
- Advice summary
- Score as secondary metadata
- `Demo` badge if applicable

CTA:
- `Xem chi tiết`

Empty:
- Use `Em chưa có lần tự kiểm tra nào`.

### Detail

Student-only.
Show:
- Result summary
- Advice snapshot
- Questions and selected answers
- Score as secondary
- Content snapshot notice: `Nội dung này là bản ghi tại thời điểm em hoàn thành bài tự kiểm tra.`

Do not show adult/admin links on this page.

## Scenario Interactions

### List

Cards for published scenarios:
- Title
- Situation summary
- Skill tag
- `Demo` badge if applicable
- CTA: `Xem tình huống`

Seeded demo scenario themes:
- Peer pressure / rủ rê
- Online teasing
- Friendship conflict
- Grade / academic pressure

### Detail and response selection

Show:
- Title
- Situation description
- Response choices as selectable cards
- Skill tag if known
- CTA per choice: `Chọn cách phản hồi này`

Rules:
- Student can choose one response.
- Disable buttons while saving.
- Pending text: `Đang lưu lựa chọn...`

### Feedback

Show:
- Feedback title: `Gợi ý sau lựa chọn của em`
- Selected response summary
- Constructive/risky explanation
- Recommended response
- Lesson learned
- Skill tag
- CTA: `Thử tình huống khác`
- CTA: `Xem lịch sử tình huống`

Constructive state:
- Use accent border and calm copy.

Risky state:
- Use warning border, not destructive red.
- Copy must explain safer alternatives without shaming.

### Scenario history

Student-only by default.
Fields:
- Date/time
- Scenario title
- Selected choice summary
- Feedback snapshot
- Recommended response snapshot
- Lesson snapshot
- Skill tag
- `Demo` badge if applicable

Empty:
- Heading: `Em chưa thử tình huống nào`
- Body: `Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây.`

## Teacher and Parent Summary-Only Interactions

Teacher/parent dashboards add a summary card per linked student/child.

Allowed fields only:
- Student name/context
- Completion date
- Test type
- Risk/state label
- Advice summary
- Support suggestion
- Latest summary
- Up to 5 recent summary-only attempts from last 30 days

Forbidden fields:
- Raw answers
- Full answer text
- Score breakdown
- Detailed private result page
- Scenario attempt history
- Chat/SOS information in this phase

Adult summary card CTA:
`Xem tóm tắt hỗ trợ`

Adult detail title:
`Tóm tắt được phép xem`

Privacy note must be visible on adult summary detail:
`BeYou không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc.`

Every adult read of a self-check summary must correspond to metadata-only audit event `sensitive_resource_read`.

## Admin Content Management Interactions

### Shared admin rules

Content status:
- `draft`: editable, not visible to students.
- `published`: visible to students if active.
- `archived`: not visible to students, retained for history/audit.

Status badge placement:
- Near content title and in list row/card.

Status colors:
- `draft`: neutral border/card.
- `published`: accent.
- `archived`: warning/neutral, not destructive.

Audit:
- Admin create/edit/publish/archive/delete draft actions must record `admin_safety_content_changed`.
- Audit metadata must not include raw student answers, secrets, passwords, tokens, cookies, or API keys.

### Self-check admin list

Fields:
- Title
- Status
- Question count
- Threshold count
- Last updated
- Demo badge
- Actions: `Chỉnh sửa`, `Xuất bản`, `Lưu trữ`

Empty:
- Heading: `Chưa có bài tự kiểm tra`
- Body: `Tạo bản nháp đầu tiên để chuẩn bị nội dung hỗ trợ học sinh.`

### Self-check editor

Sections:
1. Basic information
   - `Tên bài tự kiểm tra`
   - `Mô tả ngắn`
   - `Trạng thái nội dung`
2. Questions
   - Question text
   - Answer choices
   - Numeric score value per choice
3. Risk thresholds
   - State label
   - Minimum score
   - Maximum score
   - Comment
   - Advice
   - Positive content
   - Suggested next action
4. Preview
   - Student-facing preview card

Validation:
- A published test must have at least one question.
- Each question must have at least two choices.
- Each choice must have a numeric score.
- Thresholds must cover possible score ranges without overlap.
- Each threshold must map to exactly one of: `On dinh`, `Can chu y`, `Nen tim ho tro`, `Can ho tro som`.

### Scenario admin list

Fields:
- Title
- Status
- Skill tag
- Choice count
- Last updated
- Demo badge
- Actions: `Chỉnh sửa`, `Xuất bản`, `Lưu trữ`

Empty:
- Heading: `Chưa có tình huống`
- Body: `Tạo bản nháp tình huống để học sinh luyện cách phản hồi an toàn hơn.`

### Scenario editor

Sections:
1. Basic information
   - `Tiêu đề tình huống`
   - `Mô tả tình huống`
   - `Kỹ năng liên quan`
   - `Trạng thái nội dung`
2. Response choices
   - Choice text
   - Signal: `constructive` or `risky`
   - Feedback
3. Recommended response
4. Lesson learned
5. Preview

Validation:
- A published scenario must have title, situation, at least two response choices, feedback for each choice, recommended response, lesson, and skill tag.
- Avoid `right/wrong` only framing.

## Loading, Empty, Error, Privacy, Audit, and Demo States

### Loading

Use text loading state:
`Đang tải thông tin...`

For forms:
- Disable submit.
- Button pending text: `Đang lưu...`, `Đang gửi...`, or `Đang xuất bản...`.

### Empty

Use existing `EmptyState` component where possible.
Customize heading/body per surface as defined above.
Do not use a generic placeholder empty state. If a surface-specific empty state is missing, use fallback heading `Chưa có nội dung phù hợp với vai trò này` and body `Hãy kiểm tra lại bộ lọc hoặc quay về trang chính để chọn nội dung khác.`

### Error

Error containers:
- Rounded card.
- Warning border.
- Body text size.
- Do not use destructive red unless destructive operation failed after confirmation.

Generic retry CTA:
`Thử lại`

### Privacy states

Student privacy reminder must appear:
- Before self-check submit.
- On result page.
- In history/detail page footer.

Copy:
`Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.`

Adult privacy reminder must appear:
`Bạn đang xem phần tóm tắt được phép xem, không phải toàn bộ câu trả lời riêng tư của học sinh.`

### Audit-facing UI

If audit metadata appears in admin/debug views:
Allowed:
- Actor
- Action
- Resource type
- Timestamp
- Status/reason
- Metadata summary

Forbidden:
- Raw answers
- Full answer text
- Passwords
- Tokens
- Session cookies
- API keys
- Raw chatbot content

### Demo states

Demo banner remains persistent:
`Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.`

Demo badge appears:
- Self-check cards
- Scenario cards
- Attempt history records
- Adult summary cards
- Admin content rows/cards

Never rely on color alone for demo state.

## Mobile and Responsive Behavior

Mobile first:
- Student flows must be comfortable at 360px width.
- Single-column layout on mobile.
- Admin lists may become stacked cards on mobile.
- Buttons full-width on mobile when primary flow actions.
- Choice cards full-width with 16px padding.
- Touch targets minimum 44px.
- Fixed or sticky progress/footer is allowed only if it does not hide content.

Breakpoints:
- Mobile: one column.
- `md`: two-column card grids for dashboard/list pages.
- Admin desktop: table-like layout or two-column editor/preview.

Navigation:
- Student question flow must preserve progress and support back.
- Avoid accidental submit; final submit must be explicit.

## Accessibility

Required:
- Semantic headings in order.
- Buttons are real `button` elements.
- Links are real `a`/Next `Link` elements.
- Dialogs use `role="dialog"` and `aria-modal="true"`.
- Form labels are visible.
- Error messages appear near the related field and in text, not color only.
- Selected answer state must include text or aria state, not color only.
- Focus rings must remain visible.
- Color contrast must meet WCAG AA for text.
- Touch target minimum 44px.
- Destructive confirmations require explicit confirmation button.

Self-check accessibility:
- Each answer choice must be keyboard selectable.
- Progress text must be readable by screen readers.
- Validation message must be announced or placed directly after the question.

Scenario accessibility:
- Feedback must identify selected response and recommendation in text.
- Do not rely on green/orange alone to communicate constructive/risky.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|---|---|---|
| shadcn official | none installed in this phase | not applicable; no `components.json` detected |
| third-party | none | not applicable |

Registry rule:
- No third-party registry blocks are approved for Phase 3.
- If shadcn/ui is initialized later, use official components only unless `shadcn view` safety vetting is completed and recorded.

## Pre-Populated Sources

| Source | Decisions used |
|---|---|
| `.planning/REQUIREMENTS.md` | TEST-01..TEST-06, SCEN-01..SCEN-05, ADMIN-02, ADMIN-03 |
| `.planning/ROADMAP.md` | Phase 3 goal, success criteria, dependency on Phase 2 |
| `03-CONTEXT.md` | Self-check tests, risk labels, adult summary boundaries, scenarios, admin draft/published/archived workflow |
| `01-UI-SPEC.md` | Visual system, typography, colors, copy tone, demo banner/badge, registry rule |
| `01-CONTEXT.md` | Privacy-by-default, non-clinical language, adult summary-only access |
| `02-CONTEXT.md` | Role portals, demo indicators, student-adult links, backend-enforced authorization |
| Existing frontend | Tailwind tokens, `EmptyState`, `DemoBanner`, `DemoBadge`, admin form/dialog patterns |

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-21
