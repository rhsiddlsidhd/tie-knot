import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppImage } from "./app-image";

describe("AppImage", () => {
  it("src가 있으면 이미지를 렌더링한다", () => {
    render(<AppImage src="/product.jpg" alt="상품 이미지" />);

    expect(screen.getByRole("img", { name: "상품 이미지" })).toHaveAttribute(
      "src",
    );
  });

  it("src가 빈 문자열이면 placeholder를 렌더링한다", () => {
    render(<AppImage src="" alt="상품 이미지" />);

    expect(screen.getByRole("img", { name: "상품 이미지" }).tagName).toBe(
      "DIV",
    );
  });

  it("이미지 로드에 실패하면 placeholder로 교체한다", () => {
    render(<AppImage src="/missing.jpg" alt="상품 이미지" />);

    fireEvent.error(screen.getByRole("img", { name: "상품 이미지" }));

    expect(screen.getByRole("img", { name: "상품 이미지" }).tagName).toBe(
      "DIV",
    );
  });

  it("실패한 이미지의 src가 바뀌면 새 이미지를 렌더링한다", () => {
    const { rerender } = render(
      <AppImage src="/missing.jpg" alt="상품 이미지" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "상품 이미지" }));

    rerender(<AppImage src="/replacement.jpg" alt="상품 이미지" />);

    expect(screen.getByRole("img", { name: "상품 이미지" }).tagName).toBe(
      "IMG",
    );
  });
});
