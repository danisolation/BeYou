# Phase 44: Teacher/Parent Portal Updates - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase with mockup reference)

<domain>
## Phase Boundary

Add Peerlight AI chatbot to teacher/parent portal, redesign dashboard with card-based layout matching student design, and show only SOS detail section in student SOS profile view.

</domain>

<decisions>
## Implementation Decisions

### Peerlight AI Chatbot for Adults
- Same chat interface design as student (from Phase 43)
- Add chat route under teacher and parent portals
- Reuse chat component/logic from student side

### Dashboard Card Redesign
- Teacher/Parent dashboards use card-based layout matching student design style
- Use StitchCard components for feature access
- Remove sections from feedback: "Nhận định của giáo viên" and "Đánh giá quan trọng"
- Cards for: linked students, SOS alerts, support summaries

### SOS Profile View
- When teacher/parent views a student's SOS detail, show only the essential section
- Simplify the current SOS detail view to focus on the alert info

### Agent's Discretion
- Which features teachers vs parents see (keep existing role boundaries)
- Card descriptions and Vietnamese copy
- Whether to create new chat route or reuse student chat component

</decisions>

<code_context>
## Existing Code Insights

### Current Pages
- frontend/app/(authenticated)/teacher/ — teacher portal pages
- frontend/app/(authenticated)/parent/ — parent portal pages
- Both have their own page.tsx dashboards

### Reusable Assets
- StitchCard from Phase 39
- Chat page logic from student/chat (Phase 43)
- Design tokens
- SOS alert detail component at frontend/components/sos-alert-detail.tsx

</code_context>

<specifics>
## Specific Ideas

- Teacher dashboard cards: Học sinh liên kết, Cảnh báo SOS, Hỗ trợ tổng quan, Peerlight AI
- Parent dashboard similar but read-only focused
- Chat pages can be simple wrappers that reuse the chat component

</specifics>

<deferred>
## Deferred Ideas

- Full teacher/parent portal redesign beyond dashboard+SOS+chat
- Teacher-specific workflow features

</deferred>
