# Requirements: v2.0 Mobile-First & PWA

**Milestone:** v2.0
**Created:** 2026-05-28
**Total:** 16 requirements across 4 categories

## RESP: Responsive Layouts

| ID | Requirement | Priority |
|---|---|---|
| RESP-01 | Student pages fully responsive with mobile/tablet/desktop breakpoints (dashboard, self-checks, scenarios, chat, support plan, mood check-ins, history) | Must |
| RESP-02 | Admin pages fully responsive (users, links, operations, content wizard) | Must |
| RESP-03 | Teacher/Parent pages fully responsive (linked students, SOS alerts, support summaries) | Must |
| RESP-04 | Public pages responsive (landing, login, privacy) | Must |

## NAV: Mobile Navigation

| ID | Requirement | Priority |
|---|---|---|
| NAV-01 | Bottom tab bar for student on mobile (Dashboard, Test tâm lý, Tình huống, Chat, Menu/More) with active state indicator | Must |
| NAV-02 | Drawer/hamburger navigation for admin on mobile with collapsible sections | Must |
| NAV-03 | Desktop sidebar hidden on mobile (<768px), mobile nav shown; smooth transition between layouts | Must |
| NAV-04 | All interactive elements have touch targets ≥44px on mobile | Must |

## PWA: Progressive Web App

| ID | Requirement | Priority |
|---|---|---|
| PWA-01 | Web app manifest with app name "Peerlight AI", icons (192px, 512px), theme color matching brand, display: standalone | Must |
| PWA-02 | Service worker providing offline fallback page with "Không có kết nối" message and retry button | Must |
| PWA-03 | Install prompt UI (Add to Home Screen banner) shown once to returning users | Should |
| PWA-04 | App shell caching — layout, fonts, and critical CSS load from cache on repeat visits | Must |

## ANIM: Animations & Transitions

| ID | Requirement | Priority |
|---|---|---|
| ANIM-01 | Page transitions between routes (slide for forward navigation, fade for tab switches) with reduced-motion respect | Must |
| ANIM-02 | Micro-interactions on buttons (press scale), cards (hover lift), and tab switches (indicator slide) | Should |
| ANIM-03 | Skeleton loading animations on all data-fetching pages (consistent with existing pattern) | Must |
| ANIM-04 | Pull-to-refresh gesture on student mobile pages that triggers data reload | Should |

## Traceability

| Requirement | Phase |
|---|---|
| (To be filled by roadmap) | |

## Constraints

- Must preserve existing dark mode support across all responsive layouts
- Must not break existing test suite (168+ tests)
- PWA service worker must not cache API responses (privacy-first — no sensitive data in cache)
- Animations must respect `prefers-reduced-motion` media query
- Bottom tab bar must not obstruct content (safe area padding)
- Keep existing Tailwind design tokens and color system
