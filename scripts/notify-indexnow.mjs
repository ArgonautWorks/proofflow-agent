#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY = "007788c945504c664c19514d5baf7187";
export const SITE_ORIGIN = "https://proofflow-agent.vercel.app";
export const INDEXABLE_URLS = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/building-proofflow`,
  `${SITE_ORIGIN}/llms.txt`,
  `${SITE_ORIGIN}/openapi.json`,
];

export function indexNowPayload() {
  return {
    host: new URL(SITE_ORIGIN).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: INDEXABLE_URLS,
  };
}

export async function notifyIndexNow(fetchImplementation = fetch) {
  const keyResponse = await fetchImplementation(`${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`);
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== INDEXNOW_KEY) {
    throw new Error("The deployed IndexNow ownership key is unavailable or invalid");
  }

  const response = await fetchImplementation(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowPayload()),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the update with HTTP ${response.status}`);
  }
  return { accepted: true, status: response.status, urls: INDEXABLE_URLS.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  notifyIndexNow()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(`IndexNow notification failed: ${error.message}`);
      process.exitCode = 1;
    });
}
