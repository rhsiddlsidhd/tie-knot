import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AvailableSubCategory } from "@/core/domain/product-category";

const { getAvailableSubCategoriesServiceMock } = vi.hoisted(() => ({
  getAvailableSubCategoriesServiceMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useAuth", () => ({
  useAuth: () => ({ session: null as unknown, isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/services/product", () => ({
  getAvailableSubCategoriesService: getAvailableSubCategoriesServiceMock,
}));

import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { Header } from "./Header";

const leafItem = NAVIGATION_BY_TYPE.MAIN.links[0]!;

const guestbookOnlyBook: AvailableSubCategory[] = [
  { category: "guestbook", subCategory: "book" },
];

const renderHeader = async () => render(await Header());

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAvailableSubCategoriesServiceMock.mockResolvedValue(guestbookOnlyBook);
  });

  it("로고는 홈으로 이동하는 링크다", async () => {
    await renderHeader();

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("검색 아이콘은 /search로 이동하는 링크다", async () => {
    await renderHeader();

    expect(screen.getByRole("link", { name: "상품 검색" })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("메뉴 버튼 클릭 시 Sheet가 열리고 MAIN nav 링크가 보인다", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: new RegExp(leafItem.label) }),
    ).toHaveAttribute("href", leafItem.href);
  });

  it("닫기 버튼 클릭 시 Sheet가 닫힌다", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("공개 상품이 있는 서브카테고리만 nav에 그린다", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /방명록 굿즈/ }),
    );

    expect(
      within(dialog).getByRole("link", { name: "방명록" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("link", { name: "스탬프" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /답례품/ }),
    ).not.toBeInTheDocument();
  });

  it("nav 링크를 클릭하면 Sheet가 닫힌다", async () => {
    const user = userEvent.setup();
    await renderHeader();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("link", { name: new RegExp(leafItem.label) }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("서브카테고리 조회가 실패하면 정적 카테고리 목록으로 폴백한다", async () => {
    getAvailableSubCategoriesServiceMock.mockRejectedValue(
      new Error("db down"),
    );
    const user = userEvent.setup();
    await renderHeader();

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByRole("button", { name: /답례품/ }),
    ).toBeInTheDocument();
  });
});
