import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeSync } from "./ThemeSync";

describe("ThemeSync", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("마운트 시 documentElement에 theme을 data-theme으로 반영한다", () => {
    render(<ThemeSync theme="midnight" />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("midnight");
  });

  it("언마운트 시 이전 data-theme 값으로 복원한다", () => {
    document.documentElement.setAttribute("data-theme", "default");

    const { unmount } = render(<ThemeSync theme="blossom" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("blossom");

    unmount();
    expect(document.documentElement.getAttribute("data-theme")).toBe("default");
  });

  it("이전 값이 없었다면 언마운트 시 속성을 제거한다", () => {
    const { unmount } = render(<ThemeSync theme="botanical" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("botanical");

    unmount();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("theme prop이 바뀌면 documentElement도 새 값으로 갱신한다", () => {
    const { rerender } = render(<ThemeSync theme="default" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("default");

    rerender(<ThemeSync theme="midnight" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("midnight");
  });

  it("항상 null을 렌더한다(화면에 자체 UI가 없다)", () => {
    const { container } = render(<ThemeSync theme="default" />);

    expect(container).toBeEmptyDOMElement();
  });
});
