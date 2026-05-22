# Phase 12: Trusted Adult Support Plan - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 12 adds student-owned trusted adult support plans. Students can select from existing linked adults, describe shareable support preferences, understand what selected adults may view, and pause/deactivate the plan. This phase owns student support-plan backend/domain, student UI, authorization, and metadata-only audit. Adult summary consumption belongs to Phase 14.

</domain>

<decisions>
## Implementation Decisions

### Student Ownership and Sharing
- Support plans are owned by the student and can only select already-active linked adults.
- Fields are explicitly shareable support preferences, not private notes: what helps, what does not help, preferred contact style, safe contact times, and an optional shareable note.
- Students see clear Vietnamese copy that the selected adults can view the plan later, while mood private notes and raw self-check/chat content stay private by default.
- Pause/deactivate changes status while preserving historical metadata and audit context.

### Backend
- Add `student_support_plans` and `student_support_plan_adults` tables with lifecycle status, timestamps, demo flag, and linked adult selections.
- Add student-only support-plan APIs under `/api/student/support-plan`.
- Validate selected adult IDs against active `StudentAdultLink` rows for the student.
- Emit metadata-only audit events with status, selected adult count, selected roles, and field presence flags only.

### Frontend
- Add `/student/support-plan` page reachable from the student dashboard.
- Use existing card/form styling and cookie-authenticated API helpers.
- Show linked adults as selectable options and disable save with supportive copy when no linked adults exist.
- Keep the UI calm, non-clinical, and explicit about sharing boundaries.

### Tests
- Backend tests cover create/update/deactivate, linked-adult validation, student-only access, and metadata-only audit.
- Frontend tests cover dashboard entry, privacy copy, selected adults, save request body, and no token storage.

### the agent's Discretion
- Exact field labels and helper copy can follow existing BeYou tone.
- A single current support plan per student is enough for v1.2.
- No reminders, adult detail pages, exports, or external notifications in this phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/api/student.py` already exposes student profile and linked adults.
- `StudentAdultLink`, `LinkStatus`, and `UserRole` model existing student-adult relationships.
- `record_audit_event` rejects forbidden sensitive metadata keys.
- `frontend/app/(authenticated)/layout.tsx` already gates `/student/*` before child rendering when privacy acknowledgement is required.
- Student dashboard cards use rounded white cards, `text-heading`, `text-body`, `text-label`, and accent links.

### Established Patterns
- Backend routers are mounted from `main.py` with `/api/...` prefixes; sub-router paths should not double-prefix `/api`.
- Mutating cookie-authenticated requests use `require_same_site_mutation`.
- Frontend API helpers use `apiFetch` with `credentials: include`.
- Tests create isolated users and clear dependent tables manually.

### Integration Points
- Add support-plan models to `backend/app/db/models.py` and Alembic migration.
- Add `backend/app/schemas/support_plan.py`, `backend/app/services/support_plan.py`, and `backend/app/api/student_support_plan.py`.
- Mount router in `backend/app/main.py` under `/api/student/support-plan`.
- Add `frontend/lib/support-plan-api.ts`, `frontend/app/(authenticated)/student/support-plan/page.tsx`, and a student dashboard entry card.

</code_context>

<specifics>
## Specific Ideas

- Status values: `active`, `paused`, `deactivated`.
- Shareable support fields: `what_helps`, `what_does_not_help`, `preferred_contact_method`, `safe_contact_times`, `shareable_note`.
- Audit metadata should include booleans like `has_what_helps` instead of text values.

</specifics>

<deferred>
## Deferred Ideas

- Adult-facing support summary rendering is Phase 14.
- Mood check-ins are Phase 13.
- Reminders, external notifications, counselor handoff, and raw note sharing remain future scope.

</deferred>
