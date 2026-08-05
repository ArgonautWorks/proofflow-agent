import { readFile } from "node:fs/promises";

const tracePath = new URL(
  "../.next/server/app/api/v1/audits/route.js.nft.json",
  import.meta.url,
);

const trace = JSON.parse(await readFile(tracePath, "utf8"));
const tracedFiles = Array.isArray(trace.files) ? trace.files : [];
const requiredRuntimeFiles = [
  "node_modules/@x402/extensions/package.json",
  "node_modules/@x402/extensions/dist/esm/bazaar/index.mjs",
  "node_modules/@x402/core/package.json",
  "node_modules/@x402/extensions/node_modules/ajv/package.json",
  "node_modules/fast-uri/package.json",
];

const missing = requiredRuntimeFiles.filter(
  (requiredFile) => !tracedFiles.some((tracedFile) => tracedFile.endsWith(requiredFile)),
);

if (missing.length > 0) {
  throw new Error(
    `Paid API runtime trace is missing Bazaar dependencies:\n${missing.join("\n")}`,
  );
}

console.log("Paid API runtime trace includes the x402 Bazaar dependency graph.");
