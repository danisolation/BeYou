# Phase 33: Cross-Role UI & Performance Baseline Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 33-cross-role-ui-performance-baseline-audit
**Areas discussed:** UI inventory scope, Performance baseline scope, Privacy-safe evidence, Baseline artifact format

---

## UI Inventory Scope

| Question | Option | Description | Selected |
|---|---|---|---|
| Route coverage | Role dashboards + critical subroutes | Student dashboard/SOS/mood/self-check/chat/support-plan; Teacher/Parent dashboard/support-summary/SOS detail; Admin dashboard/operations/users/links/reports | selected |
| Route coverage | Only 4 role dashboards | Fastest, but may miss drift in critical subroutes | |
| Route coverage | All authenticated routes | Most complete, but can make Phase 33 too broad | |
| State coverage | Full state matrix | Happy, loading, error, empty, blocked/privacy, responsive mobile/tablet/desktop, keyboard/focus, status/alert announcements | selected |
| State coverage | Happy + empty/loading only | Faster, but weak for a11y and privacy boundaries | |
| State coverage | Visual rhythm only | Spacing/card/table/form/nav without state behavior | |
| Evidence style | Matrix artifact + code refs | Route/state/pattern/drift/severity table with file references and optional screenshot/manual notes | selected |
| Evidence style | Screenshot-first | Visual, but heavier and less directly useful for planning | |
| Evidence style | Test-first | Stronger assertions, but may exceed audit scope | |
| Severity | Privacy/a11y-first severity | P0 for privacy/SOS/a11y risk; P1 for important consistency/state drift; P2 for polish/copy/spacing | selected |
| Severity | Low/medium/high | Simple, but less tied to privacy risk | |
| Severity | No scoring | Quick, but weak for planner prioritization | |

**User's choice:** Recommended options selected for all UI inventory questions.
**Notes:** Phase 33 should produce evidence and routing, not refactor UI.

---

## Performance Baseline Scope

| Question | Option | Description | Selected |
|---|---|---|---|
| Path coverage | Frontend role routes + backend hot paths | Selected UI routes plus `/auth/me`, Student profile/SOS/reminders, Teacher/Parent students/support-overview/support-summary, Admin users/links/operations/reports | selected |
| Path coverage | Only dashboard routes and direct APIs | Faster, but less complete for perceived slowness | |
| Path coverage | Backend-heavy only | Focus DB/API first; defer UI baseline | |
| Environment split | Local deterministic + public demo + live-pilot constraints | Local/build evidence, safe Vercel/Render public demo evidence, explicit unavailable pilot constraints | selected |
| Environment split | Local only | Stable, but may miss production-visible slowness | |
| Environment split | Public demo first | Closer to production, but noisy because of cold starts/readiness | |
| Metrics | Balanced metrics | Route/build evidence, waterfall count, endpoint duration, payload bytes, query-count candidates, cold/warm label, command/source | selected |
| Metrics | Minimal metrics | Endpoint duration plus route build output only | |
| Metrics | Deep profiling | Adds traces/flamegraphs now, heavier than Phase 33 audit | |
| Thresholds | Baseline-only with hotspot priority | No arbitrary hard thresholds; rank P0/P1/P2 by privacy risk, unbounded/N+1 evidence, payload/waterfall size, production-visible slowness | selected |
| Thresholds | Hard thresholds immediately | Clear, but likely premature before baseline | |
| Thresholds | No priority scoring | Records numbers but leaves planner to infer priority | |

**User's choice:** Recommended options selected for all performance baseline questions.
**Notes:** Live public demo evidence cannot be counted as production-pilot proof.

---

## Privacy-Safe Evidence

| Question | Option | Description | Selected |
|---|---|---|---|
| Allowed artifact data | Aggregate/safe metadata only | Route/endpoint names, status categories, counts, durations, payload bytes, query-count candidates, cold/warm labels, command names | selected |
| Allowed artifact data | Allow masked IDs/emails | Easier debugging, but riskier for privacy redlines | |
| Allowed artifact data | Allow demo sample records | Easier illustration, but normalizes user-like data in artifacts | |
| Sensitive field description | Classify fields, not values | Record field category and boundary without copying actual values | selected |
| Sensitive field description | Synthetic placeholders | More readable, but still sample-data shaped | |
| Sensitive field description | Omit field discussion | Safest, but planner may miss payload/privacy context | |
| Measurement location | Ephemeral/test-side only | Scripts, tests, helpers, or manual commands create artifacts; no production runtime logging yet | selected |
| Measurement location | Admin operations dashboard | Visible in app, but expands metadata surface and scope | |
| Measurement location | External APM/logging | Powerful, but not aligned with privacy/scope | |
| Redline enforcement | Artifact/script redline gate | Reject raw identifiers, emails, names, notes, transcripts, answers, request bodies, provider claims, secrets, free-text reasons, exports, risk leaderboards, drilldowns, browser tokens | selected |
| Redline enforcement | Manual review only | Faster, but easier to miss leaks | |
| Redline enforcement | Defer to Phase 38 | Less work now, but baseline could start unsafe | |

**User's choice:** Recommended privacy-safe evidence options selected.
**Notes:** Phase 33 measurement must stay aggregate-only and test-side.

---

## Baseline Artifact Format

| Question | Option | Description | Selected |
|---|---|---|---|
| Primary artifacts | Two primary artifacts | `33-UI-INVENTORY.md` and `33-PERFORMANCE-BASELINE.md`, with verification summary if workflow requires | selected |
| Primary artifacts | One combined audit file | Simpler, but may mix UI drift and perf hotspots | |
| Primary artifacts | Markdown + machine JSON | Better automation, but adds scope | |
| UI artifact structure | Route-state matrix | Role, route, state, current pattern/component, drift, privacy/a11y note, severity, candidate phase | selected |
| UI artifact structure | Narrative by role only | Easy to read, harder to convert to tasks | |
| UI artifact structure | Screenshot gallery first | Visual, but weaker for requirement/code trace | |
| Performance artifact structure | Evidence table + hotspot queue | Environment, route/API, command/source, duration/cold-warm, payload bytes, waterfall count, query candidate, privacy check, severity, candidate phase | selected |
| Performance artifact structure | Only timings table | Fast, but lacks query/payload/waterfall context | |
| Performance artifact structure | Operations-style checklist | Admin-friendly, but not granular enough for planning | |
| Hotspot seeding | Seed as candidates only | Admin users/links, teacher/parent/SOS checks, support overview, support summary, operations buckets, frontend waterfalls | selected |
| Hotspot seeding | Do not seed | Only measured evidence, no code-candidate list | |
| Hotspot seeding | Seed as must-fix list | Clearer, but overstates evidence before baseline | |
| Follow-up routing | Candidate routing | Map each finding to Phase 34, 35, 36, 37, or 38; no fixes in Phase 33 | selected |
| Follow-up routing | No routing | Planner infers next phase | |
| Follow-up routing | Immediate fix suggestions | Risks turning audit into planning | |

**User's choice:** Recommended artifact format options selected.
**Notes:** Phase 33 should generate artifacts that downstream planning can directly consume.

---

## the agent's Discretion

- Exact scripts/helpers/test names.
- Exact artifact table formatting.
- Whether individual UI findings need screenshots/manual notes.
- Exact measurement commands and safe public-demo evidence collection path.

## Deferred Ideas

- UI refactors and shared primitives: Phase 34.
- Role dashboard consistency implementation: Phase 35.
- Backend/DB optimization: Phase 36.
- Frontend loading/render/caching optimization: Phase 37.
- Final thresholds/release gates: Phase 38.
