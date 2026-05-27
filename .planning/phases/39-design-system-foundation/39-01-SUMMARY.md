---
phase: 39-design-system-foundation
plan: 01
subsystem: frontend-ui
tags: [design-tokens, tailwind, components, navigation, layout]
dependency_graph:
  requires: []
  provides: [stitch-design-tokens, stitch-card-component, student-sidebar, mobile-bottom-nav, layout-shell]
  affects: [all-frontend-pages, authenticated-layout]
tech_stack:
  added: [Plus Jakarta Sans, class-variance-authority patterns, tailwind-merge cn utility]
  patterns: [design-token-first styling, component extraction, responsive nav]
key_files:
  created:
    - frontend/lib/cn.ts
    - frontend/components/stitch-card.tsx
    - frontend/components/navigation/student-sidebar.tsx
    - frontend/components/navigation/mobile-bottom-nav.tsx
    - frontend/components/layout-shell.tsx
  modified:
    - frontend/tailwind.config.ts
    - frontend/app/globals.css
    - frontend/components/ui-primitives.tsx
    - frontend/app/(authenticated)/layout.tsx
decisions:
  - Kept secondary as #EAF7F3 (legacy value) for backward compat instead of Stitch #55615f
  - Added secondary-stitch for future migration to Stitch secondary color
  - Used fixed bottom nav with overflow "More" menu instead of scrollable horizontal nav
metrics:
  duration: ~8min
  completed: 2026-05-27
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 4
---

# Phase 39 Plan 01: Design System & Shared UI Foundation Summary

Stitch design system tokens in Tailwind config with 30+ colors, 7 typography sizes, spacing/radius/font-family; StitchCard component with circular/rounded variants; extracted StudentSidebar, MobileBottomNav, LayoutShell wired into authenticated layout.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | ed51ec5 | feat(39): add Stitch design tokens to Tailwind config and globals.css |
| 2 | eb6fe5f | feat(39): create StitchCard component and update ui-primitives tokens |
| 3 | 615e4f0 | feat(39): extract navigation components and layout shell |

## Task Details

### Task 1: Tailwind config + globals.css

Rewrote `tailwind.config.ts` with complete Stitch design token system:
- 30+ color tokens (primary, surface variants, outline, role colors, error, tertiary)
- 7 Stitch typography sizes alongside legacy sizes
- Spacing (gutter, margin-desktop, margin-mobile)
- Border radius (card: 32px, hero: 48px, button: 16px)
- Plus Jakarta Sans font family
- Updated globals.css with Google Fonts import and new CSS custom properties
- Full backward compatibility maintained (bg-secondary, bg-background, text-accent still work)

### Task 2: StitchCard + ui-primitives update

- Created `cn` utility (clsx + tailwind-merge) at `lib/cn.ts`
- Created `StitchCard` component with `circular` and `rounded` variants using CVA
- Updated `ui-primitives.tsx`: replaced 6 hardcoded `ring-[#D7EFE8]` with `ring-outline-variant`, replaced `text-accent` with `text-primary` in appropriate places

### Task 3: Navigation extraction + layout shell

- Extracted `StudentSidebar` (100 lines) with design token classes (bg-surface-container-low, border-outline-variant, bg-primary for active)
- Created `MobileBottomNav` with fixed bottom bar, icons + labels, overflow "More" menu
- Created `LayoutShell` content wrapper with max-width and responsive padding
- Refactored authenticated layout from 312 lines to 180 lines by delegating to components
- All auth/privacy/routing/demo-banner logic preserved

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing cn utility**
- **Found during:** Task 2
- **Issue:** No `cn` utility existed in the project; StitchCard needed className merging
- **Fix:** Created `frontend/lib/cn.ts` with clsx + tailwind-merge
- **Commit:** eb6fe5f

**2. [Rule 2 - Backward compat] Secondary color conflict**
- **Found during:** Task 1
- **Issue:** Plan specified secondary → #55615f (Stitch) but existing pages use bg-secondary expecting light green #EAF7F3
- **Fix:** Kept `secondary: #EAF7F3` for backward compat, added `secondary-stitch: #55615f` for future migration
- **Commit:** ed51ec5

## Verification Results

- `npx tsc --noEmit`: 0 errors in source files (19 pre-existing errors in test files only)
- All new components export correctly and are imported by the layout
- Backward compat: bg-background, bg-secondary, text-accent all still resolve

## Self-Check: PASSED
