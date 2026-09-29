import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/app/(admin)/admin/reviews/_containers/AdminReviewsTable", () => ({
  AdminReviewsTable: () => <div>리뷰 테이블</div>,
}));

import ReviewsPage from "./page";

describe("관리자 리뷰 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
  });

  it("ADMIN 권한을 확인한 뒤 리뷰 테이블을 렌더링한다", async () => {
    render(await ReviewsPage());

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
    expect(screen.getByText("리뷰 테이블")).toBeInTheDocument();
  });

  it("인증에 실패하면(verifySession이 throw) 테이블을 렌더링하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(ReviewsPage()).rejects.toThrow("redirect");
  });
});
