# Phase 40: Login & Homepage Redesign - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase with mockup reference)

<domain>
## Phase Boundary

Rebuild login page and student homepage to match Stitch mockups with updated branding cards and consistent design language. Login gets 3 specific feature cards; homepage becomes card-based About page with image+text blocks.

</domain>

<decisions>
## Implementation Decisions

### Login Page
- Show 3 branding cards: "Góc nhỏ bình yên", "Nâng niu từng xao động", "Điểm hẹn chữa lành"
- Fix slow-loading circle animation (remove or replace with lightweight alternative)
- Use Plus Jakarta Sans font and Stitch design tokens
- Login form stays functional (email/password), just restyled

### Homepage (About Page)
- Card-based design with image+text blocks (no links to other pages except "Bắt đầu")
- Remove duplicate sections
- Sections from mockup: Hero, Safe Harbor philosophy, Core Values (3 cards), Smart Tools (bento grid), Trust & Privacy, CTA
- "Bắt đầu" button is the only navigation CTA
- Content will be updated later from Word file - for now use mockup text

### Agent's Discretion
- Exact image placeholders (use placeholder SVGs or gradient backgrounds)
- Animation details (keep lightweight, no heavy JS animations)
- Responsive breakpoints follow existing lg/md/sm pattern

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 39 design tokens in tailwind.config.ts
- StitchCard component for card sections
- LayoutShell for content wrapper
- Glass card effects available via Tailwind classes

### Established Patterns
- Next.js pages under app/ directory
- Login at frontend/app/login/page.tsx
- Homepage likely at frontend/app/page.tsx (public landing)

### Integration Points
- Login page: frontend/app/login/page.tsx
- Homepage/landing: frontend/app/page.tsx
- Both are public pages (not under authenticated layout)

</code_context>

<specifics>
## Specific Ideas

From the Stitch mockup HTML:
- Hero section with organic shapes, floating animation, large photo
- "Triết lý Safe Harbor" text section
- 3 core value cards (Privacy, Expert Support, Life Skills)
- Bento-grid feature showcase (AI Assistant, Emotion Diary, SOS, Security)
- Glass-card Trust & Privacy section
- Green CTA section at bottom
- Sticky top navbar with logo

</specifics>

<deferred>
## Deferred Ideas

- Content text update from Word file (will come later)
- Navigation menu links (homepage is mostly static, no internal routing needed)

</deferred>
