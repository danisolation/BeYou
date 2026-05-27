# Phase 24 UI Spec: Adult Reason-for-Access Prompt

**Status:** Approved for autonomous implementation  
**Date:** 2026-05-25

## Surface

- Existing teacher support summary page: `/teacher/students/[studentId]/support-summary`
- Existing parent support summary page: `/parent/students/[studentId]/support-summary`

## User Goal

Adults should understand why BeYou asks for a reason before showing sensitive support context. The prompt must reinforce transparency and support-not-surveillance boundaries while keeping the flow quick for legitimate support.

## Required States

1. **Loading:** existing loading copy may remain.
2. **Reason required:** show an in-page card before any protected support content.
3. **Submitting reason:** disable submit button and keep selected reason visible.
4. **Allowed:** show existing support summary with an added reason transparency card.
5. **Error:** show existing safe empty/error state; do not expose protected content.

## Reason Prompt Content

- Heading: `Cho biết lý do hỗ trợ trước khi xem`
- Body must say the reason is used for transparency and metadata-only audit.
- Body must say it does not grant extra access and existing linked-adult permission is still required.
- Choices use controlled labels only; no free-text input.
- Submit button: `Tiếp tục xem tóm tắt`

## Allowed Reason Labels

- `student_requested_support`: `Học sinh đã nhờ hỗ trợ`
- `follow_up_after_checkin`: `Theo dõi sau một check-in gần đây`
- `support_plan_context`: `Xem bối cảnh kế hoạch hỗ trợ`
- `sos_follow_up`: `Theo dõi sau một tình huống SOS`
- `routine_care_conversation`: `Chuẩn bị cho cuộc trò chuyện chăm sóc định kỳ`

## Privacy Boundaries

- Do not render support-plan details, mood trend text, or shared mood-note content before the backend accepts a reason.
- Do not show email/contact identifiers.
- Do not use punitive or surveillance copy such as `giám sát`, `tuân thủ`, `xếp hạng`, `kỷ luật`.
- Do not include free-text reason fields.

## Accessibility

- Reason choices must be native radio inputs or equivalent labelled controls.
- The submit button must be disabled until a reason is selected.
- Error/help copy must be visible text, not only color.

## Acceptance

- Frontend tests prove the prompt renders on HTTP 428, blocks content before reason submission, submits the selected `reason_code`, and then renders the summary.
- Frontend tests prove copy stays support-oriented and excludes forbidden terms.
