"use client";

import { useSpring, useTransform, motion } from "motion/react";
import type { ThemeInteractionProps } from "./InteractionOverlay";

const SPOTLIGHT_SIZE = 220;

// 커서/터치 지점을 은은하게 따라다니는 spotlight glow.
export function DefaultInteraction({ x, y }: ThemeInteractionProps) {
  const springX = useSpring(x, { stiffness: 260, damping: 32 });
  const springY = useSpring(y, { stiffness: 260, damping: 32 });
  const left = useTransform(springX, (v) => v - SPOTLIGHT_SIZE / 2);
  const top = useTransform(springY, (v) => v - SPOTLIGHT_SIZE / 2);

  return (
    <motion.div
      aria-hidden
      className="absolute rounded-full blur-2xl"
      style={{
        left,
        top,
        width: SPOTLIGHT_SIZE,
        height: SPOTLIGHT_SIZE,
        background:
          "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        opacity: 0.5,
      }}
    />
  );
}
