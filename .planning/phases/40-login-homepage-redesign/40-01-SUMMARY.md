---
status: complete
phase: 40
plan: 01
subsystem: frontend-ui
tags: [login, homepage, branding, redesign, stitch-mockup]
key-files:
  created: []
  modified:
    - frontend/app/login/page.tsx
    - frontend/app/page.tsx
decisions:
  - "Used Lucide icons (Leaf, Heart, Sunrise) for branding cards instead of emoji"
  - "Kept DemoRoleEntry section at bottom of homepage for evaluators"
  - "Homepage uses anchor links for in-page navigation, only Bắt đầu links to /login"
metrics:
  duration: ~4min
  completed: 2025-05-27
  tasks: 3/3
  files-modified: 2
---

# Phase 40 Plan 01: Login & Homepage Redesign Summary

Redesigned login page with split layout + 3 branding cards and rebuilt homepage as a full marketing About page with hero, values, bento grid tools, and CTA sections — matching Stitch mockup design language.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Redesign Login Page | 4aaac6e | Split layout with form left + 3 branding cards right; design tokens applied |
| 2 | Redesign Homepage | 889439c | Full About page with navbar, hero, values, bento grid, CTA, footer |
| 3 | Verify Build | — | tsc passes for our files; next build succeeds |

## Implementation Details

### Login Page (Task 1)
- **Layout**: Left side = login form card, Right side = 3 stacked branding cards
- **Branding Cards**: Góc nhỏ bình yên (Leaf), Nâng niu từng xao động (Heart), Điểm hẹn chữa lành (Sunrise)
- **Design tokens**: bg-background, rounded-card, text-primary, text-on-background, rounded-button
- **Loading animation**: Removed circle animation, uses simple text state ("Đang đăng nhập...")
- **All login logic preserved**: form submission, auth capabilities, demo accounts, error handling, password toggle

### Homepage (Task 2)
- **Sticky navbar**: BeYou logo + Leaf icon, nav links (anchor), "Bắt đầu" button → /login
- **Hero**: Welcome badge, display heading, description, two CTA buttons
- **Safe Harbor Philosophy**: Centered philosophy section
- **Core Values**: 3-card grid (Privacy, Expert Support, Life Skills)
- **Bento Grid**: 4 tool cards (AI 8-col, Diary 4-col, SOS 4-col, Privacy 8-col)
- **Trust & Privacy**: Glass card with shield-prefixed feature list
- **CTA Section**: Green bg, headline + two buttons
- **Footer**: 3-col grid (brand, company links, legal)
- **DemoRoleEntry**: Preserved at bottom for evaluators

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- HOME-01: ✅ Card-based About/Homepage with synchronized design language
- HOME-02: ✅ "Bắt đầu" is the only navigation CTA on homepage (all others are anchor scrolls)
- AUTH-01: ✅ Login page has 3 branding cards with icons and descriptions
- AUTH-02: ✅ No slow circle animation — replaced with text loading state

## Self-Check: PASSED
