import { NextRequest, NextResponse } from "next/server";
import { createAgentCard } from "@/lib/a2a";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return NextResponse.json(createAgentCard(request.nextUrl.origin), {
    headers: { "cache-control": "public, max-age=300" },
  });
}
