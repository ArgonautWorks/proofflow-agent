import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runGemmaProofFlow: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/lib/gemma-agent", () => ({ runGemmaProofFlow: mocks.runGemmaProofFlow }));
vi.mock("@/lib/firestore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));

import { POST } from "../app/api/gemma-core/route";

describe("POST /api/gemma-core", () => {
  beforeEach(() => {
    mocks.runGemmaProofFlow.mockReset();
    mocks.enforceRateLimit.mockReset();
    mocks.enforceRateLimit.mockResolvedValue(undefined);
    mocks.runGemmaProofFlow.mockResolvedValue({ id: "ActualGemmaRun", model: "gemma-4-26b-a4b-it", auditMode: "gemma-core" });
  });

  it("rate-limits then invokes only the isolated Gemma orchestrator", async () => {
    const request = new NextRequest("http://localhost/api/gemma-core", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({
        rulesUrl: "https://example.devpost.com/rules",
        repoUrl: "https://github.com/example/project",
        projectUrl: "https://example.vercel.app",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ audit: { id: "ActualGemmaRun", model: "gemma-4-26b-a4b-it", auditMode: "gemma-core" } });
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith("203.0.113.7");
    expect(mocks.runGemmaProofFlow).toHaveBeenCalledOnce();
  });

  it("rejects a body over 10KB before invoking rate limiting or orchestration", async () => {
    const request = new NextRequest("http://localhost/api/gemma-core", {
      method: "POST",
      body: "x".repeat(10_001),
    });
    const response = await POST(request);
    expect(response.status).toBe(413);
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.runGemmaProofFlow).not.toHaveBeenCalled();
  });
});
