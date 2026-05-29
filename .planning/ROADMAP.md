# Roadmap: Peerlight AI v2.3 Content Management Polish

**Created:** 2026-05-28
**Milestone:** v2.3 Content Management Polish
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 68-70
**Coverage:** 9/9 v2.3 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v2.2 UX Refinement & Usability Polish** - Phases 64-67 (shipped 2026-05-28; 16/16 requirements) - [roadmap archive](milestones/v2.2-ROADMAP.md), [requirements archive](milestones/v2.2-REQUIREMENTS.md)
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

- [x] **Phase 68: Content Editor Scoring & Publish** - Manual threshold scoring, visual validation grid, FE-BE checklist alignment, empty choice filtering, Vietnamese UX hints.
- [x] **Phase 69: Content Media & Student Display** - Cover image upload (admin), base64 storage, student-facing card image display.
- [ ] **Phase 70: Content Final Polish** - Teacher/parent cover image display, any remaining content editor minor tweaks.

## Phase Details

### Phase 68: Content Editor Scoring & Publish

**Goal:** Make threshold scoring work correctly with manual configuration, align FE publish checklist to BE rules exactly.
**Depends on:** Phase 67
**Requirements:** SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, UX-01
**Status:** Complete (2026-05-28)

**Success criteria:**
1. Admin can manually set min/max on each threshold without auto-redistribute overriding.
2. ScoreCoverageGrid shows visual feedback for gaps (red), overlaps (yellow), out-of-range (orange).
3. Publish checklist passes if and only if BE would accept the payload.
4. "Add threshold" fills the first gap or splits the largest range intelligently.
5. Questions with <2 non-empty choices are stripped before submission.
6. All editor inputs have Vietnamese placeholders/hints.

**Commits:** `a0af47a`, `7046a5e`, `b422e04`, `26c5264`, `5549874`, `88c8bdd`, `485ae84`, `a7479af`, `f1b404b`, `80ed043`, `32e0211`, `64a0a54`

### Phase 69: Content Media & Student Display

**Goal:** Allow admin to add cover images to tests/scenarios, display them on student-facing cards.
**Depends on:** Phase 68
**Requirements:** MEDIA-01, MEDIA-02
**Status:** Complete (2026-05-28)

**Success criteria:**
1. CoverImagePicker in Step 1 accepts image upload (max 2MB), shows preview, allows delete.
2. BE stores cover_image_url as Text column on both models.
3. Student self-check list shows cover image as card header.
4. Student scenario list shows cover image as card header.

**Commits:** `d85bf66`, `d7efef7`

### Phase 70: Content Final Polish

**Goal:** Show cover images in teacher/parent views and apply any remaining minor tweaks.
**Depends on:** Phase 69
**Requirements:** MEDIA-03
**Status:** Not started

**Success criteria:**
1. Teacher/parent pages that list content show cover images where available.
2. TypeScript compiles clean.
3. No regressions in existing functionality.
