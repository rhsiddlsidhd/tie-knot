"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button, TypographyH1 } from "@/ui/components/atoms";
import { cn } from "@/core/utils";
import promotionsData from "@/core/content/promotions.json";
import type { Promotion } from "@/core/domain";
import { useIntervalIndex } from "@/ui/hooks";

const promotions = (promotionsData as Promotion[]).filter((p) => p.isActive);

export const EcommerceHero = () => {
  const [isPaused, setIsPaused] = useState(false);

  const { currentIndex, setIndex } = useIntervalIndex({
    length: promotions.length,
    interval: 5000,
    isPaused,
  });

  if (promotions.length === 0) return null;

  const active = promotions[currentIndex];

  return (
    <section
      className="bg-background relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
    
        <div className="md:flex">
          {/* 탭 열 — 모바일: 상단 가로 언더라인 / 데스크톱: 좌측 세로 38.2% */}
          <div className="border-border scrollbar-hide bg-background flex gap-1 overflow-x-auto border-b px-3 md:w-[38.2%] md:flex-shrink-0 md:flex-col md:justify-center md:gap-1.5 md:border-r md:border-b-0 md:px-8 md:py-10">
            {promotions.map((promo, index) => {
              const isActive = active.id === promo.id;
              return (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => {
                    setIndex(index);
                    setIsPaused(true);
                  }}
                  className={cn(
                    "shrink-0 border-b-2 px-2 py-3.5 text-sm font-bold whitespace-nowrap transition-colors md:rounded-r-lg md:border-b-0 md:border-l-2 md:px-4 md:py-3",
                    isActive
                      ? "text-primary border-primary md:bg-secondary"
                      : "text-muted-foreground hover:text-foreground border-transparent",
                  )}
                >
                  {promo.label}
                </button>
              );
            })}
          </div>

          {/* 배너 — 이미지 전체 배경 + 텍스트 좌하단 오버레이(모바일/데스크톱 동일 개념) */}
          <div className="relative min-h-[420px] overflow-hidden md:min-h-[560px] md:w-[61.8%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={active.image}
                  alt={active.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 62vw"
                  className="object-cover"
                  priority
                />
                {/* 텍스트 가독성용 하단 스크림 — ProductCard 사진 오버레이와 동일 관례 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 md:p-10">
                  {active.badge && (
                    <span className="bg-foreground/85 text-background w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm">
                      {active.badge}
                    </span>
                  )}

                  <TypographyH1 className="font-[var(--font-NotoSerif)] text-left text-2xl leading-tight font-bold text-white md:text-3xl">
                    {active.title.split("\n").map((line, i) => (
                      <Fragment key={i}>
                        {line}
                        <br />
                      </Fragment>
                    ))}
                  </TypographyH1>

                  <p className="text-sm leading-relaxed whitespace-pre-line text-white/80 md:text-base">
                    {active.description}
                  </p>

                  <Button asChild size="lg" className="w-fit">
                    <Link href={active.cta.href}>{active.cta.label}</Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
 
    </section>
  );
};
