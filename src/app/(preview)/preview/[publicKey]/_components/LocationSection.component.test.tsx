import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as UseNavigationGeoModule from "@/ui/hooks/useNavigationGeo";
import type * as UseSubwayLineInfoModule from "@/ui/hooks/useSubwayLineInfo";

// useNavigationGeo는 내부적으로 실제 geolocation/카카오 geocode 경계를 태워서
// jsdom에 없는 navigator.geolocation과 실제 네트워크 요청에 부딪힌다 —
// LocationSection 자체 behavior(주소 표시, 복사, 지하철 배지)와 무관하므로
// AccountSection.component.test.tsx의 useBanks mock과 동일한 패턴으로
// 공식 hook 경계만 고정값으로 대체한다.
vi.mock("@/ui/hooks/useNavigationGeo", async (importOriginal) => {
  const hooks = await importOriginal<typeof UseNavigationGeoModule>();
  return {
    ...hooks,
    useNavigationGeo: (): UseNavigationGeoModule.NavigationGeo => ({
      current: { lat: null, lng: null },
      target: { lat: null, lng: null },
    }),
  };
});

vi.mock("@/ui/hooks/useSubwayLineInfo", async (importOriginal) => {
  const hooks = await importOriginal<typeof UseSubwayLineInfoModule>();
  return {
    ...hooks,
    useSubwayLineInfo: vi.fn(),
  };
});

// KakaoMap은 react-kakao-maps-sdk/useKakaoLoader에 강결합돼 있고 이미
// KakaoMap.component.test.tsx가 그 자체 behavior를 커버한다 — 여기서는
// LocationSection이 address를 그대로 전달하는지만 필요하므로 가벼운 stub으로
// 대체한다.
vi.mock("./KakaoMap", () => ({
  KakaoMap: ({ address }: { address: string }) => (
    <div data-testid="kakao-map" data-address={address} />
  ),
}));

import { useSubwayLineInfo } from "@/ui/hooks/useSubwayLineInfo";
import { LocationSection } from "./LocationSection";

describe("LocationSection", () => {
  beforeEach(() => {
    vi.mocked(useSubwayLineInfo).mockReturnValue({
      lineInfo: undefined,
      isLoading: false,
      isError: undefined,
    });
  });

  it("예식장 이름과 전체 주소를 렌더링한다", () => {
    render(
      <LocationSection
        venueName="그랜드홀"
        address="서울시 강남구"
        addressDetail="3층"
      />,
    );

    expect(screen.getByText("그랜드홀")).toBeInTheDocument();
    expect(screen.getByText("서울시 강남구 3층")).toBeInTheDocument();
  });

  it("주소 상세가 없으면 주소만 렌더링한다", () => {
    render(<LocationSection venueName="그랜드홀" address="서울시 강남구" />);

    expect(screen.getByText("서울시 강남구")).toBeInTheDocument();
  });

  it("복사 버튼을 클릭하면 전체 주소를 클립보드에 복사한다", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <LocationSection
        venueName="그랜드홀"
        address="서울시 강남구"
        addressDetail="3층"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("서울시 강남구 3층");
    });
  });

  it("지하철 정보가 있으면 역 이름과 호선 배지를 렌더링한다", () => {
    vi.mocked(useSubwayLineInfo).mockReturnValue({
      lineInfo: {
        station: "강남",
        lines: [{ name: "2호선", color: "#00A84D" }],
      },
      isLoading: false,
      isError: undefined,
    });

    render(
      <LocationSection
        venueName="그랜드홀"
        address="서울시 강남구"
        subwayStation="강남"
      />,
    );

    expect(screen.getByText("강남역")).toBeInTheDocument();
    expect(screen.getByText("2호선")).toBeInTheDocument();
  });

  it("지하철 정보가 없으면 교통 정보 섹션을 렌더링하지 않는다", () => {
    render(<LocationSection venueName="그랜드홀" address="서울시 강남구" />);

    expect(screen.queryByText("지하철")).not.toBeInTheDocument();
  });
});
