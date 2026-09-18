import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMotionValue } from "motion/react";
import { MidnightInteraction } from "./MidnightInteraction";

// spawn()은 setTimeout이 아니라 performance.now()를 직접 읽어 스로틀한다 —
// vi.useFakeTimers()는 이 값을 결정적으로 만들지 못하므로(rAF/JSAnimation
// 프레임 루프까지 함께 얼려 오히려 예측 불가해진다), performance.now() 자체를
// mock해 스로틀 경계를 결정적으로 재현한다.
const createMotionValue = (initial: number) => {
  const { result } = renderHook(() => useMotionValue(initial));
  return result.current;
}

describe("MidnightInteraction", () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("마운트 시점의 커서 위치에 트레일 파티클을 하나 렌더한다", () => {
    now = 1000;
    const x = createMotionValue(120);
    const y = createMotionValue(80);

    const { container } = render(<MidnightInteraction x={x} y={y} />);

    expect(container.querySelectorAll("span")).toHaveLength(1);
    expect(container.textContent).toContain("✦");
  });

  it("스로틀 간격(70ms) 안의 연속된 이동은 새 파티클을 추가하지 않는다", () => {
    now = 1000;
    const x = createMotionValue(120);
    const y = createMotionValue(80);
    const { container } = render(<MidnightInteraction x={x} y={y} />);

    now = 1020;
    act(() => {
      x.set(140);
    });

    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("스로틀 간격을 넘긴 이동은 새 트레일 파티클을 추가한다", () => {
    now = 1000;
    const x = createMotionValue(120);
    const y = createMotionValue(80);
    const { container } = render(<MidnightInteraction x={x} y={y} />);

    now = 1080;
    act(() => {
      x.set(140);
    });

    expect(container.querySelectorAll("span")).toHaveLength(2);
  });
});
