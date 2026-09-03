import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CursorPagination } from "./CursorPagination";

describe("CursorPagination", () => {
  it("nextCursor가 있으면 다음 페이지가 현재 필터+cursor를 담은 링크다", () => {
    render(
      <CursorPagination
        basePath="/admin/orders"
        query={{ status: "CONFIRMED" }}
        hasCursor={false}
        nextCursor="next-cursor-value"
      />,
    );

    const nextLink = screen.getByRole("link", { name: "다음 페이지" });
    expect(nextLink).toHaveAttribute(
      "href",
      "/admin/orders?status=CONFIRMED&cursor=next-cursor-value",
    );
  });

  it("nextCursor가 없으면 다음 페이지 버튼이 비활성화되고 링크가 아니다", () => {
    render(
      <CursorPagination basePath="/admin/orders" hasCursor={false} nextCursor={null} />,
    );

    const nextButton = screen.getByRole("button", { name: "다음 페이지" });
    expect(nextButton).toBeDisabled();
    expect(screen.queryByRole("link", { name: "다음 페이지" })).not.toBeInTheDocument();
  });

  it("hasCursor가 true면 첫 페이지가 cursor를 뺀 현재 필터 링크다", () => {
    render(
      <CursorPagination
        basePath="/admin/users"
        query={{ role: "USER" }}
        hasCursor={true}
        nextCursor={null}
      />,
    );

    const firstLink = screen.getByRole("link", { name: "첫 페이지" });
    expect(firstLink).toHaveAttribute("href", "/admin/users?role=USER");
  });

  it("hasCursor가 false면 첫 페이지 버튼이 비활성화된다", () => {
    render(
      <CursorPagination basePath="/admin/users" hasCursor={false} nextCursor={null} />,
    );

    const firstButton = screen.getByRole("button", { name: "첫 페이지" });
    expect(firstButton).toBeDisabled();
  });
});
