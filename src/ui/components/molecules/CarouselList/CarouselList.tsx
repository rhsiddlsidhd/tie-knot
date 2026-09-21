"use client";

import { Children, type ReactNode } from "react";
import { cn } from "@/core/utils/cn";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselProps,
} from "@/ui/components/atoms/carousel";

interface CarouselListProps extends CarouselProps {
  id: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

const CarouselList = ({
  id,
  className,
  contentClassName,
  children,
  ...carouselProps
}: CarouselListProps) => {
  return (
    <Carousel aria-labelledby={id} data-id={id} {...carouselProps}>
      <CarouselContent className={contentClassName}>
        {Children.map(children, (child) => (
          <CarouselItem className={cn("basis-auto", className)}>
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export { CarouselList };
