"use client";

import type React from "react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
import { useEvent } from "./useEvent";

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

  // 모바일 청첩장만 미리보기 단계를 갖고 상세 이미지가 선택사항이다.
  const isMobileInvitation = form.category === MOBILE_INVITATION_CATEGORY;
  const visibleSteps = isMobileInvitation
    ? MOBILE_PRODUCT_FORM_STEPS
    : PHYSICAL_PRODUCT_FORM_STEPS;

  const formRef = useRef<HTMLFormElement>(null);
  // 마지막으로 클릭된 제출 버튼 종류. 두 버튼 모두 같은 action을 호출하므로
  // 성공 이후 어떤 버튼이었는지는 클릭 시점에 기록해뒀다가 state 변화 시 읽는다.
  const isContinueSubmitRef = useRef(false);

  // "등록 후 계속 작성"으로 성공한 경우에만 category/subCategory/theme을 제외한
  // 나머지 필드를 초기화한다 — uncontrolled 필드는 form.reset(), 나머지는
  // RESET_AFTER_CONTINUE와 이미지 목록 reset이 담당한다.
  // carouselApi처럼 초기화에만 쓰이는 값은 useEvent로 감싸 호출 시점에 읽는다 —
  // effect를 제출 성공(state 변화)에만 반응시키면서도 deps를 빠짐없이 적을 수 있다.
  const resetAfterContinue = useEvent(() => {
    formRef.current?.reset();
    dispatch({ type: "RESET_AFTER_CONTINUE" });
    carouselApi?.scrollTo(0, true);
    thumbnail.reset();
    preview.reset();
    images.reset();
  });

  useEffect(() => {
    if (!state?.success) return;
    if (!isContinueSubmitRef.current) return;

    resetAfterContinue();
  }, [resetAfterContinue, state]);

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

  // memo된 슬라이드에 내려가는 핸들러는 전부 useEvent로 참조를 고정한다.
  const openNextStep = useEvent(
    (current: ProductFormStep, next: ProductFormStep) => {
      if (!validateStep(current)) return;

      openStep(next);
    },
  );

  const openPreviousStep = useEvent((previous: ProductFormStep) => {
    openStep(previous);
  });

  const handleInvalid = useEvent(
    (event: React.InvalidEvent<HTMLFormElement>) => {
      const step = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-product-form-step]",
      )?.dataset.productFormStep as ProductFormStep | undefined;
      if (!step) return;

      openStep(step);
    },
  );

  const handleSubmitIntent = useEvent(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      continueRegistration: boolean,
    ) => {
      if (visibleSteps.some((step) => !validateStep(step))) {
        event.preventDefault();
        return;
      }

      isContinueSubmitRef.current = continueRegistration;
      onSubmitIntentChange(continueRegistration);
    },
  );

  // 이미지를 추가하면 해당 단계의 오류 표시도 함께 지운다.
  const handleThumbnailAdd = useEvent((urls: string[]) => {
    dispatch({ type: "CLEAR_STEP_ERROR", payload: "thumbnail" });
    thumbnail.add(urls);
  });

  const handleImagesAdd = useEvent((urls: string[]) => {
    dispatch({ type: "CLEAR_STEP_ERROR", payload: "images" });
    images.add(urls);
  });

  // 슬라이드별 콜백 묶음. 부모가 인라인 화살표로 만들면 매 렌더 참조가 바뀌어
  // memo가 무력화되므로 여기서 한 번 만들어 그대로 스프레드하게 한다.
  const slideHandlers = useMemo(
    () => ({
      basic: {
        onNext: () => openNextStep("basic", "pricing"),
      },
      pricing: {
        onPrevious: () => openPreviousStep("basic"),
        onNext: () => openNextStep("pricing", "visibility"),
      },
      visibility: {
        onPrevious: () => openPreviousStep("pricing"),
        onNext: () => openNextStep("visibility", "thumbnail"),
      },
      thumbnail: {
        onAdd: handleThumbnailAdd,
        onRemove: thumbnail.remove,
        onPrevious: () => openPreviousStep("visibility"),
        onNext: () =>
          openNextStep("thumbnail", isMobileInvitation ? "preview" : "images"),
      },
      preview: {
        onAdd: preview.add,
        onRemove: preview.remove,
        onPrevious: () => openPreviousStep("thumbnail"),
        onNext: () => openNextStep("preview", "images"),
      },
      images: {
        onAdd: handleImagesAdd,
        onRemove: images.remove,
        onPrevious: () =>
          openPreviousStep(isMobileInvitation ? "preview" : "thumbnail"),
        onNext: () => openNextStep("images", "quantity"),
      },
      quantity: {
        onPrevious: () => openPreviousStep("images"),
      },
    }),
    [
      handleImagesAdd,
      handleThumbnailAdd,
      images.remove,
      isMobileInvitation,
      openNextStep,
      openPreviousStep,
      preview.add,
      preview.remove,
      thumbnail.remove,
    ],
  );

  return {
    form,
    dispatch,
    thumbnail,
    preview,
    images,
    visibleSteps,
    isMobileInvitation,
    formRef,
    setCarouselApi,
    openNextStep,
    openPreviousStep,
    handleInvalid,
    handleSubmitIntent,
    slideHandlers,
  };
};

export { useProductForm };
