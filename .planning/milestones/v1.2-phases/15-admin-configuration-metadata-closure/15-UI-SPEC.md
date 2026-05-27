---
phase: 15-admin-configuration-metadata-closure
artifact: ui-spec
status: ready
created: 2026-05-22
---

# Phase 15 UI Spec: Admin Mood Configuration & Operations Closure

## Screens

- `/admin/mood-checkins`
- existing `/admin/operations`

## Purpose

Let admins manage safe mood check-in labels/guidance and verify v1.2 metadata-only operations boundaries.

## Quality Bar

- Admin copy emphasizes non-clinical, support-only configuration.
- Preview shows what students/adults see without raw student data.
- No export, leaderboard, raw note, or per-student drilldown controls.
- Unsafe clinical/surveillance copy is surfaced as a validation error.

## Admin Config Layout

1. Header and safety boundary card.
2. Config list.
3. Edit/create form:
   - name;
   - lifecycle status;
   - sort order;
   - student prompt;
   - adult guidance;
   - mood option labels/helpers;
   - context tag labels.
4. Preview panel.
5. Save result/error state.

## Operations Closure

Add safe audit summary buckets for support-plan, mood-check-in, adult-summary, and admin-config actions.

