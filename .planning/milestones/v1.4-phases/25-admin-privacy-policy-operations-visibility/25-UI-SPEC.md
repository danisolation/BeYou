# Phase 25 UI Spec: Admin Privacy Policy & v1.4 Operations

**Status:** Approved for autonomous implementation
**Date:** 2026-05-25

## Surfaces

- New admin policy page: `/admin/privacy-policy`
- Existing admin dashboard: `/admin`
- Existing operations page: `/admin/operations`

## User Goal

Admins should be able to verify and adjust v1.4 safe defaults without touching raw student content. They should also see whether the consent/reminder/sharing/reason-access systems are operational using counts/statuses only.

## Admin Policy Page States

1. **Loading:** `Đang tải chính sách riêng tư...`
2. **Loaded:** show safe defaults form and privacy boundary copy.
3. **Saving:** disable save button and show `Đang lưu...`.
4. **Saved:** show success copy.
5. **Error:** show non-sensitive error copy.

## Required Controls

- Toggle default in-app reminders.
- Quiet-hour start/end time inputs.
- Timezone text input defaulting to `Asia/Ho_Chi_Minh`.
- Read-only channel boundary cards showing in-app active and external channels deferred.
- Toggle note sharing availability.
- Toggle reason required for adult support summaries.
- Toggle reason required for shared mood notes.
- Controlled reason-code checkboxes with safe Vietnamese labels.
- Save button.

## Required Copy

- State that v1.4 reminders are in-app only.
- State external Zalo/SMS/push/email delivery is deferred.
- State reason prompts are for transparency and do not expand access.
- State operations are metadata-only and not for student surveillance.

## Operations Additions

- Show a `v1.4 privacy controls` panel with audit buckets for:
  - notification preferences
  - mood reminders
  - mood-note sharing
  - shared mood-note reads
  - adult support summary / reason-gated access
  - privacy policy controls
- Demo seed card should include v1.4 metadata counts for policy, consent preferences, reminder state, and share samples.

## Forbidden UI

- No raw notes, student summaries, raw reason text, names, emails, contact identifiers, risk ranking, exports, downloads, or per-student drilldown links.
- No control to enable external reminder channels in v1.4.
- No free-text reason option editor.

## Acceptance

- Frontend tests prove the policy page loads, saves safe defaults, rejects rendering forbidden raw fields, and dashboard links to the new page.
- Frontend tests prove operations renders v1.4 metadata buckets without sensitive fields or export/drilldown controls.

