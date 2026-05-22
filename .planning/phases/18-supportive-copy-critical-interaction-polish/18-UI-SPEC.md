# Phase 18 UI Spec: Supportive Copy & Critical Interaction Polish

**Created:** 2026-05-22
**Status:** Implemented

## Surfaces

- Student dashboard SOS card and confirmation panel
- Student support plan, mood check-in, and chatbot pages
- Teacher/parent dashboards and self-check/SOS support summaries
- Admin users, links, content, chatbot config, and mood check-in config pages
- Shared admin destructive confirmation dialog

## UX Requirements

- Student copy must remain Vietnamese, supportive, non-clinical, and easy to understand.
- Adult copy must reinforce that summaries are for support, not surveillance, ranking, or pressure.
- Admin copy must reinforce metadata/privacy boundaries and safe lifecycle operations.
- Critical actions must show clear consequences before confirmation and a visible outcome after completion.
- Error states must be visible and announced with alert semantics where appropriate.

## Responsive Contract

- New copy and status messages must wrap within existing card widths.
- Confirmation dialogs remain mobile-friendly with stacked buttons on small screens.
- Outcome messages use existing rounded card/label patterns and do not introduce new fixed-width elements.

## Privacy/Safety Contract

- No copy change may expand access to raw self-check answers, raw mood notes, chatbot transcripts, credentials, exports, or per-student risk rankings.
- SOS copy must clearly state BeYou does not call external emergency services automatically.
- Adult/admin copy must frame data as privacy-limited support context, not monitoring.
- Destructive/admin lifecycle confirmations must explain consequences without exposing private student content.
