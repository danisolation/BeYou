# Roadmap: Peerlight AI v1.8 UI/UX Polish & Accessibility

**Created:** 2026-05-27
**Milestone:** v1.8 UI/UX Polish & Accessibility
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 45-50
**Coverage:** 18/18 v1.8 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v1.7 UI Redesign to Match Stitch Mockups** - Phases 39-44 (shipped 2026-05-27)
- [x] **v1.6 Cross-Role UI Consistency & Production Performance** - Phases 33-38 (shipped 2026-05-27)
- [x] **v1.5 Production Pilot Readiness & Identity** - Phases 28-32 (shipped 2026-05-26)
- [x] **v1.4 Consent-Based Notifications & Access Transparency** - Phases 21-27 (shipped 2026-05-25)
- [x] **v1.3 Pilot UX & Demo Readiness** - Phases 16-20 (shipped 2026-05-22)
- [x] **v1.2 Trusted Adult Plan & Mood Check-ins** - Phases 12-15 (shipped 2026-05-22)
- [x] **v1.1 Production Hardening & Support Polish** - Phases 7-11 (shipped 2026-05-22)
- [x] **v1.0 MVP Demo** - Phases 1-6 (shipped 2026-05-21)

## Phases

- [ ] **Phase 45: Dark Mode Foundation** - Dark color palette, theme toggle, CSS custom properties, provider setup.
- [ ] **Phase 46: Skeleton Loading States** - Shared skeleton components, replace all spinners with content-shaped skeletons.
- [ ] **Phase 47: Navigation for All Roles** - Extend sidebar + mobile bottom nav to teacher/parent/admin roles.
- [ ] **Phase 48: Responsive Polish** - Audit & fix all pages 320px-1920px+, touch targets, tablet breakpoints.
- [ ] **Phase 49: Animations & Micro-interactions** - CSS transitions, scroll entrance, hover/focus states, page transitions.
- [ ] **Phase 50: Accessibility Audit & Fixes** - Keyboard nav, ARIA labels, focus rings, contrast validation.

## Phase Details

### Phase 45: Dark Mode Foundation

**Goal:** Users can toggle dark mode in settings; all pages render correctly with dark palette.
**Depends on:** Phase 44
**Requirements:** DARK-01, DARK-02, DARK-03
**Status:** Not started

**Success criteria:**
1. Dark color palette defined as CSS custom properties with Tailwind `dark:` variant.
2. Theme toggle in settings persists to localStorage and applies immediately.
3. All existing pages (student, teacher, parent, admin) render correctly in dark mode.
4. Contrast meets WCAG AA (4.5:1 text, 3:1 UI components).

### Phase 46: Skeleton Loading States

**Goal:** Replace spinners with content-shaped skeleton states for perceived speed.
**Depends on:** Phase 45
**Requirements:** SKEL-01, SKEL-02, SKEL-03
**Status:** Not started

**Success criteria:**
1. Shared skeleton component library: CardSkeleton, TextSkeleton, PageSkeleton.
2. All dashboard pages (student, teacher, parent, admin) use skeleton instead of LoadingState spinner.
3. Skeleton shapes match actual loaded content layout.

### Phase 47: Navigation for All Roles

**Goal:** Teacher, parent, and admin get sidebar + mobile bottom nav matching student pattern.
**Depends on:** Phase 45
**Requirements:** NAV-01, NAV-02, NAV-03
**Status:** Not started

**Success criteria:**
1. TeacherSidebar, ParentSidebar, AdminSidebar components exist with role-appropriate nav items.
2. Mobile bottom nav works for all roles.
3. Active nav item clearly highlighted; layout shell applies consistently.

### Phase 48: Responsive Polish

**Goal:** All pages work flawlessly from 320px to 1920px+ with no horizontal scroll.
**Depends on:** Phase 47
**Requirements:** RESP-01, RESP-02, RESP-03
**Status:** Not started

**Success criteria:**
1. No horizontal scroll on any page at 320px viewport.
2. All touch targets ≥44×44px on mobile.
3. Tablet (768-1024px) has appropriate 2-column adaptations.

### Phase 49: Animations & Micro-interactions

**Goal:** Smooth, delightful interactions throughout the app using CSS-only animations.
**Depends on:** Phase 48
**Requirements:** ANIM-01, ANIM-02, ANIM-03
**Status:** Not started

**Success criteria:**
1. Page content fades in on load (no layout shift).
2. All buttons, cards, links have hover/focus/active transitions.
3. Cards animate in on scroll via IntersectionObserver + CSS keyframes.

### Phase 50: Accessibility Audit & Fixes

**Goal:** App meets WCAG 2.1 AA with full keyboard navigation and screen reader support.
**Depends on:** Phase 49
**Requirements:** A11Y-01, A11Y-02, A11Y-03
**Status:** Not started

**Success criteria:**
1. Tab through entire app without getting stuck; visible focus rings on all interactive elements.
2. All icon-only buttons have aria-label; nav landmarks; live regions for SOS/alerts.
3. Automated contrast check passes for all color combinations in both light and dark modes.
