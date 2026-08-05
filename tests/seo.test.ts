import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  SITE_DESCRIPTION,
  SITE_ORIGIN,
  SOFTWARE_APPLICATION_JSON_LD,
} from "../lib/discovery";

describe("search discovery", () => {
  it("publishes a crawlable canonical page and root sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
      host: SITE_ORIGIN,
    });
    expect(sitemap()).toEqual([
      { url: SITE_ORIGIN },
      { url: `${SITE_ORIGIN}/building-proofflow` },
    ]);
  });

  it("describes the free product without inventing customers or revenue", () => {
    expect(SITE_DESCRIPTION).toContain("Devpost hackathon");
    expect(SOFTWARE_APPLICATION_JSON_LD).toMatchObject({
      "@type": "SoftwareApplication",
      isAccessibleForFree: true,
      offers: { price: "0", priceCurrency: "USD" },
    });
    expect(JSON.stringify(SOFTWARE_APPLICATION_JSON_LD)).not.toMatch(/customer count|revenue earned/i);
  });

  it("hosts the exact IndexNow ownership key", async () => {
    const key = "007788c945504c664c19514d5baf7187";
    const contents = await readFile(new URL(`../public/${key}.txt`, import.meta.url), "utf8");
    expect(contents.trim()).toBe(key);
  });
});
