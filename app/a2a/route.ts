import { NextRequest, NextResponse } from "next/server";
import { createA2aResponse } from "@/lib/a2a";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }
  const body = await request.json().catch(() => null);
  return NextResponse.json(createA2aResponse(body, request.nextUrl.origin), {
    headers: { "cache-control": "no-store" },
  });
}
