"use client";

import { Fragment } from "react";
import Image from "next/image";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { TypographyH1 } from "@/ui/components/atoms/typography";
import promotionsData from "@/core/content/promotions.json";
import type { Promotion } from "@/core/domain/promotion";
import { IndicatorCarousel } from "./IndicatorCarousel";

const promotions = (promotionsData as Promotion[]).filter((p) => p.isActive);
const AUTOPLAY_INTERVAL = 5000;

const EcommerceHero = () => {
  if (promotions.length === 0) return null;

  return (
    <section className="bg-background relative overflow-hidden">
      <IndicatorCarousel
        id="hero-carousel"
        opts={{ loop: true }}
        contentClassName="ml-0"
        className="relative min-h-[420px] basis-full pl-0 md:min-h-[560px]"
        labels={promotions.map((promo) => promo.label)}
        autoplayIntervalMs={AUTOPLAY_INTERVAL}
      >
        {promotions.map((promo) => (
          <Fragment key={promo.id}>
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

              <LinkButton size="lg" className="w-fit" href={promo.cta.href}>
                {promo.cta.label}
              </LinkButton>
            </div>
          </Fragment>
        ))}
      </IndicatorCarousel>
    </section>
  );
};

export { EcommerceHero };
