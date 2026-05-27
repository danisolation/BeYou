# Phase 36 Schema and Index Decision

## DBPERF-05 Decision

No new indexes added; existing SQLAlchemy/Alembic indexes cover the optimized Phase 36 predicates.

Phase 36 changed backend query shape and batching, but did not introduce new predicates that require a new migration. The optimized hot paths use existing primary keys, single-column foreign-key indexes, and existing composite indexes already represented in SQLAlchemy metadata and Alembic history.

## Observed Predicates

| Predicate | Used by | Phase 36 decision |
|---|---|---|
| `student_adult_links(adult_id, relationship_type, status, student_id)` | Teacher/Parent SOS-visible linked-student lists and adult support-summary active-link checks | Existing `adult_id` index plus active unique `(student_id, adult_id, relationship_type)` partial index cover current bounded lookups; no migration added. |
| `sos_alerts(student_id, created_at)` | SOS existence checks, latest SOS per student, support overview latest-alert loading | Existing `ix_sos_alerts_student_created` covers student-scoped SOS reads; no migration added. |
| `sos_alerts(current_status)` | Open SOS count/status filtering | Existing `ix_sos_alerts_current_status` covers status filtering; no migration added. |
| `self_check_attempts(student_id, completed_at)` | Adult self-check latest/recent summary SQL-side ordering and cutoff | Existing `ix_self_check_attempts_student_completed` covers student-scoped recency queries; no migration added. |
| `mood_check_ins(student_id, created_at)` | Adult mood latest/recent cutoff and support-summary trend windows | Existing `ix_mood_check_ins_student_created` covers student-scoped recency queries; no migration added. |

## Existing Index Coverage

- `student_adult_links`: `student_id`, `adult_id`, and partial active unique index on `(student_id, adult_id, relationship_type)`.
- `sos_alerts`: `ix_sos_alerts_student_created`, `ix_sos_alerts_current_status`, and `ix_sos_alerts_is_demo`.
- `self_check_attempts`: `ix_self_check_attempts_student_completed` and `ix_self_check_attempts_is_demo`.
- `mood_check_ins`: `ix_mood_check_ins_student_created`, `ix_mood_check_ins_trend_label`, and `ix_mood_check_ins_is_demo`.
- `sos_status_events`: `ix_sos_status_events_alert_created` for latest-alert event hydration.
- `sos_notification_deliveries`: `ix_sos_notification_deliveries_alert_created`, `ix_sos_notification_deliveries_status`, and `ix_sos_notification_deliveries_is_demo`.

## New Indexes

No new indexes added; existing SQLAlchemy/Alembic indexes cover the optimized Phase 36 predicates.

The optional migration `20260527_0012_phase36_hot_path_indexes.py` was not created because query-count regression tests passed after query refactors and batching, and no new predicate needed additional schema support.

## Verification

- Phase 36 tests assert bounded query counts for admin users/links, adult visibility/support overview, adult summaries, and admin operations dashboard.
- `backend/tests/test_phase36_operations_schema_hot_paths.py` verifies this decision artifact references DBPERF-05 and the relevant existing predicate families.
- `backend/tests/test_schema_models.py` remains the SQLAlchemy metadata registration gate.
- `alembic check` is the schema drift gate because no migration was required.
