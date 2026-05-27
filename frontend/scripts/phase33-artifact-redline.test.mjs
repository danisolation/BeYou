import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ARTIFACTS = [
  {
    label: "UI inventory",
    path: "../../.planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md",
  },
  {
    label: "performance baseline",
    path: "../../.planning/phases/33-cross-role-ui-performance-baseline-audit/33-PERFORMANCE-BASELINE.md",
  },
];

const DOWNSTREAM_PHASE_PATTERN = /\bPhase 3[4-8]\b/;

const GLOBAL_REDLINES = [
  {
    label: "email-shaped string",
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  },
  {
    label: "UUID-shaped raw identifier",
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  },
  {
    label: "JWT-shaped string",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  },
  {
    label: "Bearer token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
  },
  {
    label: "Set-Cookie evidence",
    pattern: /\bSet-Cookie\b/i,
  },
  {
    label: "Cookie header evidence",
    pattern: /\bCookie\s*:/i,
  },
  {
    label: "localStorage evidence",
    pattern: /\blocalStorage\b/,
  },
  {
    label: "sessionStorage evidence",
    pattern: /\bsessionStorage\b/,
  },
];

const POLICY_SECTION_REDLINES = [
  {
    label: "raw body heading/table evidence",
    pattern: /\b(raw body|request body|response body|full payload|body dump)\b/i,
  },
  {
    label: "raw sensitive evidence label",
    pattern:
      /\b(private note value|transcript value|self-check answer value|provider claim value|free-text reason value)\b/i,
  },
  {
    label: "forbidden product surface in evidence rows",
    pattern: /\b(risk leaderboard|per-student drilldown|raw audit browser|destructive reset control)s?\b/i,
  },
];

function artifactText(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function removePrivacyRedlinesSections(markdown) {
  return markdown.replace(
    /^## Privacy Redlines\b[\s\S]*?(?=^## (?!#)|(?![\s\S]))/gim,
    "\n## Privacy Redlines\n[policy redlines omitted for scoped evidence scan]\n",
  );
}

function candidatePhaseCells(markdown) {
  const lines = markdown.split(/\r?\n/);
  const cells = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("|") || !line.includes("|")) {
      continue;
    }

    const columns = line
      .split("|")
      .slice(1, -1)
      .map((column) => column.trim());
    const candidateIndex = columns.findIndex((column) => column.toLowerCase() === "candidate follow-up phase");
    if (candidateIndex === -1) {
      continue;
    }

    for (let rowIndex = index + 1; rowIndex < lines.length; rowIndex += 1) {
      const row = lines[rowIndex];
      if (!row.startsWith("|")) {
        break;
      }

      const rowColumns = row
        .split("|")
        .slice(1, -1)
        .map((column) => column.trim());
      const separator = rowColumns.every((column) => /^:?-{3,}:?$/.test(column));
      if (!separator && rowColumns[candidateIndex]) {
        cells.push(rowColumns[candidateIndex]);
      }
    }
  }

  return cells;
}

test("Phase 33 artifacts do not contain globally forbidden raw evidence", () => {
  for (const artifact of ARTIFACTS) {
    const markdown = artifactText(artifact.path);

    for (const redline of GLOBAL_REDLINES) {
      assert.doesNotMatch(markdown, redline.pattern, `${artifact.label} contains ${redline.label}`);
    }
  }
});

test("Phase 33 artifacts keep policy-only forbidden terms out of evidence rows", () => {
  for (const artifact of ARTIFACTS) {
    const evidenceMarkdown = removePrivacyRedlinesSections(artifactText(artifact.path));

    for (const redline of POLICY_SECTION_REDLINES) {
      assert.doesNotMatch(evidenceMarkdown, redline.pattern, `${artifact.label} contains ${redline.label}`);
    }
  }
});

test("Phase 33 artifacts have concrete downstream candidate routing", () => {
  for (const artifact of ARTIFACTS) {
    const markdown = artifactText(artifact.path);
    const cells = candidatePhaseCells(markdown);

    assert.match(markdown, /## Privacy Redlines\b/, `${artifact.label} is missing Privacy Redlines`);
    assert.match(
      markdown,
      /\bCandidate follow-up phase\b/,
      `${artifact.label} is missing Candidate follow-up phase`,
    );
    assert.match(markdown, DOWNSTREAM_PHASE_PATTERN, `${artifact.label} is missing a downstream Phase 34-38 label`);
    assert.ok(cells.length > 0, `${artifact.label} has no Candidate follow-up phase cells`);
    assert.equal(
      cells.filter((cell) => /^TBD$/i.test(cell)).length,
      0,
      `${artifact.label} contains TBD candidate follow-up phase cells`,
    );
    for (const cell of cells) {
      assert.match(cell, DOWNSTREAM_PHASE_PATTERN, `${artifact.label} has non-concrete candidate cell: ${cell}`);
    }
  }
});
