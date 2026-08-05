import type { AuditInput, SourceSnapshot } from "@/lib/types";
import {
  normalizeWhitespace,
  parseGitHubRepository,
  sha256,
  validateProjectUrl,
  validateRulesUrl,
} from "@/lib/security";

const USER_AGENT = "ProofFlow-Agent/0.1 (+https://github.com/ArgonautWorks/proofflow-agent)";
const MAX_RULES_CHARS = 32_000;
const MAX_README_CHARS = 24_000;
const MAX_TREE_FILES = 2_000;

function htmlToText(html: string): string {
  return normalizeWhitespace(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'"));
}

async function fetchChecked(url: string, accept: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { Accept: accept, "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response;
}

async function collectRules(rawUrl: string): Promise<SourceSnapshot["rules"]> {
  const url = validateRulesUrl(rawUrl);
  const response = await fetchChecked(url.href, "text/html");
  const html = (await response.text()).slice(0, 500_000);
  const title = normalizeWhitespace(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Devpost rules");
  const text = htmlToText(html).slice(0, MAX_RULES_CHARS);
  if (text.length < 500) throw new Error("Rules page did not contain enough readable text");
  return { url: url.href, title, text, sha256: sha256(text) };
}

interface GitHubRepositoryResponse {
  description: string | null;
  default_branch: string;
  pushed_at: string;
  private: boolean;
}

interface GitHubTreeResponse {
  truncated: boolean;
  tree: Array<{ path?: string; type?: string }>;
}

async function collectRepository(rawUrl: string): Promise<SourceSnapshot["repository"]> {
  const { url, owner, name } = parseGitHubRepository(rawUrl);
  const apiRoot = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const repository = await fetchChecked(apiRoot, "application/vnd.github+json")
    .then((response) => response.json() as Promise<GitHubRepositoryResponse>);
  if (repository.private) throw new Error("Repository must be public for verifiable evidence");

  const [tree, readmeResponse] = await Promise.all([
    fetchChecked(`${apiRoot}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`, "application/vnd.github+json")
      .then((response) => response.json() as Promise<GitHubTreeResponse>),
    fetchChecked(`${apiRoot}/readme`, "application/vnd.github.raw+json"),
  ]);
  const readme = (await readmeResponse.text()).slice(0, MAX_README_CHARS);
  const files = tree.tree
    .filter((item) => item.type === "blob" && item.path)
    .map((item) => item.path as string)
    .slice(0, MAX_TREE_FILES);

  return {
    url: url.href,
    owner,
    name,
    description: repository.description ?? "",
    defaultBranch: repository.default_branch,
    latestPushAt: repository.pushed_at,
    readme,
    files,
    treeTruncated: tree.truncated || tree.tree.length > MAX_TREE_FILES,
  };
}

async function probeDeployment(rawUrl: string): Promise<SourceSnapshot["deployment"]> {
  const url = validateProjectUrl(rawUrl);
  try {
    const response = await fetch(url.href, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return {
      url: url.href,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      reachable: response.ok,
    };
  } catch {
    return { url: url.href, status: 0, contentType: "", reachable: false };
  }
}

export async function collectSources(input: AuditInput): Promise<SourceSnapshot> {
  const [rules, repository, deployment] = await Promise.all([
    collectRules(input.rulesUrl),
    collectRepository(input.repoUrl),
    input.projectUrl ? probeDeployment(input.projectUrl) : Promise.resolve(undefined),
  ]);
  return deployment
    ? { checkedAt: new Date().toISOString(), rules, repository, deployment }
    : { checkedAt: new Date().toISOString(), rules, repository };
}
