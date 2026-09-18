"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { REVIEW_RATING_MAX } from "@/core/domain/review";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}

// onChange가 있으면 입력 가능한 별점(hover 미리보기 포함), 없으면 읽기 전용 표시다.
const RatingStars = ({ value, onChange, size = "md", className }: RatingStarsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const displayValue = hovered ?? value;
  const starSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHovered(null)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "평점 선택" : `평점 ${value}점`}
    >
      {Array.from({ length: REVIEW_RATING_MAX }, (_, i) => i + 1).map((star) => {
        const filled = star <= displayValue;
        const StarIcon = (
          <Star
            className={cn(
              starSize,
              filled ? "fill-primary text-primary" : "fill-none text-muted-foreground",
            )}
          />
        );

        if (!interactive) {
          return <span key={star}>{StarIcon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`${star}점`}
            aria-pressed={star === value}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange?.(star)}
            className="cursor-pointer"
          >
            {StarIcon}
          </button>
        );
      })}
    </div>
  );
};

export { RatingStars };
