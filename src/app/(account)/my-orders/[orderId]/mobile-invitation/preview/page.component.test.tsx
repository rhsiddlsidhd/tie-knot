import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const {
  verifySessionMock,
  getOwnedMobileInvitationPreviewByOrderMock,
  getProductServiceMock,
  notFoundMock,
} = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getOwnedMobileInvitationPreviewByOrderMock: vi.fn(),
  getProductServiceMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/mobile-invitation", () => ({
  getOwnedMobileInvitationPreviewByOrder:
    getOwnedMobileInvitationPreviewByOrderMock,
}));
vi.mock("@/services/product", () => ({
  getProductService: getProductServiceMock,
}));
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock(
  "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate",
  () => ({
    MobileInvitationTemplate: ({
      publicKey,
      theme,
      features,
    }: {
      publicKey: string;
      theme: string;
      features: string[];
    }) => (
      <div>
        Template:publicKey={publicKey}:theme={theme}:features={features.length}
      </div>
    ),
  }),
);

import Page from "./page";

const session = { role: "USER" as const, email: "a@x.com", userId: "user-1" };

describe("모바일 청첩장 미리보기 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue(session);
  });

  it("세션을 확인한 뒤 그 userId로 주문 소유 미리보기를 조회한다", async () => {
    getOwnedMobileInvitationPreviewByOrderMock.mockResolvedValue({
      invitation: { productId: "prod-1", publicKey: "pub-1" },
      features: [],
    });
    getProductServiceMock.mockResolvedValue(null);

    await Page({ params: Promise.resolve({ orderId: "order-1" }) });

    expect(verifySessionMock).toHaveBeenCalled();
    expect(getOwnedMobileInvitationPreviewByOrderMock).toHaveBeenCalledWith(
      "order-1",
      "user-1",
    );
  });

  it("세션 검증에 실패하면(throw) 미리보기 조회를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      Page({ params: Promise.resolve({ orderId: "order-1" }) }),
    ).rejects.toThrow();

    expect(getOwnedMobileInvitationPreviewByOrderMock).not.toHaveBeenCalled();
  });

  it("미리보기가 없으면 notFound를 호출하고 상품 조회는 하지 않는다", async () => {
    getOwnedMobileInvitationPreviewByOrderMock.mockResolvedValue(null);

    await expect(
      Page({ params: Promise.resolve({ orderId: "order-1" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getProductServiceMock).not.toHaveBeenCalled();
  });

  it("미리보기가 있으면 상품을 조회해 테마를 Template에 전달한다", async () => {
    getOwnedMobileInvitationPreviewByOrderMock.mockResolvedValue({
      invitation: { productId: "prod-1", publicKey: "pub-1" },
      features: ["GUESTBOOK"],
    });
    getProductServiceMock.mockResolvedValue({ theme: "floral" });

    render(await Page({ params: Promise.resolve({ orderId: "order-1" }) }));

    expect(getProductServiceMock).toHaveBeenCalledWith("prod-1");
    expect(
      screen.getByText("Template:publicKey=pub-1:theme=floral:features=1"),
    ).toBeInTheDocument();
  });

  it("상품이 없으면 기본 테마 default를 사용한다", async () => {
    getOwnedMobileInvitationPreviewByOrderMock.mockResolvedValue({
      invitation: { productId: "prod-1", publicKey: "pub-1" },
      features: [],
    });
    getProductServiceMock.mockResolvedValue(null);

    render(await Page({ params: Promise.resolve({ orderId: "order-1" }) }));

    expect(
      screen.getByText("Template:publicKey=pub-1:theme=default:features=0"),
    ).toBeInTheDocument();
  });
});
