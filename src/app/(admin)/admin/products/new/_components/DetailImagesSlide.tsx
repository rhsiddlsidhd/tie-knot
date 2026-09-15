"use client";

import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";
import { FieldError } from "@/ui/components/atoms/field";
import { ImageField } from "@/ui/components/organisms/ImageField";
import type { ImageItem } from "@/ui/hooks/useImageList";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface DetailImagesSlideProps {
  state: ApiResponse<{ message: string }> | null;
  items: ImageItem[];
  stepError?: string;
  isMobileInvitation: boolean;
  onAdd: (urls: string[]) => void;
  onRemove: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const DetailImagesSlide = ({
  state,
  items,
  stepError,
  isMobileInvitation,
  onAdd,
  onRemove,
  onPrevious,
  onNext,
}: DetailImagesSlideProps) => {
  return (
    <ProductFormSlideCard
      step="images"
      title="상세 이미지"
      description={
        isMobileInvitation
          ? "선택사항입니다. 등록하지 않아도 됩니다."
          : "상품 상세 페이지에 표시될 이미지를 최소 1장 등록해주세요."
      }
      required={!isMobileInvitation}
      previousLabel={isMobileInvitation ? "미리보기 이미지" : "썸네일 이미지"}
      nextLabel="구매 수량"
      onPrevious={onPrevious}
      onNext={onNext}
    >
      <ImageField
        id="images-upload"
        folder="products/images"
        items={items}
        onAdd={onAdd}
        onRemove={onRemove}
      />
      {items.map((item) => (
        <input key={item.id} type="hidden" name="images" value={item.url} />
      ))}
      <FieldError className="mt-2">
        {getFieldError(state, "images") || stepError}
      </FieldError>
    </ProductFormSlideCard>
  );
};

export { DetailImagesSlide };
