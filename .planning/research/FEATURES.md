# Feature Research: BeYou v1.4 Consent-Based Notifications & Access Transparency

**Milestone:** v1.4 Consent-Based Notifications & Access Transparency  
**Researched:** 2026-05-22

## Summary

v1.4 should make BeYou's support flows more transparent and student-controlled without expanding surveillance. The safe product shape is in-app-only reminders, student-owned sharing, policy-driven reason prompts, and metadata-only operations.

## Table Stakes

| Category | Expected behavior | Boundary |
|---|---|---|
| Student reminder preferences | Student can enable/disable in-app reminders, set quiet hours, pause/resume, and see active channel boundaries. | Default consent is off; external channels unavailable. |
| Mood check-in reminders | Eligible students see optional supportive reminders and can dismiss, snooze, or open the check-in flow. | No automatic SOS, adult notification, risk score, or auto-submit. |
| Selective note sharing | Student can share a specific private mood note or student-written summary with chosen linked adults. | Sharing is per-note/per-adult and revocable. |
| Adult shared-note access | Teachers/parents see only notes currently shared with them and receive supportive response guidance. | Relationship alone is not enough; active share is required. |
| Reason-for-access | Adult/admin users provide controlled support-oriented reasons before protected sensitive access when policy requires. | Reason prompt never bypasses authorization. |
| Admin policy defaults | Admin configures safe defaults for reminders, reason requirements, allowed reason choices, and v1.4 helper copy. | Admin cannot force raw note exposure or external channels. |
| Operations visibility | Admin sees counts/status/readiness for v1.4 controls. | No raw notes, reason text, identifiers, exports, or risk drilldowns. |

## Differentiators

- Student can make policy stricter by disabling or pausing reminders.
- Student privacy map explains what adults can and cannot see.
- Per-adult note sharing supports different support relationships.
- Shared-note views include adult guidance for listening without pressure.
- Policy previews show how admin settings affect student/adult screens.

## Anti-Features

- Zalo/SMS/push/email reminders in v1.4.
- Reminder-created SOS or missed-reminder risk scoring.
- Adult access to all private mood notes.
- Admin browsing of private/shared note text.
- Forced sharing with all linked adults.
- Permanent irrevocable sharing.
- Hidden adult/admin sensitive access.
- Clinical, punitive, or surveillance copy.

## Suggested Requirement Categories

- **NOTIF:** Student consent and reminder preferences.
- **REMIND:** Non-clinical in-app mood check-in reminders.
- **SHARE:** Selective private mood-note sharing and revocation.
- **ACCESS:** Reason-for-access transparency.
- **POLICY:** Admin policy defaults.
- **OPS:** Metadata-only operations visibility.
- **QA:** Cross-role privacy regression and demo readiness.
