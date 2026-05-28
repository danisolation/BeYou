# Roadmap: Peerlight AI v1.9 Production Polish

**Created:** 2026-05-28
**Milestone:** v1.9 Production Polish
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 51-53
**Coverage:** 9/9 v1.9 requirements mapped, 0 unmapped

## Completed Milestones

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

- [ ] **Phase 51: Remove Demo Visual Indicators** - Delete DemoBanner and DemoBadge components; remove all imports and usages across 20+ pages.
- [ ] **Phase 52: Production Tone & Landing Page** - Rewrite landing page hero, login page descriptive text, and privacy page to production wording.
- [ ] **Phase 53: Runtime Config & Regression Gate** - Switch default runtime to production_pilot, verify 4 demo accounts work, run full test suite.

## Phase Details

### Phase 51: Remove Demo Visual Indicators

**Goal:** No user-facing "Demo" badges or banners remain; app presents as production.
**Depends on:** Phase 50
**Requirements:** PROD-01, PROD-02, PROD-03
**Status:** Not started

**Success criteria:**
1. `DemoBanner` component deleted; zero imports of `demo-banner` across codebase.
2. `DemoBadge` component deleted; zero imports of `demo-badge` across codebase.
3. All pages that referenced these components still render (no import errors).
4. Landing page "Vào demo trong một bước" section removed/replaced.
5. Frontend build passes.

### Phase 52: Production Tone & Landing Page

**Goal:** All user-facing text reads as production product, not demo/prototype.
**Depends on:** Phase 51
**Requirements:** TONE-01, TONE-02, TONE-03
**Status:** Not started

**Success criteria:**
1. Login page descriptive text updated (but "Tài khoản demo" section label and buttons preserved).
2. Privacy page no longer references "dữ liệu demo" explanations.
3. Admin operations wording updated to production monitoring tone.
4. Frontend build passes; no visual regressions.

### Phase 53: Runtime Config & Regression Gate

**Goal:** App defaults to production_pilot mode; all tests pass; demo accounts remain functional.
**Depends on:** Phase 52
**Requirements:** CONFIG-01, CONFIG-02, CONFIG-03
**Status:** Not started

**Success criteria:**
1. `backend/app/core/config.py` default RUNTIME_MODE changed to `production_pilot`.
2. Backend tests pass (189+ tests).
3. Frontend tests pass (111+ tests).
4. Frontend build passes.
5. Demo accounts can still log in (seed script unchanged, login flow works).
