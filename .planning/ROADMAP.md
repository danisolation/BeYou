# Roadmap: Peerlight AI v1.7 UI Redesign to Match Stitch Mockups

**Created:** 2026-05-27
**Milestone:** v1.7 UI Redesign to Match Stitch Mockups
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 39-44
**Coverage:** 20/20 v1.7 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v1.6 Cross-Role UI Consistency & Production Performance** - Phases 33-38 (shipped 2026-05-27; constrained pass with Phase 34 visual walkthrough deferred and test timeout accepted) - [roadmap archive](milestones/v1.6-ROADMAP.md), [requirements archive](milestones/v1.6-REQUIREMENTS.md), [audit](milestones/v1.6-MILESTONE-AUDIT.md)
- [x] **v1.5 Production Pilot Readiness & Identity** - Phases 28-32 (shipped 2026-05-26; constrained pass with live `smoke:pilot` tech debt accepted) - [roadmap archive](milestones/v1.5-ROADMAP.md), [requirements archive](milestones/v1.5-REQUIREMENTS.md), [audit](milestones/v1.5-MILESTONE-AUDIT.md)
- [x] **v1.4 Consent-Based Notifications & Access Transparency** - Phases 21-27 (shipped 2026-05-25) - [roadmap archive](milestones/v1.4-ROADMAP.md)
- [x] **v1.3 Pilot UX & Demo Readiness** - Phases 16-20 (shipped 2026-05-22) - [roadmap archive](milestones/v1.3-ROADMAP.md)
- [x] **v1.2 Trusted Adult Plan & Mood Check-ins** - Phases 12-15 (shipped 2026-05-22) - [roadmap archive](milestones/v1.2-ROADMAP.md)
- [x] **v1.1 Production Hardening & Support Polish** - Phases 7-11 (shipped 2026-05-22) - [roadmap archive](milestones/v1.1-ROADMAP.md)
- [x] **v1.0 MVP Demo** - Phases 1-6 (shipped 2026-05-21) - [roadmap archive](milestones/v1.0-ROADMAP.md)

## Phases

- [x] **Phase 39: Design System & Shared UI Foundation** - Establish synchronized Tailwind config, shared components (cards, nav, layout), and design tokens matching Stitch mockups.
- [x] **Phase 40: Login & Homepage Redesign** - Rebuild login page and student homepage to match Stitch mockups with consistent branding.
- [x] **Phase 41: Student Dashboard & Navigation** - Rebuild student dashboard with circular cards, specific CTAs, and consistent sidebar/mobile navigation.
- [x] **Phase 42: Feature Pages (Tests, Check-in, Scenarios)** - Redesign Test tâm lý, Check-in cảm xúc, and Tình huống pages with sub-pages and integrated history.
- [x] **Phase 43: Chat, SOS, Trusted Adults & Settings** - Redesign Peerlight AI chat (mobile hamburger), SOS (2-state), Trusted Adults, and Settings pages.
- [x] **Phase 44: Teacher/Parent Portal Updates** - Add Peerlight AI chatbot, card-based dashboard, and SOS detail view to teacher/parent portal.

## Phase Details

### Phase 39: Design System & Shared UI Foundation

**Goal:** All pages can draw from one consistent set of design tokens, card components, navigation patterns, and layout primitives that match the Stitch mockup aesthetic.
**Depends on:** Phase 38
**Requirements:** UICONS-01, UICONS-02
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Tailwind config has all Stitch mockup colors, typography, spacing, and border-radius tokens.
2. Shared card component supports circular/rounded variants with icon, title, description, and CTA button.
3. Desktop sidebar navigation component exists and works across student pages.
4. Mobile bottom navigation component exists with consistent icons.
5. Layout wrapper applies consistent page structure (header, content area, responsive behavior).

### Phase 40: Login & Homepage Redesign

**Goal:** Login and homepage match the Stitch mockups with updated branding cards, no loading issues, and proper content layout.
**Depends on:** Phase 39
**Requirements:** HOME-01, HOME-02, AUTH-01, AUTH-02
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Login page shows 3 branding cards (Góc nhỏ bình yên, Nâng niu từng xao động, Điểm hẹn chữa lành) without slow circle animation.
2. Homepage displays card-based sections with image+text blocks, no duplicate sections.
3. "Bắt đầu" is the only navigational CTA on the homepage.
4. Both pages use Phase 39 design tokens and shared components consistently.

### Phase 41: Student Dashboard & Navigation

**Goal:** Student dashboard uses circular/rounded cards with specific CTAs and descriptions, without history or privacy blocks on the main page.
**Depends on:** Phase 39
**Requirements:** DASH-01, DASH-02, DASH-03
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Dashboard shows circular/rounded cards for each feature (Test, Check-in, Scenarios, Settings).
2. Each card has specific CTA text (Vào test, Vào check-in, Vào thực hành, Vào thiết lập).
3. No history sections appear on the dashboard.
4. No privacy blocks or reminder settings appear inline on dashboard.
5. Navigation sidebar (desktop) and bottom nav (mobile) are functional.

### Phase 42: Feature Pages (Tests, Check-in, Scenarios)

**Goal:** Test tâm lý, Check-in cảm xúc, and Tình huống pages have proper sub-page structure, integrated history, and privacy banners matching Stitch mockups.
**Depends on:** Phase 41
**Requirements:** TEST-01, TEST-02, TEST-03, CHECKIN-01, CHECKIN-02, SCENARIO-01, SCENARIO-02, SCENARIO-03
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Test tâm lý has 3 sub-pages: test list, test-taking (question-by-question), and results.
2. Check-in cảm xúc shows privacy banner with 4 reassurance points and integrated history section.
3. Tình huống has 3 sub-pages: scenario library, practice (interactive), and results/feedback.
4. All sub-pages use consistent design tokens and shared card components.
5. History is displayed within each feature page (not on dashboard).

### Phase 43: Chat, SOS, Trusted Adults & Settings

**Goal:** Peerlight AI chat has mobile hamburger menu, SOS has 2-state flow, Trusted Adults matches mockup, Settings combines check-in + SOS settings.
**Depends on:** Phase 41
**Requirements:** CHAT-01, CHAT-02, SOS-01, SOS-02, TRUST-01, SETTINGS-01
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Peerlight AI chat shows hamburger menu (≡) on mobile for sidebar navigation.
2. Chat is named "Peerlight AI" in all visible locations.
3. SOS shows initial confirmation state; after "Đúng, tôi cần giúp ngay" shows activated overlay.
4. Trusted Adults page matches the Stitch mockup design.
5. Settings page shows both check-in settings and SOS settings in one unified view.

### Phase 44: Teacher/Parent Portal Updates

**Goal:** Teacher/Parent portal gets Peerlight AI chatbot, card-based dashboard matching student design, and simplified SOS detail view.
**Depends on:** Phase 43
**Requirements:** ADULT-01, ADULT-02, ADULT-03
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Teacher/Parent portal includes Peerlight AI chatbot with same design as student version.
2. Teacher/Parent dashboard uses card-based layout matching student dashboard card design.
3. SOS profile view shows only the student SOS detail section (not full profile).
4. Portal uses the same design tokens and shared components as student pages.
