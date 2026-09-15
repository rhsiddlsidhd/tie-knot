import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { QueryFilterSelect } from "./QueryFilterSelect";

type Status = "PENDING" | "CONFIRMED";

const options: Array<{ value: Status | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 상태" },
  { value: "PENDING", label: "결제대기" },
  { value: "CONFIRMED", label: "결제완료" },
];

describe("QueryFilterSelect", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("특정 값을 선택하면 basePath에 paramName query를 붙여 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        options={options}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "결제완료" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders?status=CONFIRMED");
  });

  it("ALL을 선택하면 query 없이 basePath로만 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        value="CONFIRMED"
        options={options}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "전체 상태" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders");
  });

  it("value를 지정하지 않으면 전체 옵션을 현재 값으로 표시한다", () => {
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        options={options}
      />,
    );

    expect(screen.getByText("전체 상태")).toBeInTheDocument();
  });
  // q가 생기면서 필터 변경이 검색어를 날리면 안 된다.
  it("보존할 파라미터를 함께 싣는다", async () => {
    const user = userEvent.setup();
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        options={options}
        preserved={{ q: "김철수" }}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "결제완료" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/admin/orders?q=%EA%B9%80%EC%B2%A0%EC%88%98&status=CONFIRMED",
    );
  });

  it("필터를 전체로 되돌려도 보존할 파라미터는 남는다", async () => {
    const user = userEvent.setup();
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        value="PENDING"
        options={options}
        preserved={{ q: "kim" }}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "전체 상태" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders?q=kim");
  });

  // 필터를 바꾸면 이전 페이지 위치는 의미가 없다.
  it("cursor는 보존하지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <QueryFilterSelect
        basePath="/admin/orders"
        paramName="status"
        options={options}
        preserved={{ cursor: "abc" }}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "결제완료" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders?status=CONFIRMED");
  });
});
