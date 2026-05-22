# Feature Research: BeYou v1.1

**Milestone:** v1.1 Production Hardening & Support Polish  
**Researched:** 2026-05-21  
**Confidence:** High for product scope; medium for production operations until implementation validates exact environment constraints.

## Summary

v1.1 should not add a new student wellbeing product surface. It should make the v1.0 product safer to operate, clearer to use, and easier to support.

The most important product rule is that in-app SOS remains the source of truth. Email is only an optional backend-owned delivery channel that nudges linked adults to sign in to BeYou.

Operational visibility should answer operational questions without turning BeYou into surveillance:

- Is the app safely configured?
- Are database migrations current?
- Are SOS email notifications ready?
- Did delivery attempts succeed or fail?
- Who performed sensitive support/admin actions?

It must not expose raw self-check answers, chatbot transcripts, SOS notes, secrets, or risk leaderboards.

## Table Stakes

| Category | Capability | Complexity | Notes |
|---|---|---:|---|
| Production readiness | Config, DB, migration, cookie/origin, and secret hygiene checks | Medium | Must be safe for admin display and non-sensitive public readiness |
| SOS email readiness | Backend-owned disabled/local outbox/SMTP modes | High | Email never replaces in-app SOS |
| SOS delivery audit | Metadata-only delivery attempts and failures | Medium | No raw student content or credentials |
| Privacy redirect | Direct student route redirects to `/privacy` when acknowledgement is missing | Low-Medium | Fixes known v1.0 tech debt |
| Role navigation | Authenticated nav shows only role-appropriate links | Low-Medium | Backend authorization remains authoritative |
| Adult UX clarity | Teacher/parent pages explain summary-only boundaries | Low | Supports student trust |
| Nested self-check editing | Admin edits questions, choices, scoring, thresholds, and lifecycle | High | Must protect historical results |
| Nested scenario editing | Admin edits choices, feedback, recommended response, lesson, skill tags, and lifecycle | High | Needs publish validation and preview |
| Metadata-only ops dashboard | Admin sees readiness, delivery status, and audit metadata | Medium-High | No raw exports or risk drilldowns |

## Optional Differentiators

- Admin readiness dashboard with red/yellow/green cards.
- Remediation hints beside failed readiness checks.
- Safe provider simulation or test-send workflow that never notifies real linked adults.
- Retry queue with backoff if production email is actually enabled at scale.
- Content diff/version history after nested editing is stable.
- Student preview for admin content before publishing.
- Reason-for-access prompts for sensitive support actions.
- Operational runbook links in admin UI.

## Anti-Features

| Anti-feature | Why avoid it | Safer alternative |
|---|---|---|
| Replacing in-app SOS with email | Email can fail, delay, or be missed | Email only nudges adults to open BeYou |
| Email status update links | Authorization and leak risk | Require authenticated in-app status updates |
| Raw SOS/self-check/chat content in email | Email is uncontrolled and forwardable | Minimal alert text plus authenticated link |
| Frontend-held SMTP/API credentials | Secret exposure | Backend-only provider config |
| Risk leaderboard | Turns support into surveillance | Narrow support queues with relationship checks |
| Raw transcript/answer browsing by default | Violates privacy-by-default | Metadata and permitted summaries only |
| Email success as adult acknowledgement | Delivery is not human action | Keep explicit in-app status workflow |
| Fail-open production config | Unsafe real-student launch risk | Block or loudly fail unsafe production settings |
| Broadcast SOS to all staff | Overexposes student distress | Notify only linked/authorized adults |
| SMS/Zalo/push in v1.1 | Adds consent/provider complexity | Defer to a later notification milestone |

## Dependencies

```text
Existing auth + RBAC + cookie sessions
  -> role-specific navigation
  -> admin operations access control

Existing privacy acknowledgement
  -> direct student route redirect
  -> clearer student/adult privacy UX

Existing SOS alert + status + in-app notification workflow
  -> backend email delivery attempts
  -> delivery metadata and failure isolation

Existing configuration and Alembic setup
  -> readiness checks
  -> migration health

Existing admin content APIs
  -> nested self-check/scenario editors
  -> publish validation and preview

Existing metadata-only audit
  -> operations dashboard
  -> delivery and support/admin event visibility
```

## MVP Recommendation

Prioritize:

1. Production readiness checks.
2. Backend-owned SOS email readiness with local outbox, failure isolation, and metadata-only delivery audit.
3. Student/adult role and privacy UX polish.
4. Nested admin self-check/scenario editing with validation and historical-result protection.
5. Metadata-only operational visibility.

Defer:

- SMS/Zalo/push channels.
- Email-based SOS status updates.
- Advanced retry/queue infrastructure.
- Raw sensitive exports.
- Risk leaderboards and surveillance dashboards.
- Human counselor handoff or emergency service automation.

