# Requirements: v2.4 External Notifications & Security Hardening Prep

**Milestone:** v2.4
**Created:** 2026-06-02
**Total:** 4 requirements across 3 categories

## NOTIFY: External Notification Helpers & Config Readiness

| ID | Requirement | Priority |
|---|---|---|
| NOTIFY-01 | Secure SMTP configuration validation on startup with explicit fallback reporting | Must |
| NOTIFY-02 | Metadata email dispatch outcomes must sanitize and redact recipient email addresses and sensitive alert details | Must |

## TENANT: Multi-School Tenant Schema Scaffolding

| ID | Requirement | Priority |
|---|---|---|
| TENANT-01 | Scaffold SQLAlchemy database columns and alembic migration placeholders for multi-school tenancy support | Should |

## SECURE: Security Polish & Release Gates

| ID | Requirement | Priority |
|---|---|---|
| SECURE-01 | Comprehensive audit metadata verification tests and release gate validation | Must |

## Constraints

- Changes must be fully additive and backward-compatible with v2.3.
- Do not store any student credentials, emails, or notes in server logs or raw files.
- Always retain Vietnamese-first communication for student and parent interfaces.

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| NOTIFY-01 | Phase 71 | Pending |
| NOTIFY-02 | Phase 71 | Pending |
| TENANT-01 | Phase 72 | Pending |
| SECURE-01 | Phase 73 | Pending |

**Coverage:**
- v2.4 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0 ✓
