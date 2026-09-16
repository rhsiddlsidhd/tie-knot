import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/my-orders",
}));
vi.mock("@/ui/components/organisms/SidebarToggle", () => ({
  SidebarToggle: (): null => null,
}));

import Layout from "./layout";

describe("(my-order) Layout", () => {
  it("공통 사이드바에 주문 메뉴와 페이지 내용을 표시한다", () => {
    render(<Layout>주문 페이지</Layout>);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("button", { name: /주문 정보/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("주문 페이지")).toBeInTheDocument();
  });
});
