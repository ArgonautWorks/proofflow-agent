import { describe, expect, it } from "vitest";
import { createEvidenceReport } from "../lib/report";
import type { AuditResult } from "../lib/types";

const audit: AuditResult = {
  id: "AbCdEfGhIjKlMnOpQrSt",
  projectName: "ProofFlow Agent",
  contestName: "Agent Contest",
  executiveSummary: "A strict audit.",
  score: 75,
  overallStatus: "at-risk",
  requirements: [{
    id: "R1",
    title: "Public repository",
    requirement: "Publish code.",
    category: "Submission",
    status: "verified",
    severity: "critical",
    sourceExcerpt: "URL to your public code repository",
    evidence: ["README.md", "app/page.tsx"],
    rationale: "Files are public.",
    nextAction: "Keep the repository public.",
  }],
  topRisks: [],
  nextActions: ["Record the demo."],
  operationalPriority: {
    action: "Record the demo.",
    rationale: "The mandatory demo is the highest-impact gap.",
    selection: "gemma",
    model: "gemma-4-26b-a4b-it",
  },
  semanticAlignment: {
    model: "gemini-embedding-2",
    score: 0.8123,
    matchedRisk: "The deadline may be missed.",
  },
  actionsPerformed: [{ label: "Repository scanned", detail: "Two files found.", status: "completed" }],
  sourceSnapshot: {
    checkedAt: "2026-08-05T00:00:00.000Z",
    rules: { url: "https://example.devpost.com/rules", title: "Rules", text: "Rules", sha256: "abc123" },
    repository: {
      url: "https://github.com/ArgonautWorks/proofflow-agent",
      owner: "ArgonautWorks",
      name: "proofflow-agent",
      description: "",
      defaultBranch: "main",
      latestPushAt: "2026-08-05T00:00:00.000Z",
      readme: "README",
      files: ["README.md", "app/page.tsx"],
      treeTruncated: false,
    },
  },
  model: "gemini-3.6-flash",
  completedAt: "2026-08-05T00:00:00.000Z",
};

describe("evidence report", () => {
  it("exports requirements, evidence, actions, and the source lock", () => {
    const report = createEvidenceReport(audit);
    expect(report).toContain("ProofFlow evidence pack");
    expect(report).toContain("README.md; app/page.tsx");
    expect(report).toContain("Rules SHA-256: `abc123`");
    expect(report).toContain("Record the demo.");
    expect(report).toContain("Gemma 4");
    expect(report).toContain("81% alignment");
    expect(report).toContain("Gemini Embedding 2");
  });
});
