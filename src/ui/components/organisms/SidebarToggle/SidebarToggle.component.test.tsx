import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/products/new",
}));

import { SidebarProvider } from "@/ui/components/ui/sidebar";
import { SidebarToggle } from "./SidebarToggle";

describe("SidebarToggle", () => {
  it("숨김 대상이 아닌 경로 segment마다 navigation 라벨로 breadcrumb 링크를 표시한다", () => {
    render(
      <SidebarProvider>
        <SidebarToggle />
      </SidebarProvider>,
    );

    expect(screen.getByRole("link", { name: "상품 목록" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
    expect(screen.getByRole("link", { name: "상품 등록" })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
  });

  it("admin처럼 숨김 대상 segment는 breadcrumb에 표시하지 않는다", () => {
    render(
      <SidebarProvider>
        <SidebarToggle />
      </SidebarProvider>,
    );

    expect(
      screen.queryByRole("link", { name: "ADMIN" }),
    ).not.toBeInTheDocument();
  });
});
