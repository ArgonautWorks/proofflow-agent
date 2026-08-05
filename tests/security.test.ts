import { describe, expect, it } from "vitest";
import { parseGitHubRepository, validateProjectUrl, validateRulesUrl } from "../lib/security";

describe("public-source guardrails", () => {
  it("accepts an official Devpost rules page", () => {
    expect(validateRulesUrl("https://example.devpost.com/rules#top").href).toBe("https://example.devpost.com/rules");
  });

  it("rejects non-rules, local, and credential-bearing URLs", () => {
    expect(() => validateRulesUrl("https://example.devpost.com/overview")).toThrow(/rules/);
    expect(() => validateRulesUrl("http://localhost/rules")).toThrow(/HTTPS/);
    expect(() => validateRulesUrl("https://user:pass@example.devpost.com/rules")).toThrow(/Credentials/);
  });

  it("normalizes a public GitHub repository root", () => {
    expect(parseGitHubRepository("https://github.com/ArgonautWorks/proofflow-agent.git")).toMatchObject({
      owner: "ArgonautWorks",
      name: "proofflow-agent",
    });
  });

  it("rejects subpaths and non-GitHub repository hosts", () => {
    expect(() => parseGitHubRepository("https://github.com/ArgonautWorks/proofflow-agent/issues")).toThrow(/root/);
    expect(() => parseGitHubRepository("https://gitlab.com/ArgonautWorks/proofflow-agent")).toThrow(/github/);
  });

  it("limits deployment probes to supported public surfaces", () => {
    expect(validateProjectUrl("https://proofflow-agent.vercel.app/").hostname).toBe("proofflow-agent.vercel.app");
    expect(() => validateProjectUrl("https://127.0.0.1/")).toThrow(/local/);
    expect(() => validateProjectUrl("https://example.com/")).toThrow(/Vercel/);
  });
});
