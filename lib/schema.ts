import { z } from "zod";

const requirementSchema = z.object({
  id: z.string().min(1).max(32),
  title: z.string().min(1).max(100),
  requirement: z.string().min(1).max(500),
  category: z.string().min(1).max(80),
  status: z.enum(["verified", "partial", "missing"]),
  severity: z.enum(["critical", "important", "optional"]),
  sourceExcerpt: z.string().min(1).max(300),
  evidence: z.array(z.string().min(1).max(300)).max(6),
  rationale: z.string().min(1).max(500),
  nextAction: z.string().min(1).max(300),
});

export const modelAuditSchema = z.object({
  projectName: z.string().min(1).max(100),
  contestName: z.string().min(1).max(120),
  executiveSummary: z.string().min(1).max(700),
  score: z.number().int().min(0).max(100),
  overallStatus: z.enum(["ready", "at-risk", "blocked"]),
  requirements: z.array(requirementSchema).min(3).max(14),
  topRisks: z.array(z.string().min(1).max(300)).max(5),
  nextActions: z.array(z.string().min(1).max(300)).min(1).max(6),
});

export const auditInputSchema = z.object({
  rulesUrl: z.string().url().max(500),
  repoUrl: z.string().url().max(500),
  projectUrl: z.union([z.string().url().max(500), z.literal("")]).optional(),
});

export const auditJsonSchema = {
  type: "object",
  properties: {
    projectName: { type: "string", description: "Project name supported by repository evidence." },
    contestName: { type: "string", description: "Contest name supported by rules evidence." },
    executiveSummary: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    overallStatus: { type: "string", enum: ["ready", "at-risk", "blocked"] },
    requirements: {
      type: "array",
      minItems: 3,
      maxItems: 14,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          requirement: { type: "string" },
          category: { type: "string" },
          status: { type: "string", enum: ["verified", "partial", "missing"] },
          severity: { type: "string", enum: ["critical", "important", "optional"] },
          sourceExcerpt: { type: "string" },
          evidence: { type: "array", items: { type: "string" }, maxItems: 6 },
          rationale: { type: "string" },
          nextAction: { type: "string" },
        },
        required: [
          "id",
          "title",
          "requirement",
          "category",
          "status",
          "severity",
          "sourceExcerpt",
          "evidence",
          "rationale",
          "nextAction"
        ],
        additionalProperties: false,
      },
    },
    topRisks: { type: "array", items: { type: "string" }, maxItems: 5 },
    nextActions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
  },
  required: [
    "projectName",
    "contestName",
    "executiveSummary",
    "score",
    "overallStatus",
    "requirements",
    "topRisks",
    "nextActions"
  ],
  additionalProperties: false,
} as const;
