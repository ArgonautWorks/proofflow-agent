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
      models: {
        evidenceReasoning: "gemini-3.6-flash",
        operationalPrioritization: "gemma-4-26b-a4b-it",
      },
      firestore: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, service: "proofflow-agent" }, { status: 503 });
  }
}
