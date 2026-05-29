# Roadmap: Peerlight AI v2.2 UX Refinement & Usability Polish

**Created:** 2026-05-28
**Milestone:** v2.2 UX Refinement & Usability Polish
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 64-67
**Coverage:** 16/16 v2.2 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v2.1 AI Chat Enhancement** - Phases 60-63 (shipped 2026-05-28; 14/14 requirements, 6/6 integrations) - [roadmap archive](milestones/v2.1-ROADMAP.md), [requirements archive](milestones/v2.1-REQUIREMENTS.md), [audit](milestones/v2.1-MILESTONE-AUDIT.md)
- [x] **v2.0 Mobile-First & PWA** - Phases 54-59 (shipped 2026-05-28; 16/16 requirements, 8/8 integrations) - [roadmap archive](milestones/v2.0-ROADMAP.md), [requirements archive](milestones/v2.0-REQUIREMENTS.md), [audit](milestones/v2.0-MILESTONE-AUDIT.md)
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

- [ ] **Phase 64: Global UX Foundations** - Toast notification system, universal retry/error recovery, consistent loading skeletons, success feedback.
- [ ] **Phase 65: Student Features Polish** - Chat thread search, mood check-in toasts, support plan autosave, self-check filtering, notification settings.
- [ ] **Phase 66: Adult Portal Enhancement** - Student list search/filter, quick-status indicators, SOS urgency filter, dashboard refresh.
- [ ] **Phase 67: Admin & System Polish** - Fix silent errors, unsaved-changes warnings, clear-filters affordance, mobile admin tables.

## Phase Details

### Phase 64: Global UX Foundations

**Goal:** Establish shared UX infrastructure (toast, retry, skeletons) that all features build on.
**Depends on:** Phase 63
**Requirements:** GLOBAL-01, GLOBAL-02, GLOBAL-03, GLOBAL-04
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Toast component renders success/error/info with auto-dismiss and accessible announcements.
2. All existing error states replaced with retry-capable error component.
3. At least 8 pages upgraded from plain-text loading to proper skeletons.
4. Form submissions across all roles show toast feedback on success.

### Phase 65: Student Features Polish

**Goal:** Polish student-facing features for smoother daily use.
**Depends on:** Phase 64
**Requirements:** STUDENT-01, STUDENT-02, STUDENT-03, STUDENT-04, STUDENT-05
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Chat sidebar has working search input that filters threads by keyword.
2. Mood check-in submit triggers success toast with encouragement.
3. Support plan form persists draft to localStorage on every keystroke; restores on mount.
4. Self-check history shows filter dropdowns (test name, date range).
5. Notification preferences page uses skeleton and toast on save.

### Phase 66: Adult Portal Enhancement

**Goal:** Give teachers/parents faster access to relevant student info.
**Depends on:** Phase 64
**Requirements:** ADULT-01, ADULT-02, ADULT-03, ADULT-04
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Student list has working search by name + filter by safety state.
2. Student cards show colored status dot (green/amber/red) based on last mood/safety.
3. SOS alert list has status tabs or filter dropdown with unread visual badge.
4. Dashboard shows "Cập nhật lúc HH:MM" + refresh icon button.

### Phase 67: Admin & System Polish

**Goal:** Fix quality gaps in admin experience and add protective UX patterns.
**Depends on:** Phase 64
**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Admin dashboard preview fetch failures show visible error state.
2. Config pages prompt "Bạn có thay đổi chưa lưu" on navigate-away.
3. All filterable admin lists show clear-filter button when active.
