import { beforeEach, describe, expect, it, vi } from "vitest";

const { cancelExpiredPendingOrdersForAllUsers, cancelExpiredAwaitingInvitationOrdersForAllUsers } =
  vi.hoisted(() => ({
    cancelExpiredPendingOrdersForAllUsers: vi.fn(),
    cancelExpiredAwaitingInvitationOrdersForAllUsers: vi.fn(),
  }));

vi.mock("@/services/payment", () => ({
  cancelExpiredPendingOrdersForAllUsers,
  cancelExpiredAwaitingInvitationOrdersForAllUsers,
}));

import { GET } from "./route";

const request = (authorization?: string) =>
  new Request("http://localhost/api/cron/expired-orders", {
    headers: authorization ? { authorization } : {},
  });

const pendingResult = {
  scanned: 1,
  cancelled: 1,
  syncedToConfirmed: 0,
  heldForReview: 0,
};
const awaitingInvitationResult = { scanned: 1, cancelled: 1, failed: 0 };

describe("GET /api/cron/expired-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-secret");
    cancelExpiredPendingOrdersForAllUsers.mockResolvedValue(pendingResult);
    cancelExpiredAwaitingInvitationOrdersForAllUsers.mockResolvedValue(
      awaitingInvitationResult,
    );
  });

  it("올바른 Bearer 시크릿이면 두 배치를 모두 호출하고 200과 집계를 반환한다", async () => {
    const response = await GET(request("Bearer cron-secret"));
    const body = await response.json();

    expect(cancelExpiredPendingOrdersForAllUsers).toHaveBeenCalled();
    expect(cancelExpiredAwaitingInvitationOrdersForAllUsers).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      pending: pendingResult,
      awaitingInvitation: awaitingInvitationResult,
    });
  });

  it("Authorization 헤더가 없으면 401이고 배치를 호출하지 않는다", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(cancelExpiredPendingOrdersForAllUsers).not.toHaveBeenCalled();
    expect(cancelExpiredAwaitingInvitationOrdersForAllUsers).not.toHaveBeenCalled();
  });

  it("시크릿이 틀리면 401이고 배치를 호출하지 않는다", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(cancelExpiredPendingOrdersForAllUsers).not.toHaveBeenCalled();
  });

  it("CRON_SECRET이 미설정이면 503이고 배치를 호출하지 않는다", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const response = await GET(request("Bearer undefined"));

    expect(response.status).toBe(503);
    expect(cancelExpiredPendingOrdersForAllUsers).not.toHaveBeenCalled();
    expect(cancelExpiredAwaitingInvitationOrdersForAllUsers).not.toHaveBeenCalled();
  });

  it("한 배치가 reject해도 다른 배치는 호출되며 500과 실패한 쪽 null을 반환한다", async () => {
    cancelExpiredPendingOrdersForAllUsers.mockRejectedValue(new Error("db down"));

    const response = await GET(request("Bearer cron-secret"));
    const body = await response.json();

    expect(cancelExpiredAwaitingInvitationOrdersForAllUsers).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      pending: null,
      awaitingInvitation: awaitingInvitationResult,
    });
  });

  it("두 배치가 모두 reject해도 500을 반환하고 예외를 던지지 않는다", async () => {
    cancelExpiredPendingOrdersForAllUsers.mockRejectedValue(new Error("db down"));
    cancelExpiredAwaitingInvitationOrdersForAllUsers.mockRejectedValue(
      new Error("portone down"),
    );

    const response = await GET(request("Bearer cron-secret"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, pending: null, awaitingInvitation: null });
  });
});
