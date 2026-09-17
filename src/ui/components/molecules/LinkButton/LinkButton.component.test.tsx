import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkButton } from "./LinkButton";

describe("LinkButton", () => {
  it("href를 가진 링크로 렌더링된다", () => {
    render(<LinkButton href="/orders">주문 내역</LinkButton>);

    const link = screen.getByRole("link", { name: "주문 내역" });
    expect(link).toHaveAttribute("href", "/orders");
  });

  it("variant와 size에 맞는 버튼 스타일 class를 링크에 적용한다", () => {
    render(
      <LinkButton href="/orders" variant="outline" size="lg">
        주문 내역
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "주문 내역" });
    expect(link.className).toContain("border");
    expect(link.className).toContain("h-10");
  });

  it("className을 링크에 병합한다", () => {
    render(
      <LinkButton href="/orders" className="w-full">
        주문 내역
      </LinkButton>,
    );

    const link = screen.getByRole("link", { name: "주문 내역" });
    expect(link.className).toContain("w-full");
  });
});
