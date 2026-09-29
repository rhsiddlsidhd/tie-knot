import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/app/(admin)/admin/products/_containers/AdminProductsTable", () => ({
  AdminProductsTable: () => <div>상품 테이블</div>,
}));

import ProductsPage from "./page";

describe("관리자 상품 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
  });

  it("ADMIN 권한을 확인한 뒤 상품 테이블을 렌더링한다", async () => {
    render(await ProductsPage());

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
    expect(screen.getByText("상품 테이블")).toBeInTheDocument();
  });

  it("인증에 실패하면(verifySession이 throw) 테이블을 렌더링하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(ProductsPage()).rejects.toThrow("redirect");
  });
});
