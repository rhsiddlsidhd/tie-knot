"use client";

import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { updateProduct } from "@/actions/updateProduct";
import type { Product } from "@/core/domain/product";
import { Spinner } from "@/ui/components/atoms/spinner";
import { DiscountField } from "@/ui/components/organisms/DiscountField";
import { ImageField } from "@/ui/components/organisms/ImageField";
import { InputField } from "@/ui/components/organisms/InputField";
import { SelectField } from "@/ui/components/organisms/SelectField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import { TextareaField } from "@/ui/components/organisms/TextareaField";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";
import { FormSectionCard } from "@/ui/components/molecules/FormSectionCard";
import { Input } from "@/ui/components/atoms/input";
import { Button } from "@/ui/components/atoms/button";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { Field, FieldLabel, FieldError } from "@/ui/components/atoms/field";
import { TypographyH4 } from "@/ui/components/atoms/typography";

import { usePremiumFeature } from "@/ui/hooks/usePremiumFeatures";
import { useImageList } from "@/ui/hooks/useImageList";

import {
  getCategoryOptions,
  getSubCategoryOptions,
} from "@/core/utils/category";
import { getFieldError, hasFieldErrors } from "@/core/utils/error";
import type { MobileInvitationTheme } from "@/core/domain/theme";
import type {
  ProductCategory,
  SubCategory,
} from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { getMobileInvitationThemeOptions } from "@/core/utils/theme";
import { toast } from "sonner";
import { useAdminModalStore } from "@/ui/stores/use-app-store";
interface ProductEditDialogProps {
  product: Product;
}

const ProductEditDialog = ({ product }: ProductEditDialogProps) => {
  const [state, action, pending] = useActionState(
    updateProduct.bind(null, product._id),
    null,
  );
  const closeModal = useAdminModalStore((state) => state.closeModal);
  const { premiumFeatures, loading } = usePremiumFeature();
  const [isPremium, setIsPremium] = useState(product.isPremium);
  const [isFeature, setIsFeature] = useState(product.isFeatured);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    product.featureIds || [],
  );
  const [status, setStatus] = useState(product.status);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    product.category as ProductCategory,
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    SubCategory | ""
  >(product.subCategory as SubCategory);
  const [selectedTheme, setSelectedTheme] = useState<MobileInvitationTheme>(
    product.theme ?? "default",
  );
  const thumbnail = useImageList([product.thumbnail]);
  const images = useImageList(product.images);
  const [minQuantity, setMinQuantity] = useState<number>(product.minQuantity);
  const [isUnlimitedMax, setIsUnlimitedMax] = useState(
    product.maxQuantity === 0,
  );
  // 무제한 Input이 마운트될 때 쓸 defaultValue — 최초엔 기존 상품 값(product.maxQuantity)을
  // 보존하고, 체크박스를 다시 해제할 때만 minQuantity 기반 제안값으로 갱신한다.
  const [maxQuantityDefault, setMaxQuantityDefault] = useState(
    product.maxQuantity > 0 ? product.maxQuantity : 1,
  );

  const handleMinQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMinQuantity(raw === "" ? NaN : Number(raw));
  };

  const thumbnailError = getFieldError(state, "thumbnail");
  const titleError = getFieldError(state, "title");
  const descriptionError = getFieldError(state, "description");
  const imagesError = getFieldError(state, "images");
  const minQuantityError = getFieldError(state, "minQuantity");
  const maxQuantityError = getFieldError(state, "maxQuantity");

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.message(state.data.message);
      closeModal();
    } else if (!hasFieldErrors(state.error)) {
      toast.error(state.error.message);
    }
  }, [state, closeModal]);

  const handlePremiumChange = (checked: boolean) => {
    setIsPremium(checked);
    if (!checked) {
      setSelectedFeatures([]);
    }
  };

  const handleFeatureChange = (checked: boolean, id: string) => {
    setSelectedFeatures((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // "deleted"는 여기서 선택할 수 없다 — 삭제는 이 드롭다운이 아니라 삭제/복구
  // 버튼(ProductTableRowAction) 전용 경로이며, deletedAt과 함께 세팅된다.
  // 드롭다운으로 status만 "deleted"로 바꾸면 deletedAt이 안 바뀌어 목록 필터
  // (deletedAt 기준)와 상태 표시가 어긋난다(#136).
  const statusOptions = [
    { value: "active", label: "판매중" },
    { value: "inactive", label: "비활성" },
    { value: "soldOut", label: "품절" },
  ];

  return (
    <form action={action} className="space-y-6">
      {selectedFeatures.map((featureId) => (
        <input
          key={featureId}
          type="hidden"
          name="featureIds"
          value={featureId}
        />
      ))}

      <FormSectionCard title="썸네일 이미지" required>
        <ImageField
          id="edit-thumbnail-input"
          folder="products/thumbnails"
          items={thumbnail.items}
          onAdd={(urls) => {
            thumbnail.items.forEach((item) => thumbnail.remove(item.id));
            thumbnail.add(urls);
          }}
          onRemove={thumbnail.remove}
          maxCount={1}
          sizes="490px"
        />
        <input
          type="hidden"
          name="thumbnail"
          value={thumbnail.getUrls()[0] ?? ""}
        />
        <FieldError className="mt-2">{thumbnailError}</FieldError>
      </FormSectionCard>

      <FormSectionCard title="기본 정보" contentClassName="space-y-6" required>
        <InputField
          id="edit-title"
          name="title"
          label="상품명"
          defaultValue={product.title}
          placeholder="예: 엘레강트 로즈 청첩장"
          required
          error={titleError}
        />

        <TextareaField
          id="edit-description"
          name="description"
          label="상품 설명"
          defaultValue={product.description}
          placeholder="상품에 대한 자세한 설명을 입력하세요."
          rows={3}
          required
          error={descriptionError}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="edit-category"
            name="category"
            defaultValue={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value as ProductCategory);
              setSelectedSubCategory("");
            }}
            placeholder="카테고리를 선택하세요"
            data={getCategoryOptions()}
            error={getFieldError(state, "category")}
            required
          >
            카테고리(대분류)
          </SelectField>

          <SelectField
            id="edit-subCategory"
            name="subCategory"
            defaultValue={selectedSubCategory}
            onValueChange={(value) =>
              setSelectedSubCategory(value as SubCategory)
            }
            placeholder="서브 카테고리를 선택하세요"
            data={getSubCategoryOptions(selectedCategory)}
            error={getFieldError(state, "subCategory")}
            required
          >
            서브 카테고리
          </SelectField>

          {selectedCategory === MOBILE_INVITATION_CATEGORY && (
            <SelectField
              id="edit-theme"
              name="theme"
              defaultValue={selectedTheme}
              onValueChange={(value) =>
                setSelectedTheme(value as MobileInvitationTheme)
              }
              placeholder="테마를 선택하세요"
              data={getMobileInvitationThemeOptions()}
            >
              테마
            </SelectField>
          )}
        </div>

        <div className="space-y-2">
          <SelectField
            id="edit-status"
            name="status"
            defaultValue={status}
            onValueChange={(value) =>
              setStatus(value as "active" | "inactive" | "soldOut")
            }
            placeholder="판매 상태를 선택하세요"
            data={statusOptions}
            required
          >
            판매 상태
          </SelectField>
        </div>
      </FormSectionCard>

      <FormSectionCard title="가격 정보" contentClassName="space-y-6" required>
        <div className="flex flex-col gap-6">
          <InputField
            id="edit-price"
            name="price"
            label="기본 가격"
            type="number"
            defaultValue={product.price}
            placeholder="0"
            min={0}
            step={1}
            suffix="원"
            required
            error={getFieldError(state, "price")}
          />

          <DiscountField
            idPrefix="edit-product-discount"
            defaultType={product.discount.discountType}
            defaultValue={product.discount.value}
            error={getFieldError(state, "discount")}
          />
        </div>

        <input
          type="hidden"
          name="isPremium"
          value={isPremium ? "true" : "false"}
        />
        <SwitchField
          id="edit-isPremium"
          label="프리미엄 상품"
          description="추가 유료 옵션을 제공하는 상품입니다."
          checked={isPremium}
          onCheckedChange={handlePremiumChange}
        />

        {isPremium && (
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <TypographyH4 className="font-medium">
              프리미엄 기능 선택
            </TypographyH4>
            <div className="grid grid-cols-2 gap-3">
              {premiumFeatures.map((feature) => (
                <Field
                  key={feature.code}
                  orientation="horizontal"
                  className="gap-2"
                >
                  <Checkbox
                    id={`edit-feature-${feature.code}`}
                    checked={selectedFeatures.includes(feature._id)}
                    onCheckedChange={(checked) =>
                      handleFeatureChange(!!checked, feature._id)
                    }
                  />
                  <FieldLabel
                    htmlFor={`edit-feature-${feature.code}`}
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    {feature.label}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </div>
        )}
      </FormSectionCard>

      <FormSectionCard title="노출 설정" contentClassName="space-y-6">
        <input
          type="hidden"
          name="isFeatured"
          value={isFeature ? "true" : "false"}
        />
        <SwitchField
          id="edit-feature"
          label="추천 상품"
          description="메인 페이지에 추천 상품으로 노출됩니다."
          checked={isFeature}
          onCheckedChange={setIsFeature}
        />

        <InputField
          id="edit-priority"
          name="priority"
          label="추천 우선순위"
          type="number"
          defaultValue={product.priority}
          placeholder="0"
          min={0}
          max={100}
          step={1}
          error={getFieldError(state, "priority")}
        />
      </FormSectionCard>

      <FormSectionCard
        title="상세 이미지"
        required={selectedCategory !== MOBILE_INVITATION_CATEGORY}
      >
        <ImageField
          id="edit-images-upload"
          folder="products/images"
          items={images.items}
          onAdd={images.add}
          onRemove={images.remove}
        />
        {images.items.map((item) => (
          <input key={item.id} type="hidden" name="images" value={item.url} />
        ))}
        <FieldError className="mt-2">{imagesError}</FieldError>
      </FormSectionCard>

      <FormSectionCard title="구매 수량" required>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            id="edit-minQuantity"
            name="minQuantity"
            label="최소 구매 수량"
            type="number"
            min={1}
            step={1}
            required
            value={Number.isNaN(minQuantity) ? "" : minQuantity}
            onChange={handleMinQuantityChange}
            error={minQuantityError}
          />

          <div className="space-y-2">
            {isUnlimitedMax ? (
              <FieldFrame id="edit-maxQuantity-display" label="최대 구매 수량">
                <Input
                  id="edit-maxQuantity-display"
                  type="number"
                  disabled
                  placeholder="무제한"
                />
                <input type="hidden" name="maxQuantity" value="0" />
              </FieldFrame>
            ) : (
              <InputField
                id="edit-maxQuantity"
                name="maxQuantity"
                label="최대 구매 수량"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={maxQuantityDefault}
              />
            )}
            <Field orientation="horizontal" className="gap-2 pt-1">
              <Checkbox
                id="edit-isUnlimitedMax"
                checked={isUnlimitedMax}
                onCheckedChange={(checked) => {
                  setIsUnlimitedMax(!!checked);
                  if (!checked) {
                    setMaxQuantityDefault(
                      Number.isNaN(minQuantity) ? 1 : Math.max(1, minQuantity),
                    );
                  }
                }}
              />
              <FieldLabel
                htmlFor="edit-isUnlimitedMax"
                className="cursor-pointer text-sm font-normal"
              >
                무제한
              </FieldLabel>
            </Field>
            <FieldError className="mt-2">{maxQuantityError}</FieldError>
          </div>
        </div>
      </FormSectionCard>

      <div className="bg-background sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-4 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={closeModal}>
          취소
        </Button>
        <Button type="submit" className="min-w-30" disabled={pending}>
          {pending ? "수정 중..." : "상품 수정"}
        </Button>
      </div>
    </form>
  );
};

export { ProductEditDialog };
