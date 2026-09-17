import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { mutateMock, pushMock, refreshMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("swr", () => ({ mutate: mutateMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock("@/actions/logoutUser", () => ({
  logoutUser: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { logoutUser } from "@/actions/logoutUser";
import { toast } from "sonner";
import { useLogout } from "./useLogout";

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그아웃 성공 시 세션 캐시를 비우고 홈으로 이동한다", async () => {
    vi.mocked(logoutUser).mockResolvedValue({ success: true, data: null });

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutUser).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", null, false);
    expect(toast.success).toHaveBeenCalledWith("로그아웃되었습니다.");
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("로그아웃 실패 시 에러 토스트만 띄우고 이동하지 않는다", async () => {
    vi.mocked(logoutUser).mockResolvedValue({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    });

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
