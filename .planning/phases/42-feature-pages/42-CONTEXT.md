# Phase 42: Feature Pages (Tests, Check-in, Scenarios) - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase with mockup reference)

<domain>
## Phase Boundary

Redesign Test tâm lý, Check-in cảm xúc, and Tình huống pages with proper sub-page structure, integrated history sections, and privacy banners matching Stitch mockups.

</domain>

<decisions>
## Implementation Decisions

### Test tâm lý (self-checks)
- 3 sub-pages: test list, taking test, results
- Test list shows available tests as cards
- Taking test shows questions one by one (placeholder for now, content from Word later)
- Results page shows score/feedback
- Keep existing API integration (backend already supports this)

### Check-in cảm xúc (mood-check-ins)
- Privacy banner with 4 reassurance points:
  1. Chỉ em mới thấy nhật ký cảm xúc này
  2. Không ai bị thông báo khi em check-in
  3. Em có thể xóa bất kỳ lúc nào
  4. Dữ liệu được mã hóa an toàn
- History section displayed INSIDE this page (moved from dashboard)
- Check-in form stays the same (emoji/mood selection + optional note)

### Tình huống (scenarios)
- 3 sub-pages: library (list), practice (interactive), results/feedback
- Library shows scenario cards by category
- Practice page shows scenario + choices (placeholder content)
- Results page shows feedback, better alternatives, related skills

### Agent's Discretion
- Exact sub-page routing (use [id] dynamic routes or separate pages)
- Card layouts within each page
- How to handle missing content (placeholder text is fine)

</decisions>

<code_context>
## Existing Code Insights

### Current Pages
- frontend/app/(authenticated)/student/self-checks/ — existing test pages
- frontend/app/(authenticated)/student/mood-check-ins/ — existing check-in page
- frontend/app/(authenticated)/student/scenarios/ — existing scenario pages

### Reusable Assets
- StitchCard for list items
- Design tokens from Phase 39
- Existing API endpoints (already built in backend)

</code_context>

<specifics>
## Specific Ideas

- Each feature page starts with a header explaining what it does
- History/logs are shown at the bottom of each page (collapsible or scrollable)
- Privacy banner uses a soft info-box style (blue/green surface with icon)
- Sub-page navigation uses breadcrumbs or back button

</specifics>

<deferred>
## Deferred Ideas

- Actual test questions and scenario content (from Word file)
- Advanced analytics/charts for mood history

</deferred>
