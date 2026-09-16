import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

import { SidebarNavItem } from "./SidebarNavItem";

describe("SidebarNavItem", () => {
  it("링크 항목을 href와 함께 표시한다", () => {
    render(<SidebarNavItem type="ADMIN" />);

    expect(screen.getByRole("link", { name: /대시보드/ })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
  });

  it("그룹 메뉴는 기본으로 접혀 있다", () => {
    render(<SidebarNavItem type="ADMIN" />);

    expect(
      screen.queryByRole("link", { name: "상품 목록" }),
    ).not.toBeInTheDocument();
  });

  it("그룹 메뉴를 클릭하면 하위 항목을 펼친다", async () => {
    const user = userEvent.setup();
    render(<SidebarNavItem type="ADMIN" />);

    await user.click(screen.getByRole("button", { name: /상품 관리/ }));

    expect(screen.getByRole("link", { name: "상품 목록" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
  });
});
