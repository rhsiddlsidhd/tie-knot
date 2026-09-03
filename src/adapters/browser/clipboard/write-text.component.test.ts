import { describe, it, expect, vi, afterEach } from "vitest";

import { writeText } from "./write-text";

describe("writeText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigator.clipboard에 텍스트를 위임한다", async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: clipboardWriteText } });

    await writeText("복사할 텍스트");

    expect(clipboardWriteText).toHaveBeenCalledWith("복사할 텍스트");
  });

  it("권한이 거부되면 거부 사유를 그대로 전파한다", async () => {
    const denied = new Error("NotAllowedError");
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(denied) },
    });

    await expect(writeText("복사할 텍스트")).rejects.toBe(denied);
  });
});
