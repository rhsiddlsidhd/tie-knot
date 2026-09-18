import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminListHeading } from "./AdminListHeading";

describe("AdminListHeading", () => {
  it("title을 표시한다", () => {
    render(<AdminListHeading title="주문 관리" />);

    expect(
      screen.getByRole("heading", { name: "주문 관리" }),
    ).toBeInTheDocument();
  });

  it("subtitle을 지정하면 함께 표시한다", () => {
    render(
      <AdminListHeading title="상품 목록" subtitle="등록된 템플릿 상품을 관리합니다." />,
    );

    expect(
      screen.getByText("등록된 템플릿 상품을 관리합니다."),
    ).toBeInTheDocument();
  });

  it("subtitle을 지정하지 않으면 렌더링하지 않는다", () => {
    render(<AdminListHeading title="리뷰 관리" />);

    expect(screen.queryByText(/관리합니다/)).not.toBeInTheDocument();
  });
});
