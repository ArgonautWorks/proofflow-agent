import { describe, expect, it } from "vitest";
import {
  BASE_USDC,
  RECEIVING_WALLET,
  TRANSFER_TOPIC,
  classifyProofFlowSettlement,
  ledgerDate,
  marketTestDecision,
  revenueLedgerRow,
} from "../lib/revenue-monitor.mjs";

const PAYER = "0x1111111111111111111111111111111111111111";
const HASH = `0x${"a".repeat(64)}`;
const topic = (address) => `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
const transaction = { to: BASE_USDC, input: "0xe3ee160e00000000" };
const paidLog = (overrides = {}) => ({
  address: BASE_USDC,
  topics: [TRANSFER_TOPIC, topic(PAYER), topic(RECEIVING_WALLET)],
  data: "0xc350",
  blockNumber: "0x2f3be51",
  transactionHash: HASH,
  ...overrides,
});

describe("ProofFlow revenue monitor", () => {
  it("classifies only exact external 50,000-atomic EIP-3009 settlements", () => {
    expect(classifyProofFlowSettlement(paidLog(), transaction)).toEqual({
      transaction: HASH,
      payer: PAYER,
      amount_usdc_atomic: "50000",
      block_number: 49528401,
      endpoint: null,
    });
    expect(classifyProofFlowSettlement(paidLog({ data: "0xc351" }), transaction)).toBeNull();
    expect(classifyProofFlowSettlement(paidLog({
      topics: [TRANSFER_TOPIC, topic(RECEIVING_WALLET), topic(RECEIVING_WALLET)],
    }), transaction)).toBeNull();
    expect(classifyProofFlowSettlement(paidLog(), { ...transaction, input: "0xa9059cbb00000000" })).toBeNull();
  });

  it("formats E063 ledger cash and enforces the 72-hour market gate", () => {
    const receipt = classifyProofFlowSettlement(paidLog(), transaction);
    const date = new Date("2026-08-04T22:30:00.000Z");
    expect(ledgerDate(date)).toBe("2026-08-05");
    expect(revenueLedgerRow(receipt, date)).toMatch(/^2026-08-05,E063,api_revenue,0.00,0.050000,0.050000,/);
    expect(marketTestDecision(0, "2026-08-05T00:00:00.000Z", new Date("2026-08-07T23:59:59.000Z")).status).toBe("running");
    expect(marketTestDecision(0, "2026-08-05T00:00:00.000Z", new Date("2026-08-08T00:00:00.000Z")).status).toBe("kill");
    expect(marketTestDecision(1, "2026-08-05T00:00:00.000Z", new Date("2026-08-08T00:00:00.000Z")).status).toBe("validated");
  });
});
