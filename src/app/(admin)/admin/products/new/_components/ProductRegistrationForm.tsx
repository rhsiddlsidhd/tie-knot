"use client";

import type React from "react";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { DiscountField } from "@/ui/components/organisms/DiscountField";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";
import { ImageField } from "@/ui/components/organisms/ImageField";
import { InputField } from "@/ui/components/organisms/InputField";
import { SelectField } from "@/ui/components/organisms/SelectField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import { TextareaField } from "@/ui/components/organisms/TextareaField";
import { Input } from "@/ui/components/atoms/input";
import { Button } from "@/ui/components/atoms/button";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/ui/components/atoms/field";
import { TypographyH4 } from "@/ui/components/atoms/typography";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/ui/components/atoms/carousel";

import {
  getCategoryOptions,
  getSubCategoryOptions,
} from "@/core/utils/category";
import { getFieldError } from "@/core/utils/error";
import type { ProductCategory } from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { getMobileInvitationThemeOptions } from "@/core/utils/theme";
import type { ApiResponse } from "@/core/domain/error";
import { ProductFormSlideCard } from "./ProductFormSlideCard";
import { useProductForm } from "../_hooks/useProductForm";

interface ProductRegistrationFormProps {
  premiumFeatures: PremiumFeature[];
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
  onCancel: () => void;
  // 등록 성공 시 목록으로 이동할지(false) 폼에 남아 계속 등록할지(true) 컨테이너에 알린다.
  onSubmitIntentChange: (continueRegistration: boolean) => void;
}

const ProductRegistrationForm = ({
  premiumFeatures,
  action,
  pending,
  state,
  onCancel,
  onSubmitIntentChange,
}: ProductRegistrationFormProps) => {
  const {
    form,
    dispatch,
    thumbnail,
    preview,
    images,
    visibleSteps,
    formRef,
    setCarouselApi,
    openNextStep,
    openPreviousStep,
    handleInvalid,
    handleSubmitIntent,
  } = useProductForm({ state, onSubmitIntentChange });

  const titleError = getFieldError(state, "title");
  const descriptionError = getFieldError(state, "description");
  const categoryError = getFieldError(state, "category");
  const subCategoryError = getFieldError(state, "subCategory");
  const themeError = getFieldError(state, "theme");
  const priceError = getFieldError(state, "price");
  const priorityError = getFieldError(state, "priority");
  const thumbnailError = getFieldError(state, "thumbnail");
  const featureIdsError = getFieldError(state, "featureIds");
  const imagesError = getFieldError(state, "images");
  const minQuantityError = getFieldError(state, "minQuantity");
  const maxQuantityError = getFieldError(state, "maxQuantity");
  const activeStepNumber = visibleSteps.indexOf(form.activeStep) + 1;

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-6"
      onInvalid={handleInvalid}
    >
      {/* featureIds — 선택된 것만 전송 */}
      {form.featureIds.map((id) => (
        <input key={id} type="hidden" name="featureIds" value={id} />
      ))}
      <input type="hidden" name="isFeatured" value={form.isFeature.toString()} />
      <input type="hidden" name="isPremium" value={form.isPremium.toString()} />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          카드를 순서대로 작성해주세요.
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {activeStepNumber}/{visibleSteps.length}
        </p>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{ watchDrag: false }}
        keyboardNavigation={false}
        aria-label="상품 등록 단계"
      >
        <CarouselContent
          className="ml-0 items-start"
          viewportClassName="transition-[height] duration-300 ease-out"
        >
          <CarouselItem
            className="pl-0"
            aria-label="1단계: 기본 정보"
            aria-hidden={form.activeStep !== "basic"}
            inert={form.activeStep !== "basic"}
          >
            <ProductFormSlideCard
              step="basic"
              title="기본 정보"
              description="상품의 이름, 설명, 분류 정보를 입력합니다."
              required
              nextLabel="가격 정보"
              onNext={() => openNextStep("basic", "pricing")}
            >
              <InputField
                id="title"
                name="title"
                label="상품명"
                placeholder="예: 엘레강트 로즈 청첩장"
                required
                error={titleError}
              />

              <TextareaField
                id="description"
                name="description"
                label="상품 설명"
                placeholder="상품에 대한 자세한 설명을 입력하세요."
                rows={4}
                required
                error={descriptionError}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <SelectField
                  id="category"
                  name="category"
                  defaultValue={form.category}
                  onValueChange={(value) => {
                    dispatch({
                      type: "CHANGE_CATEGORY",
                      payload: value as ProductCategory,
                    });
                  }}
                  placeholder="카테고리를 선택하세요"
                  data={getCategoryOptions()}
                  error={categoryError}
                  required
                >
                  카테고리(대분류)
                </SelectField>

                <SelectField
                  id="subCategory"
                  name="subCategory"
                  defaultValue={form.subCategory}
                  onValueChange={(value) => {
                    dispatch({ type: "CHANGE_SUB_CATEGORY", payload: value });
                  }}
                  placeholder="서브 카테고리를 선택하세요"
                  data={getSubCategoryOptions(form.category)}
                  error={subCategoryError || form.stepErrors.basic}
                  required
                >
                  서브 카테고리
                </SelectField>

                {form.category === MOBILE_INVITATION_CATEGORY && (
                  <SelectField
                    id="theme"
                    name="theme"
                    defaultValue={form.theme}
                    onValueChange={(value) =>
                      dispatch({ type: "CHANGE_THEME", payload: value })
                    }
                    placeholder="테마를 선택하세요"
                    data={getMobileInvitationThemeOptions()}
                    error={themeError}
                  >
                    테마
                  </SelectField>
                )}
              </div>
            </ProductFormSlideCard>
          </CarouselItem>

          <CarouselItem
            className="pl-0"
            aria-label="2단계: 가격 정보"
            aria-hidden={form.activeStep !== "pricing"}
            inert={form.activeStep !== "pricing"}
          >
            <ProductFormSlideCard
              step="pricing"
              title="가격 정보"
              description="상품의 가격 및 할인, 프리미엄 옵션을 설정합니다."
              required
              previousLabel="기본 정보"
              nextLabel="노출 설정"
              onPrevious={() => openPreviousStep("basic")}
              onNext={() => openNextStep("pricing", "visibility")}
            >
              <InputField
                id="price"
                name="price"
                label="기본 가격"
                type="number"
                placeholder="0"
                min={0}
                step={1}
                suffix="원"
                required
                error={form.priceError || priceError}
                onChange={(event) => {
                  const value = event.target.value;
                  dispatch({ type: "CLEAR_STEP_ERROR", payload: "pricing" });
                  dispatch({
                    type: "SET_PRICE_ERROR",
                    payload:
                      value !== "" && !Number.isInteger(Number(value))
                        ? "가격은 원 단위 정수로 입력해주세요."
                        : null,
                  });
                }}
              />

              <DiscountField
                idPrefix="product-discount"
                defaultType="rate"
                defaultValue={0}
                error={getFieldError(state, "discount")}
              />

              <SwitchField
                id="isPremium"
                label="프리미엄 상품"
                description="추가 유료 옵션을 제공하는 상품입니다."
                checked={form.isPremium}
                onCheckedChange={(checked) => {
                  dispatch({ type: "TOGGLE_PREMIUM", payload: checked });
                }}
              />

              {form.isPremium && (
                <div className="space-y-4 rounded-lg border border-dashed p-4">
                  <TypographyH4 className="text-foreground font-medium">
                    프리미엄 기능 선택
                  </TypographyH4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {premiumFeatures.map((feature) => (
                      <Field
                        key={feature.code}
                        orientation="horizontal"
                        className="gap-2"
                      >
                        <Checkbox
                          id={`feature-${feature.code}`}
                          checked={form.featureIds.includes(feature._id)}
                          onCheckedChange={(checked) => {
                            dispatch({
                              type: "TOGGLE_PREMIUM_FEATURE",
                              payload: { id: feature._id, checked: !!checked },
                            });
                          }}
                        />
                        <FieldLabel
                          htmlFor={`feature-${feature.code}`}
                          className="cursor-pointer text-sm leading-none font-medium"
                        >
                          {feature.label}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                  <FieldError>
                    {featureIdsError || form.stepErrors.pricing}
                  </FieldError>
                </div>
              )}
            </ProductFormSlideCard>
          </CarouselItem>

          <CarouselItem
            className="pl-0"
            aria-label="3단계: 노출 설정"
            aria-hidden={form.activeStep !== "visibility"}
            inert={form.activeStep !== "visibility"}
          >
            <ProductFormSlideCard
              step="visibility"
              title="노출 설정"
              description="상품 노출 및 정렬 순서를 관리합니다."
              previousLabel="가격 정보"
              nextLabel="썸네일 이미지"
              onPrevious={() => openPreviousStep("pricing")}
              onNext={() => openNextStep("visibility", "thumbnail")}
            >
              <SwitchField
                id="isFeatured"
                label="추천 상품"
                description="메인 페이지에 추천 상품으로 노출됩니다."
                checked={form.isFeature}
                onCheckedChange={(checked) =>
                  dispatch({ type: "TOGGLE_FEATURED", payload: checked })
                }
              />
              <InputField
                id="priority"
                name="priority"
                label="추천 우선순위"
                type="number"
                placeholder="0"
                min={0}
                max={100}
                step={1}
                defaultValue={0}
                error={priorityError}
              />
              <FieldDescription>
                높은 숫자일수록 상단에 노출됩니다 (0-100)
              </FieldDescription>
            </ProductFormSlideCard>
          </CarouselItem>

          <CarouselItem
            className="pl-0"
            aria-label="4단계: 썸네일 이미지"
            aria-hidden={form.activeStep !== "thumbnail"}
            inert={form.activeStep !== "thumbnail"}
          >
            <ProductFormSlideCard
              step="thumbnail"
              title="썸네일 이미지"
              description="상품 목록에 표시될 대표 이미지입니다."
              required
              previousLabel="노출 설정"
              nextLabel={
                form.category === MOBILE_INVITATION_CATEGORY
                  ? "미리보기 이미지"
                  : "상세 이미지"
              }
              onPrevious={() => openPreviousStep("visibility")}
              onNext={() =>
                openNextStep(
                  "thumbnail",
                  form.category === MOBILE_INVITATION_CATEGORY
                    ? "preview"
                    : "images",
                )
              }
            >
              <div className="space-y-2">
                <ImageField
                  id="thumbnail-input"
                  folder="products/thumbnails"
                  items={thumbnail.items}
                  onAdd={(urls) => {
                    dispatch({
                      type: "CLEAR_STEP_ERROR",
                      payload: "thumbnail",
                    });
                    thumbnail.add(urls);
                  }}
                  onRemove={thumbnail.remove}
                  maxCount={1}
                />
                <input
                  type="hidden"
                  name="thumbnail"
                  value={thumbnail.getUrls()[0] ?? ""}
                />
                <FieldError>
                  {thumbnailError || form.stepErrors.thumbnail}
                </FieldError>
              </div>
            </ProductFormSlideCard>
          </CarouselItem>

          {/* 미리보기 URL — invitation 전용(REQ-6). */}
          {form.category === MOBILE_INVITATION_CATEGORY && (
            <CarouselItem
              className="pl-0"
              aria-label="5단계: 미리보기 이미지"
              aria-hidden={form.activeStep !== "preview"}
              inert={form.activeStep !== "preview"}
            >
              <ProductFormSlideCard
                step="preview"
                title="미리보기 이미지"
                description="상품 상세 페이지에 표시될 미리보기 이미지입니다."
                previousLabel="썸네일 이미지"
                nextLabel="상세 이미지"
                onPrevious={() => openPreviousStep("thumbnail")}
                onNext={() => openNextStep("preview", "images")}
              >
                <div className="space-y-2">
                  <ImageField
                    id="preview-input"
                    folder="products/previews"
                    items={preview.items}
                    onAdd={preview.add}
                    onRemove={preview.remove}
                    maxCount={1}
                  />
                  <input
                    type="hidden"
                    name="previewUrl"
                    value={preview.getUrls()[0] ?? ""}
                  />
                </div>
              </ProductFormSlideCard>
            </CarouselItem>
          )}

          <CarouselItem
            className="pl-0"
            aria-label="상세 이미지 단계"
            aria-hidden={form.activeStep !== "images"}
            inert={form.activeStep !== "images"}
          >
            <ProductFormSlideCard
              step="images"
              title="상세 이미지"
              description={
                form.category === MOBILE_INVITATION_CATEGORY
                  ? "선택사항입니다. 등록하지 않아도 됩니다."
                  : "상품 상세 페이지에 표시될 이미지를 최소 1장 등록해주세요."
              }
              required={form.category !== MOBILE_INVITATION_CATEGORY}
              previousLabel={
                form.category === MOBILE_INVITATION_CATEGORY
                  ? "미리보기 이미지"
                  : "썸네일 이미지"
              }
              nextLabel="구매 수량"
              onPrevious={() =>
                openPreviousStep(
                  form.category === MOBILE_INVITATION_CATEGORY
                    ? "preview"
                    : "thumbnail",
                )
              }
              onNext={() => openNextStep("images", "quantity")}
            >
              <ImageField
                id="images-upload"
                folder="products/images"
                items={images.items}
                onAdd={(urls) => {
                  dispatch({ type: "CLEAR_STEP_ERROR", payload: "images" });
                  images.add(urls);
                }}
                onRemove={images.remove}
              />
              {images.items.map((item) => (
                <input
                  key={item.id}
                  type="hidden"
                  name="images"
                  value={item.url}
                />
              ))}
              <FieldError className="mt-2">
                {imagesError || form.stepErrors.images}
              </FieldError>
            </ProductFormSlideCard>
          </CarouselItem>

          <CarouselItem
            className="pl-0"
            aria-label="마지막 단계: 구매 수량"
            aria-hidden={form.activeStep !== "quantity"}
            inert={form.activeStep !== "quantity"}
          >
            <ProductFormSlideCard
              step="quantity"
              title="구매 수량"
              description="고객이 한 번에 구매할 수 있는 수량 범위를 설정합니다."
              required
              previousLabel="상세 이미지"
              onPrevious={() => openPreviousStep("images")}
            >
              <InputField
                id="minQuantity"
                name="minQuantity"
                label="최소 구매 수량"
                type="number"
                min={1}
                step={1}
                required
                value={Number.isNaN(form.minQuantity) ? "" : form.minQuantity}
                onChange={(event) => {
                  const raw = event.target.value;
                  dispatch({
                    type: "CHANGE_MIN_QUANTITY",
                    payload: raw === "" ? NaN : Number(raw),
                  });
                }}
                error={minQuantityError}
              />

              <FieldFrame
                id={form.isUnlimitedMax ? "maxQuantity-display" : "maxQuantity"}
                label="최대 구매 수량"
                error={maxQuantityError}
              >
                {form.isUnlimitedMax ? (
                  <>
                    <Input
                      id="maxQuantity-display"
                      type="number"
                      disabled
                      placeholder="무제한"
                    />
                    <input type="hidden" name="maxQuantity" value="0" />
                  </>
                ) : (
                  <Input
                    id="maxQuantity"
                    name="maxQuantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    defaultValue={
                      Number.isNaN(form.minQuantity) ? 1 : Math.max(1, form.minQuantity)
                    }
                  />
                )}
                <Field orientation="horizontal" className="gap-2 pt-1">
                  <Checkbox
                    id="isUnlimitedMax"
                    checked={form.isUnlimitedMax}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: "TOGGLE_UNLIMITED_MAX",
                        payload: !!checked,
                      })
                    }
                  />
                  <FieldLabel
                    htmlFor="isUnlimitedMax"
                    className="cursor-pointer text-sm font-normal"
                  >
                    무제한
                  </FieldLabel>
                </Field>
              </FieldFrame>
            </ProductFormSlideCard>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        {form.activeStep === "quantity" && (
          <>
            <Button
              type="submit"
              variant="secondary"
              className="min-w-30"
              disabled={pending}
              onClick={(event) => handleSubmitIntent(event, true)}
            >
              {pending ? "등록 중..." : "등록 후 계속 작성"}
            </Button>
            <Button
              type="submit"
              className="min-w-30"
              disabled={pending}
              onClick={(event) => handleSubmitIntent(event, false)}
            >
              {pending ? "등록 중..." : "상품 등록"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
};

export { ProductRegistrationForm };
