# Retrospective: BeYou - Tu Tin La Minh

## Milestone: v1.0 - MVP Demo

**Shipped:** 2026-05-21  
**Phases:** 6  
**Plans:** 26  
**Requirements:** 47/47 satisfied

### What Was Built

- Privacy, authorization, audit, demo-data, and non-clinical safety foundation.
- Email/password auth, role portals, demo accounts, and admin user/link management.
- Student self-check and scenario flows with admin content management and summary-only adult visibility.
- Confirmed SOS workflow with linked teacher/parent visibility and teacher status handling.
- Backend-only supportive chatbot gateway with provider abstraction, guardrails, escalation copy, and admin safety config.
- Privacy-limited aggregate reports with small-group suppression and no raw sensitive exports.

### What Worked

- Building privacy and authorization contracts first reduced later rework across self-checks, SOS, chatbot, and reports.
- Backend-owned session, authorization, scoring, guardrails, and report suppression kept the frontend from becoming a security boundary.
- Phase-level verification plus final milestone audit caught artifact drift before archive.
- Autonomous phase execution worked well once user decisions were encoded as locked defaults.

### What Was Inefficient

- Some GSD tracking updates missed ROADMAP/STATE/REQUIREMENTS fields and required manual normalization.
- Phase 02 had verification evidence in `02-07-SUMMARY.md` but lacked the standard `02-VERIFICATION.md` artifact until milestone audit.
- Local dev auth was slowed by localhost vs 127.0.0.1 CORS/same-site mismatches and frontend port relay issues.
- `MILESTONES.md` needed manual accomplishments because automatic extraction returned none.

### Patterns Established

- Sensitive student resources use role + relationship + purpose checks, deny-by-default backend enforcement, and metadata-only audit.
- Raw self-check answers and chatbot transcripts remain student-owned by default.
- Adults receive support summaries and SOS workflow state, not raw private detail.
- Chatbot safety is enforced pre- and post-provider on the backend, with provider abstraction and deterministic fallback.
- Aggregate reports suppress small sensitive buckets and avoid exports, drilldowns, and risk leaderboards.

### Key Lessons

- Treat GSD generated state as useful but verify against disk artifacts before advancing workflow gates.
- Every completed phase should have a canonical `*-VERIFICATION.md`, even if the final plan summary already includes verification evidence.
- Local cookie-auth flows need explicit dev origins documented and tested early.
- For sensitive wellbeing apps, "support, not surveillance" must be validated in API shape, UI copy, and reporting constraints.

### Cost Observations

- Model mix and token cost were not tracked in this session.
- Most value came from autonomous execution agents plus targeted orchestrator audits/fixes.
- The largest manual overhead was artifact normalization rather than application implementation.

## Cross-Milestone Trends

| Theme | v1.0 Observation | Follow-up |
|---|---|---|
| Privacy defaults | Effective when decided before feature work | Keep as release gate for future milestones |
| GSD state drift | ROADMAP/STATE/REQUIREMENTS sometimes needed manual correction | Audit artifacts before completion |
| UX debt | Non-blocking role nav/privacy redirect issues remain | Consider v1.1 polish/cleanup |
| Admin tooling | Backend supports richer nested content than MVP UI exposes | Consider admin content UX improvements |
