---
phase: 13-mood-check-ins-student-history
artifact: ui-spec
status: ready
created: 2026-05-22
---

# Phase 13 UI Spec: Mood Check-ins & Student History

## Screens

- `/student/mood-check-ins`
- `/student/mood-check-ins/history`

## Purpose

Give students a private, low-friction place to notice how they are doing and choose a safe next step.

## Quality Bar

- Non-clinical, supportive Vietnamese copy.
- Explicitly says optional notes are private by default.
- SOS is presented as an explicit student action only.
- No diagnosis, risk score, adult alert, leaderboard, or export.

## Check-in Form

1. Hero/privacy card.
2. Mood radio choices.
3. Energy and stress controls.
4. Context tag checkboxes.
5. Optional private note textarea.
6. Submit button.
7. Result card with trend label, supportive message, suggested next action, and links to support plan/SOS dashboard when relevant.

## History

1. Timestamped list sorted newest first.
2. Mood/energy/stress/trend summary.
3. Student-private note shown only to the student.
4. Empty state when no check-ins exist.

## Accessibility

- Fieldset/legend for mood and context groups.
- Labels for energy, stress, and note.
- Clear success/error messages.

