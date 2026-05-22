# Feature Landscape: BeYou v1.2 Trusted Adult Plan & Mood Check-ins

**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Researched:** 2026-05-22

## Summary

v1.2 should deepen proactive support before SOS escalation. The milestone should help students express who they trust, what support feels safe, and how their mood is trending, while giving adults enough context to support without raw private detail.

## Feature Categories

| Category | Table stakes | Differentiators | Anti-features |
|---|---|---|---|
| Trusted adult plan | Choose linked adults, support preferences, boundaries, update/deactivate | Student-friendly scripts, "what helps/doesn't help", shareable support notes | Forced adult access to everything |
| Mood check-ins | Low-friction mood input, optional private note, history | Weekly trend reflection, supportive next steps, SOS suggestion for high concern | Clinical scoring or diagnosis |
| Adult summaries | Linked adult can see trend/recency and suggested support | Different teacher vs parent copy and actions | Raw notes, risk leaderboards |
| Admin config | Manage prompts/guidance and lifecycle | Metadata-only audit and validation | Admin browsing of individual raw mood content |
| Privacy/safety | Consent/boundary copy, role checks, audit | Student-owned sharing controls | Automatic emergency escalation |

## Suggested v1.2 Scope

1. Student-owned trusted adult plan:
   - select from existing linked teachers/parents;
   - define preferred support style, safe contact windows, "what helps", "what does not help", and shareable notes;
   - update, deactivate, and review privacy boundaries.
2. Lightweight mood check-ins:
   - daily/weekly prompt with simple mood/energy/stress tags;
   - optional private note;
   - student history and simple trend view;
   - supportive next steps and SOS/trusted-adult suggestion for high concern.
3. Adult support summaries:
   - teacher/parent see linked-student trend summaries and support preferences;
   - no raw notes or raw answer exports;
   - supportive action copy tailored to role.
4. Admin-safe configuration:
   - manage active check-in prompts, option labels, and support guidance;
   - audit changes as metadata only;
   - expose only metadata in operations.

## Edge Cases

- Student has no linked adults: plan should explain how admin/teacher link setup is needed and avoid dead ends.
- Student selects only one adult: adult summaries must respect the selected support plan and existing relationship links.
- Student submits multiple check-ins in a day: define update vs additional entry behavior.
- Student adds optional note: it remains student-only unless a future explicit sharing requirement is scoped.
- High concern mood: show SOS/trusted-adult guidance without automatic SOS.
- Adult route for unlinked student: deny without leaking sensitive existence.

## Privacy and Consent Boundaries

- Student sees clear copy before creating a support plan or check-in.
- Adults see support preferences and derived summaries, not private notes.
- Admins configure prompts/guidance, not raw student mood entries.
- Audit records action metadata only.

## Future Scope

- Reminder scheduling.
- Zalo/SMS/push notification channels.
- Human counselor handoff.
- Reason-for-access prompts.
- Student-controlled sharing of selected notes.
- Multi-school policy customization.
