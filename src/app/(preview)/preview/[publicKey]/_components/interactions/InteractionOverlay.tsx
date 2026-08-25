"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useMotionValue, useReducedMotion } from "motion/react";
import type { MotionValue } from "motion/react";
import { BlossomInteraction } from "./BlossomInteraction";
import { BotanicalInteraction } from "./BotanicalInteraction";
import { MidnightInteraction } from "./MidnightInteraction";
import { DefaultInteraction } from "./DefaultInteraction";

export interface ThemeInteractionProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const themeInteractionMap: Record<string, ComponentType<ThemeInteractionProps>> = {
  blossom: BlossomInteraction,
  botanical: BotanicalInteraction,
  midnight: MidnightInteraction,
  default: DefaultInteraction,
};

interface InteractionOverlayProps {
  theme: string;
}

// 청첩장 테마별로 포인터/터치 입력에 반응하는 연출을 얹는다. 오버레이는 좌표만
// 관찰하고(passive) pointer-events:none이라 아래 콘텐츠·Radix Dialog 클릭을
// 절대 가로채지 않는다 — prefers-reduced-motion이면 리스너 자체를 안 붙인다.
export function InteractionOverlay({ theme }: InteractionOverlayProps) {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // 실제 입력이 한 번도 없으면 (0,0)은 "커서가 좌상단 모서리에 있다"가 아니라
  // "아직 입력 없음"을 뜻한다 — 첫 입력 전까지는 아예 렌더하지 않는다. SSR과
  // hydration 직후 첫 렌더가 항상 이 상태와 같아서 hydration mismatch도 없다.
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handlePointerInput = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setHasInteracted(true);
    };

    window.addEventListener("pointermove", handlePointerInput, { passive: true });
    window.addEventListener("pointerdown", handlePointerInput, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerInput);
      window.removeEventListener("pointerdown", handlePointerInput);
    };
  }, [shouldReduceMotion, x, y]);

  if (shouldReduceMotion || !hasInteracted) return null;

  const ThemeInteraction = themeInteractionMap[theme] ?? DefaultInteraction;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <ThemeInteraction x={x} y={y} />
    </div>
  );
}
