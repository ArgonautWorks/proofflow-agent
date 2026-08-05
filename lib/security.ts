import { createHash } from "node:crypto";
import { isIP } from "node:net";

const DEVPOST_HOST = /(^|\.)devpost\.com$/i;
const VERCEL_HOST = /(^|\.)vercel\.app$/i;

export function normalizedHttpsUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are supported");
  if (url.username || url.password || url.port) throw new Error("Credentials and custom ports are not allowed");
  if (isIP(url.hostname) || url.hostname === "localhost") throw new Error("IP and local URLs are not allowed");
  url.hash = "";
  return url;
}

export function validateRulesUrl(raw: string): URL {
  const url = normalizedHttpsUrl(raw);
  if (!DEVPOST_HOST.test(url.hostname)) throw new Error("This beta accepts official Devpost rules pages only");
  if (!/\/rules\/?$/.test(url.pathname)) throw new Error("Use the contest's official /rules page");
  return url;
}

export function parseGitHubRepository(raw: string): { url: URL; owner: string; name: string } {
  const url = normalizedHttpsUrl(raw);
  if (url.hostname !== "github.com") throw new Error("Repository must be hosted on github.com");
  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("Use a GitHub repository root URL");
  const owner = parts[0];
  const name = parts[1].replace(/\.git$/i, "");
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(name)) throw new Error("Invalid GitHub repository path");
  return { url: new URL(`https://github.com/${owner}/${name}`), owner, name };
}

export function validateProjectUrl(raw: string): URL {
  const url = normalizedHttpsUrl(raw);
  if (!VERCEL_HOST.test(url.hostname) && !DEVPOST_HOST.test(url.hostname)) {
    throw new Error("This beta probes Vercel or Devpost deployment URLs only");
  }
  return url;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
