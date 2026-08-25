"use client";

import { useTransform, motion } from "motion/react";
import type { MotionValue } from "motion/react";
import type { ThemeInteractionProps } from "./InteractionOverlay";

const MAX_TILT_DEG = 14;

// 화면 모서리에 배치한 잎사귀 — depth가 클수록 parallax 이동폭이 커진다.
const LEAF_POSITIONS = [
  { left: 6, top: 10, depth: 1 },
  { left: 92, top: 14, depth: 0.7 },
  { left: 10, top: 82, depth: 0.7 },
  { left: 90, top: 84, depth: 1 },
] as const;

interface LeafProps {
  baseLeft: number;
  baseTop: number;
  depth: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
}

function Leaf({ baseLeft, baseTop, depth, x, y }: LeafProps) {
  const offsetXRatio = useTransform(() => {
    if (typeof window === "undefined") return 0;
    return (x.get() - window.innerWidth / 2) / (window.innerWidth / 2);
  });
  const offsetYRatio = useTransform(() => {
    if (typeof window === "undefined") return 0;
    return (y.get() - window.innerHeight / 2) / (window.innerHeight / 2);
  });

  const rotateY = useTransform(offsetXRatio, (v) => v * MAX_TILT_DEG);
  const rotateX = useTransform(offsetYRatio, (v) => -v * MAX_TILT_DEG);
  const parallaxX = useTransform(offsetXRatio, (v) => v * 14 * depth);
  const parallaxY = useTransform(offsetYRatio, (v) => v * 14 * depth);

  return (
    <motion.span
      aria-hidden
      className="absolute text-2xl"
      style={{
        left: `${baseLeft}%`,
        top: `${baseTop}%`,
        color: "var(--botanical-green)",
        x: parallaxX,
        y: parallaxY,
        rotateX,
        rotateY,
      }}
    >
      🍃
    </motion.span>
  );
}

export function BotanicalInteraction({ x, y }: ThemeInteractionProps) {
  return (
    <div className="h-full w-full" style={{ perspective: 800 }}>
      {LEAF_POSITIONS.map((pos, index) => (
        <Leaf
          key={index}
          baseLeft={pos.left}
          baseTop={pos.top}
          depth={pos.depth}
          x={x}
          y={y}
        />
      ))}
    </div>
  );
}
