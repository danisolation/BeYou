---
phase: 06-aggregate-reports-privacy-hardening
mode: autonomous
requirements: [ADMIN-05, ADMIN-06]
created: 2026-05-21
---

# Phase 06 Context: Aggregate Reports & Privacy Hardening

## Goal

Admins can view privacy-limited aggregate reporting without exposing raw sensitive student data.

## Locked prior decisions honored

- Privacy-by-default: adult/admin experiences support students, not surveil them.
- Raw self-check answers, chatbot transcripts, SOS notes/messages, and per-student mental-health detail remain private by default.
- Sensitive reads and safety workflow state changes are audited with metadata only.
- Demo records are visibly labeled and separated through `is_demo`.
- Frontend uses cookie-authenticated `apiFetch`; no browser token storage.
- No CORS, auth, or same-site guard weakening.

## Autonomous decisions

| Area | Decision | Reason |
|---|---|---|
| Aggregate dimensions | Include user counts by role/status/demo, active linked students/links, self-check completions by test and risk level, SOS counts by status/severity/source, popular scenario attempts, and chatbot high-risk/sos-suggested signal counts. | Covers ADMIN-05 while staying aggregate-only. |
| Suppression threshold | Use a minimum sensitive bucket size of 3. Zero counts are shown as 0; non-zero sensitive counts below 3 are hidden as suppressed. | Prevents small-group inference while still proving aggregate reporting. |
| Demo handling | Add `demo_scope=all|demo|real` filter and show demo/real counts/labels. Default is all. | Makes demo data explicit and consistent with `is_demo`. |
| Audit boundary | Audit successful aggregate report reads as `sensitive_resource_read` on `aggregate_report` with metadata-only scope, sections, threshold, and decision. | Reports summarize sensitive domains, so reads should be accountable without raw data. |
| API privacy | Response schemas must not include student IDs, names, emails, raw answers, answer snapshots, chat messages, transcripts, SOS notes, or drilldown URLs. | Satisfies ADMIN-06. |
| UI privacy copy | Vietnamese copy will explain reports are trend-only, no raw exports, no per-student detail, no risk leaderboard. | Keeps admin posture supportive and non-surveillance. |
| Drilldowns/exports | No export button and no links from report buckets to individual records. | Avoids accidental raw sensitive disclosure. |

## Success mapping

- ADMIN-05: backend + UI aggregate report over users, self-checks, SOS, scenarios, chatbot safety counts.
- ADMIN-06: privacy-limited response/schema, suppressed small buckets, audit, Vietnamese privacy notes, no raw export/drilldown.
