# Phase 72: Multi-School Tenant Schema Scaffolding - Plan

**Status:** Completed

## Implementation Steps

### 1. Model Field Scaffolding
- Target Models: `User` and `Session` in `backend/app/db/models.py`.
- Action: Add indexed, nullable UUID `tenant_id` standard column to prepare database structures for school separation.

### 2. Alembic Migration Scaffolding
- Target Directory: `backend/alembic/versions/`
- Script: `20260602_0013_scaffold_multi_school_tenancy.py`
- Operations:
  - Add nullable `tenant_id` UUID column to `users` and `sessions` tables.
  - Form index `ix_users_tenant_id` on `users(tenant_id)`.
  - Form index `ix_sessions_tenant_id` on `sessions(tenant_id)`.

### 3. Execution & Verification Loop
- Action: Apply the migration to the running PostgreSQL development container with `alembic upgrade head`.
- Action: Run the entire backend test suite to identify and resolve any timing differences or schema-drift assertions found across files.
