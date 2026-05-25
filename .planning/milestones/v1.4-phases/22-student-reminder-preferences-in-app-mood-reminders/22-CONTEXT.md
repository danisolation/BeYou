# Phase 22: Student Reminder Preferences & In-App Mood Reminders - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Autonomous; user delegated implementation decisions to agent.

<domain>

## Phase Boundary

Students need consent-first in-app mood check-in reminders with quiet hours, pause/resume, and non-clinical copy. This phase must not add Zalo/SMS/push/email delivery, automatic SOS, adult reminder notifications, or risk scoring.

</domain>

<decisions>

## Implementation Decisions

- Use request-time computed in-app reminders, not a background worker or provider.
- Keep reminder settings student-owned and default off.
- Represent external channels as deferred/unavailable and reject them server-side.
- Treat reminder dismissal/snooze/open as safe metadata-only events.
- Add a dedicated student settings page and dashboard reminder card.

</decisions>

<code_context>

## Existing Code Insights

- Phase 21 added backend models and service contracts for preferences/reminder state.
- Existing student mood check-in flow already guarantees no automatic SOS/adult notification from check-ins.
- Existing frontend uses client components with `apiFetch` and local state.
- Student dashboard is the right place for in-app reminder cards.

</code_context>

<specifics>

## Specific Requirements Covered

- **NOTIF-02..NOTIF-04:** Student can enable/disable, configure quiet hours, and pause/resume in-app reminders.
- **REMIND-01..REMIND-05:** Reminder due state, dismiss/snooze/open actions, no-auto-SOS invariant, supportive copy, and safe audit metadata.

</specifics>

<deferred>

## Deferred to Later v1.4 Phases

- Selective private mood-note sharing is Phase 23.
- Reason-gated adult protected access is Phase 24.
- Admin policy UI/operations readiness is Phase 25.

</deferred>
