# Phase 19 UI Spec: Demo/Pilot Operations Readiness

**Created:** 2026-05-22
**Status:** Implemented

## Surfaces

- Admin operations dashboard
- Admin operations API helper/types
- Production smoke command output

## UX Requirements

- Admins can see demo seed readiness, connectivity/session contract, smoke checklist, readiness, SOS email metadata, v1.2 support metadata, and audit metadata in one place.
- Demo seed readiness must show role presence/active/demo status, active demo links, and published walkthrough content counts.
- Connectivity copy must explain health paths, credentialed CORS methods, and cookie configuration without exposing cookie values or secrets.
- Smoke checklist must show the exact command and what it verifies.
- Existing metadata-only privacy boundary copy and no-export/no-drilldown behavior must remain visible.

## Responsive Contract

- New operations panels use existing card/grid patterns and wrap on mobile.
- Role readiness cards and count cards stay touch-friendly and avoid fixed widths.
- Long demo emails and commands wrap safely inside cards.

## Privacy/Safety Contract

- No raw SOS notes, self-check answers, chatbot transcripts, private mood notes, credentials, cookie values, secrets, exports, or student risk drilldowns.
- Operations fields may include public demo emails, counts, statuses, health paths, origin counts, and cookie name/config metadata only.
- Production smoke output may say a session cookie was issued, but must never print the cookie value.
