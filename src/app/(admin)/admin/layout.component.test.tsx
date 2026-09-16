import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));
vi.mock("@/ui/components/organisms/SidebarToggle", () => ({
  SidebarToggle: (): null => null,
}));
vi.mock("@/app/(admin)/admin/_components/AdminModal", () => ({
  AdminModal: (): null => null,
}));

import AdminLayout from "./layout";

describe("(admin) AdminLayout", () => {
  it("공통 사이드바에 관리자 메뉴와 페이지 내용을 표시한다", () => {
    render(<AdminLayout>관리자 페이지</AdminLayout>);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /대시보드/ })).toBeInTheDocument();
    expect(screen.getByText("관리자 페이지")).toBeInTheDocument();
  });
});
