"use client";

import { useState } from "react";
import {
  AppImage,
  Button,
  Card,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@/ui/components/atoms";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import clsx from "clsx";
import { Check, ChevronDown, Palette, Type, Settings, FileText } from "lucide-react";

// 상품 상세 이미지가 이 개수를 넘으면 나머지는 "더보기" 뒤로 접는다 — 청첩장 상세페이지가
// 원래 세로로 긴 이미지 여러 장이라, 다 펼쳐두면 스크롤이 지나치게 길어진다.
const VISIBLE_IMAGE_COUNT = 1;

interface ProductFeaturesProps {
  options: PremiumFeature[];
  images: string[];
}

export function ProductFeatures({ options, images }: ProductFeaturesProps) {
  const icons = [Check, Palette, Type, Settings];
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleImages = images.slice(0, VISIBLE_IMAGE_COUNT);
  const restImages = images.slice(VISIBLE_IMAGE_COUNT);

  return (
    <div className="mb-16 space-y-12">
      {/* Features List */}
      <div className={clsx(options.length === 0 && "hidden")}>
        <TypographyH2 className="text-foreground mb-6 border-none text-3xl font-bold">주요 옵션</TypographyH2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {options.map((feature, index) => {
            let Icon;
            if (feature.label.includes("PDF")) {
              Icon = FileText;
            } else {
              Icon = icons[index % icons.length];
            }
            return (
              <Card key={index} className="border-border flex flex-col p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <TypographyH3 className="text-foreground text-sm font-semibold">
                    {feature.label}
                  </TypographyH3>
                </div>
                <TypographyMuted>
                  {feature.description}
                </TypographyMuted>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detailed Features */}
      <div>
        <TypographyH2 className="text-foreground mb-6 border-none text-3xl font-bold">상세 정보</TypographyH2>
        {images.length === 0 ? (
          <TypographyMuted>상세 이미지가 아직 등록되지 않았습니다.</TypographyMuted>
        ) : (
          <div>
            <div className="flex flex-col gap-4">
              {visibleImages.map((src, index) => (
                <div
                  key={src}
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-transparent"
                >
                  <AppImage
                    src={src}
                    alt={`상세 이미지 ${index + 1}`}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            {restImages.length > 0 && (
              <>
                {isExpanded && (
                  <div
                    id="additional-product-images"
                    className="mt-4 flex flex-col gap-4"
                  >
                    {restImages.map((src, index) => (
                      <div
                        key={src}
                        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-transparent"
                      >
                        <AppImage
                          src={src}
                          alt={`상세 이미지 ${VISIBLE_IMAGE_COUNT + index + 1}`}
                          className="object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  aria-expanded={isExpanded}
                  aria-controls="additional-product-images"
                  onClick={() => setIsExpanded((expanded) => !expanded)}
                >
                  {isExpanded ? "접기" : "더보기"}
                  <ChevronDown
                    className={clsx(
                      "ml-1 h-4 w-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
