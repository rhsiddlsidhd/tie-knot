import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InteractionOverlay } from "./InteractionOverlay";

// InteractionOverlay의 리스너는 React 합성 이벤트가 아니라 window에 직접
// 붙은 네이티브 리스너라 dispatchEvent가 트리거하는 setState를 act()로
// 감싸야 커밋된 결과를 곧바로 단언할 수 있다.
function firePointerMove(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
  });
}

// prefers-reduced-motion 분기는 여기서 검증하지 않는다: motion/react의
// useReducedMotion은 matchMedia 결과를 모듈 스코프에 프로세스 생애주기 동안
// 딱 한 번만 캐시해서, 같은 테스트 파일 안에서 matchMedia를 목킹해 값을
// 바꿔가며 검증하면 그 뒤 테스트 전부가 첫 캐시값에 오염된다.

describe("InteractionOverlay", () => {
  it("첫 입력 전에는 아무것도 렌더하지 않는다", () => {
    const { container } = render(<InteractionOverlay theme="blossom" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("blossom 테마는 고정 꽃잎 없이 default(spotlight)로 폴백한다", () => {
    const { container } = render(<InteractionOverlay theme="blossom" />);
    firePointerMove(200, 200);
    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeNull();
  });

  it("botanical 테마는 pointermove 이후 커서를 향해 뻗는 덩굴손을 렌더한다", () => {
    const { container } = render(<InteractionOverlay theme="botanical" />);
    firePointerMove(200, 200);
    expect(container.querySelector("path")).not.toBeNull();
  });

  it("midnight 테마는 pointermove 이후 트레일 파티클을 렌더한다", () => {
    const { container } = render(<InteractionOverlay theme="midnight" />);
    firePointerMove(200, 200);
    expect(container.textContent).toContain("✦");
  });

  it("default 테마는 pointermove 이후 spotlight glow를 렌더한다", () => {
    const { container } = render(<InteractionOverlay theme="default" />);
    firePointerMove(200, 200);
    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeNull();
  });

  it("등록되지 않은 테마 문자열은 default(spotlight)로 폴백한다", () => {
    const { container } = render(<InteractionOverlay theme="does-not-exist" />);
    firePointerMove(200, 200);
    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeNull();
  });
});
