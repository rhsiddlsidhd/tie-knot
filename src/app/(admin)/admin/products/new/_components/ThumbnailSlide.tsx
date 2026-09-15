"use client";

import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";
import { FieldError } from "@/ui/components/atoms/field";
import { ImageField } from "@/ui/components/organisms/ImageField";
import type { ImageItem } from "@/ui/hooks/useImageList";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface ThumbnailSlideProps {
  state: ApiResponse<{ message: string }> | null;
  items: ImageItem[];
  stepError?: string;
  isMobileInvitation: boolean;
  onAdd: (urls: string[]) => void;
  onRemove: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const ThumbnailSlide = ({
  state,
  items,
  stepError,
  isMobileInvitation,
  onAdd,
  onRemove,
  onPrevious,
  onNext,
}: ThumbnailSlideProps) => {
  return (
    <ProductFormSlideCard
      step="thumbnail"
      title="썸네일 이미지"
      description="상품 목록에 표시될 대표 이미지입니다."
      required
      previousLabel="노출 설정"
      nextLabel={isMobileInvitation ? "미리보기 이미지" : "상세 이미지"}
      onPrevious={onPrevious}
      onNext={onNext}
    >
      <div className="space-y-2">
        <ImageField
          id="thumbnail-input"
          folder="products/thumbnails"
          items={items}
          onAdd={onAdd}
          onRemove={onRemove}
          maxCount={1}
        />
        <input
          type="hidden"
          name="thumbnail"
          value={items[0]?.url ?? ""}
        />
        <FieldError>{getFieldError(state, "thumbnail") || stepError}</FieldError>
      </div>
    </ProductFormSlideCard>
  );
};

export { ThumbnailSlide };
