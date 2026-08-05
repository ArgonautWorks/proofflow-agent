import { NextResponse } from "next/server";
import { PAID_AUDIT_PATH, PAID_AUDIT_PRICE } from "@/lib/x402";

export function GET() {
  return new NextResponse([
    "# ProofFlow Audit API",
    "",
    "Generate a source-cited Devpost submission-compliance audit from an official rules page, public GitHub repository, and optional public deployment.",
    "",
    `Paid JSON POST: ${PAID_AUDIT_PATH}`,
    `Price: ${PAID_AUDIT_PRICE} USDC on Base via x402 v2.`,
    "Body: {rulesUrl, repoUrl, projectUrl?}",
    "Output: persisted evidence ledger with score, requirements, evidence, risks, next actions, source hashes, and model provenance.",
    "Failed validation, capacity checks, and upstream model failures are not settled.",
    "Free trial UI: /",
    "OpenAPI: /openapi.json",
    "x402 manifest: /.well-known/x402",
    "A2A discovery: /.well-known/agent-card.json and POST /a2a.",
    "PayanAgent relay: https://payanagent.com/x402/kh78bdhmjvfteqqpfq06e5g3g98bw5ks",
    "Source: https://github.com/ArgonautWorks/proofflow-agent",
    "",
  ].join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
