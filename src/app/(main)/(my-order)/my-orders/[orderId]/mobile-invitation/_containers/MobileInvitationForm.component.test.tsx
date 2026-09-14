import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// useMobileInvitationForm 훅은 실제 구현을 그대로 쓴다 — 이 테스트의 대상은
// "훅 오케스트레이션 + View 조합"이라는 컨테이너 책임이다. 데이터 페칭 훅(SWR)과
// Server Action, browser adapter만 공식 경계로 대체한다.
const { routerPushMock, paramsMock, saveMobileInvitationMock, toastErrorMock } =
  vi.hoisted(() => ({
    routerPushMock: vi.fn(),
    paramsMock: vi.fn(() => ({ orderId: "order-1" })),
    saveMobileInvitationMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
  useParams: paramsMock,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: toastErrorMock },
}));

vi.mock("@/actions/saveMobileInvitation", () => ({
  saveMobileInvitation: saveMobileInvitationMock,
}));

vi.mock("@/ui/hooks/useBanks", () => ({
  useBanks: () => ({ banks: [] }),
}));
vi.mock("@/ui/hooks/useSubwayStations", () => ({
  useSubwayStations: () => ({ subwayStations: [] }),
}));

vi.mock("@/adapters/browser/daum/useDaumPopup", () => ({
  useDaumPopup: () => ({ address: "", handleDaumAddressPopup: vi.fn() }),
}));
vi.mock("@/adapters/browser/cloudinary/widget", () => ({
  CloudinaryWidget: ({
    children,
  }: {
    children: (controls: { isLoading: boolean; open: () => void }) => React.ReactNode;
  }) => children({ isLoading: false, open: vi.fn() }),
}));

const { useFetchMobileInvitationMock } = vi.hoisted(() => ({
  useFetchMobileInvitationMock: vi.fn(),
}));
vi.mock("@/ui/hooks/useFetchMobileInvitation", () => ({
  useFetchMobileInvitation: useFetchMobileInvitationMock,
}));

import { MobileInvitationForm } from "./MobileInvitationForm";

const validEditorData = {
  groom: { name: "김철수", phone: "010-1111-2222" },
  bride: { name: "이영희", phone: "010-3333-4444" },
  weddingDate: new Date("2026-05-01T14:30:00"),
  venue: "더 컨벤션 웨딩홀",
  address: "서울시 강남구 테헤란로 123",
  addressDetail: "3층",
  subwayStation: "",
  guestbookEnabled: false,
  thumbnailImages: [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
    "https://example.com/3.jpg",
  ],
  galleryImages: [],
  theme: "default",
  publicKey: "pub-1",
  status: "draft" as const,
};

describe("MobileInvitationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paramsMock.mockReturnValue({ orderId: "order-1" });
  });

  it("저장된 청첩장이 없으면(create) 로딩 중이어도 skeleton이 아니라 폼을 보여준다", () => {
    useFetchMobileInvitationMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<MobileInvitationForm />);

    expect(screen.getByText("기본 정보")).toBeInTheDocument();
  });

  it("저장된 청첩장이 있으면(edit) 로딩 중엔 skeleton을 보여준다", () => {
    useFetchMobileInvitationMock.mockReturnValue({
      data: validEditorData,
      isLoading: true,
    });

    render(<MobileInvitationForm />);

    expect(screen.queryByText("기본 정보")).not.toBeInTheDocument();
  });

  it("썸네일 이미지가 3장이 아니면 클라이언트 검증에 실패해 저장 액션을 호출하지 않는다", async () => {
    // 텍스트/날짜/주소 필드는 브라우저 native required 검증 대상이라 값을 채워야
    // submit 이벤트 자체가 발생한다. 이미지 장수는 native 검증 대상이 아니므로
    // 여기서만 값을 깨뜨려(0장) 클라이언트 zod 검증(정확히 3장) 실패 경로를 겨냥한다.
    useFetchMobileInvitationMock.mockReturnValue({
      data: { ...validEditorData, thumbnailImages: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MobileInvitationForm />);

    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(saveMobileInvitationMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("유효한 값으로 저장에 성공하면 서버 액션을 호출하고 완료 후 /my-orders로 이동한다", async () => {
    useFetchMobileInvitationMock.mockReturnValue({
      data: validEditorData,
      isLoading: false,
    });
    saveMobileInvitationMock.mockResolvedValue({
      success: true,
      data: { publicKey: "pub-1", message: "수정 완료" },
    });
    const user = userEvent.setup();
    render(<MobileInvitationForm />);

    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    await waitFor(() => expect(saveMobileInvitationMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(routerPushMock).toHaveBeenCalledWith("/my-orders"),
    );
  });

  it("서버 액션이 실패를 반환하면 이동하지 않는다", async () => {
    useFetchMobileInvitationMock.mockReturnValue({
      data: validEditorData,
      isLoading: false,
    });
    saveMobileInvitationMock.mockResolvedValue({
      success: false,
      error: { category: "VALIDATION", message: "저장에 실패했습니다." },
    });
    const user = userEvent.setup();
    render(<MobileInvitationForm />);

    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    await waitFor(() => expect(saveMobileInvitationMock).toHaveBeenCalled());
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
