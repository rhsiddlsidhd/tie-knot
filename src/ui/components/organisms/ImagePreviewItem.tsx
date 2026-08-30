"use client";

import { ImageOff, X } from "lucide-react";
import React, { useState } from "react";
import { CloudImage } from "@/ui/components/molecules";
import { Button } from "@/ui/components/atoms";
interface ImagePreviewItemProps {
  id: string;
  preview: string;
  onRemove: (id: string) => void;
  sizes?: string;
}

/**
 * 삭제 버튼이 있는 이미지 미리보기 아이템 (Organism)
 */
export const ImagePreviewItem = ({
  id,
  preview,
  onRemove,
  sizes,
}: ImagePreviewItemProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="border-border group relative aspect-square overflow-hidden rounded-lg border">
      {hasError ? (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <ImageOff className="text-muted-foreground h-6 w-6" />
        </div>
      ) : (
        <CloudImage
          src={preview}
          alt={`Preview ${id}`}
          sizes={sizes}
          onError={() => setHasError(true)}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={() => onRemove(id)}
        className="bg-background/90 hover:bg-background absolute top-2 right-2 h-auto rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
