---
phase: 2
slug: identity-roles-links-demo-access
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-20
---

# Phase 2 - UI Design Contract

> Visual and interaction contract for Phase 2: Identity, Roles, Links & Demo Access. This contract consumes Phase 1 privacy, safety, demo-data, authorization, and copywriting decisions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui planned; not initialized because no frontend scaffold or `components.json` exists yet |
| Preset | none |
| Component library | Radix via shadcn/ui when frontend scaffold exists |
| Icon library | lucide-react |
| Font | Inter or system sans fallback; Vietnamese text must render clearly |

Implementation contract:

- When the Next.js frontend is scaffolded, initialize shadcn/ui before building Phase 2 screens.
- Use official shadcn/ui components only unless a later phase completes registry safety vetting.
- Phase 2 must extend Phase 1 visual rules and must not redefine color, spacing, typography, demo indicators, or privacy copy in a conflicting way.
- UI must be Vietnamese-friendly, calming, non-clinical, mobile-first, and readable for THPT students.
- Backend enforcement is required for auth, role, relationship, and purpose checks. Frontend routing is only a convenience.

Recommended official shadcn components for this phase:

- `button`
- `card`
- `input`
- `label`
- `form`
- `checkbox`
- `alert`
- `badge`
- `dialog`
- `table`
- `tabs`
- `dropdown-menu`
- `separator`
- `skeleton`
- `toast` or `sonner`

---

## Spacing Scale

Declared values must be multiples of 4 and must match Phase 1.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge spacing, table metadata gaps |
| sm | 8px | Compact form help text, inline controls, card sub-gaps |
| md | 16px | Default card padding, form field spacing, list item padding |
| lg | 24px | Section padding on mobile, dialog padding |
| xl | 32px | Desktop section padding, dashboard grid gaps |
| 2xl | 48px | Major page sections |
| 3xl | 64px | Page-level spacing on desktop |

Exceptions:

- Minimum touch target: 44px height/width for buttons, links, checkboxes, menu items, and mobile controls.
- Primary login and privacy acknowledgement CTA: minimum 44px height.
- Demo banner: minimum 40px height, persistent at top of authenticated demo sessions.
- Admin table row action buttons may be visually compact but must retain a 44px accessible hit target.
- Destructive confirmation dialog buttons: minimum 44px height and separated by at least 8px.

---

## Typography

Use exactly these Phase 1 type sizes and no additional phase-specific sizes.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 400 | 1.5 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.2 |

Rules:

- Use weight 400 for body text, helper text, and supportive explanations.
- Use weight 600 for headings, section labels, role labels, and primary actions.
- Avoid clinical, punitive, surveillance, or diagnosis language.
- Vietnamese copy must be short, warm, and clear.
- Admin and adult UI must stay operational/supportive, not disciplinary.

---

## Color

Use the Phase 1 color contract.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FCFF` | App background, login page background, authenticated page background |
| Secondary (30%) | `#EAF7F3` | Cards, dashboards, portal panels, privacy acknowledgement surface, profile cards |
| Accent (10%) | `#2CA58D` | Primary CTA, active selected role state, successful login/acknowledgement indicators, supportive links |
| Warning | `#F59E0B` | Mild warning, account disabled notice, privacy exception notices |
| Destructive | `#DC2626` | Disable account, delete demo-only record, revoke link, high-risk/SOS only |

Accent reserved for:

- Login submit button: `Đăng nhập`
- Privacy acknowledgement continue button
- Active dashboard navigation state
- Student privacy notice review link
- Successful enabled/active status indicators
- Admin save/create actions

Color rules:

- Red is reserved only for destructive actions, SOS/high-risk states, and confirmation of irreversible or high-impact admin changes.
- Orange is for mild warning only, such as disabled account state or incomplete setup.
- Demo indicators must not rely on color only. They require text banner and `Demo` badge.
- Adult/admin dashboards must not use alarming heatmaps, risk leaderboards, or punitive status colors.

---

## Visual Hierarchy & Focal Points

Each Phase 2 screen needs one primary focal point and one clear next action.

| Surface | First visual focus | Primary next action |
|---------|--------------------|---------------------|
| Login | Centered login card with page title `Chào mừng đến với BeYou` and email field | `Đăng nhập` |
| Privacy gate | Privacy notice summary card and acknowledgement checkbox | `Tiếp tục vào BeYou` after checkbox is checked |
| Student dashboard | Student profile card with name, school/class, `Demo` badge when applicable | Review linked support adults or open `Ai có thể xem thông tin của em?` |
| Teacher dashboard | Linked students list grouped in supportive cards/table | Open a permitted student support profile |
| Parent dashboard | Linked child/student cards with allowed support information | Open a permitted student support profile |
| Admin dashboard | Management entry cards for users and student-adult links | Choose `Quản lý tài khoản` or `Liên kết học sinh và người lớn hỗ trợ` |
| Admin user management | User table/filter area, with status and role visible before row actions | `Tạo tài khoản` or row-level safe edit action |
| Admin link management | Link table/card list showing student, adult, relationship type, and status | `Tạo liên kết` or row-level `Thu hồi liên kết` |

Rules:

- Do not make destructive actions the first or most visually prominent control.
- Demo banner sits above authenticated content but must not obscure the page's primary task.
- Empty states use a calm centered card; admin creation CTAs remain secondary to the explanatory copy when no records exist.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Đăng nhập` |
| Privacy gate CTA | `Tiếp tục vào BeYou` |
| Empty state heading | `Chưa có dữ liệu để hiển thị` |
| Empty state body | `Khi tài khoản hoặc liên kết được tạo, BeYou sẽ hiển thị thông tin phù hợp với vai trò của bạn tại đây.` |
| Error state | `Chưa tải được thông tin. Hãy thử lại hoặc báo với người phụ trách demo.` |
| Destructive confirmation | See destructive actions table below |

### Required shared copy

| Surface | Copy |
|---------|------|
| Demo banner | `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.` |
| Demo badge | `Demo` |
| Student privacy link | `Ai có thể xem thông tin của em?` |
| Privacy checkbox | `Em đã đọc và hiểu ai có thể xem thông tin của em.` |
| Logged-out session message | `Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.` |
| Unauthorized message | `Bạn không có quyền xem nội dung này.` |
| Loading message | `Đang tải thông tin...` |

### Login screen copy

| Element | Copy |
|---------|------|
| Page title | `Chào mừng đến với BeYou` |
| Page subtitle | `Đăng nhập để vào không gian hỗ trợ phù hợp với vai trò của bạn.` |
| Email label | `Email` |
| Password label | `Mật khẩu` |
| Submit button | `Đăng nhập` |
| Demo helper | `Bạn có thể dùng tài khoản demo được cung cấp để xem thử vai trò học sinh, giáo viên, phụ huynh hoặc quản trị viên.` |
| Invalid login error | `Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại thông tin đăng nhập.` |
| Disabled account error | `Tài khoản này đang bị tạm khóa. Hãy liên hệ quản trị viên hoặc người phụ trách demo.` |

### Role portal landing copy

| Role | Dashboard title | Supportive subtitle |
|------|-----------------|---------------------|
| Student | `Bảng điều khiển của em` | `Xem thông tin cá nhân, người lớn tin cậy được liên kết, và các bước hỗ trợ tiếp theo.` |
| Teacher | `Cổng giáo viên` | `Xem học sinh được liên kết và các thông tin được phép xem để hỗ trợ các em.` |
| Parent | `Cổng phụ huynh` | `Xem học sinh được liên kết và thông tin hỗ trợ được phép hiển thị.` |
| Admin | `Cổng quản trị` | `Quản lý tài khoản, vai trò và liên kết học sinh-người lớn một cách an toàn.` |

### Admin user management copy

| Element | Copy |
|---------|------|
| Users page title | `Quản lý tài khoản` |
| Create user CTA | `Tạo tài khoản` |
| Edit user CTA | `Lưu thay đổi` |
| Disable account CTA | `Tạm khóa tài khoản` |
| Delete account CTA | `Xóa tài khoản demo` |
| Role label | `Vai trò` |
| Status label | `Trạng thái tài khoản` |
| Demo marker helper | `Tài khoản demo chỉ dùng để giới thiệu sản phẩm, không phải hồ sơ học sinh thật.` |

### Admin student-adult link management copy

| Element | Copy |
|---------|------|
| Links page title | `Liên kết học sinh và người lớn hỗ trợ` |
| Create link CTA | `Tạo liên kết` |
| Revoke link CTA | `Thu hồi liên kết` |
| Empty state heading | `Chưa có liên kết nào` |
| Empty state body | `Tạo liên kết để giáo viên hoặc phụ huynh chỉ thấy học sinh được phép hỗ trợ.` |
| Link helper | `Liên kết này quyết định người lớn nào được xem thông tin hỗ trợ được phép hiển thị.` |

### Destructive actions

| Action | Confirmation copy | Cancel button | Confirm button | Required interaction |
|--------|-------------------|---------------|----------------|----------------------|
| Disable account | `Tạm khóa tài khoản này? Người dùng sẽ không thể đăng nhập cho đến khi được mở lại.` | `Giữ tài khoản` | `Tạm khóa tài khoản` | Confirmation dialog with action-specific buttons |
| Delete demo-only account | `Xóa tài khoản demo này? Chỉ dùng thao tác này cho dữ liệu demo, không dùng cho hồ sơ học sinh thật.` | `Giữ tài khoản demo` | `Xóa tài khoản demo` | Confirmation dialog with visible `Demo` badge |
| Revoke student-adult link | `Thu hồi liên kết này? Người lớn sẽ không còn thấy thông tin hỗ trợ của học sinh này.` | `Giữ liên kết` | `Thu hồi liên kết` | Confirmation dialog with action-specific buttons |
| Change role | `Đổi vai trò tài khoản này? Quyền truy cập sẽ thay đổi ngay sau khi lưu.` | `Hủy đổi vai trò` | `Lưu vai trò mới` | Inline warning plus confirmation dialog before saving |

Tone rules:

- Student-facing: warm, direct, non-clinical.
- Teacher/parent-facing: supportive, privacy-limited.
- Admin-facing: operational, precise, not punitive.
- Never use: `giám sát`, `xếp hạng rủi ro`, `học sinh nguy hiểm`, `theo dõi bí mật`.
- Prefer: `hỗ trợ`, `người lớn tin cậy`, `thông tin được phép xem`, `học sinh cần được quan tâm`.

---

## Interaction Contract

### Public login

- Login is the only public app surface in Phase 2.
- Required fields: email, password.
- Submit button stays enabled only when both fields are non-empty.
- Password field must support show/hide toggle with accessible label.
- On successful login, route user by backend-returned role.
- Do not route based only on client-side role assumptions.
- Failed login must not reveal whether email or password was incorrect.
- Do not expose session tokens in localStorage or visible UI.

### Role-based routing

After login, route to:

| Role | Route intent | Landing surface |
|------|--------------|-----------------|
| student | `/student` | Student dashboard |
| teacher | `/teacher` | Teacher dashboard |
| parent | `/parent` | Parent dashboard |
| admin | `/admin` | Admin dashboard |

Rules:

- If backend says user is unauthenticated, show session-expired message and return to login.
- If authenticated user tries to access wrong role portal, show unauthorized state and provide link to their correct dashboard.
- Navigation visibility must match role, but backend authorization remains mandatory.

### Privacy acknowledgement gate

Applies after first login and before dashboard access for student and demo student accounts.

- Show Phase 1 privacy notice content.
- Checkbox label: `Em đã đọc và hiểu ai có thể xem thông tin của em.`
- Continue button label: `Tiếp tục vào BeYou`
- Continue button remains disabled until checkbox is checked.
- Persist acknowledgement metadata: notice version, user id, timestamp, `is_demo`.
- Record metadata-only `privacy_acknowledged` audit event.
- Dashboard/profile must keep persistent link: `Ai có thể xem thông tin của em?`
- Reopening the notice later must not require acknowledgement again.

### Authenticated layout

All role portals use a shared authenticated layout with:

- Top demo banner when session or viewed records are demo.
- Role-aware navigation.
- Account menu with role label.
- Privacy notice link for student dashboard/profile.
- Logout action.
- Mobile navigation with 44px minimum touch targets.

Demo banner:

- Must appear at top of authenticated demo sessions.
- Text: `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.`
- Must not rely on color only.

Demo badge:

- Text: `Demo`
- Place near account/record title or metadata.
- Use on demo users, demo profiles, and demo links.

### Student dashboard/profile

Must show:

- Student full name.
- Email.
- School.
- Class.
- Linked support adults grouped by teacher/parent.
- Demo badge when applicable.
- Privacy notice review link.

Student dashboard empty states:

- If no linked adults: `Chưa có người lớn hỗ trợ được liên kết. Khi quản trị viên tạo liên kết, em sẽ thấy thông tin tại đây.`
- If profile missing school/class: `Hồ sơ của em chưa đủ thông tin trường lớp. Hãy báo với quản trị viên hoặc người phụ trách demo.`

Student dashboard must not show self-check, SOS, chatbot, or scenario functionality in Phase 2 except as disabled/future placeholders if needed.

### Teacher dashboard

Must show:

- Teacher profile summary.
- Linked students list.
- For each linked student: name, class, school, relationship status, demo badge if applicable.
- No raw self-check answers, chat transcripts, SOS details, or risk leaderboard in Phase 2.

Teacher empty state:

- Heading: `Chưa có học sinh được liên kết`
- Body: `Khi quản trị viên tạo liên kết, học sinh được phép hỗ trợ sẽ hiển thị tại đây.`

### Parent dashboard

Must show:

- Parent profile summary.
- Linked student/child list.
- For each linked student: name, class, school, relationship status, demo badge if applicable.
- No raw self-check answers, chat transcripts, SOS details, or hidden monitoring language.

Parent empty state:

- Heading: `Chưa có học sinh được liên kết`
- Body: `Khi quản trị viên tạo liên kết, thông tin hỗ trợ được phép xem sẽ hiển thị tại đây.`

### Admin dashboard

Must provide entry points to:

- User management.
- Student-adult link management.
- Demo account visibility.

Admin dashboard summary cards may show counts for:

- Total users.
- Active users.
- Disabled users.
- Demo users.
- Active student-adult links.

Do not show wellbeing/risk aggregate reports in Phase 2.

### Admin user management

Required interactions:

- Create user.
- Edit basic profile fields.
- Change role.
- Disable account.
- Mark account deleted or delete demo-only account.
- Identify demo accounts with `Demo` badge.

User table columns:

- Name.
- Email.
- Role.
- School/class when applicable.
- Status.
- Demo indicator.
- Last updated.
- Actions.

Form fields:

- Full name.
- Email.
- Role: `student`, `teacher`, `parent`, `admin`.
- Status: active, disabled, deleted.
- School and class required for student accounts.
- Demo marker visible but not casually editable unless implementation explicitly supports safe demo-only admin controls.

Validation:

- Student accounts require name, email, school, and class.
- Teacher, parent, and admin accounts require name and email.
- Role changes require confirmation.
- Disable/delete actions require confirmation dialog.

### Admin student-adult link management

Required interactions:

- View active links.
- Create student-teacher link.
- Create student-parent link.
- Revoke active link.
- Show link status and demo indicator.

Link table columns:

- Student.
- Adult.
- Relationship type.
- Student class/school.
- Status.
- Demo indicator.
- Created/updated timestamp.
- Actions.

Rules:

- Relationship type must be exactly `teacher` or `parent`.
- Student selector must only choose student accounts.
- Adult selector must only choose teacher or parent accounts.
- Revoke action requires destructive confirmation.
- Link changes must use metadata-only audit events.
- Demo links must show `Demo` badge.

### Loading states

Use skeletons or simple text:

- Global: `Đang tải thông tin...`
- Login submit: `Đang đăng nhập...`
- Admin save: `Đang lưu thay đổi...`
- Link creation: `Đang tạo liên kết...`

Loading states must preserve layout height to reduce jumpiness.

### Empty states

Empty states must include:

- Clear heading.
- One-sentence explanation.
- Role-appropriate next step.
- No blame language.

### Error states

Error states must include:

- What went wrong.
- What to do next.
- No technical stack traces.
- No sensitive backend details.

Default reusable error:

`Chưa tải được thông tin. Hãy thử lại hoặc báo với người phụ trách demo.`

### Mobile contract

- All Phase 2 surfaces must work at 360px width.
- Use single-column layout on mobile.
- Admin tables must become stacked cards or horizontally scrollable regions with visible labels.
- Primary actions must remain reachable without hover.
- Navigation must be tap-friendly with 44px minimum targets.
- Dialogs must fit mobile viewport and allow scrolling.

### Accessibility contract

- All form inputs require visible labels.
- Error messages must be associated with fields.
- Color must not be the only indicator for demo, disabled, destructive, or active status.
- Dialogs must trap focus and return focus after close.
- Buttons must have accessible names.
- Tables must have headers or card labels.
- Keyboard users must be able to complete login, acknowledgement, user management, and link management.

---

## Privacy & Safety Boundaries

Phase 2 must preserve Phase 1 contracts:

- Deny by default.
- Backend-enforced role, relationship, and purpose checks.
- Frontend-only privacy enforcement is forbidden.
- Metadata-only audit events.
- No raw sensitive student data in admin/adult UI.
- No passwords, tokens, session cookies, API keys, raw chat content, or raw self-check answers in logs or UI diagnostics.
- Demo and real data must remain visibly separated.

Adult/admin language must frame access as support:

- Use: `thông tin được phép xem`
- Use: `hỗ trợ học sinh`
- Use: `người lớn tin cậy`
- Avoid: surveillance, ranking, discipline, hidden monitoring.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | planned: button, card, input, label, form, checkbox, alert, badge, dialog, table, tabs, dropdown-menu, separator, skeleton, toast/sonner | not required |
| third-party | none | not applicable |

Registry rule:

- No third-party registry blocks are approved for Phase 2.
- If a later phase adds third-party blocks, run `npx shadcn view` safety review before inclusion.
- Since `components.json` does not exist yet, shadcn is planned but not initialized in this contract.

---

## Source Decisions Consumed

| Source | Decisions used |
|--------|----------------|
| `.planning/REQUIREMENTS.md` | AUTH-01..AUTH-06, ADMIN-01, SAFE privacy constraints |
| `.planning/ROADMAP.md` | Phase 2 goal, success criteria, role portal scope |
| `.planning/PROJECT.md` | Vietnamese-friendly, calming, mobile-first, email/password, seeded demo accounts |
| `02-CONTEXT.md` | Backend-owned auth, opaque sessions, four roles, privacy gate, student-adult links, admin management |
| `01-UI-SPEC.md` | Color, typography, spacing, demo indicator, privacy link, adult-view tone |
| `01-PRIVACY-NOTICE.vi.md` | Student privacy notice and acknowledgement copy |
| `01-DEMO-DATA-POLICY.md` | Demo banner, Demo badge, not color-only rule |
| `01-AUTHORIZATION-POLICY.yml` | Deny-by-default backend authorization and relationship checks |
| Codebase scout | No app source, no `components.json`, no existing Tailwind/shadcn files |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
