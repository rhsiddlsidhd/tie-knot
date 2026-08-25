"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TypographyMuted } from "@/ui/components/atoms";
import { Hammer } from "lucide-react";
import { routes } from "@/core/domain";

interface ComingSoonTemplateProps {
  title: React.ReactNode;
  description: React.ReactNode;
  secondaryLink?: { href: string; label: string };
}

const FADE_DELAY = { 1: 0.1, 2: 0.25, 3: 0.4, 4: 0.6, 5: 0.75 } as const;

export function ComingSoonTemplate({ title, description, secondaryLink }: ComingSoonTemplateProps) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.985 0.006 75)" }}
    >
      {/* Dot grid texture - Consistent with NotFound */}
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

      {/* Background Text (Coming Soon instead of 404) */}
      <motion.div
        className="text-foreground pointer-events-none absolute leading-none font-[var(--font-NotoSerif)] font-black select-none"
        style={{
          fontSize: "clamp(100px, 20vw, 280px)",
          letterSpacing: "-0.04em",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      >
        COMING SOON
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

          {/* Construction Icon */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[2] }}
          >
            <div className="relative">
              <motion.div
                className="bg-primary/5 absolute inset-0 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, ease: [0.4, 0, 0.6, 1], repeat: Infinity }}
              />
              <Hammer
                className="text-primary relative h-12 w-12 opacity-40"
                strokeWidth={1.5}
              />
            </div>
          </motion.div>

          {/* Status Text */}
          <motion.p
            className="mb-2 text-center text-sm font-[var(--font-NotoSerif)] font-medium tracking-[0.2em] uppercase"
            style={{ color: "oklch(0.65 0.03 60)" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[3] }}
          >
            Under Construction
          </motion.p>

          {/* Title */}
          <motion.h1
            className="text-foreground text-center text-2xl font-[var(--font-NotoSerif)] font-semibold tracking-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[3] }}
          >
            {title}
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
            <TypographyMuted className="max-w-[280px] text-center leading-relaxed">
              {description}
            </TypographyMuted>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="mt-10 flex flex-col gap-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: FADE_DELAY[5] }}
          >
            <ComingSoonHomeLink />
            {secondaryLink && (
              <Link
                href={secondaryLink.href}
                className="text-muted-foreground hover:text-foreground text-center text-xs font-medium tracking-wide transition-colors"
              >
                {secondaryLink.label}
              </Link>
            )}
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

function ComingSoonHomeLink() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={routes.home}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="border-foreground text-foreground hover:text-background relative inline-block overflow-hidden border px-10 py-3 text-sm font-[var(--font-NotoSerif)] font-medium tracking-widest transition-colors duration-[350ms] ease-out"
    >
      <motion.span
        className="bg-foreground absolute inset-0"
        initial={{ y: "100%" }}
        animate={{ y: isHovered ? "0%" : "100%" }}
        transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
      />
      <span className="relative z-10">홈으로 돌아가기</span>
    </Link>
  );
}
