# Pitfalls Research: BeYou v1.1

**Milestone:** v1.1 Production Hardening & Support Polish  
**Researched:** 2026-05-21  
**Confidence:** High

## Critical Pitfalls

### 1. Readiness Checks That Create False Confidence

**What goes wrong:** Checks only verify that env vars exist, not whether values are safe for production.

**Prevention:**

- Validate unsafe values such as wildcard credentialed origins, insecure production cookies, placeholder secrets, demo seed enabled, and missing migration head.
- Return remediation hints, not just green/red booleans.
- Keep `/health/live` separate from full readiness.

**Phase:** 7

### 2. Treating SOS Email as Source of Truth

**What goes wrong:** Email success/failure starts driving SOS status or replaces in-app notifications.

**Prevention:**

- Persist SOS and in-app notifications first.
- Treat email as best-effort delivery metadata.
- Never advance SOS status based on email delivery alone.

**Phase:** 8

### 3. Silent Email Failure

**What goes wrong:** SMTP/provider failure is swallowed or logged only in server logs.

**Prevention:**

- Record delivery attempts with status and error category.
- Show metadata-only delivery state to admins.
- Do not roll back SOS on email failure.

**Phase:** 8 and 11

### 4. Credential or Sensitive Content Leakage

**What goes wrong:** Email settings, provider errors, SOS notes, self-check answers, or chatbot text appear in frontend responses, audit metadata, emails, or logs.

**Prevention:**

- Mask secrets in readiness and admin operations.
- Keep email content minimal.
- Maintain forbidden audit metadata tests.
- Avoid raw exports.

**Phase:** 7, 8, and 11

### 5. UX Polish Only Hides Problems Visually

**What goes wrong:** Navigation is cleaned up, but wrong-role routes or privacy acknowledgement bypasses remain accessible.

**Prevention:**

- Keep backend gates authoritative.
- Add frontend tests for role nav and privacy redirect.
- Add regression tests for wrong-role and unacknowledged student access.

**Phase:** 9

### 6. Nested Content Editors Publish Broken Structures

**What goes wrong:** Admin can save incomplete questions, choices, thresholds, scenario feedback, or lifecycle states that break student flows.

**Prevention:**

- Validate nested structures before publish.
- Show actionable errors beside fields.
- Add preview before publish.
- Preserve snapshots/version-safe history.

**Phase:** 10

### 7. Operations UI Becomes Surveillance

**What goes wrong:** Admin operations dashboards expose raw sensitive student content, risk ranking, or per-student drilldowns under "support" or "debug" labels.

**Prevention:**

- Filter audit views to metadata-only fields.
- Suppress raw sensitive exports.
- Keep report and operations UI support-oriented.
- Test that forbidden strings/fields are absent.

**Phase:** 11

## Cross-Phase Guardrails

- Preserve privacy-by-default.
- Use role, relationship, and purpose authorization for sensitive resources.
- Keep provider secrets backend-only.
- Keep audit metadata minimal and purposeful.
- Keep student-facing copy supportive and non-clinical.
- Prefer additive changes over broad rewrites.

