import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pathnameMock, searchParamsMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/admin/dashboard"),
  searchParamsMock: vi.fn(() => new URLSearchParams()),
}));
vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useSearchParams: searchParamsMock,
}));

import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { Sheet, SheetContent } from "@/ui/components/ui/sheet";
import { SheetNavigationList } from "./SheetNavigationList";

const admin = NAVIGATION_BY_TYPE.ADMIN;
const main = NAVIGATION_BY_TYPE.MAIN;

// SheetClose는 Dialog 컨텍스트를 요구한다 — 실제 Sheet 안에서 렌더한다.
const renderInSheet = (section: typeof admin) =>
  render(
    <Sheet open>
      <SheetContent>
        <SheetNavigationList groups={section.groups} links={section.links} />
      </SheetContent>
    </Sheet>,
  );

describe("SheetNavigationList", () => {
  it("링크 항목을 href와 함께 표시한다", () => {
    pathnameMock.mockReturnValue("/admin/dashboard");
    searchParamsMock.mockReturnValue(new URLSearchParams());

    renderInSheet(admin);

    expect(screen.getByRole("link", { name: /대시보드/ })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
  });

  it("그룹 메뉴는 기본으로 접혀 있다", () => {
    pathnameMock.mockReturnValue("/admin/dashboard");
    searchParamsMock.mockReturnValue(new URLSearchParams());

    renderInSheet(admin);

    expect(
      screen.queryByRole("link", { name: "상품 목록" }),
    ).not.toBeInTheDocument();
  });

  it("그룹 메뉴를 클릭하면 하위 항목을 펼친다", async () => {
    pathnameMock.mockReturnValue("/admin/dashboard");
    searchParamsMock.mockReturnValue(new URLSearchParams());
    const user = userEvent.setup();

    renderInSheet(admin);

    await user.click(screen.getByRole("button", { name: /상품 관리/ }));

    expect(screen.getByRole("link", { name: "상품 목록" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
  });

  it("쿼리까지 일치하는 서브카테고리 링크만 active로 표시한다", async () => {
    pathnameMock.mockReturnValue("/products/guestbook");
    searchParamsMock.mockReturnValue(
      new URLSearchParams({ subCategory: "stamp" }),
    );
    const user = userEvent.setup();

    renderInSheet(main);

    await user.click(screen.getByRole("button", { name: /방명록 굿즈/ }));

    expect(screen.getByRole("link", { name: "스탬프" }).className).toContain(
      "bg-muted/50",
    );
    expect(screen.getByRole("link", { name: "전체보기" }).className).not.toContain(
      "bg-muted/50",
    );
  });

  it("쿼리가 없으면 전체보기 링크를 active로 표시한다", async () => {
    pathnameMock.mockReturnValue("/products/guestbook");
    searchParamsMock.mockReturnValue(new URLSearchParams());
    const user = userEvent.setup();

    renderInSheet(main);

    await user.click(screen.getByRole("button", { name: /방명록 굿즈/ }));

    expect(
      screen.getByRole("link", { name: "전체보기" }).className,
    ).toContain("bg-muted/50");
  });
});
