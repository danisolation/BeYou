# Phase 55 — Mobile Navigation System: Context

## Smart Discuss Decisions

### Grey Area 1: Touch Target & Sizing
| # | Decision | Answer |
|---|----------|--------|
| 1 | Touch target enforcement | CSS min-h-11 min-w-11 on all nav buttons — audit existing |
| 2 | Bottom nav item count | Keep current pattern (4 visible + "more" = 5 visible slots) |
| 3 | Active indicator style | Primary color text + bold + bottom border indicator |

### Grey Area 2: Responsive Breakpoints & Transitions
| # | Decision | Answer |
|---|----------|--------|
| 1 | Mobile→desktop breakpoint | 768px (md: in Tailwind) — verify existing |
| 2 | Drawer animation | CSS transform + opacity transition (200ms) — keep existing pattern |
| 3 | Layout jump prevention | Fixed positioning for bottom nav, transform for drawer — no CLS |

## Codebase Scout Summary

Existing infrastructure is ~85% complete:
- `mobile-bottom-nav.tsx` — Student bottom tabs with expandable "more" menu
- `admin-mobile-nav.tsx` — Admin drawer nav with collapsible sections + overlay
- `teacher-mobile-nav.tsx` — Teacher mobile nav
- `parent-mobile-nav.tsx` — Parent mobile nav
- `layout-shell.tsx` — Role-based switching with `pb-20 lg:pb-0`
- Authenticated layout imports all role-specific nav components

### Identified Gaps
1. Touch targets may not meet 44px minimum (need audit + fix)
2. Active indicator bottom border may not be present on all nav items
3. Breakpoint may be lg: (1024px) instead of md: (768px) — need verification
4. Transition smoothness (drawer animation timing) needs verification
5. "5 items" criterion needs count verification per student nav
