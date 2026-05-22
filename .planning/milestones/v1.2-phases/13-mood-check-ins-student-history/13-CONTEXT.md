# Phase 13: Mood Check-ins & Student History - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 13 adds lightweight, non-clinical student mood check-ins and student-owned history. Students can submit mood, energy, stress, context tags, and an optional private note. The system preserves each submission with timestamps, returns supportive trend labels, and can suggest support-plan/SOS next steps without automatically notifying adults or creating SOS alerts.

</domain>

<decisions>
## Implementation Decisions

- Student-owned only in this phase; adult summaries consume privacy-preserving aggregates in Phase 14.
- Mood inputs are controlled, non-diagnostic labels; no AI scoring or clinical classification.
- Optional private note stays student-only by default and is excluded from audit metadata.
- Repeat same-day submissions are preserved as independent timestamped entries.
- High-concern check-ins show trusted-adult/support-plan/SOS guidance, but do not create SOS alerts or notify adults.
- Static prompts/options are acceptable for Phase 13; admin-managed configuration belongs to Phase 15.

</decisions>

<code_context>
## Existing Code Insights

- Student routes are privacy-ack gated and mounted from `backend/app/main.py`.
- Support-plan Phase 12 added `student_private_support` permission handling and support-plan student UI patterns.
- SOS APIs already exist and should remain explicit; Phase 13 must not call SOS create endpoints.
- Student dashboard already has entry cards and can add mood check-in/history links.

</code_context>

<specifics>
## Specific Ideas

- Model: `MoodCheckIn`.
- Fields: `mood_label`, `energy_level`, `stress_level`, `context_tags`, `private_note`, `trend_label`, `supportive_message`, `suggested_next_action`, `suggest_support_plan`, `suggest_sos`, timestamps, demo flag.
- API:
  - `GET /api/student/mood-check-ins/options`
  - `POST /api/student/mood-check-ins`
  - `GET /api/student/mood-check-ins/history`
- UI:
  - `/student/mood-check-ins`
  - `/student/mood-check-ins/history`

</specifics>

<deferred>
## Deferred Ideas

- Adult summaries over mood trends are Phase 14.
- Admin prompt/guidance management is Phase 15.
- Reminders, external notifications, exports, AI risk scoring, and automatic SOS remain out of scope.

</deferred>
