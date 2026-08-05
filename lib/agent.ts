import { collectSources } from "@/lib/sources";
import { reasonAboutEvidence } from "@/lib/gemini";
import { selectOperationalPriority } from "@/lib/gemma";
import { measurePriorityAlignment } from "@/lib/embedding";
import { persistAudit } from "@/lib/firestore";
import type { AgentAction, AuditInput, OperationalPriority, SemanticAlignment } from "@/lib/types";

export async function runProofFlow(input: AuditInput) {
  const sourceSnapshot = await collectSources(input);
  const { audit: modelAudit, model } = await reasonAboutEvidence(sourceSnapshot);
  const missing = modelAudit.requirements.filter((item) => item.status === "missing").length;
  const partial = modelAudit.requirements.filter((item) => item.status === "partial").length;
  let operationalPriority: OperationalPriority;
  try {
    operationalPriority = await selectOperationalPriority({
      projectName: modelAudit.projectName,
      overallStatus: modelAudit.overallStatus,
      topRisks: modelAudit.topRisks,
      nextActions: modelAudit.nextActions,
    });
  } catch {
    operationalPriority = {
      action: modelAudit.nextActions[0],
      rationale: "The secondary model was unavailable, so the first validated audit action was preserved deterministically.",
      selection: "deterministic",
      model: null,
    };
  }
  let semanticAlignment: SemanticAlignment | undefined;
  try {
    semanticAlignment = await measurePriorityAlignment({
      action: operationalPriority.action,
      risks: modelAudit.topRisks,
    });
  } catch {
    semanticAlignment = undefined;
  }
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
      label: "Evidence pack assembled",
      detail: `${modelAudit.requirements.length} obligations mapped; ${missing} missing and ${partial} partial.`,
      status: missing === 0 ? "completed" : "attention",
    },
    {
      label: "Operational priority selected",
      detail: operationalPriority.selection === "gemma"
        ? `Gemma 4 selected one evidence-bound action from ${modelAudit.nextActions.length} candidates.`
        : "The validated first action was retained without weakening the core audit.",
      status: operationalPriority.selection === "gemma" ? "completed" : "attention",
    },
    {
      label: "Priority grounding measured",
      detail: semanticAlignment
        ? `Gemini Embedding 2 measured ${Math.round(semanticAlignment.score * 100)}% semantic alignment to the closest validated risk.`
        : "The optional embedding check was unavailable; the validated priority remains unchanged.",
      status: semanticAlignment ? "completed" : "attention",
    },
  ];

  return persistAudit({
    ...modelAudit,
    score: Math.max(0, Math.min(100, modelAudit.score)),
    operationalPriority,
    semanticAlignment,
    actionsPerformed,
    sourceSnapshot,
    model,
    completedAt: new Date().toISOString(),
  });
}
