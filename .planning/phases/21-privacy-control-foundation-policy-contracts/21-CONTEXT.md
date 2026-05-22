# Phase 21: Privacy Control Foundation & Policy Contracts - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Autonomous; user delegated implementation decisions to agent.

<domain>

## Phase Boundary

Establish backend data contracts, audit safeguards, authorization resource types, and safe defaults for v1.4 consent, reminders, sharing, and reason policies. This phase is a foundation phase: no full student reminder UI or adult note-sharing UX yet.

</domain>

<decisions>

## Implementation Decisions

- Keep v1.4 reminders in-app only; reject external Zalo/SMS/push/email activation.
- Add database-backed models for student reminder preferences, reminder state, school policy defaults, and mood-note share grants.
- Use controlled reason codes instead of free-text reasons.
- Extend metadata-only audit protections before any new write/read paths can store sensitive text.
- Add authorization resource recognition without granting admin/adult raw private-note access.

</decisions>

<code_context>

## Existing Code Insights

- `backend/app/db/models.py` already stores mood check-ins, private notes, audit events, and admin mood config.
- `backend/app/core/authorization.py` is the central role/relationship gate.
- `backend/app/services/audit.py` rejects forbidden sensitive metadata keys recursively.
- `backend/app/services/admin_operations.py` sanitizes audit metadata again before admin display.
- Existing tests use SQLAlchemy models, API client fixtures, and metadata privacy regression patterns.

</code_context>

<specifics>

## Specific Requirements Covered

- **NOTIF-01:** Student reminder preference state contract exists with enabled/disabled, quiet hours, timezone, pause, and channel boundaries.
- **NOTIF-05:** External reminder channels are contractually rejected/deferred in API/schema helpers.

</specifics>

<deferred>

## Deferred to Later v1.4 Phases

- Phase 22 will add actual student preference/reminder API routes and frontend UI.
- Phase 23 will implement note sharing behavior.
- Phase 24 will enforce reason-gated adult access routes.
- Phase 25 will add admin policy UI/operations readiness.

</deferred>
