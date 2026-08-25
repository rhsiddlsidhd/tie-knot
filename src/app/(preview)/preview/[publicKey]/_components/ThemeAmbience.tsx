"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

const BLOSSOM_PETALS = [
  { left: "8%", duration: 7, delay: 0 },
  { left: "22%", duration: 9, delay: 1.5 },
  { left: "40%", duration: 6, delay: 3 },
  { left: "60%", duration: 10, delay: 0.5 },
  { left: "78%", duration: 8, delay: 2 },
  { left: "92%", duration: 7.5, delay: 4 },
] as const;

// fixed는 브라우저 뷰포트 전체를 기준으로 삼아 모바일 청첩장 카드(max-w-lg)
// 바깥까지 새어나간다. 그렇다고 absolute inset-0(전체 문서 높이 기준)으로
// 두면 낙하 애니메이션의 시작/끝 지점(%, vh 단위)이 5000px대 전체 문서
// 높이에 흩어져 실제로는 스크롤 중 화면에 몇 초 스칠 뿐 거의 안 보인다.
// sticky + h-screen + grid-area(InvitationTemplate의 grid cell 공유)로
// "카드 폭 안에서, 매 스크롤 위치의 현재 화면 한 장 분량"에 항상 렌더되게
// 하면서도 문서 흐름에 추가 높이를 얹지 않는다.
function BlossomAmbience() {
  return (
    <div
      className="pointer-events-none sticky top-0 z-30 h-screen overflow-hidden [grid-area:1/1]"
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

// z(translateZ)가 음수로 클수록 perspective 투영상 더 멀리 있는 별이다 —
// 브라우저가 원근에 맞춰 자동으로 작게 그려주므로 별도 scale 계산이 없다.
// brightness는 대기 원근감(멀수록 흐릿함)을 위한 밝기 배율이다. drift는
// 스크롤을 문서 끝까지 내렸을 때 이 별이 이동하는 y값(px) — 가까운(z가 0에
// 가까운) 별일수록 크게 움직여야 실제로 카메라를 지나쳐 흐르는 전경처럼
// 보인다(가까운 물체일수록 시야를 더 빨리 가로지르는 실제 패럴랙스 원리).
const MIDNIGHT_STARS = [
  // far
  { size: 1.5, duration: 2.4, delay: 0, z: -240, brightness: 0.45, drift: -25 },
  { size: 1.5, duration: 3.1, delay: 0.6, z: -240, brightness: 0.45, drift: -25 },
  { size: 1.5, duration: 2.8, delay: 1.2, z: -240, brightness: 0.45, drift: -25 },
  { size: 1.5, duration: 2.2, delay: 0.3, z: -240, brightness: 0.45, drift: -25 },
  { size: 1.5, duration: 3.4, delay: 1.8, z: -240, brightness: 0.45, drift: -25 },
  // mid
  { size: 2, duration: 2.6, delay: 0.9, z: -120, brightness: 0.7, drift: -80 },
  { size: 2, duration: 3, delay: 2.4, z: -120, brightness: 0.7, drift: -80 },
  { size: 2, duration: 2.9, delay: 1.5, z: -120, brightness: 0.7, drift: -80 },
  { size: 2, duration: 2.3, delay: 0.2, z: -120, brightness: 0.7, drift: -80 },
  { size: 2, duration: 3.2, delay: 2.1, z: -120, brightness: 0.7, drift: -80 },
  // near
  { size: 2.5, duration: 2.7, delay: 1.1, z: -30, brightness: 1, drift: -200 },
  { size: 2.5, duration: 2.5, delay: 0.7, z: -30, brightness: 1, drift: -200 },
  { size: 2.5, duration: 3.3, delay: 1.9, z: -30, brightness: 1, drift: -200 },
  { size: 2.5, duration: 2.4, delay: 0.4, z: -30, brightness: 1, drift: -200 },
] as const;

// 4%~92% 범위로 제한해 별이 화면 가장자리에서 잘려 보이는 걸 막는다.
function randomStarPosition() {
  return { top: `${(Math.random() * 88 + 4).toFixed(1)}%`, left: `${(Math.random() * 88 + 4).toFixed(1)}%` };
}

// 최초 렌더(SSR)와 클라이언트 hydration은 같은 함수를 같은 입력으로 한 번씩
// 실행한다 — 그 자리에서 Math.random()을 쓰면 서버/클라이언트가 서로 다른
// 값을 뽑아 hydration mismatch가 난다. duration/delay(두 렌더 모두 같은 값)만
// 으로 계산하는 순수함수로 시드를 고정해 최초 위치를 서버·클라이언트가
// 동일하게 렌더하게 하고, 진짜 랜덤 순간이동은 마운트 이후 useEffect에서만
// 시작한다.
function seededStarPosition(duration: number, delay: number) {
  const seed = duration * 1000 + delay * 97;
  const top = (Math.abs(Math.sin(seed)) * 88 + 4).toFixed(1);
  const left = (Math.abs(Math.sin(seed * 1.37)) * 88 + 4).toFixed(1);
  return { top: `${top}%`, left: `${left}%` };
}

interface StarProps {
  size: number;
  duration: number;
  delay: number;
  z: number;
  brightness: number;
  drift: number;
  scrollYProgress: MotionValue<number>;
}

// dot이 고정 좌표에서 반짝이기만 하면 밤하늘이 아니라 벽지처럼 보인다 — 반짝임
// 한 사이클(opacity가 0으로 꺼지는 순간)이 끝날 때마다 다른 랜덤 좌표로
// 순간이동시켜, 별이 이곳저곳에서 새로 뜨는 느낌을 준다. top/left는 motion이
// 아니라 React state로만 바꿔 CSS 트랜지션 없이 즉시 점프하게 한다.
function MidnightStar({ size, duration, delay, z, brightness, drift, scrollYProgress }: StarProps) {
  const [position, setPosition] = useState(() => seededStarPosition(duration, delay));
  // 별마다 z깊이에 비례한 drift를 스크롤에 물려 별마다 다른 속도로 움직이게
  // 한다 — 그룹 전체를 한 속도로 미는 것보다, 가까운 별이 훨씬 빨리 흐르고
  // 먼 별은 거의 안 움직여야 "카메라가 우주를 관통해 지나간다"는 원근감이 산다.
  const driftY = useTransform(scrollYProgress, [0, 1], [0, drift]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      setPosition(randomStarPosition());
      intervalId = setInterval(() => setPosition(randomStarPosition()), duration * 1000);
    }, delay * 1000);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [duration, delay]);

  return (
    <motion.span
      className="absolute rounded-full"
      style={{
        top: position.top,
        left: position.left,
        width: size,
        height: size,
        backgroundColor: "var(--midnight-gold)",
        z,
        y: driftY,
      }}
      animate={{ opacity: [0.2 * brightness, brightness, 0.2 * brightness], scale: [1, 1.4, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

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

// 블렌드 모드로 콘텐츠 위를 덮어 물들이는 대신(그러면 텍스트/이미지까지 흐려진다),
// 레이어를 콘텐츠보다 뒤에 둔다 — 섹션이 불투명한 곳은 자연히 가려지고,
// 투명한 여백에서만 비쳐 보여 순수하게 "배경"만 표현한다. "뒤에 두기"는
// z-index를 음수로 낮추는 대신 DOM 순서로만 해결한다 — InvitationTemplate에서
// 이 컴포넌트가 콘텐츠 wrapper보다 먼저 렌더되고, 둘 다 z-index:auto라서
// 나중에 오는 콘텐츠가 항상 위에 그려진다. position:sticky + 음수 z-index
// 조합은 일부 브라우저에서 서브트리 전체가 아예 페인트되지 않는(별이 완전히
// 안 보이는) 렌더링 버그가 있어 반드시 피한다.
// 깊이는 블러/블렌드 트릭이 아니라 실제 CSS 3D(perspective + translateZ)로
// 만든다: 같은 사이즈로 그려도 z가 더 먼 별은 perspective 투영으로 브라우저가
// 알아서 더 작게 그린다. 스크롤에는 별 무리 전체를 한 속도로 미는 대신 별마다
// z깊이에 비례한 drift를 물려(MidnightStar 내부) 카메라가 우주를 관통해
// 지나가는 듯한 입체 패럴랙스를 낸다.
function MidnightAmbience() {
  const { scrollYProgress } = useScroll();

  return (
    <div
      className="pointer-events-none sticky top-0 h-screen overflow-hidden [grid-area:1/1]"
      style={{ perspective: 500 }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 140% 90% at 50% 20%, var(--midnight-haze) 0%, transparent 45%, var(--midnight-deep) 100%)",
          opacity: 0.6,
        }}
      />
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {MIDNIGHT_STARS.map((star, i) => (
          <MidnightStar
            key={i}
            size={star.size}
            duration={star.duration}
            delay={star.delay}
            z={star.z}
            brightness={star.brightness}
            drift={star.drift}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
      <ShootingStar />
    </div>
  );
}

const VINE_WIDTH = 40;
const VINE_WAVELENGTH = 160;
const VINE_AMPLITUDE = 14;
const VINE_STEP = 8;
// 세 줄기를 120도씩 위상차를 둬서 같은 원기둥을 감고 도는 것처럼 배치한다 —
// 위상차만 다르고 파장/진폭은 같아야 실제로 서로를 타고 넘나드는 매듭이 된다.
const STRAND_PHASES = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3] as const;

interface BraidSegment {
  strand: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  depth: number;
}

// depth는 헬릭스를 정면에서 봤을 때의 앞뒤 위치(-1: 제일 뒤, 1: 제일 앞)다.
// 같은 y 구간에서 depth 오름차순으로 그리면(painter's algorithm) 뒤 줄기가
// 먼저 칠해지고 앞 줄기가 그 위를 덮어, 교차점마다 실제로 위/아래를 넘나드는
// 매듭처럼 보인다.
function strandAt(y: number, phase: number) {
  const theta = (y / VINE_WAVELENGTH) * Math.PI * 2 + phase;
  return { x: VINE_WIDTH / 2 + VINE_AMPLITUDE * Math.sin(theta), depth: Math.cos(theta) };
}

function generateBraid(height: number) {
  if (height <= 0) return { bands: [] as BraidSegment[][], leaves: [] as { x: number; y: number; flip: boolean }[] };

  const bands: BraidSegment[][] = [];
  for (let y = 0; y < height; y += VINE_STEP) {
    const yEnd = Math.min(y + VINE_STEP, height);
    const segments = STRAND_PHASES.map((phase, strand) => {
      const p0 = strandAt(y, phase);
      const p1 = strandAt(yEnd, phase);
      return { strand, x0: p0.x, y0: y, x1: p1.x, y1: yEnd, depth: (p0.depth + p1.depth) / 2 };
    });
    segments.sort((a, b) => a.depth - b.depth);
    bands.push(segments);
  }

  const stepsPerWave = Math.round(VINE_WAVELENGTH / VINE_STEP);
  const leaves: { x: number; y: number; flip: boolean }[] = [];
  for (let i = 0; i <= bands.length; i++) {
    if (i === 0 || i % stepsPerWave !== 0) continue;
    const y = Math.min(i * VINE_STEP, height);
    // 그 높이에서 제일 앞에 있는(depth 최대) 줄기에만 잎을 달아 앞줄기를
    // 따라 잎이 돋는 것처럼 보이게 한다.
    const front = STRAND_PHASES.map((phase) => strandAt(y, phase)).reduce((a, b) => (b.depth > a.depth ? b : a));
    leaves.push({ x: front.x, y, flip: leaves.length % 2 === 0 });
  }

  return { bands, leaves };
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

  const { bands, leaves } = useMemo(() => generateBraid(height), [height]);
  // 스크롤 진행률만큼 위에서부터 드러나는 clip-path 창 — path 하나가 아니라
  // 여러 segment로 쪼갠 매듭이라 pathLength 대신 clipPath로 reveal을 구현한다.
  const revealHeight = useTransform(scrollYProgress, (v) => v * height);

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none relative overflow-hidden [grid-area:1/1]"
      aria-hidden
    >
      {height > 0 && (
        <BraidStrand height={height} bands={bands} leaves={leaves} revealHeight={revealHeight} />
      )}
    </div>
  );
}

interface BraidStrandProps {
  height: number;
  bands: BraidSegment[][];
  leaves: { x: number; y: number; flip: boolean }[];
  revealHeight: MotionValue<number>;
}

// 오른쪽 가장자리 바깥으로 카드 밖까지 폭의 절반이 걸치도록 앵커링하고,
// wrapper의 overflow-hidden이 그 절반을 잘라낸다 — 안쪽 절반만 카드 안에서
// 보여서 "프레임 밖에서 자라 들어오는" 느낌을 준다. 텍스트보다 먼저(DOM
// 순서상 앞) 렌더돼 텍스트가 항상 그 위에 그려진다.
//
// 순수 장식을 넘어 "얼마나 읽었는지"를 겸하게 한다: 전체 매듭을 옅은
// 밑그림으로 항상 먼저 보여주고(앞으로 자랄 구간의 예고), 스크롤로 지나온
// 구간만 clipPath로 선명하게 덧그린다 — 청첩장을 읽어 내려가는 만큼 덩굴이
// 실제로 자라나 보이는 스크롤 진행 표시다. 자라는 끝 지점엔 펄스하는
// 새싹 하나를 얹어 "지금 여기까지 읽었다"는 지점을 짚어준다.
function BraidStrand({ height, bands, leaves, revealHeight }: BraidStrandProps) {
  const clipId = "botanical-braid-reveal";
  const tip = useTransform(revealHeight, (ry) => {
    const front = STRAND_PHASES.map((phase) => strandAt(ry, phase)).reduce((a, b) =>
      b.depth > a.depth ? b : a,
    );
    return { x: front.x, y: ry };
  });
  const tipX = useTransform(tip, (t) => t.x);
  const tipY = useTransform(tip, (t) => t.y);

  return (
    <svg
      width={VINE_WIDTH}
      height={height}
      viewBox={`0 0 ${VINE_WIDTH} ${height}`}
      className="absolute top-0"
      style={{ right: -VINE_WIDTH / 2 }}
    >
      {/* 아직 안 읽은 구간의 옅은 밑그림 — 전체 여정을 미리 보여준다 */}
      <g>
        {bands.map((segments, bandIndex) =>
          segments.map((seg) => (
            <line
              key={`preview-${bandIndex}-${seg.strand}`}
              x1={seg.x0}
              y1={seg.y0}
              x2={seg.x1}
              y2={seg.y1}
              stroke="var(--botanical-green)"
              strokeWidth={1 + (seg.depth + 1) * 0.75}
              strokeLinecap="round"
              opacity={0.18 + (seg.depth + 1) * 0.08}
            />
          )),
        )}
      </g>
      <clipPath id={clipId}>
        <motion.rect x={0} y={0} width={VINE_WIDTH} height={revealHeight} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {bands.map((segments, bandIndex) =>
          segments.map((seg) => (
            <line
              key={`${bandIndex}-${seg.strand}`}
              x1={seg.x0}
              y1={seg.y0}
              x2={seg.x1}
              y2={seg.y1}
              stroke="var(--botanical-green)"
              strokeWidth={1.5 + (seg.depth + 1) * 1.25}
              strokeLinecap="round"
              opacity={0.5 + (seg.depth + 1) * 0.2}
            />
          )),
        )}
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
      </g>
      <motion.circle
        cx={tipX}
        cy={tipY}
        r={4}
        fill="var(--botanical-gold)"
        animate={{ opacity: [0.9, 0.3, 0.9] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
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
