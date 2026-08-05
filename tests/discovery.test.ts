import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "../app/openapi.json/route";

describe("OpenAPI discovery", () => {
  it("gives purchasing agents concrete route guidance", async () => {
    const response = await GET(
      new NextRequest("https://proofflow-agent.vercel.app/openapi.json"),
    );
    const document = await response.json();

    expect(document.info["x-guidance"]).toContain("POST /api/v1/audits");
    expect(document.info["x-guidance"]).toContain("GET /api/v1/audits");
    expect(document.paths["/api/v1/audits"].post["x-payment-info"]).toMatchObject({
      price: { mode: "fixed", currency: "USD", amount: "0.05" },
      protocols: [{ x402: {} }],
    });
  });
});
