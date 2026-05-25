# Phase 23: Selective Mood-Note Sharing & Revocation - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Mode:** Auto-selected decisions; user delegated design and implementation choices to the agent.

<domain>

## Phase Boundary

Students can selectively share an existing private mood check-in note, or a student-authored summary derived from that check-in, with chosen currently linked adults. Students can later revoke access. Adult reads must require both an active relationship and an active student-created share grant, and all share/read/revoke audit must remain metadata-only.

</domain>

<decisions>

## Implementation Decisions

### Share Scope and Student Control
- **D-01:** Sharing starts from the student's own mood history, only for check-ins that include a private note or an explicitly entered student summary.
- **D-02:** The default share scope is private-note sharing for the selected check-in; optional student-authored summary is supported as a second scope without auto-generating clinical interpretations.
- **D-03:** Students choose one or more currently linked adults from the same linked-adult source used by support plans; stale or revoked relationships are rejected server-side.
- **D-04:** Re-sharing an already-active check-in/adult pair should be idempotent or update the selected scope/summary safely, not create duplicate active grants.

### Preview, Confirmation, and Copy
- **D-05:** The student UI must show a confirmation preview naming each selected adult, what exact content will be shared, what remains private, and how to revoke later.
- **D-06:** Copy stays Vietnamese, supportive, consent-first, and non-clinical: sharing helps a trusted adult listen, not diagnose, discipline, rank risk, or monitor compliance.
- **D-07:** Empty states should guide the student to create a mood check-in or add a private note, without pressuring them to share.
- **D-08:** Revocation should be visible next to active shares in mood history and should clearly say the adult will lose access after revocation.

### Adult Read Boundary
- **D-09:** Adults get a dedicated shared mood-note read surface/API; existing adult mood trend summaries stay summary-only unless an active share grant exists.
- **D-10:** Adult reads require role check, active relationship, and active `MoodNoteShare`; a relationship alone must not reveal private note or student summary text.
- **D-11:** Adult UI should present shared notes as student-consented context with support-not-surveillance reminders and no per-student risk scoring or raw mood-history expansion.
- **D-12:** Revoked shares disappear from adult read responses immediately; historical audit may show metadata statuses only.

### Audit and Privacy Invariants
- **D-13:** Share, read, and revoke audits must include only safe metadata such as share id, student id, adult id, scope, status, relationship type, and content flags/counts.
- **D-14:** Audit metadata must never include `private_note`, `student_summary`, raw note text, summary text, free-text reasons, or contact identifiers.
- **D-15:** This phase must not create SOS alerts, adult notifications, external messages, risk scores, or background delivery.
- **D-16:** Backend tests must explicitly prove revoked adults cannot read content and unrelated linked adults cannot read unshared notes.

### the agent's Discretion
- Exact component factoring, endpoint naming, form layout, loading states, and whether active shares are shown inline per check-in or as a nested card are delegated to the agent, provided the privacy and confirmation decisions above hold.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone requirements and phase scope
- `.planning/ROADMAP.md` — Phase 23 goal, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` — SHARE-01 through SHARE-05 acceptance criteria and v1.4 out-of-scope boundaries.
- `.planning/phases/21-privacy-control-foundation-policy-contracts/21-CONTEXT.md` — Locked v1.4 privacy-control foundation decisions.
- `.planning/phases/22-student-reminder-preferences-in-app-mood-reminders/22-CONTEXT.md` — Locked in-app-only, no-auto-SOS/adult-alert, metadata-only audit decisions.

### Existing implementation anchors
- `backend/app/db/models.py` — `MoodCheckIn`, `MoodNoteShare`, `StudentAdultLink`, and v1.4 privacy-policy models.
- `backend/app/core/authorization.py` — Existing role, relationship, and `shared_mood_note` permission boundaries.
- `backend/app/services/mood_checkins.py` — Student-owned mood check-in history and current private-note audit behavior.
- `backend/app/services/adult_summaries.py` — Adult summary-only support boundary and mood-trend behavior.
- `backend/app/services/support_plan.py` — Existing linked-adult selection and validation pattern.
- `backend/app/services/privacy_controls.py` — v1.4 audit/privacy helpers and policy defaults.
- `frontend/app/(authenticated)/student/mood-check-ins/history/page.tsx` — Student mood history surface where sharing controls should attach.
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx` — Shared adult support UI pattern reused by parent route.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets
- `MoodNoteShare` already stores check-in id, student id, adult id, relationship snapshot, scope, optional `student_summary`, timestamps, and revoked metadata.
- `support_plan._active_linked_adult_rows()` and `_validate_selected_adults()` provide the linked-adult validation pattern to reuse or extract.
- `MoodCheckInHistoryResponse` and frontend `MoodCheckIn` types provide the current student history contract that can be extended with share state.
- `AdultSupportSummaryDetail` provides adult privacy-note/card patterns that can host or link to shared note content.

### Established Patterns
- Backend routes are mounted in `main.py` with `/api` prefix; child routers must not double-prefix `/api`.
- Student mutation routes require same-site mutation protection and privacy acknowledgement.
- Adult reads use teacher/parent route pairs, active relationship checks, summary-only copy, and metadata-only audit.
- Frontend data fetching uses `apiFetch`, local `useEffect` state, `EmptyState`, `DemoBadge`, rounded cards, and Vietnamese copy.
- Tests create isolated demo users/links and assert both allowed and denied privacy boundaries.

### Integration Points
- Student share APIs should integrate near `/api/student/mood-check-ins` or a clearly related student mood-note-share router.
- Adult read APIs should integrate with `/api/teacher/students/{student_id}/...` and `/api/parent/students/{student_id}/...` patterns.
- Student mood history should fetch active share state, display share/revoke controls, and refresh after mutations.
- Adult teacher/parent support-summary pages should show shared mood notes only from active grants.

</code_context>

<specifics>

## Specific Ideas

- Keep the share action anchored to a specific check-in card so the student always knows exactly what will be shared.
- Include preview text and a "what stays private" reminder before saving a share.
- Use active relationship labels from existing link snapshots so students can identify selected adults without exposing new contact details in audit.
- Preserve the existing adult mood trend summary as aggregate-only; add shared content as a clearly separate consented section.

</specifics>

<deferred>

## Deferred Ideas

- Reason-for-access prompts before adult reads are Phase 24, not Phase 23.
- Admin policy controls and operations buckets for share/read/revoke are Phase 25.
- External notification to adults when a note is shared is out of scope for v1.4.
- Full access timeline or counselor handoff remains future work unless later roadmap phases add it.

</deferred>

---

*Phase: 23-selective-mood-note-sharing-revocation*
*Context gathered: 2026-05-22*
