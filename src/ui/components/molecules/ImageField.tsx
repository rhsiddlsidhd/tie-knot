"use client";

import React from "react";
import { Upload, Plus } from "lucide-react";
import { CloudinaryWidget } from "@/adapters/browser/cloudinary";
import { ImagePreviewItem } from "@/ui/components/molecules";
import { Button, TypographyMuted } from "@/ui/components/atoms";

import type { ImageItem } from "@/ui/hooks";

interface ImageFieldProps {
  id: string;
  items: ImageItem[];
  folder: string;
  onAdd: (urls: string[]) => void;
  onRemove: (id: string) => void;
  sizes?: string;
  maxCount?: number;
}

const ImageField = ({
  id,
  items,
  folder,
  onAdd,
  onRemove,
  sizes,
  maxCount,
}: ImageFieldProps) => {
  const isMaxReached = maxCount !== undefined && items.length >= maxCount;

  return (
    <div>
      {items.length === 0 ? (
        <CloudinaryWidget folder={folder} onUpload={(url) => onAdd([url])}>
          {({ isLoading, open }) => (
            <button
              id={id}
              type="button"
              disabled={isLoading}
              onClick={() => open()}
              className="border-border hover:bg-accent/50 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors disabled:cursor-wait disabled:opacity-60"
            >
              <Upload className="text-muted-foreground mb-2 h-8 w-8" />
              <TypographyMuted className="mb-1">
                {isLoading ? "업로드 도구 준비 중" : "클릭하여 이미지 업로드"}
              </TypographyMuted>
              <TypographyMuted>PNG, JPG, WEBP (최대 10MB)</TypographyMuted>
            </button>
          )}
        </CloudinaryWidget>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <ImagePreviewItem
              key={item.id}
              id={item.id}
              preview={item.preview}
              sizes={sizes}
              onRemove={onRemove}
            />
          ))}
          {!isMaxReached && (
            <CloudinaryWidget folder={folder} onUpload={(url) => onAdd([url])}>
              {({ isLoading, open }) => (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => open()}
                  className="aspect-square h-full w-full border-dashed"
                  aria-label="이미지 추가"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
            </CloudinaryWidget>
          )}
        </div>
      )}
    </div>
  );
};

export { ImageField };
