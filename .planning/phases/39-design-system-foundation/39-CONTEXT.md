# Phase 39: Design System & Shared UI Foundation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Establish synchronized Tailwind config, shared components (cards, nav, layout), and design tokens matching Stitch mockups. All subsequent phases will draw from this foundation.

</domain>

<decisions>
## Implementation Decisions

### Design Tokens
- Adopt full Stitch color palette: primary (#00604e), student-blue (#3B82F6), teacher-amber (#D97706), parent-purple (#8B5CF6), admin-slate (#334155), plus all surface/container/variant colors
- Font: Plus Jakarta Sans (already available via Google Fonts)
- Border radius: rounded-[32px] for cards, rounded-[48px] for hero sections, rounded-2xl for buttons
- Keep Lucide React icons (already deeply integrated) - do NOT switch to Material Symbols

### Shared Components
- Create a new StitchCard component with circular/rounded variants (icon, title, description, CTA)
- Update existing ui-primitives to use new design tokens without breaking existing functionality
- Desktop sidebar: keep current structure, update styling to match Stitch aesthetic
- Mobile navigation: keep bottom horizontal scroll nav, update styling

### Agent's Discretion
- All implementation choices for component API design at agent's discretion
- Keep backward compatibility with existing pages that haven't been redesigned yet

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui-primitives.tsx` — PageHeader, Section, EntryCard, StatusBadge, LoadingState, ErrorState, PrivacyBoundaryCard, SurfaceCard, ResponsiveTable
- `tailwind.config.ts` — Currently minimal (5 colors, 4 font sizes)
- `app/(authenticated)/layout.tsx` — Student sidebar nav, mobile nav, role-based routing

### Established Patterns
- Tailwind utility classes for styling
- Lucide React for icons
- Responsive design with sm/md/lg breakpoints
- CSS class name composition via `cn()` utility

### Integration Points
- `tailwind.config.ts` — all pages read design tokens from here
- `components/ui-primitives.tsx` — shared components imported across all pages
- `app/(authenticated)/layout.tsx` — navigation shell wraps all authenticated pages
- `app/globals.css` — global styles

</code_context>

<specifics>
## Specific Ideas

- Colors from Stitch mockup tailwind config to adopt as the design system base
- Glass card effects (backdrop-filter blur) for elevated sections
- Organic shape decorations (border-radius variations) for hero areas
- Float animation for decorative elements

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
