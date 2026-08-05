import { NextRequest, NextResponse } from "next/server";
import {
  BASE_USDC,
  PAID_AUDIT_PATH,
  PAID_AUDIT_PRICE,
  PAY_TO,
  X402_NETWORK,
  paidAuditExample,
} from "@/lib/x402";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  return NextResponse.json({
    x402Version: 2,
    serviceName: "ProofFlow Audit API",
    description: "Generate a source-cited Devpost compliance ledger from public contest and project evidence.",
    source: "https://github.com/ArgonautWorks/proofflow-agent",
    resources: [{
      resource: `${origin}${PAID_AUDIT_PATH}`,
      method: "POST",
      price: PAID_AUDIT_PRICE,
      network: X402_NETWORK,
      asset: "USDC",
      asset_address: BASE_USDC,
      pay_to: PAY_TO,
      input: { body: paidAuditExample },
      result: "Persisted JSON evidence ledger with score, verified/partial/missing requirements, risks, next actions, and a Markdown report route.",
    }],
  });
}
