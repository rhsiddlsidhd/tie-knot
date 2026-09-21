import { act, render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ThemeAmbience } from "./ThemeAmbience";

// BotanicalAmbience는 wrapper의 실제 렌더 높이를 ResizeObserver로 관찰해야만
// svg 매듭을 그린다 — jsdom-polyfill의 기본 ResizeObserverMock은 콜백을
// 저장하지 않는 no-op이라 리사이즈 발생을 재현할 수 없다.
// GuestbookSection.component.test.tsx의 IntersectionObserver capturing mock과
// 동일한 패턴으로 콜백을 직접 캡처해 실행한다.
let latestResizeCallback: ResizeObserverCallback | null = null;
const nativeResizeObserver = globalThis.ResizeObserver;

class CapturingResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    latestResizeCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver =
    CapturingResizeObserverMock as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  latestResizeCallback = null;
});

afterAll(() => {
  globalThis.ResizeObserver = nativeResizeObserver;
});

// prefers-reduced-motion(테마 무관 null 렌더 분기)은 여기서 검증하지 않는다:
// motion/react의 useReducedMotion은 matchMedia 결과를 모듈 스코프에 프로세스
// 생애주기 동안 딱 한 번만 캐시해서, 같은 테스트 파일 안에서 matchMedia를
// 목킹해 값을 바꿔가며 검증하면 그 뒤 테스트 전부가 첫 캐시값에 오염된다
// (InteractionOverlay.component.test.tsx와 동일한 제약).

describe("ThemeAmbience", () => {
  it("blossom 테마는 낙하하는 꽃잎 파티클을 렌더한다", () => {
    const { container } = render(<ThemeAmbience theme="blossom" />);

    expect(container.textContent).toContain("🌸");
  });

  it("botanical 테마는 리사이즈로 높이가 관찰되기 전엔 매듭을 렌더하지 않는다", () => {
    const { container } = render(<ThemeAmbience theme="botanical" />);

    expect(latestResizeCallback).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("botanical 테마는 높이가 관찰되면 매듭 svg를 렌더한다", () => {
    const { container } = render(<ThemeAmbience theme="botanical" />);

    act(() => {
      latestResizeCallback!(
        [{ contentRect: { height: 400 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("midnight 테마는 별과 별똥별 파티클을 렌더한다", () => {
    const { container } = render(<ThemeAmbience theme="midnight" />);

    // MIDNIGHT_STARS(14개) + ShootingStar(1개) = motion.span 15개가
    // 이 테마의 유일한 렌더 결과다.
    expect(container.querySelectorAll("span")).toHaveLength(15);
  });

  it("default 테마는 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<ThemeAmbience theme="default" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("등록되지 않은 테마 문자열은 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<ThemeAmbience theme="does-not-exist" />);

    expect(container).toBeEmptyDOMElement();
  });
});
