# Phase 1 Data Classification Policy

**Requirement:** SAFE-01  
**Status:** Contract for Phase 2+ implementation

BeYou classifies data before storage, sharing, authorization, or audit behavior is implemented. These classes are privacy defaults, not UI labels.

## Data Classes

| Class | Scope | Default visibility | Adult default | Audit required | Raw content allowed by default |
|---|---|---|---|---|---|
| `public_content` | Published safety education, scenario prompts, non-sensitive static copy | Public inside app | Visible when relevant | No | Yes |
| `account_profile` | User identity, role, account status, school/class profile fields | Owner and authorized admin | Limited profile context for linked support adults | Yes for admin changes | No |
| `relationship_links` | Student-teacher-parent relationships and link state | Linked parties and authorized admin | Visible only for linked support relationship | Yes | No |
| `wellbeing_records` | Self-check answers, scores, risk/support states, summaries, history | Student by default | Summary only by default | Yes | No |
| `safety_sos_chat_signals` | SOS alerts, SOS notes, chatbot safety signals, raw chat transcript references | Student and safety-purpose actors only | Safety summary and confirmed SOS note only | Yes | No |

## Resource Classification

| Resource key | Class | Default visibility | Adult default |
|---|---|---|---|
| `student_self_check_raw_answers` | `wellbeing_records` | Student only | Not shown by default |
| `self_check_summary` | `wellbeing_records` | Student, linked adults for support purpose | Summary only: risk level, advice summary, date, support suggestion |
| `chat_transcript_raw` | `safety_sos_chat_signals` | Student only by default | Not shown by default |
| `chat_safety_signal` | `safety_sos_chat_signals` | Student and safety-purpose actors | Safety summary only when needed |
| `sos_alert` | `safety_sos_chat_signals` | Student and linked support adults | Alert metadata plus student-confirmed note |
| `student_adult_link` | `relationship_links` | Linked parties and authorized admin | Relationship context only |
| `audit_event` | `relationship_links` | Authorized admin/support audit purpose | Metadata only |
| `demo_record` | `public_content` or matching demo class | Demo context only | Demo-visible with clear badge/banner |

## Locked Privacy Defaults

- Raw chatbot transcripts are private to the student by default.
- Teacher, parent, and admin roles do not see raw transcript content by default.
- Teacher and parent self-check visibility is summary-only by default.
- High-risk sharing uses a safety summary and student-confirmed SOS note, not the full chat transcript.
- Sensitive classes require backend authorization and metadata-only audit rules in later phases.

## Retention Gate

Sensitive classes use `retention: TBD_before_real_pilot` until legal/school review defines concrete retention and deletion rules. This blocks real student pilot launch, but does not block the MVP demo.
