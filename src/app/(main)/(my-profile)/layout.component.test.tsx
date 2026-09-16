import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/my-profile",
}));
vi.mock("@/ui/components/organisms/SidebarToggle", () => ({
  SidebarToggle: (): null => null,
}));

import Layout from "./layout";

describe("(my-profile) Layout", () => {
  it("공통 사이드바에 프로필 메뉴와 페이지 내용을 표시한다", () => {
    render(<Layout>프로필 페이지</Layout>);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /프로필/ })).toBeInTheDocument();
    expect(screen.getByText("프로필 페이지")).toBeInTheDocument();
  });
});
