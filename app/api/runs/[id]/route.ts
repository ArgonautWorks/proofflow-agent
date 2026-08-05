import { NextResponse } from "next/server";
import { readAudit } from "@/lib/firestore";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const audit = await readAudit(id);
  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  return NextResponse.json({ audit });
}
