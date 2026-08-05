import { readAudit } from "@/lib/firestore";
import { createEvidenceReport } from "@/lib/report";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const audit = await readAudit(id);
  if (!audit) return new Response("Audit not found", { status: 404 });
  return new Response(createEvidenceReport(audit), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="proofflow-${id}.md"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
