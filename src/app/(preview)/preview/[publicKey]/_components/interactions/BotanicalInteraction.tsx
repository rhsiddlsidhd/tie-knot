"use client";

import { useSpring, useTransform, motion } from "motion/react";
import type { ThemeInteractionProps } from "./InteractionOverlay";

const CURL_OFFSET = 26;
// 담쟁이덩굴(Ivy) 잎 실루엣 — 끝은 뾰족하고 뿌리 쪽은 하트형으로 살짝 파인
// 팔메이트 윤곽. 서양 꽃말에서 담쟁이는 "영원한 사랑·신의"를 뜻해 청첩장
// 인터랙션에 어울린다. 원점이 잎자루(줄기) 쪽, +x가 잎 끝 방향이라 rotate로
// 그대로 진행 방향에 맞춰 붙일 수 있다.
const IVY_LEAF_PATH =
  "M11,0 C7,-6 -2,-8 -9,-5 C-11,-3 -10,-1 -7,0 C-10,1 -11,3 -9,5 C-2,8 7,6 11,0 Z";

// 커서를 향해 자라나는 덩굴손 — 뿌리(anchor)는 아주 느리게, 끝(tip)은 빠르게
// 커서를 따라가게 해서 둘 사이가 팽팽하게 당겨진 곡선을 이룬다. 다른 테마가
// 커서 위치에 파티클을 스폰하거나(midnight) 고정 glow가 따라붙는 것과 달리,
// 여기서는 곡선 하나가 계속 늘어나고 줄어드는 것 자체가 메커니즘이다 — 끝에
// 달린 잎은 곡선의 접선 방향으로 회전해 덩굴이 빛(커서)을 향해 뻗어가는
// 것처럼 보이게 한다. x/y는 InteractionOverlay가 주는 실제 clientX/clientY라
// fixed inset-0 컨테이너 안에서 카드 안팎 어디서든 커서를 정확히 따라간다.
export function BotanicalInteraction({ x, y }: ThemeInteractionProps) {
  const tipX = useSpring(x, { stiffness: 220, damping: 20 });
  const tipY = useSpring(y, { stiffness: 220, damping: 20 });
  const anchorX = useSpring(x, { stiffness: 34, damping: 26 });
  const anchorY = useSpring(y, { stiffness: 34, damping: 26 });

  // 진행 방향에 수직으로 제어점을 밀어내 직선이 아니라 한쪽으로 살짝 휘어지는
  // 곡선을 만든다 — 실제 덩굴손이 감아 도는 느낌.
  const curve = useTransform(() => {
    const ax = anchorX.get();
    const ay = anchorY.get();
    const tx = tipX.get();
    const ty = tipY.get();
    const dx = tx - ax;
    const dy = ty - ay;
    const len = Math.hypot(dx, dy) || 1;
    const cx = (ax + tx) / 2 + (-dy / len) * CURL_OFFSET;
    const cy = (ay + ty) / 2 + (dx / len) * CURL_OFFSET;
    const angle = (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI;
    return { d: `M ${ax} ${ay} Q ${cx} ${cy} ${tx} ${ty}`, angle };
  });
  const d = useTransform(curve, (c) => c.d);
  const angle = useTransform(curve, (c) => c.angle);

  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke="var(--botanical-green)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.55}
      />
      <motion.g style={{ x: tipX, y: tipY, rotate: angle }}>
        <path d={IVY_LEAF_PATH} fill="var(--botanical-green)" opacity={0.75} />
      </motion.g>
    </svg>
  );
}
