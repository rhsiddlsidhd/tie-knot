import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMotionValue } from "motion/react";
import { BotanicalInteraction } from "./BotanicalInteraction";

// InteractionOverlay는 첫 입력 이후에만 이 컴포넌트를 마운트하므로, 마운트
// 시점의 x/y는 이미 실제 좌표다. tip(빠른 spring)과 anchor(느린 spring) 둘 다
// 같은 source의 현재 값으로 초기화되므로(motion-dom followValue), 실제
// 애니메이션 프레임이 흐르기 전까지는 두 값이 일치한다 — 이 결정적인 마운트
// 직후 상태(둘 다 같은 좌표)만 jsdom에서 검증한다. 이후 프레임에서 둘이
// 갈라지며 덩굴손이 늘어나는 것은 실제 browser rAF 타이밍에 의존하는 애니메이션
// geometry라 Component tier 범위 밖이다(docs/__test/component.md "Browser
// Limitations").
const createMotionValue = (initial: number) => {
  const { result } = renderHook(() => useMotionValue(initial));
  return result.current;
};

const getCurvePath = (container: HTMLElement) => {
  return container.querySelector("path[stroke]");
};

describe("BotanicalInteraction", () => {
  it("커서 좌표에서 시작해 같은 좌표로 끝나는 곡선을 렌더한다(마운트 직후 tip===anchor)", () => {
    const x = createMotionValue(200);
    const y = createMotionValue(150);

    const { container } = render(<BotanicalInteraction x={x} y={y} />);
    const path = getCurvePath(container);

    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toBe("M 200 150 Q 200 150 200 150");
    expect(path?.getAttribute("stroke")).toBe("var(--botanical-green)");
  });

  it("커서 좌표가 다르면 곡선의 시작/끝점도 그 좌표를 따라간다", () => {
    const x = createMotionValue(50);
    const y = createMotionValue(60);

    const { container } = render(<BotanicalInteraction x={x} y={y} />);
    const path = getCurvePath(container);

    expect(path?.getAttribute("d")).toBe("M 50 60 Q 50 60 50 60");
  });

  it("덩굴 끝에 달린 잎 도형을 커서 위치에 렌더한다", () => {
    const x = createMotionValue(200);
    const y = createMotionValue(150);

    const { container } = render(<BotanicalInteraction x={x} y={y} />);
    const leaf = container.querySelector("g path");

    expect(leaf).not.toBeNull();
    expect(leaf?.getAttribute("fill")).toBe("var(--botanical-green)");
  });
});
