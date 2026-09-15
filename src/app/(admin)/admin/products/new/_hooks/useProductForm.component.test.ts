import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { useProductForm } from "./useProductForm";

const renderProductForm = (
  onSubmitIntentChange = vi.fn<(continueRegistration: boolean) => void>(),
) => {
  const view = renderHook(() =>
    useProductForm({ state: null, onSubmitIntentChange }),
  );

  return { ...view, onSubmitIntentChange };
};

describe("useProductForm", () => {
  it("모바일 청첩장 카테고리는 미리보기 단계를 포함한 7단계를 노출한다", () => {
    const { result } = renderProductForm();

    expect(result.current.form.category).toBe(MOBILE_INVITATION_CATEGORY);
    expect(result.current.form.activeStep).toBe("basic");
    expect(result.current.visibleSteps).toEqual([
      "basic",
      "pricing",
      "visibility",
      "thumbnail",
      "preview",
      "images",
      "quantity",
    ]);
  });

  it("실물 상품 카테고리로 바꾸면 미리보기 단계를 제외한다", () => {
    const { result } = renderProductForm();

    act(() => {
      result.current.dispatch({ type: "CHANGE_CATEGORY", payload: "favor" });
    });

    expect(result.current.visibleSteps).not.toContain("preview");
    expect(result.current.visibleSteps).toHaveLength(6);
  });

  it("서브 카테고리를 고르지 않으면 다음 단계로 넘어가지 않는다", () => {
    const { result } = renderProductForm();

    act(() => {
      result.current.openNextStep("basic", "pricing");
    });

    expect(result.current.form.activeStep).toBe("basic");
    expect(result.current.form.stepErrors.basic).toBe(
      "서브 카테고리를 선택해주세요.",
    );
  });

  it("서브 카테고리를 고르면 다음 단계로 넘어가고 오류를 지운다", () => {
    const { result } = renderProductForm();

    act(() => {
      result.current.openNextStep("basic", "pricing");
    });
    act(() => {
      result.current.dispatch({
        type: "CHANGE_SUB_CATEGORY",
        payload: "wedding",
      });
    });
    act(() => {
      result.current.openNextStep("basic", "pricing");
    });

    expect(result.current.form.activeStep).toBe("pricing");
    expect(result.current.form.stepErrors.basic).toBeUndefined();
  });

  it("이전 단계로는 검증 없이 이동한다", () => {
    const { result } = renderProductForm();

    act(() => {
      result.current.openPreviousStep("quantity");
    });

    expect(result.current.form.activeStep).toBe("quantity");
  });

  it("유효하지 않은 단계가 남아 있으면 제출을 막는다", () => {
    const { result, onSubmitIntentChange } = renderProductForm();
    const preventDefault = vi.fn();

    act(() => {
      result.current.handleSubmitIntent(
        {
          preventDefault,
        } as unknown as React.MouseEvent<HTMLButtonElement>,
        true,
      );
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmitIntentChange).not.toHaveBeenCalled();
    expect(result.current.form.activeStep).toBe("basic");
  });

  it("모든 단계가 유효하면 제출 의도를 컨테이너에 알린다", () => {
    const { result, onSubmitIntentChange } = renderProductForm();
    const preventDefault = vi.fn();

    act(() => {
      result.current.dispatch({
        type: "CHANGE_SUB_CATEGORY",
        payload: "wedding",
      });
      result.current.thumbnail.add(["https://example.com/thumbnail.png"]);
    });
    act(() => {
      result.current.handleSubmitIntent(
        {
          preventDefault,
        } as unknown as React.MouseEvent<HTMLButtonElement>,
        true,
      );
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onSubmitIntentChange).toHaveBeenCalledWith(true);
  });
});
