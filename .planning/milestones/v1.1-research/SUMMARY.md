# Research Summary: BeYou v1.1

**Milestone:** v1.1 Production Hardening & Support Polish  
**Created:** 2026-05-21

## Executive Summary

v1.1 should harden and polish the shipped v1.0 product rather than expand the wellbeing scope. The safest path is five additive slices:

1. Production readiness checks.
2. Backend-owned SOS email readiness.
3. Role/privacy UX polish.
4. Nested admin content editing.
5. Metadata-only operational visibility.

The central safety rule is unchanged: in-app SOS remains the canonical workflow. Email is only an optional backend-owned nudge to linked adults.

## Stack Additions

- No new dependency is required for readiness.
- No new dependency is required for nested content editing.
- Use Python stdlib SMTP first for v1.1 email readiness.
- Add one backend delivery/outbox table for SOS email metadata.
- Reuse metadata-only audit and existing auth/authorization patterns for operations visibility.

Avoid frontend email SDKs, SMS/Zalo/push providers, Redis/Celery, analytics/session replay, and raw sensitive exports in v1.1.

## Feature Table Stakes

| Area | Must have |
|---|---|
| Readiness | Config, DB, migration, cookie/origin, and secret hygiene checks |
| SOS email | disabled/local_outbox/smtp modes, minimal email, failure isolation |
| Delivery audit | Metadata-only delivery status and error categories |
| UX polish | Student privacy redirect, role-specific nav, clearer adult boundaries |
| Content | Nested self-check/scenario editors, publish validation, preview, history protection |
| Operations | Admin dashboard and audit filters that expose metadata only |

## Architecture Direction

- Add `readiness` service and schemas.
- Add `admin_operations` API for admin readiness, audit metadata, and delivery status.
- Add `sos_email` service and `SosNotificationDelivery` model/table.
- Modify SOS creation only after canonical SOS and in-app notifications remain intact.
- Modify authenticated frontend layout for role nav and student privacy redirect.
- Add admin operations page and nested content editor components.

## Watch Outs

- Readiness must not pass on unsafe placeholder values.
- Email must not become SOS source of truth.
- Email failures must not roll back SOS creation.
- Emails, logs, audit metadata, and admin responses must not expose raw student content or secrets.
- Role nav polish must not replace backend authorization tests.
- Nested editors must block invalid publish states.
- Operations visibility must not become student surveillance.

## Recommended Roadmap

| Phase | Focus | Why now |
|---|---|---|
| 7 | Production readiness foundation | Establish safe launch gates before external notification or admin ops surfaces |
| 8 | SOS email readiness | Adds optional external nudge while preserving canonical SOS |
| 9 | Role and privacy UX polish | Fixes known v1.0 UX debt and reduces confusion |
| 10 | Nested admin content editing | Makes existing content APIs usable for complete production content management |
| 11 | Metadata-only operations visibility | Pulls readiness, delivery, and audit metadata together after source events exist |

## Requirement Guidance

Keep requirements user-centric and testable. Separate email delivery from SOS status. Map each requirement to exactly one phase. Treat privacy and metadata-only visibility as acceptance gates, not optional implementation details.

