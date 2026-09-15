"use client";

import type React from "react";
import { useEffect, useReducer, useRef, useState } from "react";
import type { CarouselApi } from "@/ui/components/atoms/carousel";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type { ApiResponse } from "@/core/domain/error";
import { useImageList } from "@/ui/hooks/useImageList";
import {
  MOBILE_PRODUCT_FORM_STEPS,
  PHYSICAL_PRODUCT_FORM_STEPS,
} from "../_constants/productForm";
import type { ProductFormStep } from "../_types/productForm";
import {
  initialProductFormState,
  productFormReducer,
} from "../_utils/productFormReducer";
import { getStepErrorMessage } from "../_utils/productFormValidation";

interface UseProductFormParams {
  state: ApiResponse<{ message: string }> | null;
  onSubmitIntentChange: (continueRegistration: boolean) => void;
}

/** 상품 등록 폼의 단계 상태, 이미지 목록, 캐러셀 제어를 한곳에서 관리한다. */
const useProductForm = ({
  state,
  onSubmitIntentChange,
}: UseProductFormParams) => {
  const [form, dispatch] = useReducer(
    productFormReducer,
    initialProductFormState,
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const thumbnail = useImageList();
  const preview = useImageList();
  const images = useImageList();

  const visibleSteps =
    form.category === MOBILE_INVITATION_CATEGORY
      ? MOBILE_PRODUCT_FORM_STEPS
      : PHYSICAL_PRODUCT_FORM_STEPS;

  const formRef = useRef<HTMLFormElement>(null);
  // 마지막으로 클릭된 제출 버튼 종류. 두 버튼 모두 같은 action을 호출하므로
  // 성공 이후 어떤 버튼이었는지는 클릭 시점에 기록해뒀다가 state 변화 시 읽는다.
  const isContinueSubmitRef = useRef(false);

  // "등록 후 계속 작성"으로 성공한 경우에만 category/subCategory/theme을 제외한
  // 나머지 필드를 초기화한다 — uncontrolled 필드는 form.reset(), 나머지는
  // RESET_AFTER_CONTINUE와 이미지 목록 reset이 담당한다.
  useEffect(() => {
    if (!state?.success) return;
    if (!isContinueSubmitRef.current) return;

    formRef.current?.reset();
    dispatch({ type: "RESET_AFTER_CONTINUE" });
    carouselApi?.scrollTo(0, true);
    thumbnail.reset();
    preview.reset();
    images.reset();
    // thumbnail/preview/images는 매 렌더 새로 생성되는 객체라 deps에 넣으면 매 렌더 실행된다.
    // 제출 성공(state 변화)에만 반응하면 충분하므로 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!carouselApi) return;

    const viewport = formRef.current?.querySelector<HTMLElement>(
      '[data-slot="carousel-content"]',
    );
    const slide =
      carouselApi.slideNodes()[visibleSteps.indexOf(form.activeStep)];
    if (!viewport || !slide) return;

    const updateHeight = () => {
      viewport.style.height = `${slide.scrollHeight}px`;
    };
    const frame = requestAnimationFrame(updateHeight);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(updateHeight);
    resizeObserver?.observe(slide);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
    };
  }, [
    carouselApi,
    form.activeStep,
    form.featureIds.length,
    form.isPremium,
    form.isUnlimitedMax,
    images.items.length,
    preview.items.length,
    thumbnail.items.length,
    visibleSteps,
  ]);

  const openStep = (step: ProductFormStep) => {
    dispatch({ type: "OPEN_STEP", payload: step });
    carouselApi?.scrollTo(visibleSteps.indexOf(step));
  };

  /** 브라우저 제약을 먼저 확인하고, 통과하면 스텝별 비즈니스 규칙을 확인한다. */
  const validateStep = (step: ProductFormStep) => {
    const stepElement = formRef.current?.querySelector<HTMLElement>(
      `[data-product-form-step="${step}"]`,
    );
    const controls = stepElement?.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");
    const invalidControl = controls
      ? Array.from(controls).find(
          (control) => control.willValidate && !control.checkValidity(),
        )
      : undefined;

    if (invalidControl) {
      openStep(step);
      requestAnimationFrame(() => {
        invalidControl.reportValidity();
        invalidControl.focus();
      });
      return false;
    }

    const message = getStepErrorMessage(step, {
      category: form.category,
      subCategory: form.subCategory,
      isPremium: form.isPremium,
      featureIds: form.featureIds,
      priceError: form.priceError,
      thumbnailCount: thumbnail.items.length,
      imageCount: images.items.length,
    });

    if (message) {
      dispatch({ type: "FAIL_STEP", payload: { step, message } });
      carouselApi?.scrollTo(visibleSteps.indexOf(step));
      return false;
    }

    dispatch({ type: "CLEAR_STEP_ERROR", payload: step });
    return true;
  };

  const openNextStep = (current: ProductFormStep, next: ProductFormStep) => {
    if (!validateStep(current)) return;

    openStep(next);
  };

  const openPreviousStep = (previous: ProductFormStep) => {
    openStep(previous);
  };

  const handleInvalid = (event: React.InvalidEvent<HTMLFormElement>) => {
    const step = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-product-form-step]",
    )?.dataset.productFormStep as ProductFormStep | undefined;
    if (!step) return;

    openStep(step);
  };

  const handleSubmitIntent = (
    event: React.MouseEvent<HTMLButtonElement>,
    continueRegistration: boolean,
  ) => {
    if (visibleSteps.some((step) => !validateStep(step))) {
      event.preventDefault();
      return;
    }

    isContinueSubmitRef.current = continueRegistration;
    onSubmitIntentChange(continueRegistration);
  };

  return {
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
  };
};

export { useProductForm };
