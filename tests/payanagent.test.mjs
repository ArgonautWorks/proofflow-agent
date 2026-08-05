import { describe, expect, it } from "vitest";
import {
  EXPECTED_AMOUNT,
  EXPECTED_ASSET,
  EXPECTED_NETWORK,
  EXPECTED_WALLET,
  assertExpectedChallenge,
  decodePaymentRequired,
} from "../scripts/register-payanagent.mjs";

describe("PayanAgent ProofFlow registrar", () => {
  it("accepts only the exact paid endpoint challenge", () => {
    const accepted = {
      amount: EXPECTED_AMOUNT,
      asset: EXPECTED_ASSET,
      network: EXPECTED_NETWORK,
      payTo: EXPECTED_WALLET,
    };
    expect(() => assertExpectedChallenge(accepted)).not.toThrow();
    expect(() => assertExpectedChallenge({ ...accepted, amount: "49999" })).toThrow(/drifted/);
  });

  it("decodes a bounded payment-required header", () => {
    const accepted = { amount: EXPECTED_AMOUNT, network: EXPECTED_NETWORK };
    const encoded = Buffer.from(JSON.stringify({ accepts: [accepted] })).toString("base64");
    expect(decodePaymentRequired(encoded)).toEqual(accepted);
  });
});
