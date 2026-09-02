"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  TypographyH1,
  type CarouselApi,
} from "@/ui/components/atoms";
import { cn } from "@/core/utils/cn";
import promotionsData from "@/core/content/promotions.json";
import type { Promotion } from "@/core/domain/promotion";

const promotions = (promotionsData as Promotion[]).filter((p) => p.isActive);
const AUTOPLAY_INTERVAL = 5000;

export const EcommerceHero = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || isPaused || promotions.length <= 1) return;

    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [api, isPaused]);

  if (promotions.length === 0) return null;

  return (
    <section
      className="bg-background relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
        <CarouselContent className="ml-0">
          {promotions.map((promo) => (
            <CarouselItem key={promo.id} className="relative min-h-[420px] pl-0 md:min-h-[560px]">
              <Image
                src={promo.image}
                alt={promo.label}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              {/* 텍스트 가독성용 하단 스크림 — ProductCard 사진 오버레이와 동일 관례 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 md:p-10">
                {promo.badge && (
                  <span className="bg-foreground/85 text-background w-fit rounded-full px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm">
                    {promo.badge}
                  </span>
                )}

                <TypographyH1 className="font-[var(--font-NotoSerif)] max-w-2xl text-left text-2xl leading-tight font-bold text-white md:text-3xl">
                  {promo.title.split("\n").map((line, i) => (
                    <Fragment key={i}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </TypographyH1>

                <p className="max-w-xl text-sm leading-relaxed whitespace-pre-line text-white/80 md:text-base">
                  {promo.description}
                </p>

                <Button asChild size="lg" className="w-fit">
                  <Link href={promo.cta.href}>{promo.cta.label}</Link>
                </Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {promotions.length > 1 && (
          <>
            <div className="hidden md:block">
              <CarouselPrevious className="left-4 -translate-y-1/2 bg-white/80 hover:bg-white" />
              <CarouselNext className="right-4 -translate-y-1/2 bg-white/80 hover:bg-white" />
            </div>

            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 md:right-8 md:bottom-6">
              {promotions.map((promo, index) => (
                <button
                  key={promo.id}
                  type="button"
                  aria-label={promo.label}
                  onClick={() => {
                    api?.scrollTo(index);
                    setIsPaused(true);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    selectedIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
};
