import { NextRequest, NextResponse } from "next/server";
import { runProofFlow } from "@/lib/agent";
import { enforceRateLimit } from "@/lib/firestore";
import { auditInputSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientIp(request: NextRequest): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 10_000) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    const input = auditInputSchema.parse(await request.json());
    await enforceRateLimit(clientIp(request));
    const audit = await runProofFlow({
      rulesUrl: input.rulesUrl,
      repoUrl: input.repoUrl,
      projectUrl: input.projectUrl || undefined,
    });
    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed";
    const status = /limit|capacity/i.test(message) ? 429 : /URL|HTTPS|GitHub|Devpost|Repository|rules page/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
