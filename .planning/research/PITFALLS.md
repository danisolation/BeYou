# Domain Pitfalls: BeYou v1.2 Trusted Adult Plan & Mood Check-ins

**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Researched:** 2026-05-22

## Summary

The main risk is turning proactive support into monitoring. v1.2 must keep support plans student-owned, check-in notes private by default, adult views summary-only, and admin/operations visibility metadata-only.

## Pitfalls Table

| Pitfall | Impact | Prevention | Phase implication |
|---|---|---|---|
| Raw mood notes exposed to adults/admins | Breaks student trust and privacy guarantees | Separate raw note fields from derived summaries; test response shapes | Mood and adult summary phases |
| Mood trends become risk leaderboards | Product shifts from support to surveillance | Use supportive trend language, no rankings, no exports/drilldowns | Adult/admin phases |
| Support plan ignores linked-adult relationship | Unauthorized disclosure | Validate selected adults against existing links and role permissions | Support plan phase |
| High concern check-in auto-sends SOS | Unsafe escalation and consent violation | Suggest SOS/trusted adult contact only; require explicit SOS confirmation | Mood phase |
| Admin config enables punitive/clinical copy | Harmful UX and scope drift | Validation, preview, and non-clinical copy guidelines | Admin config phase |
| Audit metadata leaks private text | Sensitive data in operations logs | Reuse sanitizer and assert forbidden keys/text are absent | Every phase |
| Student cannot understand sharing boundaries | Consent failure | Add clear Vietnamese privacy copy before plan/check-in flows | Student UI phases |
| Multiple check-ins create confusing history | Poor UX and noisy summaries | Define same-day update/add behavior and show timestamps clearly | Mood phase |

## Privacy and Safety Risks

- Optional notes are the highest-risk data. Keep them student-only unless a future explicit sharing model is designed.
- Adult summaries should show trend direction, recency, and support suggestions, not raw details.
- Admins should configure prompts/guidance but not browse individual submissions.
- Audit events must remain metadata-only and sanitized recursively.

## UX Risks

- If check-ins feel like homework or surveillance, students may avoid them.
- If support plans are too long, students will not complete them.
- If adult copy sounds disciplinary, the feature undermines trust.
- If high-concern copy is too alarming, it may discourage honest check-ins.

## Architecture and Data Risks

- Support plan and mood models need explicit lifecycle/status fields to avoid hard deletes breaking history.
- Adult summaries should be generated through a service boundary, not by returning raw model fields.
- Existing privacy acknowledgement and authenticated role layout must cover new student pages.
- Future reminder/notification work should not be smuggled into v1.2.

## Testing Gaps to Avoid

- Missing negative authorization tests for unlinked teacher/parent access.
- Missing assertions that adult/admin/operations responses exclude raw notes.
- Missing frontend tests for role-specific adult copy.
- Missing regression for privacy-blocked student direct navigation to new pages.

## Prevention Strategy

- Make privacy boundaries explicit requirements.
- Build student-owned domain first, then derive adult summaries.
- Add tests before or alongside every adult/admin response surface.
- Keep high-concern escalation advisory until explicit SOS confirmation.
- Close with a cross-surface privacy audit.
