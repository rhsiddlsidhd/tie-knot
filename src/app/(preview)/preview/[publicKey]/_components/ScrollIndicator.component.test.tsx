import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollIndicator } from "./ScrollIndicator";

// ScrollIndicator는 props도 조건 분기도 없는 순수 시각 장식(bounce 애니메이션)이다 —
// 검증 가능한 behavior가 "에러 없이 마운트/언마운트되고 무언가를 렌더한다"로
// 제한된다. 애니메이션 타이밍·좌표 자체는 jsdom이 증명할 수 없는 실제 layout
// 영역이라(component.md Browser Limitations) 여기서 검증하지 않는다.
describe("ScrollIndicator", () => {
  it("에러 없이 마운트되고 시각적 인디케이터를 렌더한다", () => {
    const { container, unmount } = render(<ScrollIndicator />);

    expect(container.firstChild).not.toBeNull();
    expect(() => unmount()).not.toThrow();
  });
});
