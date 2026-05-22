# Roadmap: BeYou - Tu Tin La Minh

**Created:** 2026-05-22  
**Granularity:** Coarse  
**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Coverage:** 24/24 v1.2 requirements mapped; 15/24 complete

## Phase Overview

| # | Phase | Goal | Requirements | Depends on | UI hint |
|---|-------|------|--------------|------------|---------|
| 12 | Trusted Adult Support Plan | Students can define a proactive support plan with selected linked adults and clear sharing boundaries. | PLAN-01..PLAN-05 | v1.1 archive | yes |
| 13 | Mood Check-ins & Student History | Students can submit lightweight non-clinical mood check-ins, keep optional notes private, and review trends. | MOOD-01..MOOD-05 | Phase 12 | yes |
| 14 | Adult Support Summaries | Teachers and parents can view linked-student support summaries without raw private notes or surveillance patterns. | ADULT-01..ADULT-05 | Phases 12, 13 | yes |
| 15 | Admin Configuration & Metadata Operations Closure | Admins can configure prompts/guidance and verify metadata-only privacy, audit, and routing boundaries across v1.2. | ADMIN-01..ADMIN-05, SAFE-01..SAFE-04 | Phases 12, 13, 14 | yes |

## Phase Checklist

- [x] Phase 12: Trusted Adult Support Plan
- [x] Phase 13: Mood Check-ins & Student History
- [x] Phase 14: Adult Support Summaries
- [ ] Phase 15: Admin Configuration & Metadata Operations Closure

## Phase Details

### Phase 12: Trusted Adult Support Plan

**Goal:** Students can define a proactive support plan with selected linked adults and clear sharing boundaries.  
**Depends on:** v1.1 archive  
**Requirements:** PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05  
**UI hint:** yes  
**Status:** Complete

**Success criteria:**
1. Student can create/update a support plan using only existing linked adults.
2. Student can select which linked adults are included and see what each selected adult can view.
3. Student can store shareable support preferences and pause/deactivate the plan without deleting historical audit context.
4. Support plan changes emit metadata-only audit events with no private notes or unshared detail.

**Plans:** 3/3 complete

Plans:
- [x] 12-01-PLAN.md - Support plan backend domain, APIs, authorization, and audit
- [x] 12-02-PLAN.md - Student support plan UI and privacy copy
- [x] 12-03-PLAN.md - Support plan regression, review, verification, and closure

### Phase 13: Mood Check-ins & Student History

**Goal:** Students can submit lightweight non-clinical mood check-ins, keep optional notes private, and review trends.  
**Depends on:** Phase 12  
**Requirements:** MOOD-01, MOOD-02, MOOD-03, MOOD-04, MOOD-05  
**UI hint:** yes  
**Status:** Complete

**Success criteria:**
1. Student can submit non-clinical mood, energy, stress, and context inputs.
2. Optional private notes remain student-only by default.
3. Student can review timestamped check-in history, trend labels, and supportive next steps.
4. High-concern check-ins suggest trusted-adult contact and SOS without automatically sending SOS.

**Plans:** 3/3 complete

Plans:
- [x] 13-01-PLAN.md - Mood check-in backend domain, APIs, trend summaries, and audit
- [x] 13-02-PLAN.md - Student check-in, history, and supportive guidance UI
- [x] 13-03-PLAN.md - Mood privacy, repeat-entry, no-auto-SOS regression, review, and closure

### Phase 14: Adult Support Summaries

**Goal:** Teachers and parents can view linked-student support summaries without raw private notes or surveillance patterns.  
**Depends on:** Phases 12, 13  
**Requirements:** ADULT-01, ADULT-02, ADULT-03, ADULT-04, ADULT-05  
**UI hint:** yes  
**Status:** Complete

**Success criteria:**
1. Teacher and parent access is limited to linked/managed students.
2. Adult summaries include shareable support preferences, recent trend direction, recency, and suggested supportive actions.
3. Adult APIs and UI exclude raw private notes and raw check-in details.
4. Unauthorized adult access is denied without sensitive existence leakage.

**Plans:** 3/3 complete

Plans:
- [x] 14-01-PLAN.md - Adult support summary backend APIs and authorization
- [x] 14-02-PLAN.md - Teacher and parent support summary UI
- [x] 14-03-PLAN.md - Adult privacy regression, role-copy review, verification, and closure

### Phase 15: Admin Configuration & Metadata Operations Closure

**Goal:** Admins can configure prompts/guidance and verify metadata-only privacy, audit, and routing boundaries across v1.2.  
**Depends on:** Phases 12, 13, 14  
**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, SAFE-01, SAFE-02, SAFE-03, SAFE-04  
**UI hint:** yes  
**Status:** Not started

**Success criteria:**
1. Admin can manage and preview mood prompts, option labels, support guidance, sort order, and lifecycle status.
2. Admin validation blocks incomplete or unsafe non-clinical guidance.
3. Operations visibility remains metadata-only for support plans, check-ins, adult summaries, and admin config.
4. Tests verify privacy-ack routing, role/relationship authorization, raw-note exclusion, metadata-only audit, and no automatic SOS.

**Plans:** 0/3 complete

Plans:
- [ ] 15-01-PLAN.md - Admin mood prompt and guidance configuration
- [ ] 15-02-PLAN.md - Metadata operations and audit integration
- [ ] 15-03-PLAN.md - Cross-surface privacy regression, review, verification, and milestone closure prep

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| PLAN-01 | Phase 12 | Complete |
| PLAN-02 | Phase 12 | Complete |
| PLAN-03 | Phase 12 | Complete |
| PLAN-04 | Phase 12 | Complete |
| PLAN-05 | Phase 12 | Complete |
| MOOD-01 | Phase 13 | Complete |
| MOOD-02 | Phase 13 | Complete |
| MOOD-03 | Phase 13 | Complete |
| MOOD-04 | Phase 13 | Complete |
| MOOD-05 | Phase 13 | Complete |
| ADULT-01 | Phase 14 | Complete |
| ADULT-02 | Phase 14 | Complete |
| ADULT-03 | Phase 14 | Complete |
| ADULT-04 | Phase 14 | Complete |
| ADULT-05 | Phase 14 | Complete |
| ADMIN-01 | Phase 15 | Pending |
| ADMIN-02 | Phase 15 | Pending |
| ADMIN-03 | Phase 15 | Pending |
| ADMIN-04 | Phase 15 | Pending |
| ADMIN-05 | Phase 15 | Pending |
| SAFE-01 | Phase 15 | Pending |
| SAFE-02 | Phase 15 | Pending |
| SAFE-03 | Phase 15 | Pending |
| SAFE-04 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 24 total
- Mapped to phases: 24
- Complete: 15
- Unmapped: 0

## Assumptions

- v1.2 continues phase numbering from v1.1, so it starts at Phase 12.
- In-app SOS remains canonical; mood check-ins can suggest SOS but never send SOS automatically.
- Optional mood notes stay student-only by default.
- Adult support views must remain summary-only and supportive, not disciplinary or surveillance-oriented.
- Admin configuration belongs late in the milestone so prompts/guidance can reflect the student and adult flows already built.

---
*Last updated: 2026-05-22 after Phase 14 completion*
