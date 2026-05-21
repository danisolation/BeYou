# Phase 03: Student Self-Checks, Scenarios & Content Management - Research

**Researched:** 2026-05-21  
**Domain:** FastAPI + SQLAlchemy/Alembic content and attempt workflows, privacy-limited wellbeing summaries, Next.js role dashboards  
**Confidence:** HIGH for project/codebase integration; MEDIUM for external-library currency

## Summary

Phase 3 should be planned as four integrated workstreams:

1. Backend content/attempt domain for self-checks and scenarios.
2. Student self-check and scenario flows.
3. Teacher/parent summary-only self-check views.
4. Admin content lifecycle for tests, questions, choices, thresholds, scenarios, feedback, lessons, and skill tags.

The biggest implementation risk is preserving privacy boundaries while storing enough snapshots for student history and content edits. The primary recommendation is backend-first planning: models, services, authorization, audit, migrations, seed, and backend tests before frontend pages.

## User Constraints

### Locked Decisions

- Seed two active self-check tests: `Sức khỏe cảm xúc` and `Áp lực bạn bè`.
- Self-check answers are multiple-choice; each answer choice has a numeric score value.
- Backend sums selected choice values and maps total score to test-specific thresholds.
- Risk/state labels must be exactly: `On dinh`, `Can chu y`, `Nen tim ho tro`, and `Can ho tro som`.
- Thresholds are admin-editable per test, not global/code-only.
- Store raw self-check answers for student detail review only; teachers, parents, and admins do not see raw answers by default.
- Student result screen leads with supportive message, risk/state label, and next action; numeric score is secondary.
- Teacher/parent summary fields only: student context, date, test type, risk/state label, advice summary, and support suggestion.
- Adult history shows latest summary plus up to 5 recent summary-only attempts from the last 30 days.
- Every adult self-check summary read records metadata-only `sensitive_resource_read`.
- Scenario history is student-facing/private by default in Phase 3.
- Seed four scenarios: peer pressure/rủ rê, online teasing, friendship conflict, and grade/academic pressure.
- Scenario attempts must snapshot selected choice, feedback, recommended response, lesson, skill tag, timestamp, and `is_demo`.
- Content lifecycle is `draft`, `published`, `archived`; students only see published active content.
- Attempts/results retain snapshots after content edits.
- Prefer archive over hard delete; delete only unused drafts if audit intent is preserved.
- Admin content changes record metadata-only `admin_safety_content_changed`.

### Deferred Ideas

- Self-check subscales and domain-level analytics.
- Critical-item auto-escalation that directly triggers safety workflow.
- Trend charts, exports, and aggregate reports.
- Adult access to raw self-check answers.
- Chatbot safety/content configuration.
- SOS workflow and in-app alert handling.

## Phase Requirements

| ID | Planning support |
|---|---|
| TEST-01..TEST-06 | Requires content tables, student submit/history/detail APIs, summary-only adult APIs, authorization, and audit. |
| SCEN-01..SCEN-05 | Requires scenario content tables, student browse/choose/feedback/history APIs, and attempt snapshots. |
| ADMIN-02..ADMIN-03 | Requires admin content CRUD, lifecycle validation, publish/archive/delete-draft rules, and audit. |

## Standard Stack

| Area | Use | Status |
|---|---|---|
| Backend API | FastAPI routers + dependency auth/session pattern | Existing Phase 2 pattern |
| Schemas | Pydantic v2 `BaseModel`, `Field`, `field_validator` | Existing schema pattern |
| ORM | SQLAlchemy 2 mapped models | Existing `backend/app/db/models.py` pattern |
| Migrations | Alembic revision files | Existing `backend/alembic/versions` pattern |
| DB | PostgreSQL 16 via Docker Compose | Host port `15432` |
| Frontend | Next.js + React + TypeScript + Tailwind | Existing `frontend/` app |
| API helper | `apiFetch` with `credentials: "include"` | Existing `frontend/lib/api.ts` |
| Tests | pytest, Vitest, Playwright | Existing Phase 2 final verification stack |

Do not introduce a new content/admin library or third-party UI registry. Existing custom Tailwind components are the approved UI contract; shadcn is not initialized.

## Architecture Patterns

### Backend Structure

Use the existing route/service/schema style:

```text
backend/app/
├── db/models.py
├── schemas/self_checks.py
├── schemas/scenarios.py
├── services/self_checks.py
├── services/scenarios.py
├── api/student_self_checks.py
├── api/student_scenarios.py
├── api/adult_summaries.py
└── api/admin_content.py
```

### Data Model Recommendation

Use separate content and attempt tables:

- `self_check_tests`: title, description, status, is_active, is_demo, timestamps.
- `self_check_questions`: test_id, text, sort_order, is_demo.
- `self_check_choices`: question_id, text, score_value, sort_order, is_demo.
- `self_check_thresholds`: test_id, state_label, min_score, max_score, comment, advice, positive_content, suggested_next_action.
- `self_check_attempts`: student_id, test_id, score, state_label, summary fields, full test snapshot, is_demo, completed_at.
- `self_check_attempt_answers`: attempt_id, nullable question/choice ids for history, question_text_snapshot, choice_text_snapshot, score_value_snapshot.
- `scenarios`: title, situation, skill_tag, status, recommended_response, lesson, is_demo, timestamps.
- `scenario_choices`: scenario_id, text, signal, feedback, sort_order, is_demo.
- `scenario_attempts`: student_id, scenario_id, selected_choice_id, selected_choice_snapshot, feedback_snapshot, recommended_response_snapshot, lesson_snapshot, skill_tag_snapshot, is_demo, completed_at.

### Scoring Pattern

Plan a service function that:

1. Validates the test is published and all questions are answered.
2. Ensures every selected choice belongs to the submitted test.
3. Sums selected choice scores.
4. Finds exactly one matching threshold for the total.
5. Writes attempt + answer snapshots in one transaction.

### Authorization Pattern

Extend `require_permission` to explicitly allow:

- Student own `self_check_raw_answers` read/write for reflection.
- Linked teacher/parent `self_check_summary` read with `support_not_surveillance`.
- Admin `self_check_content` and `scenario_content` manage with `admin_operations`.

Do not rely on frontend route hiding; backend enforcement is required.

### Audit Pattern

Use existing `record_audit_event`; it already rejects forbidden metadata keys including raw self-check answer fields. Adult summary reads should call `sensitive_resource_read` with metadata similar to:

```python
{
    "student_id": str(student_id),
    "relationship_check": "linked_teacher|linked_parent",
    "purpose_key": "support_not_surveillance",
    "decision": "summary_only",
}
```

Admin content mutations should record `admin_safety_content_changed` with content type/id, change type, admin actor metadata, and `is_demo`; never include raw student answers or secrets.

## Frontend Integration

Add student routes:

- `/student/self-checks`
- `/student/self-checks/[testId]`
- `/student/self-checks/results/[attemptId]`
- `/student/self-checks/history`
- `/student/scenarios`
- `/student/scenarios/[scenarioId]`
- `/student/scenarios/history`

Add adult summary UI inside teacher/parent dashboards, preserving summary-only copy and visible privacy note.

Add admin dashboard entry card:

- Title: `Nội dung tự kiểm tra và tình huống`
- Description: `Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh theo đúng phạm vi an toàn.`

## Don’t Hand-Roll

| Problem | Don’t build | Use instead |
|---|---|---|
| Auth/session | Frontend tokens/localStorage | Existing HttpOnly cookie session + `apiFetch` |
| Authorization | UI-only role checks | `require_role` + `require_permission` |
| Audit sanitization | Ad hoc audit payloads | `record_audit_event` validator |
| Form validation | Untyped objects | Pydantic backend schemas and frontend typed helpers |
| Migrations | Manual DB edits | Alembic revisions |
| Content history | Joining mutable current content | Attempt snapshot fields |

## Common Pitfalls

1. **Leaking raw answers to adults/admins** — use distinct summary DTOs and never share answer tables in adult endpoints.
2. **Historical attempts changing after admin edits** — snapshot result copy, answers, feedback, lesson, and skill tag at attempt time.
3. **Publishing invalid content** — require questions, choices, scoring values, and non-overlapping thresholds for tests; scenarios need at least two choices and feedback.
4. **Audit metadata containing private data** — add tests for nested forbidden payloads and Phase 3 event types.
5. **Demo/real mixing** — propagate `is_demo` from seeded content/student to attempts, summaries, audit, and UI badges.

## Runtime State Inventory

| Category | Items found | Action required |
|---|---|---|
| Stored data | Existing users, sessions, links, audit events, privacy acknowledgements; no Phase 3 self-check/scenario models yet | Add Alembic migration; preserve existing tables |
| Live service config | PostgreSQL via Docker Compose | Run migration before seed/tests |
| Secrets/env vars | Demo seed gated by `ALLOW_DEMO_SEED`; frontend origin affects CSRF | Use existing env pattern |
| Build artifacts | Frontend `.next`, node_modules, backend caches are not source | No plan tasks beyond normal build/test |

## Demo Seed Strategy

Extend `backend/app/seeds/demo_seed.py` after demo users/links are created.

Seed:

- Two published self-check tests with complete questions, choices, and thresholds.
- Four published scenarios.
- At least one latest and multiple recent demo attempts for the demo student to verify adult “latest + 5 recent/30 days.”

Seed must be deterministic/idempotent and must not run unless `ALLOW_DEMO_SEED=true`.

## Verification Strategy

Formal Nyquist validation artifacts are skipped because `.planning/config.json` has `workflow.nyquist_validation: false`.

Plan these checks:

- Backend pytest for scoring, threshold gaps/overlaps, snapshot immutability, student-only raw detail, adult summary-only access, admin lifecycle, audit metadata, and demo flags.
- Frontend Vitest for critical UI helpers/components/forms and no-token-storage regression.
- Playwright E2E for demo student self-check submit/history, scenario attempt, teacher/parent summary-only view, and admin create/publish/archive content.
- Final sequence should mirror Phase 2: start Postgres, run Alembic, seed demo, run backend tests, frontend tests, and Playwright.

## Security Domain

| ASVS category | Applies | Phase 3 control |
|---|---|---|
| V2 Authentication | Yes | Existing cookie sessions |
| V3 Session Management | Yes | HttpOnly SameSite cookies; no token JSON |
| V4 Access Control | Yes | Role + relationship + purpose checks; summary-only adult access |
| V5 Input Validation | Yes | Pydantic schemas; publish validation |
| V6 Cryptography | Indirect | Existing password/session mechanisms; no new crypto |
| V7 Error Handling/Logging | Yes | No raw sensitive data in audit/log metadata |
| V8 Data Protection | Yes | Raw answers private; snapshots minimized for adult summaries |

## Open Questions (RESOLVED)

1. **Threshold editing UI:** RESOLVED: Use guided buckets with validation because labels are fixed.
2. **Demo attempts:** RESOLVED: Seed attempts for at least one self-check and enough records to exercise latest + recent adult summary behavior.
3. **Admin student-result views:** RESOLVED: Do not build admin student-result views in Phase 3; admin content management is in scope, admin result reporting is Phase 6.

## Key Findings

- Backend privacy boundaries are already prepared but must be extended for student raw-answer permissions and admin content resources.
- Existing audit service already blocks raw self-check answer metadata keys; reuse it for adult reads and admin content changes.
- Snapshotting is mandatory for both self-check attempts and scenario attempts to prevent admin edits from altering history.
- UI contract is strict: no shadcn/third-party registry blocks, calm Tailwind UI, exact Vietnamese copy for many states.
- Verification should extend Phase 2’s pytest/Vitest/Playwright sequence rather than introduce a new test stack.
