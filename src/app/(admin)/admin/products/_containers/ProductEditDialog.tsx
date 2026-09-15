"use client";

import type React from "react";
import { useActionState, useEffect, useReducer } from "react";
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
import type { ProductCategory } from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { getMobileInvitationThemeOptions } from "@/core/utils/theme";
import { toast } from "sonner";
import { useAdminModalStore } from "@/ui/stores/use-app-store";
import {
  createProductEditFormState,
  productEditFormReducer,
} from "../_utils/productEditFormReducer";
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
  const [form, dispatch] = useReducer(
    productEditFormReducer,
    product,
    createProductEditFormState,
  );
  const thumbnail = useImageList([product.thumbnail]);
  const images = useImageList(product.images);

  const handleMinQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    dispatch({
      type: "CHANGE_MIN_QUANTITY",
      payload: raw === "" ? NaN : Number(raw),
    });
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
      {form.featureIds.map((featureId) => (
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
            defaultValue={form.category}
            onValueChange={(value) =>
              dispatch({
                type: "CHANGE_CATEGORY",
                payload: value as ProductCategory,
              })
            }
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
            defaultValue={form.subCategory}
            onValueChange={(value) =>
              dispatch({ type: "CHANGE_SUB_CATEGORY", payload: value })
            }
            placeholder="서브 카테고리를 선택하세요"
            data={getSubCategoryOptions(form.category)}
            error={getFieldError(state, "subCategory")}
            required
          >
            서브 카테고리
          </SelectField>

          {form.category === MOBILE_INVITATION_CATEGORY && (
            <SelectField
              id="edit-theme"
              name="theme"
              defaultValue={form.theme}
              onValueChange={(value) =>
                dispatch({ type: "CHANGE_THEME", payload: value })
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
            defaultValue={form.status}
            onValueChange={(value) =>
              dispatch({
                type: "CHANGE_STATUS",
                payload: value as "active" | "inactive" | "soldOut",
              })
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
          value={form.isPremium ? "true" : "false"}
        />
        <SwitchField
          id="edit-isPremium"
          label="프리미엄 상품"
          description="추가 유료 옵션을 제공하는 상품입니다."
          checked={form.isPremium}
          onCheckedChange={(checked) =>
            dispatch({ type: "TOGGLE_PREMIUM", payload: checked })
          }
        />

        {form.isPremium && (
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
                    checked={form.featureIds.includes(feature._id)}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: "TOGGLE_PREMIUM_FEATURE",
                        payload: { id: feature._id, checked: !!checked },
                      })
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
          value={form.isFeature ? "true" : "false"}
        />
        <SwitchField
          id="edit-feature"
          label="추천 상품"
          description="메인 페이지에 추천 상품으로 노출됩니다."
          checked={form.isFeature}
          onCheckedChange={(checked) =>
            dispatch({ type: "TOGGLE_FEATURED", payload: checked })
          }
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
        required={form.category !== MOBILE_INVITATION_CATEGORY}
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
            value={Number.isNaN(form.minQuantity) ? "" : form.minQuantity}
            onChange={handleMinQuantityChange}
            error={minQuantityError}
          />

          <div className="space-y-2">
            {form.isUnlimitedMax ? (
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
                defaultValue={form.maxQuantityDefault}
              />
            )}
            <Field orientation="horizontal" className="gap-2 pt-1">
              <Checkbox
                id="edit-isUnlimitedMax"
                checked={form.isUnlimitedMax}
                onCheckedChange={(checked) =>
                  dispatch({
                    type: "TOGGLE_UNLIMITED_MAX",
                    payload: !!checked,
                  })
                }
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
