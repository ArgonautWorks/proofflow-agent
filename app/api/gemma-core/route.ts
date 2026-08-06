import { NextRequest, NextResponse } from "next/server";
import { runGemmaProofFlow } from "@/lib/gemma-agent";
import { enforceRateLimit } from "@/lib/firestore";
import { auditErrorResponse } from "@/lib/http";
import { auditInputSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 10_000;

function clientIp(request: NextRequest): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }
    const input = auditInputSchema.parse(JSON.parse(body));
    await enforceRateLimit(clientIp(request));
    const audit = await runGemmaProofFlow({
      rulesUrl: input.rulesUrl,
      repoUrl: input.repoUrl,
      projectUrl: input.projectUrl || undefined,
    });
    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    return auditErrorResponse(error);
  }
}
