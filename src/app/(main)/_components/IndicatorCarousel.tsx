"use client";

import { CarouselList } from "@/ui/components/molecules/CarouselList";
import { cn } from "@/core/utils/cn";
import type { ComponentProps } from "react";
import { useAutoplayCarousel } from "../_hooks/useAutoplayCarousel";

interface IndicatorCarouselProps extends Omit<ComponentProps<typeof CarouselList>, "setApi"> {
  labels: readonly string[];
  autoplayIntervalMs?: number;
}

const IndicatorCarousel = ({
  labels,
  autoplayIntervalMs,
  ...carouselListProps
}: IndicatorCarouselProps) => {
  const { api, setApi, selectedIndex } = useAutoplayCarousel({
    itemCount: labels.length,
    intervalMs: autoplayIntervalMs,
  });

  return (
    <div className="relative">
      <CarouselList {...carouselListProps} setApi={setApi} />

      {labels.length > 1 && (
        <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 md:right-8 md:bottom-6">
          {labels.map((label, index) => (
            <button
              key={label + index}
              type="button"
              aria-label={label}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                selectedIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { IndicatorCarousel };
