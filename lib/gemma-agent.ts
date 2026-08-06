import { reasonAboutEvidenceWithGemma, GEMMA_AUDIT_MODEL, type GemmaAuditDecision } from "@/lib/gemma-audit";
import { persistAudit } from "@/lib/firestore";
import { collectSources } from "@/lib/sources";
import type { AgentAction, AuditInput, AuditResult, SourceSnapshot } from "@/lib/types";

export interface GemmaProofFlowDependencies {
  collectSources: (input: AuditInput) => Promise<SourceSnapshot>;
  reasonAboutEvidence: (snapshot: SourceSnapshot) => Promise<GemmaAuditDecision>;
  persistAudit: (result: Omit<AuditResult, "id">) => Promise<AuditResult>;
}

const productionDependencies: GemmaProofFlowDependencies = {
  collectSources,
  reasonAboutEvidence: reasonAboutEvidenceWithGemma,
  persistAudit,
};

/**
 * Isolated Gemma-first workflow. It neither calls the Gemini-first audit path
 * nor embedding services, so persisted provenance remains unambiguous.
 */
export async function runGemmaProofFlow(
  input: AuditInput,
  dependencies: GemmaProofFlowDependencies = productionDependencies,
): Promise<AuditResult> {
  const sourceSnapshot = await dependencies.collectSources(input);
  const { audit: modelAudit, operationalPriority } = await dependencies.reasonAboutEvidence(sourceSnapshot);
  const missing = modelAudit.requirements.filter((item) => item.status === "missing").length;
  const partial = modelAudit.requirements.filter((item) => item.status === "partial").length;
  const actionsPerformed: AgentAction[] = [
    {
      label: "Rules ingested",
      detail: `Locked ${sourceSnapshot.rules.sha256.slice(0, 12)}… from the binding rules page.`,
      status: "completed",
    },
    {
      label: "Repository scanned",
      detail: `Verified ${sourceSnapshot.repository.files.length} public files on ${sourceSnapshot.repository.defaultBranch}.`,
      status: "completed",
    },
    {
      label: "Deployment probed",
      detail: sourceSnapshot.deployment
        ? `Received HTTP ${sourceSnapshot.deployment.status} from the supplied project URL.`
        : "No deployment URL was supplied for this run.",
      status: sourceSnapshot.deployment?.reachable ? "completed" : "attention",
    },
    {
      label: "Gemma evidence ledger assembled",
      detail: `${modelAudit.requirements.length} obligations mapped; ${missing} missing and ${partial} partial.`,
      status: missing === 0 ? "completed" : "attention",
    },
    {
      label: "Operational priority bound",
      detail: `Gemma selected one existing action from ${modelAudit.nextActions.length} candidates.`,
      status: "completed",
    },
  ];

  return dependencies.persistAudit({
    ...modelAudit,
    score: Math.max(0, Math.min(100, modelAudit.score)),
    operationalPriority,
    actionsPerformed,
    sourceSnapshot,
    model: GEMMA_AUDIT_MODEL,
    auditMode: "gemma-core",
    completedAt: new Date().toISOString(),
  });
}
