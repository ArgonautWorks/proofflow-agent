import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const STATE_FILE = process.env.PAYANAGENT_STATE_FILE
  ?? "/home/oak/.local/state/venture-lab/payanagent.json";
export const EXTERNAL_URL = process.env.PROOFFLOW_ENDPOINT
  ?? "https://proofflow-agent.vercel.app/api/v1/audits";
export const EXPECTED_WALLET = "0x5e2023b1D1366d6366E768fe432AD627bfAa5d57";
export const EXPECTED_ASSET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const EXPECTED_NETWORK = "eip155:8453";
export const EXPECTED_AMOUNT = "50000";
const USER_AGENT = "ArgonautWorks/proofflow-agent PayanAgent registrar";
const EXAMPLE = {
  rulesUrl: "https://allthingsagentichackathon.devpost.com/rules",
  repoUrl: "https://github.com/ArgonautWorks/proofflow-agent",
  projectUrl: "https://proofflow-agent.vercel.app",
};
const METADATA = {
  title: "Hackathon Submission Compliance Audit — public evidence",
  description: "Submit an official Devpost rules URL, public GitHub repository root, and optional public Vercel or Devpost deployment. ProofFlow uses Gemini structured reasoning to map binding requirements to concrete evidence, probes the deployment, fingerprints the rules, persists the run in Firestore, and returns a judge-ready JSON ledger with risks and next actions. Invalid sources, capacity failures, and upstream model failures are not settled.",
  category: "Data",
  tags: ["hackathon", "Devpost", "compliance", "evidence", "Gemini", "Firestore", "developer-tools"],
  offerType: "api",
  httpMethod: "POST",
  inputSchema: JSON.stringify({
    type: "object",
    required: ["rulesUrl", "repoUrl"],
    properties: {
      rulesUrl: { type: "string", pattern: "^https://.*\\.devpost\\.com/rules" },
      repoUrl: { type: "string", pattern: "^https://github\\.com/[^/]+/[^/]+/?$" },
      projectUrl: { type: "string", pattern: "^https://" },
    },
    additionalProperties: false,
  }),
  outputSchema: "{audit:{id, projectName, contestName, executiveSummary, score, overallStatus, requirements[], topRisks[], nextActions[], actionsPerformed[], sourceSnapshot, model, completedAt}}",
};

function headers(apiKey) {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "user-agent": USER_AGENT,
  };
}

function responseError(body) {
  const value = body?.error ?? body?.message ?? body?.detail ?? "invalid request";
  return String(value).replace(/\s+/g, " ").slice(0, 300);
}

export function decodePaymentRequired(value) {
  if (typeof value !== "string" || value.length < 20 || value.length > 65_536) {
    throw new Error("PayanAgent relay probe omitted PAYMENT-REQUIRED");
  }
  const challenge = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  const accepted = challenge?.accepts?.[0];
  if (!accepted) throw new Error("PayanAgent relay challenge omitted an accepted payment option");
  return accepted;
}

export function assertExpectedChallenge(accepted) {
  if (accepted?.network !== EXPECTED_NETWORK
    || String(accepted?.asset ?? "").toLowerCase() !== EXPECTED_ASSET.toLowerCase()
    || String(accepted?.payTo ?? "").toLowerCase() !== EXPECTED_WALLET.toLowerCase()
    || String(accepted?.amount) !== EXPECTED_AMOUNT) {
    throw new Error("PayanAgent relay payment challenge drifted from the direct resource");
  }
}

async function privateState() {
  const info = await stat(STATE_FILE);
  if (!info.isFile() || (info.mode & 0o077) !== 0) {
    throw new Error("PayanAgent state must be a private regular file");
  }
  const value = JSON.parse(await readFile(STATE_FILE, "utf8"));
  if (!value.apiKey) throw new Error("PayanAgent state is missing apiKey");
  return value;
}

async function persistOffer(offerState) {
  const latest = await privateState();
  latest.offers ??= {};
  latest.offers.proofFlowAudit = offerState;
  const temporary = path.join(
    path.dirname(STATE_FILE),
    `.${path.basename(STATE_FILE)}.${process.pid}.${Date.now()}.tmp`,
  );
  await writeFile(temporary, `${JSON.stringify(latest, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  await rename(temporary, STATE_FILE);
}

async function main() {
  const state = await privateState();
  const authHeaders = headers(state.apiKey);
  let offerId = state.offers?.proofFlowAudit?.offerId;
  if (offerId) {
    if (state.offers.proofFlowAudit.externalUrl !== EXTERNAL_URL) {
      throw new Error("Stored ProofFlow relay URL does not match the pinned endpoint");
    }
    const response = await fetch(`https://payanagent.com/api/v1/offers/${encodeURIComponent(offerId)}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(METADATA),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`PayanAgent offer update failed with HTTP ${response.status}`);
  } else {
    const response = await fetch("https://payanagent.com/api/v1/offers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ ...METADATA, externalUrl: EXTERNAL_URL }),
      signal: AbortSignal.timeout(30_000),
    });
    const registration = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`PayanAgent relay registration failed with HTTP ${response.status}: ${responseError(registration)}`);
    }
    if (!registration.offerId || registration.mode !== "relay") {
      throw new Error("PayanAgent did not create a relay offer");
    }
    offerId = registration.offerId;
  }

  const detailResponse = await fetch(`https://payanagent.com/api/v1/offers/${encodeURIComponent(offerId)}`, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!detailResponse.ok) throw new Error(`PayanAgent offer lookup failed with HTTP ${detailResponse.status}`);
  const detailBody = await detailResponse.json();
  const offer = detailBody.offer ?? detailBody;
  if (offer.isActive !== true || offer.httpMethod !== "POST") {
    throw new Error("PayanAgent offer has unexpected active or method state");
  }
  if (offer.externalUrl && offer.externalUrl !== EXTERNAL_URL) {
    throw new Error("PayanAgent relay points to an unexpected endpoint");
  }
  if (Number(offer.priceUsd) !== 0.05) throw new Error("PayanAgent offer has an unexpected catalog price");

  const buyUrl = `https://payanagent.com/x402/${offerId}`;
  const probe = await fetch(buyUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": USER_AGENT },
    body: JSON.stringify(EXAMPLE),
    signal: AbortSignal.timeout(30_000),
  });
  if (probe.status !== 402) throw new Error(`PayanAgent relay probe returned HTTP ${probe.status}`);
  assertExpectedChallenge(decodePaymentRequired(probe.headers.get("payment-required")));
  await persistOffer({
    offerId,
    buyUrl,
    mode: "relay",
    externalUrl: EXTERNAL_URL,
    amountRaw: EXPECTED_AMOUNT,
    network: EXPECTED_NETWORK,
  });
  console.log(JSON.stringify({
    synced: true,
    offer_id: offerId,
    buy_url: buyUrl,
    amount_raw: EXPECTED_AMOUNT,
    mode: "relay",
    network: EXPECTED_NETWORK,
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
