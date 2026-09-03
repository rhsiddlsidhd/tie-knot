"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent } from "motion/react";
import type { ThemeInteractionProps } from "./InteractionOverlay";

const SPAWN_INTERVAL_MS = 70;
const MAX_TRAIL_POINTS = 16;
const FADE_DURATION_S = 0.9;

interface TrailPoint {
  id: number;
  left: number;
  top: number;
}

// 커서/터치 궤적을 따라 금빛 파티클을 흩뿌리고 개별적으로 사라지게 한다.
export function MidnightInteraction({ x, y }: ThemeInteractionProps) {
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const lastSpawnRef = useRef(0);
  const nextIdRef = useRef(0);

  const spawn = (left: number, top: number) => {
    const now = performance.now();
    if (now - lastSpawnRef.current < SPAWN_INTERVAL_MS) return;
    lastSpawnRef.current = now;

    const id = nextIdRef.current++;
    setPoints((prev) => [...prev.slice(-MAX_TRAIL_POINTS + 1), { id, left, top }]);
  };

  // 마운트 시점엔 이미 첫 pointermove가 x/y를 채운 뒤(오버레이가 그 이벤트로
  // hasInteracted를 켜서 이 컴포넌트를 마운트했기 때문) — 그 값을 즉시 한 번
  // 찍어야, 다음 이벤트를 기다리지 않고 최초 입력에서 바로 트레일이 보인다.
  useEffect(() => {
    spawn(x.get(), y.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(x, "change", (latestX) => spawn(latestX, y.get()));

  return (
    <>
      {points.map((point) => (
        <motion.span
          key={point.id}
          aria-hidden
          className="absolute text-sm"
          style={{ left: point.left, top: point.top, color: "var(--midnight-gold)" }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 0.2, y: -12 }}
          transition={{ duration: FADE_DURATION_S, ease: "easeOut" }}
          onAnimationComplete={() =>
            setPoints((prev) => prev.filter((p) => p.id !== point.id))
          }
        >
          ✦
        </motion.span>
      ))}
    </>
  );
}
