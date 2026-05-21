# Phase 3: Student Self-Checks, Scenarios & Content Management - Context

**Gathered:** 2026-05-21  
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 3 delivers student self-checks, school-pressure scenarios, self-check/scenario history, privacy-limited adult self-check summaries, and admin content management for tests and scenarios. It builds on Phase 2 auth, roles, links, demo seed, and admin UI. It must preserve Phase 1 privacy-by-default, non-clinical Vietnamese copy, metadata-only audit, and demo/real-data separation.

Out of scope for this phase: SOS workflow, chatbot, aggregate reporting, advanced analytics/trend charts, external notifications, clinical diagnosis, and adult access to raw self-check answers by default.

</domain>

<decisions>

## Implementation Decisions

### Self-Check Content & Scoring

- **D-01:** Seed two active self-check tests for v1 demo: `Sức khỏe cảm xúc` and `Áp lực bạn bè`.
- **D-02:** Use multiple-choice questions where each answer choice has a numeric scoring value.
- **D-03:** Backend calculates each submission by summing selected choice values, then maps the total to thresholds defined per test.
- **D-04:** Risk/state labels must use the Phase 1 exact non-clinical labels: `On dinh`, `Can chu y`, `Nen tim ho tro`, and `Can ho tro som`.
- **D-05:** Thresholds are test-specific and admin-editable together with test content. Global thresholds or code-only thresholds are not sufficient for ADMIN-02.
- **D-06:** Store raw self-check answers so the student can review their own completed detail view. Raw answers are not shown to teachers, parents, or admins by default.

### Student Result Experience

- **D-07:** After submission, the result screen should lead with a supportive message, risk/state label, and suggested next action. The numeric score is shown as secondary information, not as the visual focus.
- **D-08:** Suggested next actions vary by risk/state: `On dinh` shows positive/supportive content; `Can chu y` and `Nen tim ho tro` suggest relevant scenarios or coping skills; `Can ho tro som` encourages talking with a trusted linked adult and prepares for SOS integration in Phase 4 without implementing SOS yet.
- **D-09:** Student self-check history includes a summary list and a detail page for each completed attempt. Only the student can see their own raw answer detail.
- **D-10:** Result and advice copy must stay supportive, short, Vietnamese, and non-diagnostic. Do not imply medical diagnosis, therapy, or punishment.

### Adult Summary Boundaries

- **D-11:** Teacher and parent views show permitted self-check summaries only for actively linked students/children.
- **D-12:** Adult summary fields: student name/context, completion date, test type, risk/state label, advice summary, and support suggestion. Adult summaries do not include raw answers or detailed score breakdowns.
- **D-13:** Adult history view shows the latest summary plus up to 5 recent summary-only attempts from the last 30 days.
- **D-14:** Every adult read of a self-check summary records a metadata-only `sensitive_resource_read` audit event. Audit metadata must not include raw answers, full answer text, passwords, tokens, session cookies, or API keys.
- **D-15:** Scenario attempt history remains student-facing/private by default in Phase 3 unless a later phase explicitly expands adult visibility.

### Scenario Content & Feedback

- **D-16:** Seed four published demo scenarios: peer pressure/rủ rê, online teasing, friendship conflict, and grade/academic pressure.
- **D-17:** Each scenario includes title, situation description, response choices, feedback for selected choice, recommended response, lesson learned, and related skill tag.
- **D-18:** Each response choice carries a constructive/risky signal, short feedback, and points to the recommended response/lesson. Avoid simple "right/wrong" framing where a supportive explanation is better.
- **D-19:** Save scenario attempt history for the student with the selected choice, feedback snapshot, recommended response snapshot, lesson snapshot, skill tag, timestamp, and `is_demo`.

### Admin Content Workflow

- **D-20:** Test and scenario content uses `draft`, `published`, and `archived` states. Students only see published active content.
- **D-21:** Admin can create and edit self-check tests, questions, answer choices, scoring values, risk thresholds, scenarios, response choices, feedback, lessons, and skill tags.
- **D-22:** For content already used by students, attempts/results must retain a snapshot of the content/summary as it existed at completion time. Later edits affect future attempts, not historical records.
- **D-23:** Prefer archiving over hard deletion for published or used content. The agent may allow deletion only for unused drafts if it keeps audit intent intact.
- **D-24:** Admin content changes must record metadata-only `admin_safety_content_changed` audit events for self-check and scenario content.

### the agent's Discretion

- The agent may choose exact schema/table names, route names, service boundaries, form layouts, validation details, and seed text as long as the locked privacy, audit, demo, and non-clinical copy decisions are preserved.
- The agent may choose exact number of questions per seeded self-check and exact wording of advice/positive content, provided the demo is complete enough for end-to-end TEST and SCEN requirements.
- The agent may decide whether Phase 3 planning splits self-checks, scenarios, admin content, and verification into separate plans or combines smaller surfaces where safe.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — BeYou product vision, student-first wellbeing scope, Python backend requirement, privacy-first constraints, and non-clinical UI/UX tone.
- `.planning/REQUIREMENTS.md` — TEST-01..TEST-06, SCEN-01..SCEN-05, ADMIN-02, and ADMIN-03 requirements.
- `.planning/ROADMAP.md` — Phase 3 boundary, dependency on Phase 2, success criteria, and next-phase boundaries.
- `.planning/STATE.md` — Current milestone state and Phase 3 as next active focus.

### Safety, Privacy, Audit, Demo, and UI Contracts

- `.planning/phases/01-safety-privacy-policy-foundation/01-CONTEXT.md` — Locked privacy-by-default, summary-only adult view, non-clinical copy, demo separation, and anti-surveillance decisions.
- `.planning/phases/01-safety-privacy-policy-foundation/01-DATA-CLASSIFICATION.yml` — `wellbeing_records`, `self_check_summary`, and `student_self_check_raw_answers` data classification.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUTHORIZATION-POLICY.yml` — Deny-by-default, linked-adult self-check summary-only access, raw answers not shown to adults/admin by default.
- `.planning/phases/01-safety-privacy-policy-foundation/01-AUDIT-EVENT-CATALOG.yml` — `sensitive_resource_read` and `admin_safety_content_changed` metadata-only audit events.
- `.planning/phases/01-safety-privacy-policy-foundation/01-DEMO-DATA-POLICY.md` — `is_demo`, demo banner, demo badge, seed restrictions, and real-pilot warning.
- `.planning/phases/01-safety-privacy-policy-foundation/01-UI-SPEC.md` — Calming visual system, self-check labels, student copy tone, adult-view language, and demo indicator rules.

### Phase 2 Foundation

- `.planning/phases/02-identity-roles-links-demo-access/02-CONTEXT.md` — Auth/session, role, privacy gate, student-adult link, admin, demo, authorization, and audit decisions Phase 3 must consume.
- `.planning/phases/02-identity-roles-links-demo-access/02-07-SUMMARY.md` — Final verification baseline, Playwright setup, security regression patterns, and Phase 3 readiness.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `backend/app/db/models.py` — Existing SQLAlchemy model patterns for users, sessions, privacy acknowledgements, student-adult links, audit events, UUID primary keys, timestamps, `is_demo`, and JSONB audit metadata.
- `backend/app/core/authorization.py` — Deny-by-default role/relationship permission helper. It already recognizes `self_check_summary` for linked adults, but Phase 3 must extend student raw-answer/self-check permissions explicitly.
- `backend/app/services/audit.py` — Metadata validator already forbids raw self-check answer keys; reuse for sensitive reads and admin content changes.
- `backend/app/api/admin_users.py` and `backend/app/api/admin_links.py` — Admin route pattern: `_require_admin`, CSRF check for mutations, Pydantic request/response schemas, service-layer mutations.
- `backend/app/seeds/demo_seed.py` — Deterministic demo seed pattern gated by `ALLOW_DEMO_SEED=true`.
- `frontend/lib/api.ts` and `frontend/lib/admin-api.ts` — Cookie-auth API helpers with `credentials: "include"` and typed admin calls.
- `frontend/components/demo-banner.tsx`, `frontend/components/demo-badge.tsx`, and `frontend/components/empty-state.tsx` — Existing UI primitives for demo separation and empty states.
- `frontend/app/(authenticated)/student/page.tsx`, `teacher/page.tsx`, `parent/page.tsx`, and `admin/page.tsx` — Role dashboard patterns and authenticated data-fetching style.
- `frontend/app/(authenticated)/admin/users/page.tsx` and `admin/links/page.tsx` — Existing admin form/list/confirmation/error-handling patterns.

### Established Patterns

- Backend API routes live under `/api/...`; `main.py` includes routers with explicit prefixes.
- Protected frontend routes rely on backend cookie sessions, not frontend-stored tokens.
- Student privacy gate already returns `409 privacy_ack_required` before student dashboard access.
- Adult portals use linked-student lists and backend relationship checks; Phase 3 should add summary endpoints under the same role boundaries.
- Admin mutations require same-site mutation checks and metadata-only audit when sensitive or safety-related.
- Final verification should include backend pytest, frontend Vitest, and Playwright E2E over demo login flows.

### Integration Points

- Add self-check and scenario models/migrations beside existing identity models.
- Add student APIs for active tests, submit, result, self-check history/detail, scenarios, scenario attempts/history.
- Add teacher/parent APIs for linked-student self-check summaries only.
- Add admin APIs for test/scenario content management under `/api/admin/...`.
- Extend demo seed with test/scenario content and optional demo attempts while preserving `is_demo`.
- Extend student dashboard with quick actions for self-checks and scenarios; extend adult dashboards with permitted summary cards; extend admin dashboard with content-management entry points.

</code_context>

<specifics>

## Specific Ideas

- Seed two self-check tests: `Sức khỏe cảm xúc` and `Áp lực bạn bè`.
- Seed four scenarios: peer pressure/rủ rê, online teasing, friendship conflict, and grade/academic pressure.
- Keep score visible but secondary. The primary result experience is supportive message, state label, and next action.
- Adult language should use support wording like `tóm tắt được phép xem`, `gợi ý hỗ trợ`, and `học sinh cần được quan tâm`, not surveillance or ranking language.

</specifics>

<deferred>

## Deferred Ideas

- Self-check subscales and domain-level analytics.
- Critical-item auto-escalation that directly triggers safety workflow.
- Trend charts, exports, and aggregate reports.
- Adult access to raw self-check answers.
- Chatbot safety/content configuration.
- SOS workflow and in-app alert handling.

</deferred>

---

*Phase: 03-student-self-checks-scenarios-content-management*  
*Context gathered: 2026-05-21*
