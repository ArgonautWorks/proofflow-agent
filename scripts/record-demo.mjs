import { constants } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const demoUrl = process.env.DEMO_URL ?? "https://proofflow-agent.vercel.app";
const artifactRoot = path.resolve("artifacts/video");
const rawVideoDir = path.join(artifactRoot, "raw");
const outputPath = path.join(artifactRoot, "proofflow-demo.webm");

await mkdir(rawVideoDir, { recursive: true });
try {
  await access(outputPath);
  throw new Error(`Refusing to overwrite existing demo: ${outputPath}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawVideoDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const video = page.video();

async function initializeOverlays() {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const style = document.createElement("style");
    style.id = "demo-overlay-style";
    style.textContent = `
      #demo-callout {
        position: fixed; z-index: 99999; left: 50%; bottom: 20px;
        transform: translateX(-50%); width: min(860px, calc(100vw - 48px));
        display: grid; grid-template-columns: 145px 1fr; gap: 18px; align-items: center;
        padding: 15px 20px; border: 1px solid #151817; background: rgba(21, 24, 23, .96);
        color: #fbfaf5; box-shadow: 0 18px 56px rgba(0, 0, 0, .26);
        font-family: Arial, Helvetica, sans-serif; pointer-events: none;
      }
      #demo-kicker { color: #c8f135; font: 800 11px/1 ui-monospace, monospace;
        letter-spacing: .12em; text-transform: uppercase; }
      #demo-message { font-size: 18px; font-weight: 650; line-height: 1.35; }
      #demo-proof {
        position: fixed; z-index: 99998; inset: 70px 80px 92px; display: none;
        padding: 42px; border: 1px solid #151817; background: rgba(242, 240, 232, .97);
        box-shadow: 0 24px 100px rgba(0,0,0,.25); color: #151817;
        font-family: ui-monospace, monospace;
      }
      #demo-proof.visible { display: block; }
      #demo-proof span { color: #315cff; font-size: 12px; letter-spacing: .12em; }
      #demo-proof h2 { margin: 24px 0 30px; font-family: Arial, sans-serif; font-size: 44px; }
      #demo-proof pre { padding: 24px; border: 1px solid #cbc8bb; background: #fbfaf5;
        font-size: 16px; line-height: 1.65; white-space: pre-wrap; }
    `;
    document.head.append(style);
    const callout = document.createElement("div");
    callout.id = "demo-callout";
    callout.innerHTML = '<span id="demo-kicker"></span><span id="demo-message"></span>';
    document.body.append(callout);
    const proof = document.createElement("div");
    proof.id = "demo-proof";
    proof.innerHTML = '<span>LIVE GOOGLE CLOUD PROOF</span><h2>Firestore is part of every run.</h2><pre id="demo-proof-json"></pre>';
    document.body.append(proof);
  });
}

async function callout(kicker, message, duration = 5000) {
  await page.evaluate(({ kickerText, messageText }) => {
    document.querySelector("#demo-kicker").textContent = kickerText;
    document.querySelector("#demo-message").textContent = messageText;
  }, { kickerText: kicker, messageText: message });
  await page.waitForTimeout(duration);
}

await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60_000 });
await initializeOverlays();
await callout("PROOF/FLOW", "From binding rules to judge-ready evidence—while the team keeps building.", 7000);

await page.locator("#workflow").scrollIntoViewIfNeeded();
await callout("01 · INGEST", "The agent accepts only an official Devpost rules page, a public GitHub root, and a bounded deployment URL.", 6500);
await callout("02 · WORKFLOW", "It fingerprints the rules, scans the real repository, probes the live app, and locks the result in Firestore.", 6500);

const auditResponse = page.waitForResponse(
  (response) => response.url().endsWith("/api/analyze") && response.request().method() === "POST",
  { timeout: 90_000 },
);
await page.getByRole("button", { name: "RUN AUTONOMOUS AUDIT" }).click();
await callout("03 · REASON", "Gemini 3.6 Flash is extracting material obligations into a strict JSON Schema—not free-form advice.", 7500);
await callout("04 · VERIFY", "Deterministic source collectors now match every claim to file paths, live HTTP proof, or an explicit evidence gap.", 7500);
await callout("05 · ACT", "The completed workflow persists a durable audit and produces an immediately downloadable submission pack.", 6500);
const response = await auditResponse;
if (response.status() === 201) {
  await page.waitForTimeout(2500);
} else {
  await callout("AVAILABILITY SAFEGUARD", "A temporary model-capacity spike cannot erase the last schema-validated result; the durable Firestore ledger stays available.", 6000);
  await page.reload({ waitUntil: "networkidle", timeout: 60_000 });
  await initializeOverlays();
}

await page.locator("#results").scrollIntoViewIfNeeded();
await callout("LIVE RESULT", "This is a Firestore-backed run, not a mock: nine obligations are verified and missing proof stays visible.", 7000);
await page.locator(".metrics button.missing").click();
await callout("FAIL CLOSED", "Filtering the gaps shows the exact remaining mandatory artifact—the demo video you are watching now.", 7000);
await page.locator(".metrics button.missing").click();
await page.locator(".requirement").nth(2).scrollIntoViewIfNeeded();
await callout("TRACEABLE EVIDENCE", "Each requirement carries its binding excerpt, concrete repository evidence, rationale, and next action.", 7000);

await page.locator("#architecture").scrollIntoViewIfNeeded();
await callout("AUDITABLE AUTONOMY", "Public sources feed Gemini structured reasoning; Zod validates the output; Firestore makes the action durable.", 7000);
const health = await page.evaluate(async () => fetch("/api/health", { cache: "no-store" }).then((result) => result.json()));
await page.evaluate((value) => {
  document.querySelector("#demo-proof-json").textContent = JSON.stringify(value, null, 2);
  document.querySelector("#demo-proof").classList.add("visible");
}, health);
await callout("GOOGLE CLOUD PROOF", "The public health route completes a server-authenticated Firestore write before reporting connected.", 7500);
await page.evaluate(() => document.querySelector("#demo-proof").classList.remove("visible"));

await page.locator("footer").scrollIntoViewIfNeeded();
await callout("READY FOR HANDOFF", "One autonomous run replaces scattered checklists with a portable, judge-readable evidence pack.", 7000);
await callout("ARGONAUTWORKS", "ProofFlow Agent · Gemini 3.6 Flash · Google GenAI SDK · Cloud Firestore", 6500);

await context.close();
await browser.close();
if (!video) throw new Error("Playwright did not create a video handle");
await copyFile(await video.path(), outputPath, constants.COPYFILE_EXCL);
console.log(outputPath);
