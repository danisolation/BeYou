# Phase 15: Admin Configuration & Metadata Operations Closure - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning  
**Mode:** Smart discuss auto-approved per autonomous milestone execution

<domain>
## Phase Boundary

Phase 15 closes v1.2 by adding admin-managed mood check-in configuration and verifying all new support-plan, mood-check-in, and adult-summary surfaces remain role-gated, privacy-gated, and metadata-only for admin/operations views.

</domain>

<decisions>
## Implementation Decisions

- Admin config manages labels/helper copy/guidance and lifecycle for controlled mood/context keys; it does not add arbitrary raw data fields.
- Published config validation blocks missing options and unsafe clinical/surveillance language.
- Student options use the latest published admin config when available, otherwise fallback to the Phase 13 static defaults.
- Operations visibility remains audit-metadata-only and does not expose private notes, raw answers, raw check-in details, exports, leaderboards, or student drilldowns.
- Phase 15 completes SAFE-01 through SAFE-04 through regression tests and explicit verification artifacts.

</decisions>

<code_context>
## Existing Code Insights

- Admin dashboard already links users, links, content, chatbot, reports, and operations pages.
- Admin operations service already sanitizes audit metadata and supports filtering.
- Phase 13 mood options are static in `app.services.mood_checkins`.
- Existing admin content patterns use same-site mutation checks and metadata-only audit.

</code_context>

<specifics>
## Specific Ideas

- Add `MoodCheckInConfig` model and migration.
- Add `/api/admin/mood-checkins/configs` list/create/update/preview endpoints.
- Add admin UI `/admin/mood-checkins`.
- Add operations dashboard support/mood/admin-config audit buckets.
- Add tests for admin validation, preview, operations privacy, route privacy gating, raw-note exclusion, and no-auto-SOS.

</specifics>

<deferred>
## Deferred Ideas

- Full tenant policy customization.
- Arbitrary prompt builders.
- Reminder delivery providers.
- Exports and risk leaderboards remain out of scope.

</deferred>
