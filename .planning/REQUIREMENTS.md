# Requirements: v1.9 Production Polish

**Milestone:** v1.9
**Created:** 2026-05-28
**Total:** 9 requirements across 3 categories

## PROD: Production Visual Cleanup

| ID | Requirement | Priority |
|---|---|---|
| PROD-01 | Remove DemoBanner component and all imports/renderings across the app | Must |
| PROD-02 | Remove DemoBadge component and all imports/renderings across student, teacher, and admin pages | Must |
| PROD-03 | Remove "Vào demo trong một bước" section from landing page; replace with professional product intro | Must |

## TONE: Production Tone & Wording

| ID | Requirement | Priority |
|---|---|---|
| TONE-01 | Update login page demo-related descriptive text to production wording (keep "Tài khoản demo" section label and 4 account buttons) | Must |
| TONE-02 | Update privacy page to remove demo-specific explanations; frame as real data policy | Must |
| TONE-03 | Update admin operations page wording from demo-tracking to production monitoring tone | Should |

## CONFIG: Runtime & Config Defaults

| ID | Requirement | Priority |
|---|---|---|
| CONFIG-01 | Change default RUNTIME_MODE from local_demo to production_pilot | Must |
| CONFIG-02 | Ensure 4 demo accounts remain functional (seeded, login works, is_demo flag preserved in DB) | Must |
| CONFIG-03 | Ensure all existing tests pass after changes (no regression) | Must |

## Constraints

- Keep `is_demo` database field and backend logic intact — needed for data separation in admin reports
- Keep admin operations demo seed panel functional (monitoring tool)
- Do NOT delete demo account data or seed scripts
- Keep login "Tài khoản demo" section with 4 role buttons as-is
