"use client";

import { useTransform, useSpring, motion } from "motion/react";
import type { MotionValue } from "motion/react";
import type { ThemeInteractionProps } from "./InteractionOverlay";

const REPEL_RADIUS = 160;
const REPEL_FORCE = 36;

// 화면 곳곳에 흩어둔 꽃잎 기준 위치 — blossom-petal 앰비언트 CSS와 같은
// left% 분산 패턴을 재사용한다.
const PETAL_BASE_POSITIONS = [
  { left: 10, top: 18 },
  { left: 26, top: 62 },
  { left: 42, top: 30 },
  { left: 58, top: 74 },
  { left: 74, top: 22 },
  { left: 88, top: 58 },
] as const;

interface PetalProps {
  baseLeft: number;
  baseTop: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
}

function Petal({ baseLeft, baseTop, x, y }: PetalProps) {
  // dist가 0에 가까울수록(커서가 꽃잎 바로 위) 힘은 최대여야 한다 — 0으로
  // 나누는 것만 막고(epsilon), "가깝다"를 "힘 없음"으로 착각하지 않는다.
  const offsetX = useTransform(() => {
    if (typeof window === "undefined") return 0;
    const baseX = (baseLeft / 100) * window.innerWidth;
    const dx = baseX - x.get();
    const dy = (baseTop / 100) * window.innerHeight - y.get();
    const dist = Math.hypot(dx, dy);
    if (dist > REPEL_RADIUS) return 0;
    return (dx / Math.max(dist, 1)) * (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
  });
  const offsetY = useTransform(() => {
    if (typeof window === "undefined") return 0;
    const baseX = (baseLeft / 100) * window.innerWidth;
    const baseY = (baseTop / 100) * window.innerHeight;
    const dx = baseX - x.get();
    const dy = baseY - y.get();
    const dist = Math.hypot(dx, dy);
    if (dist > REPEL_RADIUS) return 0;
    return (dy / Math.max(dist, 1)) * (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
  });

  const springX = useSpring(offsetX, { stiffness: 140, damping: 14 });
  const springY = useSpring(offsetY, { stiffness: 140, damping: 14 });
  const rotate = useTransform(springX, [-REPEL_FORCE, REPEL_FORCE], [-50, 50]);

  return (
    <motion.span
      aria-hidden
      className="absolute text-lg"
      style={{
        left: `${baseLeft}%`,
        top: `${baseTop}%`,
        color: "var(--blossom-pink)",
        x: springX,
        y: springY,
        rotate,
      }}
    >
      🌸
    </motion.span>
  );
}

export function BlossomInteraction({ x, y }: ThemeInteractionProps) {
  return (
    <>
      {PETAL_BASE_POSITIONS.map((pos, index) => (
        <Petal key={index} baseLeft={pos.left} baseTop={pos.top} x={x} y={y} />
      ))}
    </>
  );
}
