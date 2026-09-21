import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QuerySearchInput } from "./QuerySearchInput";

describe("QuerySearchInput", () => {
  it("basePath로 제출하는 GET 폼이다", () => {
    const { container } = render(
      <QuerySearchInput basePath="/admin/orders" label="주문 검색" />,
    );
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("action", "/admin/orders");
    expect(form?.method).toBe("get");
  });

  it("현재 검색어를 입력 기본값으로 갖는다", () => {
    render(
      <QuerySearchInput
        basePath="/admin/orders"
        label="주문 검색"
        value="김철수"
      />,
    );

    expect(screen.getByRole("searchbox", { name: /주문 검색/ })).toHaveValue(
      "김철수",
    );
  });

  it("검색어가 없으면 빈 입력으로 시작한다", () => {
    render(<QuerySearchInput basePath="/admin/orders" label="주문 검색" />);

    expect(screen.getByRole("searchbox", { name: /주문 검색/ })).toHaveValue(
      "",
    );
  });

  // 검색은 항상 첫 페이지에서 시작해야 한다 — cursor를 실어 보내면 이전 페이지
  // 위치가 새 검색 결과에 그대로 적용된다(#309 규약).
  it("cursor는 함께 보내지 않는다", () => {
    const { container } = render(
      <QuerySearchInput
        basePath="/admin/orders"
        label="주문 검색"
        preserved={{ status: "PENDING", cursor: "abc" }}
      />,
    );
    const form = container.querySelector("form")!;

    expect(within(form).queryByDisplayValue("abc")).toBeNull();
  });

  // 검색해도 이미 걸어둔 상태 필터는 유지돼야 한다.
  it("보존할 필터는 hidden으로 함께 보낸다", () => {
    const { container } = render(
      <QuerySearchInput
        basePath="/admin/orders"
        label="주문 검색"
        preserved={{ status: "PENDING" }}
      />,
    );
    const hidden = container.querySelector('input[name="status"]');

    expect(hidden).toHaveValue("PENDING");
    expect(hidden).toHaveAttribute("type", "hidden");
  });

  it("paramName을 입력 name으로 쓴다", () => {
    const { container } = render(
      <QuerySearchInput
        basePath="/admin/orders"
        label="주문 검색"
        paramName="keyword"
      />,
    );

    expect(
      container.querySelector('input[name="keyword"]'),
    ).toBeInTheDocument();
  });

  it("placeholder를 전달한다", () => {
    render(
      <QuerySearchInput
        basePath="/admin/orders"
        label="주문 검색"
        placeholder="주문번호, 고객명, 이메일"
      />,
    );

    expect(
      screen.getByPlaceholderText("주문번호, 고객명, 이메일"),
    ).toBeInTheDocument();
  });
});
