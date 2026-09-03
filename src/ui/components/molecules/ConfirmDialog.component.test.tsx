import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

// 열림·진행 상태와 닫는 시점은 ConfirmDialog가 아니라 소비자가 소유한다 —
// 그 계약을 그대로 재현한 최소 소비자를 두고 사용자 관점에서 관찰한다.
const ConfirmDialogHost = ({
  onAction,
}: {
  onAction: () => Promise<boolean>;
}) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        상품 삭제
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="상품 삭제"
        description="봄맞이 청첩장 상품을 삭제합니다. 삭제한 상품은 휴지통에서 복구할 수 있습니다."
        confirmLabel="삭제"
        pendingLabel="삭제 중..."
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

const openDialog = async (onAction: () => Promise<boolean>) => {
  const user = userEvent.setup();
  render(<ConfirmDialogHost onAction={onAction} />);
  await user.click(screen.getByRole("button", { name: "상품 삭제" }));
  return user;
};

describe("ConfirmDialog", () => {
  it("제목·설명·동작 이름을 그대로 보여준다", async () => {
    await openDialog(async () => true);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("상품 삭제");
    expect(dialog).toHaveTextContent("휴지통에서 복구할 수 있습니다");
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("취소하면 확인 동작을 실행하지 않고 닫는다", async () => {
    const onAction = vi.fn(async () => true);
    const user = await openDialog(onAction);

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("Esc를 누르면 확인 동작 없이 닫는다", async () => {
    const onAction = vi.fn(async () => true);
    const user = await openDialog(onAction);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("바깥을 클릭해도 닫히지 않는다", async () => {
    await openDialog(async () => true);

    // 바깥 클릭 해제는 Radix가 document의 pointerdown으로 판정한다 —
    // userEvent로는 modal overlay의 pointer-events 차단을 넘길 수 없어
    // 저수준 이벤트로 직접 만든다.
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("진행 중에는 확인·취소·Esc를 모두 잠근다", async () => {
    const deferred = createDeferred<boolean>();
    const user = await openDialog(() => deferred.promise);

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await act(async () => {
      deferred.resolve(true);
    });
  });

  it("진행 중 확인을 다시 눌러도 동작을 중복 실행하지 않는다", async () => {
    const deferred = createDeferred<boolean>();
    const onAction = vi.fn(() => deferred.promise);
    const user = await openDialog(onAction);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제 중..." }));

    expect(onAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(true);
    });
  });

  it("동작이 성공하면 닫는다", async () => {
    const deferred = createDeferred<boolean>();
    const user = await openDialog(() => deferred.promise);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await act(async () => {
      deferred.resolve(true);
    });

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("동작이 실패하면 열린 채로 남아 다시 시도할 수 있다", async () => {
    const deferred = createDeferred<boolean>();
    const onAction = vi.fn(() => deferred.promise);
    const user = await openDialog(onAction);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await act(async () => {
      deferred.resolve(false);
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "삭제" });
    expect(retryButton).toBeEnabled();

    await user.click(retryButton);
    expect(onAction).toHaveBeenCalledTimes(2);
  });
});
