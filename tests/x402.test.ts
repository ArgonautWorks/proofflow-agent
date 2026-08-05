import { describe, expect, it } from "vitest";
import { auditErrorResponse } from "../lib/http";
import {
  PAID_AUDIT_PATH,
  PAID_AUDIT_PRICE,
  PAY_TO,
  X402_NETWORK,
  paidAuditInputSchema,
  paidAuditPurchaseDescription,
  paidAuditRouteConfig,
} from "../lib/x402";

describe("paid audit API", () => {
  it("pins one exact Base-USDC price and receiving wallet", () => {
    expect(PAID_AUDIT_PATH).toBe("/api/v1/audits");
    expect(PAID_AUDIT_PRICE).toBe("$0.05");
    expect(paidAuditRouteConfig.accepts).toMatchObject({
      scheme: "exact",
      network: X402_NETWORK,
      payTo: PAY_TO,
      price: PAID_AUDIT_PRICE,
    });
  });

  it("advertises only the bounded public-source input", () => {
    expect(paidAuditInputSchema.required).toEqual(["rulesUrl", "repoUrl"]);
    expect(paidAuditInputSchema.additionalProperties).toBe(false);
    expect(Object.keys(paidAuditInputSchema.properties)).toEqual(["rulesUrl", "repoUrl", "projectUrl"]);
  });

  it("provides free purchase discovery without representing an audit as fulfilled", () => {
    const description = paidAuditPurchaseDescription("https://proofflow-agent.vercel.app/untrusted/path");
    expect(description.paid_operation).toMatchObject({
      method: "POST",
      url: "https://proofflow-agent.vercel.app/api/v1/audits",
      price: "$0.05",
      settlement: { network: X402_NETWORK, pay_to: PAY_TO },
    });
    expect(description.charged).toBe(false);
    expect(description).not.toHaveProperty("audit");
  });

  it("marks upstream failures retryable and uncharged", async () => {
    const response = auditErrorResponse(new Error("Gemini is temporarily unavailable"));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(await response.json()).toMatchObject({ retryable: true, charged: false });
  });
});
