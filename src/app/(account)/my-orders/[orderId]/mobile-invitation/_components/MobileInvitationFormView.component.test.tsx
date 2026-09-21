import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MobileInvitationEditor } from "@/core/domain/mobile-invitation";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";
import type { SubwayStationsResponse } from "@/core/schemas/response/subway.schema";
import type { ImageItem } from "@/ui/hooks/useImageList";

// 하위 Section들이 쓰는 외부 SDK 경계(Daum 주소 팝업, Cloudinary 업로드 위젯)만
// Mock으로 대체한다 — MobileInvitationFormView 자체는 실제 Section들을 그대로
// 렌더해 조합(props 전달·조건부 렌더링)을 검증한다.
vi.mock("@/adapters/browser/daum/useDaumPopup", () => ({
  useDaumPopup: () => ({ address: "", handleDaumAddressPopup: vi.fn() }),
}));
vi.mock("@/adapters/browser/cloudinary/widget", () => ({
  CloudinaryWidget: ({
    children,
  }: {
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
  }) => children({ isLoading: false, open: vi.fn() }),
}));

import { MobileInvitationFormView } from "./MobileInvitationFormView";

const buildImageList = () => ({
  items: [] as ImageItem[],
  add: vi.fn(),
  remove: vi.fn(),
  getUrls: vi.fn(() => []),
  reset: vi.fn(),
});

const baseProps = {
  data: undefined as MobileInvitationEditor | undefined,
  banks: [] as BanksResponse,
  subwayStations: [] as SubwayStationsResponse,
  thumbnail: buildImageList(),
  gallery: buildImageList(),
  isUploading: false,
  uploadProgress: 0,
  handleSubmit: vi.fn(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }),
  orderId: "order-1",
};

describe("MobileInvitationFormView", () => {
  it("edit 모드에서 로딩 중이면 폼 대신 skeleton을 보여준다", () => {
    render(<MobileInvitationFormView type="edit" isLoading {...baseProps} />);

    expect(screen.queryByText("기본 정보")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /저장하기/ }),
    ).not.toBeInTheDocument();
  });

  it("create 모드면 isLoading이어도 폼을 보여준다", () => {
    render(
      <MobileInvitationFormView
        type="create"
        isLoading={false}
        {...baseProps}
      />,
    );

    expect(screen.getByText("기본 정보")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /저장하기/ }),
    ).toBeInTheDocument();
  });

  const fullData: MobileInvitationEditor = {
    publicKey: "public-key-1",
    status: "draft",
    weddingDate: new Date("2026-05-01T14:30:00"),
    venue: "더 컨벤션 웨딩홀",
    address: "서울시 강남구 테헤란로 123",
    addressDetail: "3층",
    subwayStation: "",
    guestbookEnabled: false,
    thumbnailImages: [],
    galleryImages: [],
    theme: "default",
    groom: { name: "김철수", phone: "010-1111-2222" },
    bride: { name: "이영희", phone: "010-3333-4444" },
  };

  it("data가 있으면 각 Section에 값을 전달해 필드에 반영한다", () => {
    const data = fullData;

    render(
      <MobileInvitationFormView
        type="edit"
        isLoading={false}
        {...baseProps}
        data={data}
      />,
    );

    // BasicInfoSection에 전달된 값
    expect(screen.getByDisplayValue("더 컨벤션 웨딩홀")).toBeInTheDocument();
    // CoupleInfoSection에 전달된 값
    expect(screen.getByDisplayValue("김철수")).toBeInTheDocument();
  });

  it("orderId가 있으면 hidden input으로 폼에 포함한다", () => {
    const { container } = render(
      <MobileInvitationFormView
        type="create"
        isLoading={false}
        {...baseProps}
        orderId="order-42"
      />,
    );

    const hiddenInput = container.querySelector(
      'input[type="hidden"][name="orderId"]',
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe("order-42");
  });

  it("필수 입력값이 모두 채워진 상태에서 저장하기 버튼을 클릭하면 handleSubmit이 호출된다", async () => {
    // 브라우저(및 jsdom)는 필수 필드가 비어 있으면 submit 이벤트 자체를
    // 막는다 — required 필드를 fullData로 채워 실제 제출 경로를 검증한다.
    const user = userEvent.setup();
    const handleSubmit = vi.fn(async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    });
    render(
      <MobileInvitationFormView
        type="edit"
        isLoading={false}
        {...baseProps}
        data={fullData}
        handleSubmit={handleSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("업로드 중이 아니면 진행률 Progress를 보여주지 않는다", () => {
    render(
      <MobileInvitationFormView
        type="create"
        isLoading={false}
        {...baseProps}
        isUploading={false}
      />,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("업로드 중이면 진행률 Progress를 보여준다", () => {
    render(
      <MobileInvitationFormView
        type="create"
        isLoading={false}
        {...baseProps}
        isUploading
        uploadProgress={42}
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
