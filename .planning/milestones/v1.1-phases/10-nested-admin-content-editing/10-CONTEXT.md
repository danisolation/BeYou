# Phase 10: Nested Admin Content Editing - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 10 improves the admin content editor so admins can manage full nested self-check and scenario structures. Backend services and APIs already support nested lists, publish validation, lifecycle controls, and snapshot-preserving attempt history; the main gap is frontend editing completeness and surfaced validation copy.

</domain>

<decisions>
## Implementation Decisions

### Editing Model
- Keep the existing single-page admin content editor.
- Expand existing draft state helpers to update every question, choice, threshold, and scenario choice rather than only the first item.
- Add add/remove controls for nested items while preserving the loaded order and explicit `sort_order` fields.

### Validation and Preview
- Surface backend validation detail from `ApiError.detail.detail` when publishing or saving invalid structures.
- Keep backend as source of truth for publish validation.
- Expand preview cards to show nested questions/choices/thresholds/scenario choices so admins can check student-facing content before publishing.

### Test Scope
- Add frontend tests for multi-question/multi-choice/multi-threshold persistence, scenario multi-choice editing, validation copy display, and preview visibility.
- Reuse existing backend tests for API/admin content lifecycle and snapshot behavior.

### the agent's Discretion
- Use existing visual style and components; avoid adding drag-and-drop or complex UI libraries.
- Reordering is handled through numeric order fields.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/app/(authenticated)/admin/content/page.tsx` already has draft state, lifecycle buttons, confirmation dialog, and simple preview.
- `frontend/lib/admin-content-api.ts` already exposes list/create/update/publish/archive/delete helpers for self-checks and scenarios.
- Backend `app/services/admin_content.py` already replaces nested children, validates publishability, audits metadata-only changes, and preserves historical attempts through snapshots/nulling foreign keys.

### Current Gap
- The UI only edits the first self-check question, first choice, first threshold, and first scenario choice.
- Generic error copy hides backend's actionable publish validation detail.
- Preview only shows title/description/status, not nested content.

### Integration Points
- Update admin content page and tests only unless backend test gaps reveal a direct issue.

</code_context>

<specifics>
## Specific Ideas

- Add "Thêm câu hỏi", "Thêm lựa chọn", "Thêm ngưỡng điểm", and "Thêm lựa chọn tình huống" controls.
- Show remove buttons with safe disabled states when keeping minimum useful draft structure.
- Use labels that preserve existing first-field tests while uniquely labeling additional nested fields.

</specifics>

<deferred>
## Deferred Ideas

- Drag-and-drop ordering.
- Full content diff/version history.
- Rich markdown editing.

</deferred>

