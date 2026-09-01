import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProductServiceMock, getPublishedInvitationMock } = vi.hoisted(
  () => ({
    getProductServiceMock: vi.fn(),
    getPublishedInvitationMock: vi.fn(),
  }),
);

vi.mock("@/services", () => ({
  getProductService: getProductServiceMock,
  getPublishedInvitationByPublicKey: getPublishedInvitationMock,
}));

vi.mock("./_components", () => ({
  InvitationTemplate: ({ publicKey }: { publicKey: string }) => (
    <div>청첩장:{publicKey}</div>
  ),
}));

import Page from "./page";

describe("공개 청첩장 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("존재하지 않는 공개 키면 준비 중 안내를 렌더링한다", async () => {
    getPublishedInvitationMock.mockResolvedValue(null);

    render(await Page({ params: Promise.resolve({ publicKey: "missing" }) }));

    expect(screen.getByText("준비 중인 청첩장입니다")).toBeInTheDocument();
    expect(getProductServiceMock).not.toHaveBeenCalled();
  });

  it("draft 청첩장은 본문을 공개하지 않는다", async () => {
    getPublishedInvitationMock.mockResolvedValue({ status: "draft" });

    render(await Page({ params: Promise.resolve({ publicKey: "draft-key" }) }));

    expect(screen.getByText("준비 중인 청첩장입니다")).toBeInTheDocument();
    expect(screen.queryByText("청첩장:draft-key")).not.toBeInTheDocument();
  });

  it("만료된 청첩장은 종료 안내를 렌더링한다", async () => {
    getPublishedInvitationMock.mockResolvedValue({
      status: "published",
      productId: "product-1",
      features: [],
      content: { weddingDate: new Date("2020-01-01") },
    });

    render(
      await Page({ params: Promise.resolve({ publicKey: "expired-key" }) }),
    );

    expect(screen.getByText("종료된 청첩장입니다")).toBeInTheDocument();
    expect(getProductServiceMock).not.toHaveBeenCalled();
  });

  it("게시된 청첩장은 publicKey로 본문을 렌더링한다", async () => {
    getPublishedInvitationMock.mockResolvedValue({
      status: "published",
      productId: "product-1",
      features: [],
      content: { weddingDate: new Date("2099-01-01") },
    });
    getProductServiceMock.mockResolvedValue({ theme: "default" });

    render(
      await Page({ params: Promise.resolve({ publicKey: "published-key" }) }),
    );

    expect(screen.getByText("청첩장:published-key")).toBeInTheDocument();
    expect(getProductServiceMock).toHaveBeenCalledWith("product-1");
  });
});
