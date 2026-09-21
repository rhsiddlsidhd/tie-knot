import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/ui/hooks/useAuth", () => ({
  useAuth: () => ({ session: null as unknown, isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { Header } from "./Header";

const leafItem = NAVIGATION_BY_TYPE.MAIN.links[0]!;

describe("Header", () => {
  it("로고는 홈으로 이동하는 링크다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute("href", "/");
  });

  it("검색 아이콘은 /search로 이동하는 링크다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "상품 검색" })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("메뉴 버튼 클릭 시 Sheet가 열리고 MAIN nav 링크가 보인다", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: new RegExp(leafItem.label) }),
    ).toHaveAttribute("href", leafItem.href);
  });

  it("닫기 버튼 클릭 시 Sheet가 닫힌다", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
