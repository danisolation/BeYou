# Requirements: Peerlight AI v1.6 Cross-Role UI Consistency & Production Performance

**Defined:** 2026-05-26
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

## v1.6 Requirements

Requirements for the current milestone. Each requirement maps to exactly one roadmap phase.

### UI Consistency

- [x] **UIC-01**: The app has a cross-role UI inventory that identifies drift in shell, navigation, spacing, cards, tables, forms, loading, error, empty, responsive, and accessibility patterns across Student, Teacher, Parent, and Admin surfaces.
- [x] **UIC-02**: Shared lightweight UI primitives exist for page headers, sections, cards, status badges, responsive table wrappers, loading states, error states, and empty states without importing role-specific business logic.
- [x] **UIC-03**: Student, Teacher, Parent, and Admin screens keep role-specific privacy boundary copy while using consistent Peerlight AI visual rhythm and Vietnamese support tone.
- [x] **UIC-04**: Cross-role UI changes preserve responsive behavior, keyboard focus, skip-link behavior, accessible status/error announcements, and SOS/high-risk color semantics.

### Role Dashboards

- [x] **ROLE-01**: The Student dashboard uses the harmonized shell, cards, status surfaces, and loading/error/empty patterns while preserving student-first privacy and support copy.
- [x] **ROLE-02**: The Teacher dashboard uses harmonized UI patterns while preserving SOS-only student visibility, active relationship checks, and teacher-specific SOS status actions.
- [x] **ROLE-03**: The Parent dashboard uses harmonized UI patterns while preserving read-only support posture, SOS-only student visibility, and summary-only privacy boundaries.
- [x] **ROLE-04**: The Admin dashboard and operations surfaces use harmonized metadata-only panels without adding raw exports, risk leaderboards, per-student drilldowns, raw audit browsers, or destructive reset controls.
- [x] **ROLE-05**: Shared role-entry, dashboard navigation, and guidance patterns make it clear which role is active and what data boundaries apply.

### Production Performance Baseline

- [x] **BASE-01**: v1.6 records a baseline for key role routes and APIs, including local/demo constraints, frontend route/build evidence, backend endpoint timings, payload sizes, and likely DB query hot spots.
- [x] **BASE-02**: Backend timing or query-count evidence is collected with aggregate-only metadata and never logs raw student content, emails, identifiers, private notes, transcripts, answers, provider claims, secrets, or raw request bodies.
- [x] **BASE-03**: The baseline distinguishes local deterministic evidence, public demo evidence, Render/Vercel cold or warm behavior where available, and unavailable live production-pilot constraints.

### Backend and Database Performance

- [x] **DBPERF-01**: Admin user and student-adult link list paths are bounded or paginated and avoid N+1 user/link hydration.
- [x] **DBPERF-02**: Teacher and Parent linked-student/SOS visibility paths batch relationship, user, and SOS-signal checks instead of performing per-row queries where avoidable.
- [x] **DBPERF-03**: Adult summary, history, or dashboard endpoints push filtering, ordering, and limits into SQL instead of loading broad datasets and slicing in Python.
- [x] **DBPERF-04**: Admin operations dashboard sections that are expensive are optimized or bounded while preserving metadata-only serialization and sanitizer redlines.
- [x] **DBPERF-05**: Any new index or migration is tied to observed query predicates, keeps SQLAlchemy/Alembic schema metadata aligned, and passes schema drift and privacy regression checks.

### Frontend Performance

- [x] **FEPERF-01**: Role dashboards reduce avoidable fetch waterfalls and duplicate requests while keeping credentialed API calls cookie-based.
- [ ] **FEPERF-02**: Role dashboards provide consistent perceived responsiveness through scoped loading states, skeletons or placeholders, and clear error/empty states.
- [x] **FEPERF-03**: Sensitive role data remains no-store or uses explicitly scoped cache keys and invalidation that respect user, role, resource, reason, policy, relationship, runtime, and logout boundaries.
- [x] **FEPERF-04**: Shared UI primitives do not cause route bundle bloat or cross-role page imports; Next build output is reviewed for affected routes.
- [x] **FEPERF-05**: Frontend performance work preserves privacy acknowledgement routing, no browser token storage, role dashboard routing, and existing auth capabilities behavior.

### Regression and Release Gates

- [ ] **QA-01**: Backend tests and lint verify optimized DB/backend paths, bounded results, query/index changes, authorization checks, reason gates, audit semantics, and metadata sanitization.
- [ ] **QA-02**: Frontend tests, lint, and build verify cross-role UI consistency, responsive behavior, accessibility-critical states, loading/error/empty patterns, and role-specific privacy boundaries.
- [ ] **QA-03**: Performance evidence gates compare baseline and post-optimization behavior for selected backend/frontend paths or record explicit accepted external constraints.
- [ ] **QA-04**: Privacy redline gates reject raw identifiers, emails, notes, transcripts, answers, secrets, provider claims, free-text reasons, exports, destructive reset controls, risk leaderboards, per-student drilldowns, and browser token storage in new UI/performance surfaces.
- [ ] **QA-05**: Documentation records v1.6 UI/performance evidence, commands run, remaining production constraints, and the requirement that live `smoke:pilot` remains separate from public demo proof.

## Future Requirements

Deferred to future milestones, not in v1.6 scope.

### Production Pilot Launch Evidence

- **FUTURE-PILOT-01**: Configure safe production-pilot URLs/environment, confirm `/health/ready=ready`, run `npm --prefix frontend run smoke:pilot`, and record live pilot evidence when a real pilot environment exists.

### Identity Provider Integration

- **FUTURE-IDENT-01**: Implement provider-specific OAuth/OIDC/SAML login after a pilot school selects provider details, claims, issuer, redirect URI, and provisioning requirements.

### Support Operations

- **FUTURE-SUPPORT-01**: Add counselor handoff workflow after UI/performance stability and pilot launch evidence are stable.
- **FUTURE-SUPPORT-02**: Add external Zalo/SMS/push delivery only after provider governance, consent, retries, dead-letter handling, and message privacy review are designed.

### Scale and Governance

- **FUTURE-SCALE-01**: Add multi-school tenancy after single-school pilot safety and performance are proven.
- **FUTURE-OBS-01**: Add deeper APM or observability only if it can remain aggregate-only and privacy-safe.

## Out of Scope

| Feature | Reason |
|---|---|
| Full design-system rewrite or new UI framework | v1.6 should harmonize existing surfaces without a risky rewrite. |
| Browser-stored access tokens or OAuth token handling | Violates backend-owned session and no-token browser contract. |
| Raw performance logs containing student data, emails, IDs, notes, transcripts, answers, provider claims, secrets, or request bodies | Violates privacy-by-default and metadata-only operations boundaries. |
| Generic client caching of sensitive role data without scoped keys and invalidation | Risks cross-role/user/relationship leakage. |
| Raw exports, risk leaderboards, per-student risk drilldowns, or raw audit browsers | Violates support-not-surveillance boundaries. |
| Removing authorization, privacy acknowledgement, reason gates, audit events, or safety copy to improve speed | Performance must preserve safety and privacy invariants. |
| Provider-specific SSO implementation | v1.6 optimizes existing product quality; school IdP details are still required. |
| Multi-school tenancy | Deferred until single-school pilot UX/performance are stable. |

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
| DBPERF-01 | Phase 36 | Complete |
| DBPERF-02 | Phase 36 | Complete |
| DBPERF-03 | Phase 36 | Complete |
| DBPERF-04 | Phase 36 | Complete |
| DBPERF-05 | Phase 36 | Complete |
| FEPERF-01 | Phase 37 | Complete |
| FEPERF-02 | Phase 37 | Pending |
| FEPERF-03 | Phase 37 | Complete |
| FEPERF-04 | Phase 37 | Complete |
| FEPERF-05 | Phase 37 | Complete |
| QA-01 | Phase 38 | Pending |
| QA-02 | Phase 38 | Pending |
| QA-03 | Phase 38 | Pending |
| QA-04 | Phase 38 | Pending |
| QA-05 | Phase 38 | Pending |

**Coverage:**
- v1.6 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.6 roadmap creation*
