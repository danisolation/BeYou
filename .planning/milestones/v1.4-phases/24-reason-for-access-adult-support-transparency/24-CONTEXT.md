# Phase 24: Reason-for-Access & Adult Support Transparency - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Autonomous; user delegates design decisions to AI

<domain>
## Phase Boundary

Phase 24 adds controlled reason-for-access prompts before protected teacher/parent support-summary and shared mood-note reads when school policy requires it. The phase must preserve existing role and active relationship authorization, keep reason choices controlled rather than free-text, and audit allowed, denied, and missing-reason attempts as metadata only.

</domain>

<decisions>
## Implementation Decisions

### Reason Gate Contract
- Use existing `SchoolPrivacyPolicyDefault.reason_required_for_adult_summaries`, `reason_required_for_shared_mood_notes`, and `allowed_reason_codes` from Phase 21.
- Require a `reason_code` query parameter on adult support-summary GET routes when policy requires a reason.
- Return HTTP 428 with safe allowed reason options when a linked adult omits a required reason; return 422 for invalid/disallowed reason codes.
- Do not add free-text reason input, persistence tables, or student-facing access timeline in Phase 24.

### Authorization Boundary
- Validate role and active relationship before reason-gated content is returned.
- A valid reason never bypasses `require_permission`, active relationship, route role, or active `MoodNoteShare` grants.
- Denied authorization attempts with a supplied reason are audited as metadata-only denial events without leaking whether private content exists.

### Audit and Privacy
- Add metadata-only `adult_access_reason_checked` audit events for allowed, denied, and missing reason attempts.
- Audit safe keys only: `student_id`, `actor_role`, `resource_type`, `relationship_check`, `reason_code`, `reason_required`, allowed reason count, and decision/status flags.
- Never audit raw mood notes, student summaries, support-plan text, reason free text, names, emails, contact identifiers, or private content.

### Adult UI
- Adult support summary first tries the existing summary endpoint; if the API returns reason-required, show a compact Vietnamese reason prompt with controlled radio choices.
- Copy frames the prompt as transparency and support context, not discipline, surveillance, diagnosis, or compliance.
- Do not render protected support plan, mood trend, or shared mood-note content until the reason is accepted by the backend.

### the agent's Discretion
- Choose supportive Vietnamese labels for existing allowed reason codes.
- Keep the UI lightweight and in-page rather than adding a separate route or modal.
- Reuse existing adult support-summary page and API client patterns.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/db/models.py` already defines `SchoolPrivacyPolicyDefault` with reason-required booleans and allowed reason codes.
- `backend/app/schemas/privacy_controls.py` already defines `ALLOWED_REASON_CODES` and `normalize_reason_codes`.
- `backend/app/services/privacy_controls.py` already exposes `get_or_create_school_privacy_policy` and `validate_access_reason_code`.
- `backend/app/services/adult_summaries.py` owns adult support-summary reads and calls `list_active_shared_notes_for_adult`.
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx` is shared by teacher and parent pages.

### Established Patterns
- Backend adult summary routes use cookie auth, route role checks, `require_permission`, relationship-bound service reads, and metadata-only audit.
- Frontend API calls use `apiFetch` and throw `ApiError` with parsed JSON detail on non-2xx responses.
- Existing UI copy uses rounded cards, supportive Vietnamese text, and privacy boundary sections.

### Integration Points
- Add `reason_code` query support to `/api/teacher/students/{student_id}/support-summary` and `/api/parent/students/{student_id}/support-summary`.
- Add access-reason metadata to `AdultSupportSummaryResponse`.
- Pass the accepted reason into active shared-note reads so shared-note read audit includes the safe reason code.

</code_context>

<specifics>
## Specific Ideas

No user-specified alternatives; proceed with privacy-first defaults and existing codebase conventions.

</specifics>

<deferred>
## Deferred Ideas

- Admin UI to configure reason policy remains Phase 25.
- Student-facing access timeline remains a future requirement.
- Free-text reasons remain out of scope for v1.4.

</deferred>
