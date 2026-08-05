import { NextResponse } from "next/server";
import { verifyFirestore } from "@/lib/firestore";

export const runtime = "nodejs";

export async function GET() {
  try {
    await verifyFirestore();
    return NextResponse.json({
      ok: true,
      service: "proofflow-agent",
      model: "gemini-3.6-flash",
      firestore: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, service: "proofflow-agent" }, { status: 503 });
  }
}
