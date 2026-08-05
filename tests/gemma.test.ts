import { describe, expect, it } from "vitest";
import { priorityFromFunctionCalls } from "../lib/gemma";

describe("Gemma operational priority", () => {
  const actions = ["Record the demo.", "Add an optional social post."];

  it("binds the selected index to an existing validated action", () => {
    const priority = priorityFromFunctionCalls([{
      name: "select_next_action",
      args: { index: 0, rationale: "The demo is mandatory while the social post is optional." },
    }], actions);
    expect(priority).toEqual({
      action: "Record the demo.",
      rationale: "The demo is mandatory while the social post is optional.",
      selection: "gemma",
      model: "gemma-4-26b-a4b-it",
    });
  });

  it("rejects invented or out-of-range selections", () => {
    expect(() => priorityFromFunctionCalls([{
      name: "select_next_action",
      args: { index: 7, rationale: "Invent something else." },
    }], actions)).toThrow(/out-of-range/);
  });
});
