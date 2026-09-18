import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderHook } from "@testing-library/react";

const { writeTextMock } = vi.hoisted(() => ({ writeTextMock: vi.fn() }));
const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/adapters/browser/clipboard/write-text", () => ({
  writeText: writeTextMock,
}));
vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

import { useCopy } from "./useCopy";

describe("useCopy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("복사에 성공하면 isCopied를 true로 바꾸고 성공 토스트와 콜백을 호출한다", async () => {
    writeTextMock.mockResolvedValue(undefined);
    const onCopySuccess = vi.fn();
    const { result } = renderHook(() => useCopy());

    await act(async () => {
      await result.current.copyToClipboard("hello", onCopySuccess);
    });

    expect(writeTextMock).toHaveBeenCalledWith("hello");
    expect(result.current.isCopied).toBe(true);
    expect(toastSuccessMock).toHaveBeenCalledWith("복사되었습니다.");
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
  });

  it("성공 후 2000ms가 지나면 isCopied가 다시 false로 돌아간다", async () => {
    writeTextMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCopy());

    await act(async () => {
      await result.current.copyToClipboard("hello");
    });
    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  it("복사에 실패하면 에러를 로그하고 실패 토스트를 띄우며 isCopied는 false를 유지한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rejection = new Error("permission denied");
    writeTextMock.mockRejectedValue(rejection);
    const onCopySuccess = vi.fn();
    const { result } = renderHook(() => useCopy());

    await act(async () => {
      await result.current.copyToClipboard("hello", onCopySuccess);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("복사에 실패했습니다.");
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(onCopySuccess).not.toHaveBeenCalled();
    expect(result.current.isCopied).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("복사 실패:", rejection);

    errorSpy.mockRestore();
  });
});
