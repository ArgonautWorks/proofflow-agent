export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const RECEIVING_WALLET = "0x5e2023b1D1366d6366E768fe432AD627bfAa5d57";
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const TRANSFER_WITH_AUTHORIZATION_SELECTOR = "0xe3ee160e";
export const PROOFFLOW_PRICE_ATOMIC = 50_000n;
export const PRODUCT_ENDPOINT = process.env.PROOFFLOW_SERVICE_ORIGIN
  ? `${new URL(process.env.PROOFFLOW_SERVICE_ORIGIN).origin}/api/v1/audits`
  : null;
export const DEFAULT_MARKET_TEST_STARTED_AT = "2026-08-05T06:41:43.450Z";

function topicAddress(topic) {
  const value = String(topic ?? "").toLowerCase();
  return /^0x[a-f0-9]{64}$/.test(value) ? `0x${value.slice(-40)}` : null;
}

export function classifyProofFlowSettlement(log, transaction, receivingWallet = RECEIVING_WALLET) {
  const wallet = String(receivingWallet).toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(wallet)) return null;
  if (String(log?.address).toLowerCase() !== BASE_USDC.toLowerCase()) return null;
  if (String(log?.topics?.[0]).toLowerCase() !== TRANSFER_TOPIC) return null;
  const payer = topicAddress(log?.topics?.[1]);
  const recipient = topicAddress(log?.topics?.[2]);
  if (!payer || !recipient || recipient !== wallet || payer === wallet) return null;
  let amount;
  try { amount = BigInt(log.data); } catch { return null; }
  if (amount !== PROOFFLOW_PRICE_ATOMIC) return null;
  if (String(transaction?.to).toLowerCase() !== BASE_USDC.toLowerCase()) return null;
  if (!String(transaction?.input ?? "").toLowerCase().startsWith(TRANSFER_WITH_AUTHORIZATION_SELECTOR)) return null;
  const transactionHash = String(log.transactionHash ?? "").toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(transactionHash)) return null;
  const blockNumber = Number.parseInt(log.blockNumber, 16);
  if (!Number.isSafeInteger(blockNumber)) return null;
  return {
    transaction: transactionHash,
    payer,
    amount_usdc_atomic: amount.toString(),
    block_number: blockNumber,
    endpoint: PRODUCT_ENDPOINT,
  };
}

export function ledgerDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function revenueLedgerRow(receipt, date = new Date()) {
  const note = `Settled external x402 ProofFlow audit; Base transaction ${receipt.transaction}; payer ${receipt.payer}; endpoint ${receipt.endpoint}`;
  return [ledgerDate(date), "E063", "api_revenue", "0.00", "0.050000", "0.050000", note]
    .map(csvCell)
    .join(",");
}

export function marketTestDecision(receiptCount, startedAt = DEFAULT_MARKET_TEST_STARTED_AT, date = new Date()) {
  if (!Number.isSafeInteger(receiptCount) || receiptCount < 0 || Number.isNaN(date.getTime())) {
    throw new Error("invalid market test state");
  }
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) throw new Error("invalid market test start");
  const deadlineTime = start + 72 * 60 * 60 * 1_000;
  const status = receiptCount > 0 ? "validated" : date.getTime() >= deadlineTime ? "kill" : "running";
  return {
    status,
    started_at: new Date(start).toISOString(),
    deadline_at: new Date(deadlineTime).toISOString(),
    success_threshold: "one independently confirmed external settlement",
    external_settlement_count: receiptCount,
  };
}
