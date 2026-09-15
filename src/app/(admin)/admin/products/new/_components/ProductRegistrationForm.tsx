"use client";

import type { PremiumFeature } from "@/core/domain/premium-feature";
import type { ApiResponse } from "@/core/domain/error";
import { Button } from "@/ui/components/atoms/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/ui/components/atoms/carousel";
import { useProductForm } from "../_hooks/useProductForm";
import { BasicInfoSlide } from "./BasicInfoSlide";
import { DetailImagesSlide } from "./DetailImagesSlide";
import { PreviewImageSlide } from "./PreviewImageSlide";
import { PricingSlide } from "./PricingSlide";
import { QuantitySlide } from "./QuantitySlide";
import { ThumbnailSlide } from "./ThumbnailSlide";
import { VisibilitySlide } from "./VisibilitySlide";

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
    isMobileInvitation,
    formRef,
    setCarouselApi,
    handleInvalid,
    handleSubmitIntent,
    slideHandlers,
  } = useProductForm({ state, onSubmitIntentChange });

  const activeStepNumber = visibleSteps.indexOf(form.activeStep) + 1;
  // 비활성 슬라이드는 화면에 남아 있어도 보조기술과 탭 이동에서 제외한다.
  const slideProps = (step: (typeof visibleSteps)[number], label: string) => ({
    className: "pl-0",
    "aria-label": label,
    "aria-hidden": form.activeStep !== step,
    inert: form.activeStep !== step,
  });

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
          <CarouselItem {...slideProps("basic", "1단계: 기본 정보")}>
            <BasicInfoSlide
              state={state}
              category={form.category}
              subCategory={form.subCategory}
              theme={form.theme}
              isMobileInvitation={isMobileInvitation}
              stepError={form.stepErrors.basic}
              dispatch={dispatch}
              {...slideHandlers.basic}
            />
          </CarouselItem>

          <CarouselItem {...slideProps("pricing", "2단계: 가격 정보")}>
            <PricingSlide
              state={state}
              premiumFeatures={premiumFeatures}
              isPremium={form.isPremium}
              featureIds={form.featureIds}
              priceInputError={form.priceError}
              stepError={form.stepErrors.pricing}
              dispatch={dispatch}
              {...slideHandlers.pricing}
            />
          </CarouselItem>

          <CarouselItem {...slideProps("visibility", "3단계: 노출 설정")}>
            <VisibilitySlide
              state={state}
              isFeature={form.isFeature}
              dispatch={dispatch}
              {...slideHandlers.visibility}
            />
          </CarouselItem>

          <CarouselItem {...slideProps("thumbnail", "4단계: 썸네일 이미지")}>
            <ThumbnailSlide
              state={state}
              items={thumbnail.items}
              stepError={form.stepErrors.thumbnail}
              isMobileInvitation={isMobileInvitation}
              {...slideHandlers.thumbnail}
            />
          </CarouselItem>

          {isMobileInvitation && (
            <CarouselItem {...slideProps("preview", "5단계: 미리보기 이미지")}>
              <PreviewImageSlide
                items={preview.items}
                {...slideHandlers.preview}
              />
            </CarouselItem>
          )}

          <CarouselItem {...slideProps("images", "상세 이미지 단계")}>
            <DetailImagesSlide
              state={state}
              items={images.items}
              stepError={form.stepErrors.images}
              isMobileInvitation={isMobileInvitation}
              {...slideHandlers.images}
            />
          </CarouselItem>

          <CarouselItem {...slideProps("quantity", "마지막 단계: 구매 수량")}>
            <QuantitySlide
              state={state}
              minQuantity={form.minQuantity}
              isUnlimitedMax={form.isUnlimitedMax}
              dispatch={dispatch}
              {...slideHandlers.quantity}
            />
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
