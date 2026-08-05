import { describe, expect, it } from "vitest";
import { createA2aResponse, createAgentCard, purchaseGuidance } from "../lib/a2a";

const ORIGIN = "https://proofflow-agent.vercel.app";

describe("ProofFlow A2A discovery", () => {
  it("publishes a discovery-only A2A 0.3 agent card", () => {
    const card = createAgentCard(ORIGIN);
    expect(card.protocolVersion).toBe("0.3.0");
    expect(card.url).toBe(`${ORIGIN}/a2a`);
    expect(card.capabilities).toEqual({ streaming: false, pushNotifications: false, stateTransitionHistory: false });
    expect(card.skills[0].description).toMatch(/never runs or purchases/);
  });

  it("returns deterministic purchase guidance for message/send", () => {
    const ids = ["context", "task", "message"];
    const response = createA2aResponse(
      { jsonrpc: "2.0", id: 7, method: "message/send", params: {} },
      ORIGIN,
      { uuid: () => ids.shift()!, now: () => "2026-08-05T07:00:00.000Z" },
    );
    expect(response).toMatchObject({ jsonrpc: "2.0", id: 7, result: { contextId: "context", id: "task", status: { state: "completed" } } });
    expect(JSON.stringify(response)).toContain(`${ORIGIN}/api/v1/audits`);
    expect(JSON.stringify(response)).toContain("$0.05 USDC");
  });

  it("fails closed for invalid JSON-RPC methods and never represents discovery as fulfillment", () => {
    expect(createA2aResponse(null, ORIGIN)).toEqual({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } });
    expect(createA2aResponse({ jsonrpc: "2.0", id: 1, method: "audit/run" }, ORIGIN)).toEqual({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "Method not found" } });
    expect(purchaseGuidance(ORIGIN)).toMatch(/never invokes Gemini/);
  });
});
