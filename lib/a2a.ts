import { randomUUID } from "node:crypto";
import { PAID_AUDIT_PATH, PAID_AUDIT_PRICE, paidAuditExample } from "./x402";

export const PROOFFLOW_SOURCE = "https://github.com/ArgonautWorks/proofflow-agent";
export const PROOFFLOW_DESCRIPTION = "Generate a source-cited Devpost submission-compliance ledger from public contest and project evidence.";

function normalizedOrigin(origin: string) {
  return new URL(origin).origin;
}

export function createAgentCard(origin: string) {
  const serviceOrigin = normalizedOrigin(origin);
  return {
    protocolVersion: "0.3.0",
    name: "ArgonautWorks ProofFlow Audit API",
    description: PROOFFLOW_DESCRIPTION,
    url: `${serviceOrigin}/a2a`,
    preferredTransport: "JSONRPC",
    additionalInterfaces: [{ url: `${serviceOrigin}/a2a`, transport: "JSONRPC" }],
    version: "0.3.0",
    provider: { organization: "ArgonautWorks", url: PROOFFLOW_SOURCE },
    capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
    documentationUrl: `${serviceOrigin}/openapi.json`,
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json"],
    skills: [{
      id: "proofflow-audit-purchase",
      name: "Buy a public Devpost compliance audit",
      description: "Discover the paid ProofFlow x402 audit route and its public-evidence input contract. A2A is discovery-only and never runs or purchases an audit.",
      tags: ["Devpost", "hackathon", "compliance", "evidence", "x402"],
      examples: ["How do I buy a submission audit?", "What public URLs does ProofFlow require?"],
    }],
  };
}

export function purchaseGuidance(origin: string) {
  const serviceOrigin = normalizedOrigin(origin);
  return [
    `Buy a persisted public-evidence Devpost compliance audit with POST ${serviceOrigin}${PAID_AUDIT_PATH}.`,
    `Price: ${PAID_AUDIT_PRICE} USDC on Base via x402 v2.`,
    `JSON body: ${JSON.stringify(paidAuditExample)}.`,
    `OpenAPI: ${serviceOrigin}/openapi.json.`,
    "A2A is discovery-only and never invokes Gemini, creates an audit, or initiates payment.",
  ].join(" ");
}

type A2aDependencies = {
  uuid?: () => string;
  now?: () => string;
};

export function createA2aResponse(body: unknown, origin: string, dependencies: A2aDependencies = {}) {
  const request = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null;
  const id = request?.id ?? null;
  if (!request || request.jsonrpc !== "2.0") {
    return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };
  }
  if (!["message/send", "SendMessage"].includes(String(request.method ?? ""))) {
    return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
  }
  const uuid = dependencies.uuid ?? randomUUID;
  const now = dependencies.now ?? (() => new Date().toISOString());
  return {
    jsonrpc: "2.0",
    id,
    result: {
      contextId: uuid(),
      history: [],
      id: uuid(),
      kind: "task",
      status: {
        state: "completed",
        timestamp: now(),
        message: {
          kind: "message",
          messageId: uuid(),
          role: "agent",
          parts: [{ kind: "text", text: purchaseGuidance(origin) }],
        },
      },
    },
  };
}
