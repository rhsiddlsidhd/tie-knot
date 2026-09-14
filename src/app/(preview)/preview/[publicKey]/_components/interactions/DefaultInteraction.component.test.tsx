import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMotionValue } from "motion/react";
import { DefaultInteraction } from "./DefaultInteraction";

// InteractionOverlay는 항상 첫 입력(pointermove/pointerdown)을 받은 뒤에만 이
// 컴포넌트를 마운트한다 — 이 시점엔 x/y가 이미 실제 좌표를 담고 있어 spring이
// source와 같은 값으로 초기화된다(motion-dom followValue: initialValue =
// source.get()). 그래서 애니메이션 settle을 기다리지 않고도 마운트 직후의
// 위치 계산(SPOTLIGHT_SIZE/2 중심 정렬)을 결정적으로 검증할 수 있다.
const createMotionValue = (initial: number) => {
  const { result } = renderHook(() => useMotionValue(initial));
  return result.current;
}

const getGlow = (container: HTMLElement) => {
  return container.querySelector('[style*="radial-gradient"]') as HTMLElement | null;
}

describe("DefaultInteraction", () => {
  it("커서 좌표를 중심으로 spotlight glow를 배치한다", () => {
    const x = createMotionValue(200);
    const y = createMotionValue(150);

    const { container } = render(<DefaultInteraction x={x} y={y} />);
    const glow = getGlow(container);

    expect(glow).not.toBeNull();
    // SPOTLIGHT_SIZE(220)의 절반만큼 빼서 커서가 정중앙에 오도록 좌상단을 계산한다.
    expect(glow?.style.left).toBe("90px");
    expect(glow?.style.top).toBe("40px");
    expect(glow?.style.width).toBe("220px");
    expect(glow?.style.height).toBe("220px");
  });

  it("커서 좌표가 다르면 spotlight 중심도 그 좌표를 따라간다", () => {
    const x = createMotionValue(0);
    const y = createMotionValue(0);

    const { container } = render(<DefaultInteraction x={x} y={y} />);
    const glow = getGlow(container);

    expect(glow?.style.left).toBe("-110px");
    expect(glow?.style.top).toBe("-110px");
  });
});
