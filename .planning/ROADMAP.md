# Roadmap: Peerlight AI v1.6 Cross-Role UI Consistency & Production Performance

**Created:** 2026-05-26
**Milestone:** v1.6 Cross-Role UI Consistency & Production Performance
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 33-38
**Coverage:** 27/27 v1.6 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v1.5 Production Pilot Readiness & Identity** - Phases 28-32 (shipped 2026-05-26; constrained pass with live `smoke:pilot` tech debt accepted) - [roadmap archive](milestones/v1.5-ROADMAP.md), [requirements archive](milestones/v1.5-REQUIREMENTS.md), [audit](milestones/v1.5-MILESTONE-AUDIT.md)
- [x] **v1.4 Consent-Based Notifications & Access Transparency** - Phases 21-27 (shipped 2026-05-25) - [roadmap archive](milestones/v1.4-ROADMAP.md)
- [x] **v1.3 Pilot UX & Demo Readiness** - Phases 16-20 (shipped 2026-05-22) - [roadmap archive](milestones/v1.3-ROADMAP.md)
- [x] **v1.2 Trusted Adult Plan & Mood Check-ins** - Phases 12-15 (shipped 2026-05-22) - [roadmap archive](milestones/v1.2-ROADMAP.md)
- [x] **v1.1 Production Hardening & Support Polish** - Phases 7-11 (shipped 2026-05-22) - [roadmap archive](milestones/v1.1-ROADMAP.md)
- [x] **v1.0 MVP Demo** - Phases 1-6 (shipped 2026-05-21) - [roadmap archive](milestones/v1.0-ROADMAP.md)

## Phases

- [x] **Phase 33: Cross-Role UI & Performance Baseline Audit** - Establish UI drift and privacy-safe performance baseline evidence before behavior changes. (completed 2026-05-26)
- [x] **Phase 34: Shared UI Primitives & Role Shell Harmonization** - Align shared visual primitives, role entry, navigation, guidance, accessibility, and role-boundary copy. (completed 2026-05-26)
- [x] **Phase 35: Role Dashboard Consistency Pass** - Harmonize Student, Teacher, Parent, and Admin dashboards while preserving each role's data boundaries. (completed 2026-05-27)
- [x] **Phase 36: Backend & DB Hot Path Optimization** - Optimize bounded backend/database paths without weakening authorization, reason gates, audit, or metadata-only operations. (completed 2026-05-27)
- [ ] **Phase 37: Frontend Data Loading & Render Optimization** - Reduce route waterfalls, duplicate requests, unsafe caching risk, and perceived slowness across role dashboards.
- [ ] **Phase 38: UI/Performance Release Gates** - Prove UI consistency, performance improvement evidence, privacy redlines, and documented constraints before milestone closure.

## Phase Details

### Phase 33: Cross-Role UI & Performance Baseline Audit

**Goal:** Operators and builders can see where cross-role UI drift and production performance risks exist before optimization begins.
**Depends on:** Phase 32
**Requirements:** UIC-01, BASE-01, BASE-02, BASE-03
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Builder can review a cross-role UI inventory covering Student, Teacher, Parent, and Admin shell, navigation, spacing, cards, tables, forms, loading, error, empty, responsive, and accessibility patterns.
2. Builder can review baseline evidence for key role routes and APIs, including local/demo constraints, frontend route/build evidence, backend endpoint timings, payload sizes, and likely DB hot spots.
3. Operator can distinguish local deterministic evidence, public demo evidence, Render/Vercel cold or warm behavior when available, and unavailable live production-pilot constraints.
4. Performance evidence remains aggregate-only and does not expose raw student content, emails, identifiers, private notes, transcripts, answers, provider claims, secrets, or raw request bodies.

**Plans:** 3/3 plans complete

### Phase 34: Shared UI Primitives & Role Shell Harmonization

**Goal:** Student, Teacher, Parent, and Admin surfaces share a cohesive Peerlight AI visual rhythm without sharing role-specific business logic or erasing privacy boundaries.
**Depends on:** Phase 33
**Requirements:** UIC-02, UIC-03, UIC-04, ROLE-05
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Builder can use shared lightweight UI primitives for page headers, sections, cards, status badges, responsive table wrappers, loading states, error states, and empty states without importing role-specific business logic.
2. Student, Teacher, Parent, and Admin screens preserve role-specific privacy boundary copy while using consistent Peerlight AI visual rhythm and Vietnamese support tone.
3. User can navigate role-entry and dashboard shell patterns that clearly show which role is active and what data boundaries apply.
4. Keyboard focus, skip-link behavior, accessible status/error announcements, responsive behavior, and SOS/high-risk color semantics remain intact across shared UI changes.

**Plans:** 4/4 plans complete

### Phase 35: Role Dashboard Consistency Pass

**Goal:** Each role dashboard feels like part of one product while preserving Student privacy, SOS-only adult visibility, Parent read-only posture, Teacher SOS handling, and Admin metadata-only operations.
**Depends on:** Phase 34
**Requirements:** ROLE-01, ROLE-02, ROLE-03, ROLE-04
**UI hint:** yes
**Status:** Complete

**Success criteria:**
1. Student can use a dashboard with harmonized shell, cards, status surfaces, and loading/error/empty patterns while still seeing student-first privacy and support copy.
2. Teacher can use harmonized dashboard patterns while only seeing SOS-eligible linked student information through active relationship checks and teacher-specific SOS status actions.
3. Parent can use harmonized dashboard patterns while retaining read-only support posture, SOS-only student visibility, and summary-only privacy boundaries.
4. Admin can use harmonized operations surfaces that remain metadata-only and do not add raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, or destructive reset controls.

**Plans:** 5/5 plans complete

### Phase 36: Backend & DB Hot Path Optimization

**Goal:** Key backend and database paths become bounded, batched, and query-efficient while preserving safety, authorization, audit, sanitizer, and schema integrity.
**Depends on:** Phase 33
**Requirements:** DBPERF-01, DBPERF-02, DBPERF-03, DBPERF-04, DBPERF-05
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Admin user and student-adult link list paths return bounded or paginated results without N+1 user/link hydration.
2. Teacher and Parent linked-student/SOS visibility paths batch relationship, user, and SOS-signal checks while preserving active relationship and SOS-only visibility rules.
3. Adult summary, history, and dashboard endpoints apply filtering, ordering, and limits in SQL instead of loading broad datasets and slicing in Python.
4. Admin operations dashboard sections that are expensive are optimized or bounded while preserving metadata-only serialization and sanitizer redlines.
5. Any new index or migration is tied to observed query predicates and passes SQLAlchemy/Alembic metadata alignment, schema drift, and privacy regression checks.

**Plans:** 5/5 plans complete

### Phase 37: Frontend Data Loading & Render Optimization

**Goal:** Role dashboards feel faster and more predictable without unsafe browser tokens, cross-role imports, sensitive data leakage, or weakened auth/privacy routing.
**Depends on:** Phase 34, Phase 35, Phase 36
**Requirements:** FEPERF-01, FEPERF-02, FEPERF-03, FEPERF-04, FEPERF-05
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Student, Teacher, Parent, and Admin dashboards avoid unnecessary fetch waterfalls and duplicate requests while keeping credentialed API calls cookie-based.
2. User sees consistent scoped loading, skeleton or placeholder, error, and empty states while dashboard data loads or fails.
3. Sensitive role data remains no-store or uses explicitly scoped cache keys and invalidation across user, role, resource, reason, policy, relationship, runtime, and logout boundaries.
4. Shared UI primitives do not cause route bundle bloat or cross-role page imports, and affected Next build route output is reviewed.
5. Privacy acknowledgement routing, no browser token storage, role dashboard routing, and existing auth capability behavior remain unchanged.

**Plans:** TBD

### Phase 38: UI/Performance Release Gates

**Goal:** v1.6 closes only when UI consistency, backend/frontend performance evidence, privacy redlines, and production constraints are verified and documented.
**Depends on:** Phase 33, Phase 34, Phase 35, Phase 36, Phase 37
**Requirements:** QA-01, QA-02, QA-03, QA-04, QA-05
**UI hint:** yes
**Status:** Not started

**Success criteria:**
1. Backend tests and lint verify optimized DB/backend paths, bounded results, query/index changes, authorization checks, reason gates, audit semantics, and metadata sanitization.
2. Frontend tests, lint, and build verify cross-role UI consistency, responsive behavior, accessibility-critical states, loading/error/empty patterns, and role-specific privacy boundaries.
3. Operator can compare baseline and post-optimization behavior for selected backend/frontend paths or see explicit accepted external constraints.
4. Privacy redline gates reject raw identifiers, emails, notes, transcripts, answers, secrets, provider claims, free-text reasons, exports, destructive reset controls, risk leaderboards, per-student drilldowns, and browser token storage in new UI/performance surfaces.
5. Documentation records v1.6 UI/performance evidence, commands run, remaining production constraints, and that live `smoke:pilot` remains separate from public demo proof.

**Plans:** TBD

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| UIC-01 | Phase 33 | Complete |
| UIC-02 | Phase 34 | Complete |
| UIC-03 | Phase 34 | Complete |
| UIC-04 | Phase 34 | Complete |
| ROLE-01 | Phase 35 | Complete |
| ROLE-02 | Phase 35 | Complete |
| ROLE-03 | Phase 35 | Complete |
| ROLE-04 | Phase 35 | Complete |
| ROLE-05 | Phase 34 | Complete |
| BASE-01 | Phase 33 | Complete |
| BASE-02 | Phase 33 | Complete |
| BASE-03 | Phase 33 | Complete |
| DBPERF-01 | Phase 36 | Pending |
| DBPERF-02 | Phase 36 | Pending |
| DBPERF-03 | Phase 36 | Pending |
| DBPERF-04 | Phase 36 | Pending |
| DBPERF-05 | Phase 36 | Pending |
| FEPERF-01 | Phase 37 | Pending |
| FEPERF-02 | Phase 37 | Pending |
| FEPERF-03 | Phase 37 | Pending |
| FEPERF-04 | Phase 37 | Pending |
| FEPERF-05 | Phase 37 | Pending |
| QA-01 | Phase 38 | Pending |
| QA-02 | Phase 38 | Pending |
| QA-03 | Phase 38 | Pending |
| QA-04 | Phase 38 | Pending |
| QA-05 | Phase 38 | Pending |

**Coverage Summary:**
- v1.6 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

## Progress

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 33. Cross-Role UI & Performance Baseline Audit | 3/3 | Complete    | 2026-05-26 |
| 34. Shared UI Primitives & Role Shell Harmonization | 4/4 | Complete   | 2026-05-26 |
| 35. Role Dashboard Consistency Pass | 5/5 | Complete    | 2026-05-27 |
| 36. Backend & DB Hot Path Optimization | 5/5 | Complete    | 2026-05-27 |
| 37. Frontend Data Loading & Render Optimization | 0/TBD | Not started | - |
| 38. UI/Performance Release Gates | 0/TBD | Not started | - |

---
*Roadmap created: 2026-05-26 for v1.6 milestone initialization.*
