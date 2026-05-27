---
phase: 05-supportive-chatbot-gateway-guardrails
status: findings
reviewed: 2026-05-21
---

# Phase 05 Code Review

High-signal review of Phase 05 backend/frontend chatbot changes found two real backend issues.

## Findings

### F-01 High: first high-risk response omitted chatbot disclaimer

- **File:** `backend/app/services/chat.py`
- **Problem:** When the first student message was high-risk, the backend returned escalation guidance directly without the first-response disclaimer: `BeYou không thay thế chuyên gia tư vấn hay bác sĩ...`
- **Impact:** A student in crisis might not see the required non-clinical boundary on the first bot response, weakening CHAT-04/SAFE-06.
- **Fix required:** Wrap high-risk escalation text with the same first-response intro when `first_response` is true.

### F-02 Medium: provider failures were silently swallowed

- **File:** `backend/app/services/chat.py`
- **Problem:** Provider exceptions fell back to deterministic response without logging.
- **Impact:** Misconfiguration, auth failures, timeouts, or provider abuse signals would be hard to diagnose.
- **Fix required:** Log provider fallback with exception type and stack trace while continuing safe deterministic fallback.

## No Findings

- No frontend API-key exposure found.
- No adult/admin raw transcript endpoint found.
- Same-site mutation guards are present on chat send and admin config patch.
- High-risk audit metadata remains summary-only.
