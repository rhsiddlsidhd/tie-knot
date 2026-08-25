"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll } from "motion/react";

const BLOSSOM_PETALS = [
  { left: "8%", duration: 7, delay: 0 },
  { left: "22%", duration: 9, delay: 1.5 },
  { left: "40%", duration: 6, delay: 3 },
  { left: "60%", duration: 10, delay: 0.5 },
  { left: "78%", duration: 8, delay: 2 },
  { left: "92%", duration: 7.5, delay: 4 },
] as const;

function BlossomAmbience() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {BLOSSOM_PETALS.map((petal, i) => (
        <motion.span
          key={petal.left}
          className="absolute top-[-5%] text-lg"
          style={{ left: petal.left }}
          initial={{ y: "-10%", opacity: 0 }}
          animate={{
            y: "110vh",
            x: i % 2 === 0 ? 60 : -60,
            rotate: 360,
            opacity: [0, 0.7, 0.7, 0.5, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          🌸
        </motion.span>
      ))}
    </div>
  );
}

const MIDNIGHT_STARS = [
  { top: "6%", left: "12%", size: 2, duration: 2.4, delay: 0 },
  { top: "10%", left: "68%", size: 1.5, duration: 3.1, delay: 0.6 },
  { top: "16%", left: "38%", size: 2, duration: 2.8, delay: 1.2 },
  { top: "21%", left: "84%", size: 1.5, duration: 2.2, delay: 0.3 },
  { top: "28%", left: "20%", size: 2, duration: 3.4, delay: 1.8 },
  { top: "33%", left: "55%", size: 1.5, duration: 2.6, delay: 0.9 },
  { top: "40%", left: "8%", size: 2, duration: 3, delay: 2.4 },
  { top: "45%", left: "90%", size: 1.5, duration: 2.9, delay: 1.5 },
  { top: "52%", left: "45%", size: 2, duration: 2.3, delay: 0.2 },
  { top: "58%", left: "72%", size: 1.5, duration: 3.2, delay: 2.1 },
  { top: "65%", left: "15%", size: 2, duration: 2.7, delay: 1.1 },
  { top: "71%", left: "60%", size: 1.5, duration: 2.5, delay: 0.7 },
  { top: "78%", left: "30%", size: 2, duration: 3.3, delay: 1.9 },
  { top: "85%", left: "80%", size: 1.5, duration: 2.4, delay: 0.4 },
] as const;

function ShootingStar() {
  return (
    <motion.span
      className="absolute top-[10%] left-[-10%] h-px w-24 rounded-full"
      style={{
        background:
          "linear-gradient(90deg, transparent, var(--midnight-gold), transparent)",
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: [0, 1, 0], x: "140vw", y: "60vh" }}
      transition={{
        duration: 1.4,
        ease: "easeIn",
        repeat: Infinity,
        repeatDelay: 17,
      }}
    />
  );
}

function MidnightAmbience() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {MIDNIGHT_STARS.map((star, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            backgroundColor: "var(--midnight-gold)",
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.4, 1] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <ShootingStar />
    </div>
  );
}

const VINE_WIDTH = 32;
const VINE_WAVELENGTH = 160;
const VINE_AMPLITUDE = 12;
const VINE_STEP = 8;

function generateVinePath(height: number) {
  if (height <= 0) return { d: "", leaves: [] as { x: number; y: number; flip: boolean }[] };

  const centerX = VINE_WIDTH / 2;
  const points: [number, number][] = [];
  for (let y = 0; y <= height; y += VINE_STEP) {
    const x = centerX + VINE_AMPLITUDE * Math.sin((y / VINE_WAVELENGTH) * Math.PI * 2);
    points.push([x, y]);
  }
  const [, lastY] = points[points.length - 1];
  if (lastY !== height) {
    const x = centerX + VINE_AMPLITUDE * Math.sin((height / VINE_WAVELENGTH) * Math.PI * 2);
    points.push([x, height]);
  }

  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const stepsPerWave = Math.round(VINE_WAVELENGTH / VINE_STEP);
  const leaves = points
    .filter((_, i) => i !== 0 && i % stepsPerWave === 0)
    .map(([x, y], i) => ({ x, y, flip: i % 2 === 0 }));

  return { d, leaves };
}

function BotanicalAmbience() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setHeight(entries[0]?.contentRect.height ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const { d, leaves } = useMemo(() => generateVinePath(height), [height]);

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0 z-30"
      style={{ mixBlendMode: "multiply" }}
      aria-hidden
    >
      {height > 0 && (
        <svg
          width={VINE_WIDTH}
          height={height}
          viewBox={`0 0 ${VINE_WIDTH} ${height}`}
          className="absolute top-0 left-0"
        >
          <motion.path
            d={d}
            fill="none"
            stroke="var(--botanical-green)"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.85}
            style={{ pathLength: scrollYProgress }}
          />
          <motion.g style={{ opacity: scrollYProgress }}>
            {leaves.map((leaf, i) => (
              <ellipse
                key={i}
                cx={leaf.flip ? leaf.x - 9 : leaf.x + 9}
                cy={leaf.y}
                rx={6}
                ry={2.5}
                fill="var(--botanical-gold)"
                opacity={0.7}
                transform={`rotate(${leaf.flip ? -30 : 30} ${leaf.x} ${leaf.y})`}
              />
            ))}
          </motion.g>
        </svg>
      )}
    </div>
  );
}

// 청첩장 테마별 시그니처 앰비언트 연출 — 낙하(blossom)/스크롤 성장(botanical)/반짝임(midnight)로
// 메커니즘 자체를 다르게 가서 테마 구분력을 준다(파라미터 변주가 아니라 다른 종류의 모션).
export function ThemeAmbience({ theme }: { theme: string }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  switch (theme) {
    case "blossom":
      return <BlossomAmbience />;
    case "botanical":
      return <BotanicalAmbience />;
    case "midnight":
      return <MidnightAmbience />;
    default:
      return null;
  }
}
