import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/adapters/cookies", () => ({
  deleteCookie: vi.fn().mockResolvedValue(undefined),
}));

import { deleteCookie } from "@/adapters/cookies";
import { clearUserEmailCookie } from "./clearUserEmailCookie";

describe("clearUserEmailCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("userEmail 쿠키를 삭제한다", async () => {
    await clearUserEmailCookie();

    expect(deleteCookie).toHaveBeenCalledExactlyOnceWith("userEmail");
  });
});
