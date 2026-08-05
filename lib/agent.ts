import { collectSources } from "@/lib/sources";
import { reasonAboutEvidence } from "@/lib/gemini";
import { persistAudit } from "@/lib/firestore";
import type { AgentAction, AuditInput } from "@/lib/types";

export async function runProofFlow(input: AuditInput) {
  const sourceSnapshot = await collectSources(input);
  const { audit: modelAudit, model } = await reasonAboutEvidence(sourceSnapshot);
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
      label: "Evidence pack assembled",
      detail: `${modelAudit.requirements.length} obligations mapped; ${missing} missing and ${partial} partial.`,
      status: missing === 0 ? "completed" : "attention",
    },
  ];

  return persistAudit({
    ...modelAudit,
    score: Math.max(0, Math.min(100, modelAudit.score)),
    actionsPerformed,
    sourceSnapshot,
    model,
    completedAt: new Date().toISOString(),
  });
}
