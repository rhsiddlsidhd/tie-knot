import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// AddressField는 useDaumPopup 어댑터를 사용한다 — 외부 Daum 팝업 SDK 경계만 Mock으로
// 대체하고, 이 테스트는 BasicInfoSection의 필드 렌더링/기본값 반영만 검증한다.
vi.mock("@/adapters/browser/daum/useDaumPopup", () => ({
  useDaumPopup: () => ({ address: "", handleDaumAddressPopup: vi.fn() }),
}));

import { BasicInfoSection } from "./BasicInfoSection";

const data = {
  weddingDate: new Date("2026-05-01T14:30:00"),
  venue: "더 컨벤션 웨딩홀",
  address: "서울시 강남구 테헤란로 123",
  addressDetail: "3층 그랜드볼룸",
  subwayStation: "seoul-station",
  guestbookEnabled: true,
};

const subwayStations = [
  { value: "seoul-station", label: "서울역" },
  { value: "busan", label: "부산" },
];

describe("BasicInfoSection", () => {
  it("data가 있으면 예식장명·결혼식 시간·주소 필드에 기본값을 채운다", () => {
    render(<BasicInfoSection data={data} subwayStations={subwayStations} />);

    expect(screen.getByDisplayValue("더 컨벤션 웨딩홀")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:30")).toBeInTheDocument();
    expect(screen.getByLabelText("주소")).toHaveValue(data.address);
    expect(screen.getByLabelText("상세 주소")).toHaveValue(data.addressDetail);
    expect(screen.getByText("2026년 5월 1일")).toBeInTheDocument();
  });

  it("subwayStations 옵션 중 defaultValue에 해당하는 라벨을 인근 지하철 역 입력값으로 보여준다", () => {
    render(<BasicInfoSection data={data} subwayStations={subwayStations} />);

    expect(screen.getByDisplayValue("서울역")).toBeInTheDocument();
  });

  it("guestbookEnabled 기본값을 방명록 사용 스위치에 반영한다", () => {
    render(<BasicInfoSection data={data} subwayStations={subwayStations} />);

    const toggle = screen.getByRole("switch", { name: "방명록 사용" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("data가 없으면 빈 값과 placeholder로 렌더한다", () => {
    render(<BasicInfoSection />);

    expect(
      screen.getByPlaceholderText("예: 더 컨벤션 웨딩홀"),
    ).toHaveValue("");
    expect(screen.getByText("날짜를 선택하세요")).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: "방명록 사용" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("예식장명을 입력하면 입력값이 필드에 반영된다", async () => {
    const user = userEvent.setup();
    render(<BasicInfoSection data={data} subwayStations={subwayStations} />);

    const venueInput = screen.getByLabelText("예식장명");
    await user.clear(venueInput);
    await user.type(venueInput, "새 예식장");

    expect(venueInput).toHaveValue("새 예식장");
  });
});
