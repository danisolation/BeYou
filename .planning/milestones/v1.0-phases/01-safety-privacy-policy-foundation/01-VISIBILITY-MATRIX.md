# Phase 1 Visibility Matrix

**Requirement:** SAFE-03  
**Status:** Human-readable authorization contract for Phase 2 backend enforcement

BeYou visibility is role + relationship + purpose based. Role alone is never enough for sensitive student resources.

| Resource | Student | Teacher | Parent | Admin | Purpose Limit | Audit |
|---|---|---|---|---|---|---|
| Self-check raw answers | Own answers only | Not shown by default | Not shown by default | Restricted break-glass/support admin purpose only | Student reflection; never surveillance | Required |
| Self-check summary | Own summary and history | Linked students only; summary only | Linked child only; summary only | Restricted support/admin purpose only | `support_not_surveillance` | Required |
| Chat transcript | Own transcript only by default | Not shown by default | Not shown by default | Not shown by default | Student-private support context | Required if accessed |
| Chat safety signal | Own safety summary | Safety summary only when needed | Safety summary only when needed | Safety metadata only | `safety_escalation` | Required |
| SOS alert | Own alert and status | Linked/assigned students only | Linked child only | Operational metadata only | `safety_escalation` | Required |
| Student-adult link | Own linked support adults | Linked/assigned students only | Linked child only | Manage links for support operations | Relationship management | Required |
| Audit event | Not shown in student UI | Not shown by default | Not shown by default | Metadata only for authorized audit purpose | Accountability and safety review | Required |
| Demo record | Visible only in demo context | Demo context only | Demo context only | Demo/admin context only | Demo walkthrough; not real student support | Required when sensitive |

## Locked Rules

- Adult self-check visibility is summary-only by default: risk/support level, advice summary, date, and support suggestion.
- Raw answers and raw chat transcripts are Not shown by default to teacher, parent, or admin roles.
- High-risk sharing uses safety summary and a student-confirmed SOS note, not the full chat transcript.
- Demo records require visible `Demo` indicators and `is_demo` metadata before any role-specific display.
- All sensitive reads must require a valid relationship and purpose before returning data.

## Enforcement Notes

This matrix is descriptive. Runtime enforcement belongs in the backend authorization layer defined by `01-AUTHORIZATION-POLICY.yml`, not in frontend-only UI hiding.
