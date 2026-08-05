import fs from "node:fs";
import path from "node:path";
import {
  BASE_USDC,
  DEFAULT_MARKET_TEST_STARTED_AT,
  PRODUCT_ENDPOINT,
  PROOFFLOW_PRICE_ATOMIC,
  RECEIVING_WALLET,
  TRANSFER_TOPIC,
  classifyProofFlowSettlement,
  marketTestDecision,
  revenueLedgerRow,
} from "../lib/revenue-monitor.mjs";

const RPC_URLS = (process.env.BASE_RPC_URLS ?? process.env.BASE_RPC_URL
  ?? "https://mainnet.base.org,https://base-rpc.publicnode.com,https://1rpc.io/base")
  .split(",").map((value) => value.trim()).filter(Boolean);
const STATE_FILE = process.env.PROOFFLOW_REVENUE_STATE
  ?? "/home/oak/.local/state/venture-lab/proofflow-revenue.json";
const LEDGER_FILE = process.env.PROOFFLOW_LEDGER
  ?? "/home/oak/argonaut-ventures/venture-lab-frantic-monitor/ledger.csv";
const STARTED_AT = process.env.PROOFFLOW_MARKET_TEST_STARTED_AT ?? DEFAULT_MARKET_TEST_STARTED_AT;
const CONFIRMATIONS = 20;
const INITIAL_LOOKBACK_BLOCKS = 2_000;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

function writeState(value) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true, mode: 0o700 });
  const temporary = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  fs.renameSync(temporary, STATE_FILE);
  fs.chmodSync(STATE_FILE, 0o600);
}

async function rpc(method, params) {
  let lastError;
  for (const url of RPC_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const value = await response.json();
      if (value.error) throw new Error(`RPC ${value.error.code}`);
      if (value.result === null || value.result === undefined) throw new Error("RPC returned no result");
      return value.result;
    } catch (error) { lastError = error; }
  }
  throw new Error(`all Base RPCs failed for ${method}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function hexBlock(value) { return `0x${value.toString(16)}`; }

async function main() {
  if (!PRODUCT_ENDPOINT) throw new Error("PROOFFLOW_SERVICE_ORIGIN must be set to the deployed service origin");
  const prior = readJson(STATE_FILE) ?? { receipts: [] };
  const currentBlock = Number.parseInt(await rpc("eth_blockNumber", []), 16);
  const confirmedBlock = currentBlock - CONFIRMATIONS;
  const fromBlock = Number.isSafeInteger(prior.last_scanned_block)
    ? prior.last_scanned_block + 1
    : Math.max(0, confirmedBlock - INITIAL_LOOKBACK_BLOCKS);
  if (fromBlock > confirmedBlock) return console.log("No newly confirmed Base blocks");
  const paddedWallet = `0x${RECEIVING_WALLET.slice(2).toLowerCase().padStart(64, "0")}`;
  const logs = await rpc("eth_getLogs", [{
    address: BASE_USDC,
    fromBlock: hexBlock(fromBlock),
    toBlock: hexBlock(confirmedBlock),
    topics: [TRANSFER_TOPIC, null, paddedWallet],
  }]);
  const known = new Set((prior.receipts ?? []).map((receipt) => receipt.transaction));
  const ledger = fs.readFileSync(LEDGER_FILE, "utf8");
  if (!ledger.startsWith("date,experiment_id,category,spend_usd,revenue_usd,realized_profit_usd,notes\n")) {
    throw new Error("unexpected ledger schema");
  }
  const newReceipts = [];
  for (const log of logs) {
    const hash = String(log.transactionHash ?? "").toLowerCase();
    if (known.has(hash)) continue;
    const alreadyLedgered = ledger.includes(hash);
    const receipt = classifyProofFlowSettlement(log, await rpc("eth_getTransactionByHash", [hash]));
    if (!receipt) continue;
    if (!alreadyLedgered) fs.appendFileSync(LEDGER_FILE, `${revenueLedgerRow(receipt)}\n`, "utf8");
    newReceipts.push({ ...receipt, recorded_at: new Date().toISOString() });
    known.add(hash);
  }
  const receipts = [...(prior.receipts ?? []), ...newReceipts];
  const realizedAtomic = receipts.reduce((total, receipt) => total + BigInt(receipt.amount_usdc_atomic), 0n);
  writeState({
    schema_version: 1,
    updated_at: new Date().toISOString(),
    last_scanned_block: confirmedBlock,
    confirmations: CONFIRMATIONS,
    expected_amount_usdc_atomic: PROOFFLOW_PRICE_ATOMIC.toString(),
    market_test: marketTestDecision(receipts.length, STARTED_AT),
    receipts,
    realized_revenue_usdc_atomic: realizedAtomic.toString(),
    realized_revenue_usd: `${realizedAtomic / 1_000_000n}.${(realizedAtomic % 1_000_000n).toString().padStart(6, "0")}`,
  });
  console.log(`Scanned ${logs.length} confirmed incoming USDC transfer(s); recorded ${newReceipts.length} E063 ProofFlow settlement(s)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
