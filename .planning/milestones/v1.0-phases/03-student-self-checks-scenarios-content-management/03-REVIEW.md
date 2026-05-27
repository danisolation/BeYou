---
phase: 03-student-self-checks-scenarios-content-management
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 51
files_reviewed_list:
  - backend/alembic/versions/20260521_0003_self_checks_scenarios.py
  - backend/app/api/admin_content.py
  - backend/app/api/adult_summaries.py
  - backend/app/api/student_scenarios.py
  - backend/app/api/student_self_checks.py
  - backend/app/core/authorization.py
  - backend/app/db/models.py
  - backend/app/main.py
  - backend/app/schemas/admin_content.py
  - backend/app/schemas/adult_summaries.py
  - backend/app/schemas/scenarios.py
  - backend/app/schemas/self_checks.py
  - backend/app/seeds/demo_seed.py
  - backend/app/services/admin_content.py
  - backend/app/services/adult_summaries.py
  - backend/app/services/audit.py
  - backend/app/services/scenarios.py
  - backend/app/services/self_checks.py
  - backend/tests/test_admin_users_links.py
  - backend/tests/test_auth_privacy_portals.py
  - backend/tests/test_authorization_security.py
  - backend/tests/test_demo_seed.py
  - backend/tests/test_phase2_security_regression.py
  - backend/tests/test_phase3_admin_content_seed.py
  - backend/tests/test_phase3_adult_summaries.py
  - backend/tests/test_phase3_domain_migration.py
  - backend/tests/test_phase3_security_regression.py
  - backend/tests/test_phase3_student_scenarios.py
  - backend/tests/test_phase3_student_self_checks.py
  - frontend/app/(authenticated)/admin/content/page.tsx
  - frontend/app/(authenticated)/admin/page.tsx
  - frontend/app/(authenticated)/parent/page.tsx
  - frontend/app/(authenticated)/parent/students/[studentId]/self-check-summaries/page.tsx
  - frontend/app/(authenticated)/student/page.tsx
  - frontend/app/(authenticated)/student/scenarios/[scenarioId]/page.tsx
  - frontend/app/(authenticated)/student/scenarios/history/page.tsx
  - frontend/app/(authenticated)/student/scenarios/page.tsx
  - frontend/app/(authenticated)/student/self-checks/[testId]/page.tsx
  - frontend/app/(authenticated)/student/self-checks/history/[attemptId]/page.tsx
  - frontend/app/(authenticated)/student/self-checks/history/page.tsx
  - frontend/app/(authenticated)/student/self-checks/page.tsx
  - frontend/app/(authenticated)/student/self-checks/results/[attemptId]/page.tsx
  - frontend/app/(authenticated)/teacher/page.tsx
  - frontend/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page.tsx
  - frontend/components/admin/destructive-confirm-dialog.tsx
  - frontend/lib/admin-content-api.ts
  - frontend/lib/adult-summary-api.ts
  - frontend/lib/wellbeing-api.ts
  - frontend/tests/adult-admin-content-ui.test.tsx
  - frontend/tests/e2e/phase3-wellbeing-content.spec.ts
  - frontend/tests/student-wellbeing-ui.test.tsx
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-21T00:00:00Z  
**Depth:** standard  
**Files Reviewed:** 51  
**Status:** issues_found

## Summary

Reviewed Phase 03 backend, frontend, migrations, services, schemas, and tests for privacy, authorization, content lifecycle, self-check/scenario behavior, and cookie-authenticated frontend API usage.

No critical privacy/security leak was found in the adult summary endpoints: raw self-check answers are not returned to adults/admins, and adult summary reads are audited with metadata-only summaries.

Two frontend admin content-management reliability issues were found.

## Warnings

### WR-01: Editing self-check nested fields can silently delete existing questions/thresholds

**File:** `frontend/app/(authenticated)/admin/content/page.tsx:179-215`

**Issue:** `updateSelfCheckQuestion`, `updateSelfCheckChoice`, and `updateThreshold` replace nested arrays with only the first question/threshold. If an admin edits seeded or existing multi-question content, saving can drop additional questions and/or thresholds, causing data loss and potentially making published content invalid.

**Fix:** Preserve existing nested arrays when updating a single item, e.g.:

```tsx
setSelfCheckDraft((current) => ({
  ...current,
  questions: current.questions.map((question, index) =>
    index === 0 ? { ...question, text: value } : question,
  ),
}));

setSelfCheckDraft((current) => ({
  ...current,
  thresholds: current.thresholds.map((threshold, index) =>
    index === 0
      ? {
          ...threshold,
          [field]: numericFields.includes(String(field)) ? Number(value) : value,
        }
      : threshold,
  ),
}));
```

### WR-02: Scenario draft delete button is non-functional

**File:** `frontend/app/(authenticated)/admin/content/page.tsx:501-503`

**Issue:** The "Xoa ban nhap tinh huong chua dung" button has no `onClick`, no confirmation state, and does not call `deleteDraftAdminScenario`. This creates a broken admin content lifecycle action for scenarios.

**Fix:** Import and wire `deleteDraftAdminScenario`, add a `"delete-scenario"` confirmation type, and handle it in `handleConfirm`.

```tsx
import { deleteDraftAdminScenario } from "@/lib/admin-content-api";

type ConfirmationState =
  | { type: "archive-self-check"; id: string }
  | { type: "delete-self-check"; id: string }
  | { type: "archive-scenario"; id: string }
  | { type: "delete-scenario"; id: string }
  | null;

if (confirmation?.type === "delete-scenario") {
  await runAction(() => deleteDraftAdminScenario(confirmation.id));
}
```

---

_Reviewed: 2026-05-21T00:00:00Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
