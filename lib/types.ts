export type RequirementStatus = "verified" | "partial" | "missing";
export type RequirementSeverity = "critical" | "important" | "optional";

export interface AuditInput {
  rulesUrl: string;
  repoUrl: string;
  projectUrl?: string;
}

export interface SourceSnapshot {
  checkedAt: string;
  rules: {
    url: string;
    title: string;
    text: string;
    sha256: string;
  };
  repository: {
    url: string;
    owner: string;
    name: string;
    description: string;
    defaultBranch: string;
    latestPushAt: string;
    readme: string;
    files: string[];
    treeTruncated: boolean;
  };
  deployment?: {
    url: string;
    status: number;
    contentType: string;
    reachable: boolean;
  };
}

export interface AuditRequirement {
  id: string;
  title: string;
  requirement: string;
  category: string;
  status: RequirementStatus;
  severity: RequirementSeverity;
  sourceExcerpt: string;
  evidence: string[];
  rationale: string;
  nextAction: string;
}

export interface AgentAction {
  label: string;
  detail: string;
  status: "completed" | "attention";
}

export interface OperationalPriority {
  action: string;
  rationale: string;
  selection: "gemma" | "deterministic";
  model: string | null;
}

export interface AuditResult {
  id: string;
  projectName: string;
  contestName: string;
  executiveSummary: string;
  score: number;
  overallStatus: "ready" | "at-risk" | "blocked";
  requirements: AuditRequirement[];
  topRisks: string[];
  nextActions: string[];
  operationalPriority?: OperationalPriority;
  actionsPerformed: AgentAction[];
  sourceSnapshot: SourceSnapshot;
  model: string;
  completedAt: string;
}

export interface AuditCounts {
  verified: number;
  partial: number;
  missing: number;
}
