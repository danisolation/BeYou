# Phase 25: Admin Privacy Policy & Operations Visibility - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Autonomous; user delegates design decisions to AI

<domain>
## Phase Boundary

Phase 25 lets admins configure v1.4 school privacy defaults and inspect metadata-only operations/readiness for reminder consent, in-app reminders, mood-note sharing, reason-gated adult access, and policy updates. It must not add external notification delivery, raw-note exposure, exports, per-student drilldowns, or surveillance workflows.

</domain>

<decisions>
## Implementation Decisions

### Admin Policy Contract
- Add admin-only read/update endpoints for the existing `SchoolPrivacyPolicyDefault` model.
- Reuse `SchoolPrivacyPolicyDefaultsResponse` and `SchoolPrivacyPolicyDefaultsUpdate`.
- Forbid unknown policy update fields so raw-note exposure toggles cannot be silently accepted.
- Validate v1.4 remains in-app-only: `allowed_channels` normalizes to `["in_app"]`, and `external_channels_enabled=True` is rejected.
- Keep reason choices controlled by existing `ALLOWED_REASON_CODES`; no free-text reason options.

### Admin UI
- Add `/admin/privacy-policy` page and admin dashboard entry.
- Show current safe defaults, deferred external channels, quiet-hour defaults, sharing/reason toggles, and allowed reason choices.
- Copy must emphasize metadata-only operations and support-not-surveillance boundaries.
- Do not show names, emails, student identifiers, raw notes, raw reasons, or export controls.

### Operations Visibility
- Extend the existing operations dashboard instead of creating a new surface.
- Render v1.4 audit buckets already returned by backend and expand demo seed readiness with v1.4 policy/preference/reminder/share counts.
- Keep existing audit sanitizer and add tests for raw reason/private-content exclusions.

### Demo Seed / Readiness
- Seed a demo school policy, demo student notification preference, reminder state, and a sample student-summary mood-note share.
- The demo share uses synthetic demo support copy only and is surfaced in operations as counts, not content.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/app/db/models.py` already defines `SchoolPrivacyPolicyDefault`, `StudentNotificationPreference`, `MoodCheckinReminderState`, and `MoodNoteShare`.
- `backend/app/schemas/privacy_controls.py` already defines policy response/update schemas, channel validators, and controlled reason codes.
- `backend/app/services/privacy_controls.py` already exposes `get_or_create_school_privacy_policy`, `school_policy_response`, and `assert_admin_can_manage_privacy_policy`.
- `backend/app/services/admin_operations.py` already builds metadata-only readiness, demo seed, audit, and v1.4 buckets.
- `frontend/app/(authenticated)/admin/operations/page.tsx` already renders operations metadata and audit filters.

### Integration Points
- Add backend router under `/api/admin/privacy-policy`.
- Add frontend API helper in `frontend/lib/admin-privacy-policy-api.ts`.
- Add admin page at `frontend/app/(authenticated)/admin/privacy-policy/page.tsx`.
- Extend admin dashboard card list and operations UI type/rendering.

</code_context>

<deferred>
## Deferred Ideas

- Multi-school policy selection remains out of scope; Phase 25 edits the default single-school policy.
- External Zalo/SMS/push/email reminder delivery remains deferred.
- Student-facing access timeline remains future work.
- Raw exports and per-student drilldowns remain explicitly out of scope.

</deferred>

