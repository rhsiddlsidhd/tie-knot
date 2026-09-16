import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/ui/components/atoms/sidebar";
import { AppSidebar } from "./AppSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

const renderSidebar = (navType: "ADMIN" | "MY_PROFILE" | "MY_ORDER") => {
  return render(
    <SidebarProvider defaultOpen>
      <AppSidebar navType={navType} />
    </SidebarProvider>,
  );
};

describe("AppSidebar", () => {
  it("모바일 홈 기준 로고와 서비스 문구를 표시한다", () => {
    renderSidebar("ADMIN");

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("모바일 청첩장 & 명함 서비스")).toBeInTheDocument();
  });

  it.each([
    ["ADMIN", "대시보드"],
    ["MY_PROFILE", "프로필"],
    ["MY_ORDER", "주문 정보"],
  ] as const)("%s 타입에 해당하는 메뉴를 표시한다", (navType, menuName) => {
    renderSidebar(navType);

    expect(screen.getByText(menuName)).toBeInTheDocument();
  });

  it("주문과 프로필 사이드바는 해당 라우트 메뉴만 표시한다", () => {
    const { unmount } = renderSidebar("MY_ORDER");

    expect(screen.getByText("주문 정보")).toBeInTheDocument();
    expect(screen.queryByText("고객 센터")).not.toBeInTheDocument();
    expect(screen.queryByText("프로필")).not.toBeInTheDocument();

    unmount();
    renderSidebar("MY_PROFILE");

    expect(screen.getByText("프로필")).toBeInTheDocument();
    expect(screen.queryByText("주문 정보")).not.toBeInTheDocument();
  });

  it("링크를 클릭하면 사이드바를 즉시 닫는다", async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar("MY_PROFILE");
    const sidebar = container.querySelector(
      '[data-slot="sidebar"][data-state]',
    );

    expect(sidebar).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByRole("link", { name: /프로필/ }));

    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });
});
