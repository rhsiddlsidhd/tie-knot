"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AppImage } from "@/ui/components/atoms/app-image";
import { Button } from "@/ui/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/ui/components/atoms/dialog";
import { cn } from "@/core/utils/cn";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { EyebrowSection } from "./EyebrowSection";
import type { GallerySectionProps } from "../_utils/gallerySection.mapper";

const thumbnailClassName =
  "bg-muted relative aspect-square w-full overflow-hidden rounded-lg";

const GallerySection = ({ images, lightboxEnabled }: GallerySectionProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <EyebrowSection eyebrow="GALLERY" heading="웨딩 갤러리">
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, index) => {
          const thumbnail = (
            <AppImage
              src={src}
              alt={`Gallery image ${index + 1}`}
              sizes="(max-width: 512px) 50vw, 320px"
            />
          );

          // 라이트박스가 없으면 썸네일은 그냥 그림이다 — button으로 감싸면 포커스를
          // 받고 hover에 반응하면서 눌러도 아무 일이 없어, 유료 기능이 아니라
          // 고장으로 읽힌다.
          return lightboxEnabled ? (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={cn(
                thumbnailClassName,
                "transition-opacity hover:opacity-90",
              )}
            >
              {thumbnail}
            </button>
          ) : (
            <div key={index} className={thumbnailClassName}>
              {thumbnail}
            </div>
          );
        })}
      </div>

      {lightboxEnabled && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="w-full max-w-[95vw] border-none bg-black p-0">
            <VisuallyHidden>
              <DialogTitle>갤러리 이미지 보기</DialogTitle>
            </VisuallyHidden>
            <div className="relative h-[70vh]">
              <AppImage
                src={images[currentIndex] || ""}
                alt={`Gallery image ${currentIndex + 1}`}
                sizes="(max-width)100vw , 512px"
                className="object-contain"
              />

              <Button
                variant="ghost"
                size="icon"
                className="bg-primary/70 text-primary-foreground hover:bg-primary absolute top-1/2 left-2 -translate-y-1/2"
                onClick={prev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-primary/70 text-primary-foreground hover:bg-primary absolute top-1/2 right-2 -translate-y-1/2"
                onClick={next}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="bg-primary/70 text-primary-foreground hover:bg-primary absolute top-2 right-2"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="bg-primary/70 text-primary-foreground absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </EyebrowSection>
  );
};

export { GallerySection };
