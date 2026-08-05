import { describe, expect, it } from "vitest";
import { alignmentFromEmbeddings } from "../lib/embedding";

describe("Gemini Embedding priority grounding", () => {
  it("selects the closest supplied risk without rewriting it", () => {
    const result = alignmentFromEmbeddings(
      [[1, 0], [0, 1], [1, 0]],
      ["Unrelated risk", "Matching risk"],
    );
    expect(result).toEqual({
      model: "gemini-embedding-2",
      score: 1,
      matchedRisk: "Matching risk",
    });
  });

  it("returns a bounded rounded cosine score", () => {
    const result = alignmentFromEmbeddings(
      [[1, 1], [1, 0]],
      ["Candidate risk"],
    );
    expect(result.score).toBe(0.7071);
  });

  it("rejects incomplete or malformed embedding responses", () => {
    expect(() => alignmentFromEmbeddings([[1, 0]], ["Missing risk vector"])).toThrow();
    expect(() => alignmentFromEmbeddings([[1, 0], [Number.NaN, 1]], ["Bad risk"])).toThrow();
  });
});
