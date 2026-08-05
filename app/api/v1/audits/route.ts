import { NextRequest, NextResponse } from "next/server";
import { withX402FromHTTPServer } from "@x402/next";
import { runProofFlow } from "@/lib/agent";
import { enforcePaidCapacity } from "@/lib/firestore";
import { auditErrorResponse } from "@/lib/http";
import { auditInputSchema } from "@/lib/schema";
import { x402HttpServer } from "@/lib/x402";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handler(request: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 10_000) {
      return NextResponse.json({ error: "Request is too large", charged: false }, { status: 413 });
    }
    const input = auditInputSchema.parse(await request.json());
    await enforcePaidCapacity();
    const audit = await runProofFlow({
      rulesUrl: input.rulesUrl,
      repoUrl: input.repoUrl,
      projectUrl: input.projectUrl || undefined,
    });
    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    return auditErrorResponse(error);
  }
}

export const POST = withX402FromHTTPServer<unknown>(handler, x402HttpServer);
