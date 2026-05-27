---
phase: 12-trusted-adult-support-plan
artifact: ui-spec
status: ready
created: 2026-05-22
---

# Phase 12 UI Spec: Trusted Adult Support Plan

## Screen

`/student/support-plan`

## Purpose

Let students create and update a shareable support plan with selected linked adults before a situation becomes urgent.

## Quality Bar

- Calm, student-first Vietnamese copy.
- Clear sharing boundary before the form: selected adults may later see the plan; private mood notes, raw self-check answers, and chatbot transcripts remain private by default.
- No clinical diagnosis or risk scoring.
- No adult/admin monitoring language.

## Layout

1. Hero card:
   - heading: "Kế hoạch người lớn tin cậy"
   - short explanation of why the plan exists.
   - privacy boundary copy.
2. Linked adult selection:
   - checkbox cards for linked teachers/parents.
   - empty state if no linked adults exist.
3. Shareable preference form:
   - what helps;
   - what does not help;
   - preferred contact style;
   - safe contact times;
   - optional shareable note.
4. Status controls:
   - active / paused / deactivated.
5. Save state:
   - clear success and error messages.

## States

- Loading.
- No linked adults.
- Existing plan loaded.
- Save success.
- Validation/API error.

## Accessibility

- Every field has an explicit label.
- Checkbox labels include adult name and role.
- Buttons have clear text and disabled state.

## Non-Goals

- Adult summary UI.
- Mood check-in UI.
- Reminder preferences.
- External notification settings.
