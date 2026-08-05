import { describe, expect, it, vi } from "vitest";
import {
  INDEXABLE_URLS,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  indexNowPayload,
  notifyIndexNow,
} from "../scripts/notify-indexnow.mjs";

describe("IndexNow notification", () => {
  it("verifies ownership before submitting only canonical discovery URLs", async () => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response(`${INDEXNOW_KEY}\n`, { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));

    await expect(notifyIndexNow(fetchImplementation)).resolves.toEqual({
      accepted: true,
      status: 202,
      urls: 4,
    });
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      INDEXNOW_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(indexNowPayload()),
      }),
    );
    expect(INDEXABLE_URLS).toHaveLength(4);
  });

  it("does not notify when the deployed ownership key is absent", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(new Response("missing", { status: 404 }));
    await expect(notifyIndexNow(fetchImplementation)).rejects.toThrow("ownership key");
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});
