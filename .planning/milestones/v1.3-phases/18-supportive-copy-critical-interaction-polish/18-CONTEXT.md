# Phase 18: Supportive Copy & Critical Interaction Polish - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Autonomous defaults selected by agent

<domain>
## Phase Boundary

Polish existing student, adult, and admin surfaces so copy is clearer, supportive, Vietnamese, non-clinical, and privacy-limited. Improve critical interactions by making confirmations explain consequences and by showing explicit success/error outcome states after SOS, account/link/content/config changes.

</domain>

<decisions>
## Implementation Decisions

- Preserve all existing privacy defaults and authorization surfaces.
- Add copy inline on the surfaces users already touch rather than introducing new flows.
- Use accessible `role="status"` for success/outcome messages and `role="alert"` for blocking errors.
- Strengthen destructive confirmation dialogs with additional consequence text and disabled in-progress states.
- Keep student-facing copy supportive and non-clinical; keep adult/admin copy support-not-surveillance.

</decisions>

<code_context>
## Existing Code Insights

- Student SOS already required explicit confirmation but did not show a durable success outcome after submit.
- Teacher SOS updates changed state but did not announce the outcome.
- Admin destructive operations used a shared `DestructiveConfirmDialog` with exact confirmation strings but no supporting consequence text or in-progress disabled state.
- Adult self-check summary copy contained a rough placeholder line that could be more clearly framed as support, not surveillance.
- Admin content/config pages already contained strong privacy boundaries but needed clearer outcome states after saves/publishes/lifecycle changes.

</code_context>

<specifics>
## Specific Ideas

- Add student SOS success copy that explains who sees the signal and what to do if immediate safety is at risk.
- Add privacy copy in SOS confirmation that only the optional SOS note is sent.
- Add teacher SOS outcome state after status update and clarify notes are for support progress only.
- Add status/alert semantics and outcome messages to support plan, mood check-in, admin users, admin links, admin content, chatbot config, and mood config pages.
- Add regression coverage for SOS confirmation/outcome, teacher SOS outcome, admin revoke consequences, and adult support-not-surveillance framing.

</specifics>

<deferred>
## Deferred Ideas

- Full copy review with school counselors and students.
- Centralized toast system.
- Per-action audit reason prompts for sensitive adult/admin access.

</deferred>
