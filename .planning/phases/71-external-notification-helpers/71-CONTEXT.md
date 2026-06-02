# Phase 71: External Notification Helpers & Config Readiness - Context

**Milestone:** v2.4 External Notifications & Security Hardening Prep
**Phase:** 71
**Goal:** Introduce SMTP config validation and sanitize dispatch output to eliminate PII leakage during alert triggers.
**Date:** 2026-06-02

## Technical Context
The backend SOS email system currently supports optional SMTP delivery which defaults to a test/mock setup. When SMTP credentials are provided, we should ensure the backend validates these credentials on startup or reports exact status during operational checks without printing plain credentials or username.
Additionally, any logs triggered by an email dispatch must scrub specific recipient headers (e.g. replacing `example@student.com` with `e*****e@student.com` or completely redacting).

## Requirements Addressed
- **NOTIFY-01**: Secure SMTP configuration validation on startup with explicit fallback reporting.
- **NOTIFY-02**: Metadata email dispatch outcomes must sanitize and redact recipient email addresses and sensitive alert details.

## Next Steps
We will create a structured Phase Plan (`71-PLAN.md`) outlining the exact implementation steps for this milestone phase.
