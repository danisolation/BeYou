# Requirements: v2.2 UX Refinement & Usability Polish

**Milestone:** v2.2
**Created:** 2026-05-28
**Total:** 16 requirements across 4 categories

## GLOBAL: Global UX Foundations

| ID | Requirement | Priority |
|---|---|---|
| GLOBAL-01 | Toast notification system: reusable component for success/error/info messages that auto-dismiss after 4s, stack vertically, accessible via aria-live | Must |
| GLOBAL-02 | Universal retry pattern: all data-fetching pages show a "Thử lại" (retry) button on failure instead of dead-end error text | Must |
| GLOBAL-03 | Consistent loading skeletons: replace plain-text "Đang tải..." with proper skeleton shimmer on all pages | Should |
| GLOBAL-04 | Success feedback: all form submissions show toast confirmation instead of inline-only text | Must |

## STUDENT: Student Features Polish

| ID | Requirement | Priority |
|---|---|---|
| STUDENT-01 | Chat thread search/filter: search input in sidebar filters threads by title/content keyword | Should |
| STUDENT-02 | Mood check-in success toast: prominent confirmation after submission with encouragement message | Must |
| STUDENT-03 | Support plan autosave: draft recovery via localStorage so partial edits aren't lost on navigation | Should |
| STUDENT-04 | Self-check history filtering: filter by test name and date range on history page | Should |
| STUDENT-05 | Notification settings: replace plain-text loading with proper skeleton, add save confirmation toast | Must |

## ADULT: Adult Portal Enhancement

| ID | Requirement | Priority |
|---|---|---|
| ADULT-01 | Student list search & filter: text search by name/email + filter by safety status on teacher/parent student pages | Must |
| ADULT-02 | Quick-status indicators: colored dot/badge on student cards showing latest mood/safety state at a glance | Should |
| ADULT-03 | SOS urgency filter: filter alert list by status (pending/acknowledged/resolved) + visual unread state | Must |
| ADULT-04 | Dashboard refresh: "last updated" timestamp + manual refresh button on teacher/parent home | Should |

## ADMIN: Admin & System Polish

| ID | Requirement | Priority |
|---|---|---|
| ADMIN-01 | Fix silent error swallowing: admin dashboard preview fetch failures show error state, not blank content | Must |
| ADMIN-02 | Unsaved changes warning: config pages (chatbot, mood, privacy) warn before navigating away with unsaved edits | Should |
| ADMIN-03 | Clear-filters affordance: all filterable lists show a "Xóa bộ lọc" button when filters are active | Should |

## Constraints

- Must not break existing feature behavior — all changes are additive UX improvements
- Toast system must work across all roles (student, teacher, parent, admin)
- All new interactive elements must be keyboard-accessible and have proper ARIA labels
- Mobile-first: improvements must work on 360px viewport minimum
- No new backend endpoints required for Global/Student phases; Adult/Admin may add filter params
- localStorage usage must handle quota exceeded gracefully
- Retry pattern must respect existing API retry logic (no double-retry loops)
