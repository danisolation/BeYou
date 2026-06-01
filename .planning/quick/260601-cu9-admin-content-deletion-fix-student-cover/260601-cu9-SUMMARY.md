# Quick Task 260601-cu9: Admin Content Deletion + Student Cover Image Fix

**Completed:** 2026-06-01
**Commit:** 1d731f7

## Changes

1. **Admin content deletion** — Removed draft-only restriction. Admin can now delete content in any status (draft/published/archived). Cascade-deletes all related attempts, answers, choices, questions, and thresholds.

2. **Student cover image display** — Added `cover_image_url` to `_test_list_item()` and `_scenario_list_item()` response mappers. Student cards now show cover images.

## Files Modified

| File | Change |
|------|--------|
| `backend/app/services/admin_content.py` | Remove draft-only check, add cascade deletion |
| `backend/app/api/student_self_checks.py` | Add `cover_image_url` to list response |
| `backend/app/api/student_scenarios.py` | Add `cover_image_url` to list response |
| `frontend/app/(authenticated)/admin/content/page.tsx` | Update Vietnamese confirmation message |
