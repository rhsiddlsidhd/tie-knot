"use client";

import { memo } from "react";
import { ImageField } from "@/ui/components/organisms/ImageField";
import type { ImageItem } from "@/ui/hooks/useImageList";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface PreviewImageSlideProps {
  items: ImageItem[];
  onAdd: (urls: string[]) => void;
  onRemove: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/** 미리보기 URL — 모바일 청첩장 전용(REQ-6). */
const PreviewImageSlide = memo(
  ({ items, onAdd, onRemove, onPrevious, onNext }: PreviewImageSlideProps) => {
    return (
      <ProductFormSlideCard
        step="preview"
        title="미리보기 이미지"
        description="상품 상세 페이지에 표시될 미리보기 이미지입니다."
        previousLabel="썸네일 이미지"
        nextLabel="상세 이미지"
        onPrevious={onPrevious}
        onNext={onNext}
      >
        <div className="space-y-2">
          <ImageField
            id="preview-input"
            folder="products/previews"
            items={items}
            onAdd={onAdd}
            onRemove={onRemove}
            maxCount={1}
          />
          <input type="hidden" name="previewUrl" value={items[0]?.url ?? ""} />
        </div>
      </ProductFormSlideCard>
    );
  },
);

PreviewImageSlide.displayName = "PreviewImageSlide";

export { PreviewImageSlide };
