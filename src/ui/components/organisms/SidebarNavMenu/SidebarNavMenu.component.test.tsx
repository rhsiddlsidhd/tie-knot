import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/ui/components/atoms/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

import { SidebarNavMenu } from "./SidebarNavMenu";

const renderMenu = (
  type: "ADMIN" | "MY_PROFILE" | "MY_ORDER",
  { open = true }: { open?: boolean } = {},
) => {
  return render(
    <SidebarProvider defaultOpen={open}>
      <SidebarNavMenu type={type} />
    </SidebarProvider>,
  );
};

describe("SidebarNavMenu", () => {
  it("링크 항목을 href와 함께 표시한다", () => {
    renderMenu("ADMIN");

    expect(screen.getByRole("link", { name: /대시보드/ })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
  });

  it("그룹 메뉴는 기본으로 접혀 있다", () => {
    renderMenu("ADMIN");

    expect(
      screen.queryByRole("link", { name: "상품 목록" }),
    ).not.toBeInTheDocument();
  });

  it("그룹 버튼을 클릭하면 하위 항목을 노출한다", async () => {
    const user = userEvent.setup();
    renderMenu("ADMIN");

    await user.click(screen.getByRole("button", { name: /상품 관리/ }));

    expect(screen.getByRole("link", { name: "상품 목록" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
  });

  it("현재 경로와 일치하는 링크에 active 상태를 표시한다", () => {
    renderMenu("ADMIN");

    const activeLink = screen.getByRole("link", { name: /대시보드/ });
    expect(activeLink).toHaveAttribute("data-active", "true");
  });

  it("collapse(icon) 상태에서도 메뉴 버튼에 tooltip 텍스트가 접근 가능한 형태로 존재한다", async () => {
    const user = userEvent.setup();
    renderMenu("ADMIN", { open: false });

    const dashboardLink = screen.getByRole("link", { name: /대시보드/ });
    await user.hover(dashboardLink);

    expect(await screen.findAllByText("대시보드")).not.toHaveLength(0);
  });
});
