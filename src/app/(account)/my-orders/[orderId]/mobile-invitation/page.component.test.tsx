import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, getOwnedMobileInvitationByOrderMock } = vi.hoisted(
  () => ({
    verifySessionMock: vi.fn(),
    getOwnedMobileInvitationByOrderMock: vi.fn(),
  }),
);

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/mobile-invitation", () => ({
  getOwnedMobileInvitationByOrder: getOwnedMobileInvitationByOrderMock,
}));

vi.mock(
  "@/app/(account)/my-orders/[orderId]/mobile-invitation/_containers/MobileInvitationStatusControls",
  () => ({
    MobileInvitationStatusControls: ({
      orderId,
      status,
    }: {
      orderId: string;
      status?: string;
    }) => (
      <div>
        StatusControls:orderId={orderId}:status={status ?? "none"}
      </div>
    ),
  }),
);
vi.mock(
  "@/app/(account)/my-orders/[orderId]/mobile-invitation/_containers/MobileInvitationForm",
  () => ({
    MobileInvitationForm: () => <div>MobileInvitationForm</div>,
  }),
);

import Page from "./page";

const session = { role: "USER" as const, email: "a@x.com", userId: "user-1" };

describe("모바일 청첩장 편집 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue(session);
    getOwnedMobileInvitationByOrderMock.mockResolvedValue(null);
  });

  it("세션을 확인한 뒤 그 userId로 주문 소유 청첩장을 조회한다", async () => {
    await Page({ params: Promise.resolve({ orderId: "order-1" }) });

    expect(verifySessionMock).toHaveBeenCalled();
    expect(getOwnedMobileInvitationByOrderMock).toHaveBeenCalledWith(
      "order-1",
      "user-1",
    );
  });

  it("세션 검증에 실패하면(throw) 청첩장 조회를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      Page({ params: Promise.resolve({ orderId: "order-1" }) }),
    ).rejects.toThrow();

    expect(getOwnedMobileInvitationByOrderMock).not.toHaveBeenCalled();
  });

  it("저장된 청첩장이 없으면 status 없이 StatusControls를 렌더한다", async () => {
    getOwnedMobileInvitationByOrderMock.mockResolvedValue(null);

    render(await Page({ params: Promise.resolve({ orderId: "order-1" }) }));

    expect(
      screen.getByText("StatusControls:orderId=order-1:status=none"),
    ).toBeInTheDocument();
  });

  it("저장된 청첩장의 status를 StatusControls에 전달한다", async () => {
    getOwnedMobileInvitationByOrderMock.mockResolvedValue({ status: "draft" });

    render(await Page({ params: Promise.resolve({ orderId: "order-1" }) }));

    expect(
      screen.getByText("StatusControls:orderId=order-1:status=draft"),
    ).toBeInTheDocument();
  });

  it("MobileInvitationForm을 항상 렌더한다", async () => {
    render(await Page({ params: Promise.resolve({ orderId: "order-1" }) }));

    expect(screen.getByText("MobileInvitationForm")).toBeInTheDocument();
  });
});
