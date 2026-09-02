"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TypographyMuted } from "@/ui/components/atoms";
import { routes } from "@/core/domain/routes";

const FADE_DELAY = { 1: 0.1, 2: 0.25, 3: 0.4, 4: 0.6, 5: 0.75 } as const;

export default function NotFound() {
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.985 0.006 75)" }}
    >
      {/* Dot grid texture */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.5 0.02 60 / 0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.92 0.04 80 / 0.4), transparent 70%)",
        }}
      />

      {/* Ghost 404 */}
      <motion.div
        className="text-foreground pointer-events-none absolute leading-none font-[var(--font-NotoSerif)] font-black select-none"
        style={{
          fontSize: "clamp(160px, 38vw, 380px)",
          letterSpacing: "-0.06em",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      >
        404
      </motion.div>

      {/* Main card — floating */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ y: [0, -14, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Top flourish */}
        <motion.div
          className="mb-8 flex items-center gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[1] }}
        >
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.5 0.02 60 / 0.4))",
            }}
          />
          <span
            className="text-base font-[var(--font-NotoSerif)]"
            style={{ color: "oklch(0.5 0.02 60 / 0.5)" }}
          >
            ✦
          </span>
          <div
            className="h-px w-20"
            style={{
              background:
                "linear-gradient(to left, transparent, oklch(0.5 0.02 60 / 0.4))",
            }}
          />
        </motion.div>

        {/* Envelope card */}
        <motion.div
          className="relative flex flex-col items-center px-12 py-14"
          style={{
            minWidth: "min(90vw, 460px)",
            background: "oklch(1 0 0 / 0.85)",
            border: "1px solid oklch(0.75 0.03 60 / 0.25)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 2px 0 oklch(0.75 0.03 60 / 0.15), 0 20px 60px -10px oklch(0.5 0.05 60 / 0.12)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[2] }}
        >
          {/* Corner marks */}
          <div
            className="absolute top-3 left-3 h-4 w-4 border-t border-l"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute top-3 right-3 h-4 w-4 border-t border-r"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute bottom-3 left-3 h-4 w-4 border-b border-l"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          <div
            className="absolute right-3 bottom-3 h-4 w-4 border-r border-b"
            style={{ borderColor: "oklch(0.7 0.03 60 / 0.35)" }}
          />
          {/* Envelope icon */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[2] }}
          >
            <svg
              width="48"
              height="36"
              viewBox="0 0 48 36"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <rect
                x="1"
                y="1"
                width="46"
                height="34"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M1 3l23 16L47 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
          {/* 404 number */}
          <motion.p
            className="mb-1 leading-none font-[var(--font-NotoSerif)] font-black tracking-tighter"
            style={{
              fontSize: "clamp(56px, 14vw, 80px)",
              color: "oklch(0.85 0.03 60)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[3] }}
          >
            404
          </motion.p>
          {/* Title */}
          <motion.h1
            className="text-foreground text-xl font-[var(--font-NotoSerif)] font-semibold tracking-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[3] }}
          >
            페이지를 찾을 수 없습니다
          </motion.h1>
          {/* Divider */}
          <motion.div
            className="my-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[4] }}
          >
            <div
              className="h-px w-10"
              style={{ background: "oklch(0.7 0.03 60 / 0.3)" }}
            />
            <span
              className="text-xs font-[var(--font-NotoSerif)]"
              style={{ color: "oklch(0.7 0.03 60 / 0.5)" }}
            >
              ✦
            </span>
            <div
              className="h-px w-10"
              style={{ background: "oklch(0.7 0.03 60 / 0.3)" }}
            />
          </motion.div>
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[4] }}
          >
            <TypographyMuted className="max-w-[260px] text-center leading-relaxed">
              요청하신 청첩장 또는 페이지가
              <br />
              존재하지 않거나 삭제되었습니다.
            </TypographyMuted>
          </motion.div>
          {/* CTA button */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[5] }}
          >
            <Link
              href={routes.home}
              onMouseEnter={() => setIsCtaHovered(true)}
              onMouseLeave={() => setIsCtaHovered(false)}
              className="border-foreground text-foreground hover:text-background relative inline-block overflow-hidden border px-10 py-3 text-sm font-[var(--font-NotoSerif)] font-medium tracking-widest transition-colors duration-[350ms] ease-out"
            >
              <motion.span
                className="bg-foreground absolute inset-0"
                initial={{ y: "100%" }}
                animate={{ y: isCtaHovered ? "0%" : "100%" }}
                transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
              />
              <span className="relative z-10">홈으로 돌아가기</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom brand mark */}
        <motion.div
          className="mt-8 flex items-center gap-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[5] }}
        >
          <div
            className="h-px w-10"
            style={{
              background:
                "linear-gradient(to right, transparent, oklch(0.5 0.02 60 / 0.3))",
            }}
          />
          <span
            className="text-xs font-[var(--font-NotoSerif)] tracking-widest"
            style={{ color: "oklch(0.5 0.02 60 / 0.45)" }}
          >
            Tie Knot
          </span>
          <div
            className="h-px w-10"
            style={{
              background:
                "linear-gradient(to left, transparent, oklch(0.5 0.02 60 / 0.3))",
            }}
          />
        </motion.div>
      </motion.div>
    </main>
  );
}
