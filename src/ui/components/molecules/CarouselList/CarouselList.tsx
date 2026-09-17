"use client";

import type { ComponentProps, ReactNode } from "react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { cn } from "@/core/utils/cn";
import { Carousel, CarouselContent, CarouselItem } from "@/ui/components/atoms/carousel";

type CarouselOptions = ComponentProps<typeof Carousel>["opts"];

interface CarouselListProps<T> {
  id: string;
  data: readonly T[];
  opts?: CarouselOptions;
  className?: string;
  renderItem: (item: T, index: number) => ReactNode;
}

const CarouselList = <T,>({ id, data, opts, className, renderItem }: CarouselListProps<T>) => {
  return (
    <Carousel
      aria-labelledby={id}
      data-id={id}
      opts={opts}
      plugins={[WheelGesturesPlugin()]}
    >
      <CarouselContent>
        {data.map((item, index) => (
          <CarouselItem key={`${id}-${index}`} className={cn("basis-auto", className)}>
            {renderItem(item, index)}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export { CarouselList };
