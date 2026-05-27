# Phase 41: Student Dashboard & Navigation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase with mockup reference)

<domain>
## Phase Boundary

Rebuild student dashboard with circular/rounded cards for each feature, specific CTA text, and no history/privacy blocks on the main page. Navigation sidebar and mobile bottom nav already exist from Phase 39.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Cards
- Use circular/rounded card variant (StitchCard from Phase 39)
- 4 main feature cards:
  1. Test tâm lý — CTA: "Vào test" — description about psychological self-checks
  2. Check-in cảm xúc — CTA: "Vào check-in" — description about mood tracking
  3. Tình huống xử lý — CTA: "Vào thực hành" — description about scenario practice
  4. Cài đặt — CTA: "Vào thiết lập" — description about settings
- Each card has: circular icon area, title, short description, CTA button
- Cards link to their respective pages

### Remove from Dashboard
- No history sections (move inside feature pages in Phase 42)
- No privacy boundary card (already handled by layout auth gate)
- No reminder settings inline
- No SOS alert creation inline (SOS is its own page now)

### Keep on Dashboard
- User greeting/welcome header with name
- Peerlight AI chat link card (maybe a smaller card or different section)

### Agent's Discretion
- Grid layout (2x2, or responsive grid)
- Card description text (use Vietnamese, supportive tone)

</decisions>

<code_context>
## Existing Code Insights

### Current Dashboard
- frontend/app/(authenticated)/student/page.tsx — very complex page with SOS, reminders, history, privacy blocks, linked adults, etc.
- Currently includes: profile loading, SOS alert creation, reminder management, linked adults display, mood check-in reminders

### Reusable Assets
- StitchCard component (circular variant perfect for dashboard)
- StudentSidebar and MobileBottomNav already handle navigation
- Design tokens from Phase 39

### Integration Points
- Dashboard page: frontend/app/(authenticated)/student/page.tsx
- Navigation already routes to: /student/chat, /student/self-checks, /student/mood-check-ins, /student/scenarios, /student/support-plan

</code_context>

<specifics>
## Specific Ideas

- Clean, minimal dashboard focused on 4 main action cards
- Greeting: "Chào [name], hôm nay em cảm thấy thế nào?"
- Cards arranged in a responsive grid (2 cols on desktop, 1 col on mobile)
- Each card uses the circular StitchCard variant with appropriate Lucide icon

</specifics>

<deferred>
## Deferred Ideas

- History sections move to feature pages (Phase 42)
- SOS becomes its own page (Phase 43)
- Settings becomes its own page (Phase 43)

</deferred>
