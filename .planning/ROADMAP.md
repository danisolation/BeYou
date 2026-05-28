# Roadmap: Peerlight AI v2.0 Mobile-First & PWA

**Created:** 2026-05-28
**Milestone:** v2.0 Mobile-First & PWA
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 54-59
**Coverage:** 16/16 v2.0 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v1.9 Production Polish** - Phases 51-53 (shipped 2026-05-28)
- [x] **v1.8 UI/UX Polish & Accessibility** - Phases 45-50 (shipped 2026-05-27)
- [x] **v1.7 UI Redesign to Match Stitch Mockups** - Phases 39-44 (shipped 2026-05-27)
- [x] **v1.6 Cross-Role UI Consistency & Production Performance** - Phases 33-38 (shipped 2026-05-27)
- [x] **v1.5 Production Pilot Readiness & Identity** - Phases 28-32 (shipped 2026-05-26)
- [x] **v1.4 Consent-Based Notifications & Access Transparency** - Phases 21-27 (shipped 2026-05-25)
- [x] **v1.3 Pilot UX & Demo Readiness** - Phases 16-20 (shipped 2026-05-22)
- [x] **v1.2 Trusted Adult Plan & Mood Check-ins** - Phases 12-15 (shipped 2026-05-22)
- [x] **v1.1 Production Hardening & Support Polish** - Phases 7-11 (shipped 2026-05-22)
- [x] **v1.0 MVP Demo** - Phases 1-6 (shipped 2026-05-21)

## Phases

- [x] **Phase 54: PWA Foundation & App Shell** - Manifest, service worker, offline fallback, app shell caching, install prompt.
- [x] **Phase 55: Mobile Navigation System** - Bottom tab bar for student, drawer for admin, responsive nav switching, touch targets.
- [ ] **Phase 56: Student Pages Responsive** - Mobile-first layouts for all student pages with proper breakpoints.
- [ ] **Phase 57: Admin Pages Responsive** - Mobile-first layouts for all admin pages (users, links, operations, content wizard).
- [ ] **Phase 58: Teacher/Parent & Public Pages Responsive** - Mobile-first layouts for teacher, parent, landing, login, privacy pages.
- [ ] **Phase 59: Animations & Polish** - Page transitions, micro-interactions, skeleton loading consistency, pull-to-refresh.

## Phase Details

### Phase 54: PWA Foundation & App Shell

**Goal:** App is installable, works offline (fallback), and loads instantly from cache on repeat visits.
**Depends on:** Phase 53
**Requirements:** PWA-01, PWA-02, PWA-03, PWA-04
**Plans:** 1 plan
**Status:** Planning complete

Plans:
- [x] 54-01-PLAN.md — Enhance SW with app shell caching + build-time asset injection

**Success criteria:**
1. `manifest.json` present with correct name, icons, theme_color, display: standalone.
2. Service worker registered; offline page shown when network unavailable.
3. Install prompt appears for eligible returning users.
4. Repeat visits load app shell from cache (< 1s first paint).
5. No sensitive API data cached by service worker.

### Phase 55: Mobile Navigation System

**Goal:** Native-like navigation on mobile — bottom tabs for student, drawer for admin, proper touch targets.
**Depends on:** Phase 54
**Requirements:** NAV-01, NAV-02, NAV-03, NAV-04
**Status:** Not started

**Success criteria:**
1. Student mobile shows bottom tab bar with 5 items and active indicator.
2. Admin mobile shows hamburger → drawer with collapsible sections.
3. Desktop sidebar hidden below 768px; mobile nav shown instead.
4. All interactive elements pass 44px minimum touch target audit.
5. Navigation transitions are smooth (no layout jumps).

### Phase 56: Student Pages Responsive

**Goal:** Every student page works perfectly on mobile (320px) through desktop (1440px+).
**Depends on:** Phase 55
**Requirements:** RESP-01, ANIM-03
**Status:** Not started

**Success criteria:**
1. Dashboard, self-checks, scenarios, chat, support plan, mood pages all render correctly at 320px, 768px, 1024px, 1440px.
2. Content reflows without horizontal scroll at any breakpoint.
3. Skeleton loading present on all data-fetching pages.
4. Cards stack vertically on mobile, grid on tablet+.
5. No text overflow or truncation issues.

### Phase 57: Admin Pages Responsive

**Goal:** Admin pages (users, links, operations, content wizard) work on tablet and mobile.
**Depends on:** Phase 55
**Requirements:** RESP-02
**Status:** Not started

**Success criteria:**
1. Admin users/links pages: cards stack on mobile, table on desktop.
2. Operations page: metrics stack 2x2 on mobile, 4-across on desktop.
3. Content wizard: full-width steps on mobile, comfortable on tablet+.
4. Filter panels collapse to accordion on mobile.
5. No horizontal scroll at 320px.

### Phase 58: Teacher/Parent & Public Pages Responsive

**Goal:** All remaining pages (teacher, parent, landing, login, privacy) responsive.
**Depends on:** Phase 55
**Requirements:** RESP-03, RESP-04
**Status:** Not started

**Success criteria:**
1. Teacher/Parent student list: cards on mobile, table on desktop.
2. Landing page: hero stacks vertically on mobile, feature grid responsive.
3. Login page: centered form comfortable on all sizes.
4. Privacy page: readable with proper padding on mobile.
5. All images/icons properly sized for mobile.

### Phase 59: Animations & Polish

**Goal:** Native-like feel with smooth transitions, micro-interactions, and pull-to-refresh.
**Depends on:** Phase 56, Phase 57, Phase 58
**Requirements:** ANIM-01, ANIM-02, ANIM-04
**Status:** Not started

**Success criteria:**
1. Route changes animate (slide forward, fade for tabs).
2. Buttons show press feedback (scale); cards lift on hover/focus.
3. Tab indicator slides smoothly between active items.
4. Pull-to-refresh on student pages triggers data reload.
5. All animations disabled when `prefers-reduced-motion: reduce` is active.
6. No animation jank or dropped frames on mid-range phones.
