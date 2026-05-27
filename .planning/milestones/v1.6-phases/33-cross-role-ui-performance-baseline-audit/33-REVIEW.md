---
phase: 33-cross-role-ui-performance-baseline-audit
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - backend/tests/test_phase33_performance_baseline.py
  - frontend/scripts/phase33-artifact-redline.test.mjs
  - frontend/scripts/phase33-frontend-baseline.mjs
  - frontend/scripts/phase33-frontend-baseline.test.mjs
  - frontend/tests/phase33-ui-inventory.test.tsx
findings:
  critical: 0
  warning: 4
  info: 0
  total: 4
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-26T00:00:00Z  
**Depth:** standard  
**Files Reviewed:** 5  
**Status:** issues_found

## Summary

Reviewed the Phase 33 backend/frontend baseline helpers and tests for evidence reliability, aggregate-only constraints, privacy redlines, and brittle logic. No critical security leaks were found, but several warning-level issues could allow Phase 33 evidence to appear valid while missing broken endpoints, undercounting frontend request candidates, or failing to validate actual artifact content.

## Warnings

### WR-01: Backend baseline accepts failed endpoints as valid evidence

**File:** `backend/tests/test_phase33_performance_baseline.py:363-364`

**Issue:** The test only asserts that status categories are within `2xx` through `5xx`, so broken endpoints returning `4xx`/`5xx` still pass and can be recorded as baseline evidence.

**Fix:** Require expected successful status categories per endpoint.

```python
for row in evidence_rows:
    assert row["statusCategory"] == "2xx", row
```

Or add an explicit expected status category to each endpoint spec and assert exact matches.

### WR-02: Frontend baseline undercounts fetch candidates from relative imports

**File:** `frontend/scripts/phase33-frontend-baseline.mjs:86-99`

**Issue:** `localImportCandidates()` filters for relative imports but only resolves `@/` aliases. Route files that import local components/hooks via `./` or `../` are ignored, causing `fetchCandidateCount` and `waterfallCount` to be incomplete.

**Fix:** Resolve relative imports from the route source file directory.

```js
function localImportCandidates(source, fromRelativePath) {
  const imports = [];
  const importPattern = /from\s+["']([^"']+)["']/g;
  const baseDir = path.dirname(fromRelativePath);

  for (const match of source.matchAll(importPattern)) {
    const importPath = match[1];
    const candidates = importPath.startsWith("@/")
      ? [`${importPath.slice(2)}.ts`, `${importPath.slice(2)}.tsx`]
      : importPath.startsWith(".")
        ? [
            path.normalize(path.join(baseDir, `${importPath}.ts`)),
            path.normalize(path.join(baseDir, `${importPath}.tsx`)),
            path.normalize(path.join(baseDir, importPath, "index.ts")),
            path.normalize(path.join(baseDir, importPath, "index.tsx")),
          ]
        : [];

    imports.push(...candidates);
  }

  return imports.filter((candidate) => existsSync(sourcePath(candidate)));
}
```

### WR-03: Aggregate-only validator skips nested approved values

**File:** `frontend/scripts/phase33-frontend-baseline.test.mjs:37-46`

**Issue:** `assertApprovedKeysOnly()` immediately continues for approved keys, so nested objects under approved keys such as `buildEvidence` are not recursively checked for forbidden fields.

**Fix:** Recurse into nested approved values before continuing, or validate nested schemas explicitly.

```js
if (APPROVED_OUTPUT_KEYS.includes(key)) {
  assertApprovedKeysOnly(nested);
  continue;
}
```

### WR-04: UI inventory test validates synthetic rows, not the Phase 33 artifact

**File:** `frontend/tests/phase33-ui-inventory.test.tsx:141-151`

**Issue:** The test generates `phase33InventoryCoverage` in memory and validates that generated matrix. It does not parse or validate `33-UI-INVENTORY.md`, so the artifact can omit routes, states, categories, severities, or follow-up phases while tests still pass.

**Fix:** Parse the actual inventory artifact or generate the artifact from the same exported matrix. At minimum, read `33-UI-INVENTORY.md` and assert each required route/state/category/follow-up phase appears there.

---

_Reviewed: 2026-05-26T00:00:00Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
