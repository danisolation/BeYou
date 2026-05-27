---
status: passed
phase: 27
phase_name: audit-gap-closure-peerlight-ai-refresh
verified_at: 2026-05-25
requirements_verified:
  - GAP-01
  - GAP-02
  - GAP-03
  - REFRESH-01
  - REFRESH-02
  - ACCESS-06
  - QA-05
must_haves_verified: 7
must_haves_total: 7
---

# Phase 27 Verification: Audit Gap Closure & Peerlight AI Demo Refresh

**Verdict:** Passed  
**Verified:** 2026-05-25

## Goal-Backward Check

Phase 27 needed to close the v1.4 milestone audit gaps and satisfy the user's requested Peerlight AI live-demo refresh without weakening privacy boundaries.

| Goal | Evidence | Result |
|---|---|---|
| Policy defaults affect runtime | `privacy_controls` now uses school policy defaults for student notification preference creation/update. | Passed |
| Note-sharing policy is enforced | `mood_note_shares` blocks share create/update when `note_sharing_enabled` is disabled. | Passed |
| Operations audit stays metadata-only | Admin operations schema/type no longer includes `resource_id`. | Passed |
| Peerlight AI rebrand is visible | Landing, login, shell, dashboard, chat, tests, scenarios, adult/admin copy, and tests use Peerlight AI/Vietnamese-first labels. | Passed |
| Richer psychological demo content exists | Demo seed includes anxiety, depression, ADHD/focus, and autism/social communication self-check topics without copyrighted questionnaire text. | Passed |
| Adult visibility is SOS-only | Teacher/parent lists and support-summary authorization require linked student plus SOS signal. | Passed |
| Existing behavior remains stable | Full backend/frontend tests, lint, and build pass. | Passed |

## Requirement Evidence

| Requirement | Status | Evidence |
|---|---|---|
| GAP-01 | VERIFIED | `privacy_controls` consumes `SchoolPrivacyPolicyDefault` values when creating/updating student notification preferences, including reminder defaults, quiet hours, timezone, and pause constraints. |
| GAP-02 | VERIFIED | `mood_note_shares` enforces `note_sharing_enabled` and blocks share create/update when the admin policy disables note sharing. |
| GAP-03 | VERIFIED | Admin operations response schemas/types and mapper no longer expose raw `resource_id`, preserving metadata-only audit visibility without unsafe identifiers. |
| REFRESH-01 | VERIFIED | User-facing landing, login, authenticated shell, student dashboard, chat, Test tâm lý, Tình huống xử lý thực tế, adult/admin copy, and tests are rebranded to Peerlight AI/Vietnamese-first labels. |
| REFRESH-02 | VERIFIED | Demo seed includes richer non-proprietary anxiety, depression, ADHD/focus, and autism/social-communication self-check content. |
| ACCESS-06 | VERIFIED | Teacher/parent student lists and `support_not_surveillance` authorization require active relationship plus an existing student-sent SOS signal. |
| QA-05 | VERIFIED | Full backend/frontend tests, lint, build, code review, live local demo walkthrough, and copy/privacy grep gates passed after Phase 27 changes. |

## Local Gates

```text
backend:  python -m pytest --quiet       -> 129 passed
backend:  python -m ruff check .         -> passed
frontend: npm test -- --run              -> 20 files / 94 tests passed
frontend: npm run lint                   -> passed
frontend: npm run build                  -> passed
```

## Notes

- Backend API risk labels remain contract-stable; frontend maps them to the requested Vietnamese display labels.
- The legacy `BeYouDemo!2026` demo password remains unchanged to avoid breaking demo credentials and tests.
- SOS-only adult visibility is based on the existence of a student-sent SOS alert, matching the user request that adults only see students who sent SOS.
