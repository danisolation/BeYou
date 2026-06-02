# Phase 72: Multi-School Tenant Schema Scaffolding - Context

**Milestone:** v2.4 External Notifications & Security Hardening Prep
**Phase:** 72
**Goal:** Implement database schema updates and Alembic migration placeholders to support future tenant-scoped (school-scoped) data segregation.
**Date:** 2026-06-02

## Technical Context
For future production scale, adding support for multiple isolated schools (tenants) requires that operational tables contain a `tenant_id` field. At this stage, we will scaffold:
1. `tenant_id` column as UUID on `users`, `sessions`, and key operational tables in `backend/app/db/models.py`.
2. An Alembic schema model placeholder to prepare the migration pipeline for future tenant isolation.

## Requirements Addressed
- **TENANT-01**: Scaffold SQLAlchemy database columns and alembic migration placeholders for multi-school tenancy support.

## Next Steps
We will lay out the plan file (`72-PLAN.md`) outlining the exact implementation steps for introducing the fields and migrations in a non-disruptive, fully backward-compatible manner.
