# Phase 14: Adult Support Summaries - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 14 gives linked teachers and parents privacy-preserving summaries that combine the student-approved support plan and recent mood trend context. It must not expose raw mood private notes, raw check-in details, chatbot transcripts, self-check answers, exports, leaderboards, or surveillance-style drilldowns.

</domain>

<decisions>
## Implementation Decisions

- Adult access is relationship-gated through existing active `StudentAdultLink` authorization.
- Support-plan details are shown only when the adult is selected in the active student support plan.
- Mood information is summary-only: latest trend, recency/counts, high-concern count, and supportive next action.
- Adult UI copy stays supportive and avoids diagnosis, discipline, monitoring, and risk ranking language.
- Unauthorized/wrong-role access returns denial without revealing raw sensitive resource details.

</decisions>

<code_context>
## Existing Code Insights

- `backend/app/services/adult_summaries.py` already handles linked adult self-check summaries.
- `backend/app/api/adult_summaries.py` already routes teacher/parent student summary endpoints.
- Phase 12 added `StudentSupportPlan` and selected adult records.
- Phase 13 added `MoodCheckIn` student-owned history.
- Frontend teacher/parent dashboards already list linked students and summary links.

</code_context>

<specifics>
## Specific Ideas

- Add `/api/teacher/students/{student_id}/support-summary`.
- Add `/api/parent/students/{student_id}/support-summary`.
- Add shared adult support summary frontend page component and teacher/parent routes.
- Return:
  - student context;
  - support-plan summary for selected adult only;
  - mood trend summary without private notes;
  - privacy notes.

</specifics>

<deferred>
## Deferred Ideas

- Admin/operations metadata closure is Phase 15.
- Raw note sharing by explicit student consent remains future scope.
- Exports and risk leaderboards remain out of scope.

</deferred>
