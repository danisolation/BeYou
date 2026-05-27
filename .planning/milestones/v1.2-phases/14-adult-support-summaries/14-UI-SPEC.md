---
phase: 14-adult-support-summaries
artifact: ui-spec
status: ready
created: 2026-05-22
---

# Phase 14 UI Spec: Adult Support Summaries

## Screens

- `/teacher/students/[studentId]/support-summary`
- `/parent/students/[studentId]/support-summary`

## Purpose

Help linked adults support a student with approved preferences and recent mood trend context without opening private notes or raw check-in details.

## Quality Bar

- Copy says "summary-only" and "support, not surveillance".
- No diagnosis, scoring, discipline, leaderboard, export, or raw note display.
- Support plan preferences show only when shared with that adult.
- Mood trend shows recency/counts and suggested supportive action only.

## Layout

1. Header with student context.
2. Privacy boundary card.
3. Shared support plan card.
4. Mood trend summary card.
5. Empty/not-shared states.

## Accessibility

- Page heading identifies summary purpose.
- Cards have clear headings.
- Links and buttons avoid ambiguous labels.

