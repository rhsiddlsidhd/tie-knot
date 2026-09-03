import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductPermanentDeleteDialog } from "./ProductPermanentDeleteDialog";

const PRODUCT_TITLE = "봄맞이 Spring 청첩장";

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const ProductPermanentDeleteHost = ({
  onAction,
}: {
  onAction: () => Promise<boolean>;
}) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        영구 삭제 열기
      </button>
      <ProductPermanentDeleteDialog
        open={open}
        onOpenChange={setOpen}
        productTitle={PRODUCT_TITLE}
        pending={pending}
        onConfirm={async () => {
          setPending(true);
          const succeeded = await onAction();
          setPending(false);
          if (succeeded) {
            setOpen(false);
          }
        }}
      />
    </>
  );
};

const renderHost = async (onAction: () => Promise<boolean>) => {
  const user = userEvent.setup();
  render(<ProductPermanentDeleteHost onAction={onAction} />);
  await user.click(screen.getByRole("button", { name: "영구 삭제 열기" }));
  return user;
};

const confirmationInput = () =>
  screen.getByLabelText(`확인을 위해 상품명 "${PRODUCT_TITLE}"을 입력하세요`);

const purgeButton = () => screen.getByRole("button", { name: "영구 삭제" });

describe("ProductPermanentDeleteDialog", () => {
  it("상품명을 입력하기 전에는 영구 삭제 버튼이 잠겨 있다", async () => {
    await renderHost(async () => true);

    expect(purgeButton()).toBeDisabled();
  });

  it("대소문자가 다르면 영구 삭제 버튼이 열리지 않는다", async () => {
    const user = await renderHost(async () => true);

    await user.type(confirmationInput(), "봄맞이 spring 청첩장");

    expect(purgeButton()).toBeDisabled();
  });

  it("앞뒤 공백이 붙으면 영구 삭제 버튼이 열리지 않는다", async () => {
    const user = await renderHost(async () => true);

    await user.type(confirmationInput(), `${PRODUCT_TITLE} `);

    expect(purgeButton()).toBeDisabled();
  });

  it("상품명이 완전히 일치하면 영구 삭제를 실행할 수 있다", async () => {
    const onAction = vi.fn(async () => true);
    const user = await renderHost(onAction);

    await user.type(confirmationInput(), PRODUCT_TITLE);
    expect(purgeButton()).toBeEnabled();

    await user.click(purgeButton());

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("영구 삭제에 실패하면 입력한 상품명을 그대로 남긴다", async () => {
    const deferred = createDeferred<boolean>();
    const user = await renderHost(() => deferred.promise);

    await user.type(confirmationInput(), PRODUCT_TITLE);
    await user.click(purgeButton());
    await act(async () => {
      deferred.resolve(false);
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(confirmationInput()).toHaveValue(PRODUCT_TITLE);
    expect(purgeButton()).toBeEnabled();
  });

  it("취소했다가 다시 열면 입력값이 비어 있다", async () => {
    const user = await renderHost(async () => true);

    await user.type(confirmationInput(), PRODUCT_TITLE);
    await user.click(screen.getByRole("button", { name: "취소" }));
    await user.click(screen.getByRole("button", { name: "영구 삭제 열기" }));

    expect(confirmationInput()).toHaveValue("");
    expect(purgeButton()).toBeDisabled();
  });

  it("영구 삭제에 성공한 뒤 다시 열면 입력값이 비어 있다", async () => {
    const user = await renderHost(async () => true);

    await user.type(confirmationInput(), PRODUCT_TITLE);
    await user.click(purgeButton());
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "영구 삭제 열기" }));

    expect(confirmationInput()).toHaveValue("");
    expect(purgeButton()).toBeDisabled();
  });
});
