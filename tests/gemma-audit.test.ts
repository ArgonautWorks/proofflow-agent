import { describe, expect, it, vi } from "vitest";
import { auditFromFunctionCalls } from "../lib/gemma-audit";
import { runGemmaProofFlow } from "../lib/gemma-agent";
import type { AuditResult, SourceSnapshot } from "../lib/types";

const snapshot: SourceSnapshot = {
  checkedAt: "2026-08-06T00:00:00.000Z",
  rules: {
    url: "https://example.devpost.com/rules",
    title: "Example rules",
    text: "Submit a public repository. Include a deployed project. Record a demo video.",
    sha256: "rules-lock",
  },
  repository: {
    url: "https://github.com/example/project",
    owner: "example",
    name: "project",
    description: "Example project",
    defaultBranch: "main",
    latestPushAt: "2026-08-06T00:00:00.000Z",
    readme: "A deployed project with a demo.",
    files: ["README.md", "app/page.tsx"],
    treeTruncated: false,
  },
  deployment: {
    url: "https://example.vercel.app/",
    status: 200,
    contentType: "text/html",
    reachable: true,
  },
};

function validAudit() {
  return {
    projectName: "Example Project",
    contestName: "Example Contest",
    executiveSummary: "Public project evidence was checked against the supplied rules.",
    score: 67,
    overallStatus: "at-risk" as const,
    requirements: [
      {
        id: "R1", title: "Public repository", requirement: "Submit a public repository.", category: "Submission",
        status: "verified" as const, severity: "critical" as const, sourceExcerpt: "Submit a public repository.",
        evidence: ["README.md"], rationale: "The observed repository contains a README.", nextAction: "Keep the repository public.",
      },
      {
        id: "R2", title: "Deployment", requirement: "Include a deployed project.", category: "Submission",
        status: "partial" as const, severity: "important" as const, sourceExcerpt: "Include a deployed project.",
        evidence: ["https://example.vercel.app/"], rationale: "The observed URL responded, but manual submission fields remain.", nextAction: "Confirm the deployment URL in the submission.",
      },
      {
        id: "R3", title: "Demo", requirement: "Record a demo video.", category: "Submission",
        status: "missing" as const, severity: "critical" as const, sourceExcerpt: "Record a demo video.",
        evidence: [], rationale: "No observed project source proves a demo video.", nextAction: "Record the required demo video.",
      },
    ],
    topRisks: ["The required demo is not evidenced."],
    nextActions: ["Record the required demo video.", "Confirm the deployment URL in the submission."],
  };
}

function functionCall(audit = validAudit(), priorityIndex = 0) {
  return [{
    name: "submit_evidence_audit",
    args: { audit, priorityIndex, priorityRationale: "The demo is the only critical requirement with no observed evidence." },
  }] as never;
}

describe("Gemma-first evidence audit", () => {
  it("parses exactly one forced function call and binds an existing next action", () => {
    const decision = auditFromFunctionCalls(functionCall(), snapshot);
    expect(decision.audit).toEqual(validAudit());
    expect(decision.operationalPriority).toMatchObject({
      action: "Record the required demo video.",
      selection: "gemma",
      model: "gemma-4-26b-a4b-it",
    });
  });

  it("fails closed on malformed calls, invented excerpts, and invented evidence", () => {
    expect(() => auditFromFunctionCalls([{ name: "submit_evidence_audit", args: {} }] as never, snapshot)).toThrow();
    const inventedExcerpt = validAudit();
    inventedExcerpt.requirements[0].sourceExcerpt = "Use a non-existent sponsor technology.";
    expect(() => auditFromFunctionCalls(functionCall(inventedExcerpt), snapshot)).toThrow(/excerpt/);
    const inventedEvidence = validAudit();
    inventedEvidence.requirements[0].evidence = ["src/invented.ts"];
    expect(() => auditFromFunctionCalls(functionCall(inventedEvidence), snapshot)).toThrow(/evidence/);
  });

  it("rejects rule-only proof and evidence on missing requirements", () => {
    const ruleOnly = validAudit();
    ruleOnly.requirements[0].evidence = [snapshot.rules.url];
    expect(() => auditFromFunctionCalls(functionCall(ruleOnly), snapshot)).toThrow(/evidence/);
    const missingWithEvidence = validAudit();
    missingWithEvidence.requirements[2].evidence = ["README.md"];
    expect(() => auditFromFunctionCalls(functionCall(missingWithEvidence), snapshot)).toThrow(/missing/);
  });

  it("runs and persists the isolated orchestration with no network dependencies", async () => {
    const persistAudit = vi.fn(async (result: Omit<AuditResult, "id">): Promise<AuditResult> => ({ ...result, id: "GemmaCoreRun01" }));
    const result = await runGemmaProofFlow(
      { rulesUrl: snapshot.rules.url, repoUrl: snapshot.repository.url, projectUrl: snapshot.deployment?.url },
      {
        collectSources: vi.fn(async () => snapshot),
        reasonAboutEvidence: vi.fn(async () => auditFromFunctionCalls(functionCall(), snapshot)),
        persistAudit,
      },
    );
    expect(result).toMatchObject({ id: "GemmaCoreRun01", model: "gemma-4-26b-a4b-it", auditMode: "gemma-core" });
    expect(result.operationalPriority?.action).toBe("Record the required demo video.");
    expect(result.semanticAlignment).toBeUndefined();
    expect(persistAudit).toHaveBeenCalledOnce();
  });
});
