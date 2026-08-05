import { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer } from "@x402/core/server";
import type { RouteConfig } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

export const PAY_TO = "0x5e2023b1D1366d6366E768fe432AD627bfAa5d57";
export const X402_NETWORK = "eip155:8453";
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const PAID_AUDIT_PRICE = "$0.05";
export const PAID_AUDIT_PRICE_ATOMIC = "50000";
export const PAID_AUDIT_PATH = "/api/v1/audits";

export const paidAuditInputSchema = {
  type: "object",
  required: ["rulesUrl", "repoUrl"],
  properties: {
    rulesUrl: {
      type: "string",
      pattern: "^https://",
      description: "Official Devpost contest rules URL.",
    },
    repoUrl: {
      type: "string",
      pattern: "^https://",
      description: "Public GitHub repository root URL.",
    },
    projectUrl: {
      type: "string",
      pattern: "^https://",
      description: "Optional public Vercel or Devpost deployment URL.",
    },
  },
  additionalProperties: false,
} as const;

export const paidAuditExample = {
  rulesUrl: "https://allthingsagentichackathon.devpost.com/rules",
  repoUrl: "https://github.com/ArgonautWorks/proofflow-agent",
  projectUrl: "https://proofflow-agent.vercel.app",
};

export function paidAuditPurchaseDescription(origin: string) {
  const serviceOrigin = new URL(origin).origin;
  return {
    service: "ProofFlow Audit API",
    description: "Generate a source-cited Devpost submission-compliance audit from public contest and project evidence.",
    paid_operation: {
      method: "POST",
      url: `${serviceOrigin}${PAID_AUDIT_PATH}`,
      price: PAID_AUDIT_PRICE,
      settlement: {
        protocol: "x402",
        version: 2,
        network: X402_NETWORK,
        asset: "USDC",
        asset_address: BASE_USDC,
        pay_to: PAY_TO,
      },
      input_schema: paidAuditInputSchema,
      example: paidAuditExample,
    },
    output: "Persisted JSON evidence ledger with score, requirements, risks, next actions, source fingerprints, and report routes.",
    openapi: `${serviceOrigin}/openapi.json`,
    x402_manifest: `${serviceOrigin}/.well-known/x402`,
    a2a_agent_card: `${serviceOrigin}/.well-known/agent-card.json`,
    charged: false,
  };
}

const outputExample = {
  audit: {
    id: "TiuPE6fJv3JuAamQvAIp",
    score: 95,
    overallStatus: "ready",
    requirements: [
      {
        id: "req-demo-video",
        status: "verified",
        evidence: ["README.md", "https://youtu.be/kqhoyUaeGdI"],
      },
    ],
  },
};

const facilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL ?? "https://facilitator.payai.network",
});

export const x402Server = new x402ResourceServer(facilitator)
  .register(X402_NETWORK, new ExactEvmScheme());

export const paidAuditRouteConfig = {
  accepts: {
    scheme: "exact",
    price: PAID_AUDIT_PRICE,
    network: X402_NETWORK,
    payTo: PAY_TO,
  },
  description: "Generate a source-cited Devpost submission-compliance audit from public rules, repository, and deployment evidence.",
  mimeType: "application/json",
  serviceName: "ProofFlow Audit API",
  tags: ["hackathon", "compliance", "Devpost", "evidence", "Gemini", "Firestore"],
  extensions: declareDiscoveryExtension({
    input: paidAuditExample,
    inputSchema: paidAuditInputSchema,
    bodyType: "json",
    output: { example: outputExample },
  }),
} satisfies RouteConfig;

export const x402HttpServer = new x402HTTPResourceServer(x402Server, {
  [`POST ${PAID_AUDIT_PATH}`]: paidAuditRouteConfig,
});
