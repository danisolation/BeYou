# Phase 4 Discussion Log

**Mode:** Autonomous (`don't ask`)  
**Date:** 2026-05-21

| Area | Auto-selected decision | Rationale |
|---|---|---|
| Severity/source | Use `support`/`urgent`, source `student_dashboard` now | Minimal v1 model that satisfies SOS-03 and leaves later chatbot/self-check sources open |
| Confirmation | Require explicit confirmation before POST | Directly satisfies SOS-02 and reduces accidental alerts |
| Notifications | In-app database notifications only | Matches v1 scope and avoids external delivery complexity |
| Status workflow | `sent` → `received` → `supporting` → `completed` | Matches roadmap success criteria and keeps teacher handling visible |
| Teacher controls | Linked teachers can update status forward | TEACH-03 specifically grants teacher handling |
| Parent boundary | Parents view status and summaries, no updates | PARENT-02/PARENT-03 are read/support requirements, not workflow ownership |
| Privacy | Summary/support only, no raw answers | Locked by Phase 1/3 |
| Audit | Metadata-only reads and state changes | Locked by SAFE-04 and Phase 1 catalog |
| UI tone | Vietnamese, calm, supportive, non-clinical | Locked by SAFE-06 and Phase 1 safety copy |

No user-facing question was asked because the user explicitly requested autonomous execution.
