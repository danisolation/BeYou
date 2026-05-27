# Pitfalls Research: BeYou v1.4 Consent-Based Notifications & Access Transparency

**Milestone:** v1.4 Consent-Based Notifications & Access Transparency
**Researched:** 2026-05-22

## Summary

v1.4 touches BeYou's highest-trust boundaries: reminders, adult access, private-note sharing, audit visibility, and school defaults. The biggest failure mode is accidental scope expansion from support into surveillance.

The non-negotiable line remains: no raw private note exposure by default, no automatic SOS, no external channel delivery, no risk leaderboards, and no punitive/clinical copy.

## Pitfalls and Prevention

| Area | Pitfall | Prevention | Phase |
|---|---|---|---|
| Consent | Admin defaults silently become student consent. | Store policy defaults separately; student explicit consent controls effective reminder state. | 21 |
| Channels | Broad notification toggle implies SMS/Zalo/push. | Per-channel state; v1.4 API rejects external activation. | 21-22 |
| Quiet hours | Time windows fail overnight or timezone semantics. | Store local `HH:MM` windows with `Asia/Ho_Chi_Minh` default and tests for overnight ranges. | 22 |
| Pause | UI hides reminders but backend still returns due state. | Backend reminder eligibility checks pause state. | 22 |
| Reminders | Copy becomes clinical, urgent, or pressuring. | Vietnamese supportive optional copy; no risk/diagnosis language. | 22 |
| SOS | Reminders/check-ins trigger SOS or adult alerts. | Explicit regression tests; reminder service must not call SOS/adult notification paths. | 22, 26 |
| Sharing | One consent shares all future notes. | Grant scope is one check-in/note and selected adult(s) only. | 23 |
| Revocation | Frontend hides revoked notes but API still serves them. | Active grant checked server-side on every read. | 23 |
| Links | Sharing with unlinked/revoked adults. | Reuse active `StudentAdultLink` validation. | 23 |
| Reasons | Free-text reason stores sensitive narratives. | Controlled reason codes; no raw detail in audit. | 24 |
| Bypass | Reason prompt enforced only in UI. | Gate in service/API layer for teacher and parent routes. | 24 |
| Audit | New metadata keys leak note text or identifiers. | Extend forbidden key sanitizer and test nested metadata. | 21, 26 |
| Operations | Admin dashboard becomes per-student monitoring. | Counts/status/readiness only; no drilldowns or raw exports. | 25 |

## Required Safeguards

- Reminder eligibility requires explicit student consent, not paused, outside quiet hours, allowed by policy, active account, and privacy acknowledgement.
- Mood reminders are in-app only and optional.
- Private mood notes remain student-only unless a specific active share grant exists.
- Revocation immediately removes future adult API access.
- Reason codes are selected before protected access when policy requires.
- Admin policy may restrict or provide safe defaults, but cannot force external channels or raw private-note exposure.

## Verification Traps

- Frontend-only controls that direct API calls can bypass.
- Reason prompts added to only one adult route.
- Audit key drift with names like `shared_excerpt`, `reason_detail`, `student_summary`, or `notification_body`.
- Revoked shares still present in adult detail endpoints.
- Operations views leaking `resource_id`, names, emails, or private content.
- Copy regression into red/urgent/diagnostic/disciplinary language.
