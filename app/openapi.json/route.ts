import { NextRequest, NextResponse } from "next/server";
import {
  PAID_AUDIT_PATH,
  PAID_AUDIT_PRICE,
  paidAuditExample,
  paidAuditInputSchema,
} from "@/lib/x402";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "ProofFlow Audit API",
      version: "0.2.0",
      description: "Source-cited Devpost submission-compliance audits powered by Gemini and persisted in Firestore.",
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
      contact: { name: "ArgonautWorks", url: "https://github.com/ArgonautWorks/proofflow-agent" },
    },
    servers: [{ url: origin }],
    paths: {
      [PAID_AUDIT_PATH]: {
        post: {
          operationId: "createProofFlowAudit",
          summary: "Generate a persisted evidence audit for a public Devpost project",
          tags: ["Compliance audits"],
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: PAID_AUDIT_PRICE.slice(1) },
            protocols: [{ x402: {} }],
          },
          requestBody: {
            required: true,
            content: { "application/json": { schema: paidAuditInputSchema, example: paidAuditExample } },
          },
          responses: {
            201: { description: "Persisted JSON audit with requirement ledger and report route" },
            400: { description: "Invalid or unsupported public source; payment is not settled" },
            402: { description: "x402 Base-USDC payment challenge" },
            429: { description: "Daily paid capacity reached; payment is not settled" },
            503: { description: "Temporary upstream model failure; payment is not settled" },
          },
        },
      },
    },
  });
}
