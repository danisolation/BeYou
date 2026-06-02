# Roadmap: Peerlight AI v2.4 External Notifications & Security Hardening Prep

**Created:** 2026-06-02
**Milestone:** v2.4 External Notifications & Security Hardening Prep
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 71-73
**Coverage:** 4/4 v2.4 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v2.3 Content Management Polish** - Phases 68-70 (shipped 2026-06-01) - [roadmap archive](milestones/v2.3-ROADMAP.md)
- [x] **v2.2 UX Refinement & Usability Polish** - Phases 64-67 (shipped 2026-05-28) - [roadmap archive](milestones/v2.2-ROADMAP.md)
- [x] **v2.1 AI Chat Enhancement** - Phases 60-63 (shipped 2026-05-28) - [roadmap archive](milestones/v2.1-ROADMAP.md)
- [x] **v2.0 Mobile-First & PWA** - Phases 54-59 (shipped 2026-05-28) - [roadmap archive](milestones/v2.0-ROADMAP.md)
- [x] **v1.9 Production Polish** - Phases 51-53 (shipped 2026-05-28)

## Phases

- [x] **Phase 71: External Notification Helpers & Config Readiness** - Setup secure SMTP system validation and verify metadata sanitization for E-mail SOS dispatches. (completed 2026-06-02)
- [ ] **Phase 72: Multi-School Tenant Schema Scaffolding** - Implement tenant-scoped columns and SQLAlchemy scaffolding to prepare for future school segmentation.
- [ ] **Phase 73: Security Polish & Release Gates** - Audit E2E metadata-only security invariants and lock release gates.

## Phase Details

### Phase 71: External Notification Helpers & Config Readiness

**Goal:** Provide secure verification of external SMTP configuration and sanitize dispatch outputs to eliminate PII leakage.
**Depends on:** Phase 70
**Requirements:** NOTIFY-01, NOTIFY-02
**Status:** Not Started

**Success criteria:**
1. Startup verification correctly reports SMTP configuration readiness status.
2. Email alert log outcomes redact recipient addresses and notes from stdout.

### Phase 72: Multi-School Tenant Schema Scaffolding

**Goal:** Create database migration and schema fields for future tenant isolation.
**Depends on:** Phase 71
**Requirements:** TENANT-01
**Status:** Not Started

**Success criteria:**
1. Database tables support optional `tenant_id` columns with default segregation safety.

### Phase 73: Security Polish & Release Gates

**Goal:** Ensure zero regression on privacy boundaries, metadata serialization, and release checklist.
**Depends on:** Phase 72
**Requirements:** SECURE-01
**Status:** Not Started

**Success criteria:**
1. All backend and frontend test suites pass with zero exceptions.
