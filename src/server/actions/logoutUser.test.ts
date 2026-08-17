import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services", () => ({
  logoutService: vi.fn().mockResolvedValue(undefined),
}));

import { logoutService } from "@/services";
import { logoutUser } from "./logoutUser";

describe("logoutUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logoutService를 호출해 세션 쿠키를 삭제한다", async () => {
    await logoutUser();

    expect(logoutService).toHaveBeenCalledOnce();
  });
});
