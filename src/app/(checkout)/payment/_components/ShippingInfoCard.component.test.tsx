import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// AddressField는 useDaumPopup 어댑터를 사용한다 — 외부 Daum 팝업 SDK 경계만 Mock으로
// 대체하고, 이 테스트는 주소 필드 렌더링/에러 표시만 검증한다.
vi.mock("@/adapters/browser/daum/useDaumPopup", () => ({
  useDaumPopup: () => ({ address: "", handleDaumAddressPopup: vi.fn() }),
}));

import { ShippingInfoCard } from "./ShippingInfoCard";

describe("ShippingInfoCard", () => {
  it("step 번호와 받는 분/연락처/주소 필드를 렌더링한다", () => {
    render(<ShippingInfoCard step={2} errors={{}} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("배송 정보")).toBeInTheDocument();
    expect(screen.getByLabelText("받는 분")).toBeInTheDocument();
    expect(screen.getByLabelText("연락처")).toBeInTheDocument();
    expect(screen.getByLabelText("주소")).toBeInTheDocument();
    expect(screen.getByLabelText("상세 주소")).toBeInTheDocument();
  });

  it("각 필드의 error를 전달하면 해당 필드 아래 에러 메시지를 보여준다", () => {
    render(
      <ShippingInfoCard
        step={2}
        errors={{
          receiver: ["받는 분 이름은 2자 이상 입력해주세요."],
          phone: ["휴대폰 번호 형식이 올바르지 않습니다."],
          address: ["주소를 입력해주세요."],
          addressDetail: ["상세 주소를 입력해주세요."],
        }}
      />,
    );

    expect(
      screen.getByText("받는 분 이름은 2자 이상 입력해주세요."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("휴대폰 번호 형식이 올바르지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("주소를 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("상세 주소를 입력해주세요.")).toBeInTheDocument();
  });
});
