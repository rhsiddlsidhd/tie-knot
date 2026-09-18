"use client";

import { useEffect, useState } from "react";
import type { CarouselApi } from "@/ui/components/atoms/carousel";

interface UseAutoplayCarouselOptions {
  itemCount: number;
  intervalMs?: number;
}

const useAutoplayCarousel = ({ itemCount, intervalMs }: UseAutoplayCarouselOptions) => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    if (!api || !intervalMs || itemCount <= 1) return;

    const timer = setInterval(() => api.scrollNext(), intervalMs);
    return () => clearInterval(timer);
  }, [api, intervalMs, itemCount]);

  return { api, setApi, selectedIndex };
};

export { useAutoplayCarousel };
