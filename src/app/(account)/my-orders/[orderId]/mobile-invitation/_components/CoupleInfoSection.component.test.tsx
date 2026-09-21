import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoupleInfoSection } from "./CoupleInfoSection";

const data = {
  groom: {
    name: "김철수",
    phone: "010-1111-2222",
    bankName: "KB",
    accountNumber: "111-222",
  },
  bride: {
    name: "이영희",
    phone: "010-3333-4444",
    bankName: "SH",
    accountNumber: "333-444",
  },
};

const banks = [
  { bank: "KB", name: { ko: "국민은행" } },
  { bank: "SH", name: { ko: "신한은행" } },
];

describe("CoupleInfoSection", () => {
  it("신랑·신부의 이름과 연락처를 기본값으로 채운다", () => {
    render(<CoupleInfoSection data={data} banks={banks} />);

    expect(screen.getByDisplayValue("김철수")).toBeInTheDocument();
    expect(screen.getByDisplayValue("010-1111-2222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("이영희")).toBeInTheDocument();
    expect(screen.getByDisplayValue("010-3333-4444")).toBeInTheDocument();
  });

  it("신랑·신부의 계좌번호를 기본값으로 채운다", () => {
    render(<CoupleInfoSection data={data} banks={banks} />);

    expect(screen.getByDisplayValue("111-222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("333-444")).toBeInTheDocument();
  });

  it("data가 없으면 신랑·신부 이름 입력값이 비어있다", () => {
    render(<CoupleInfoSection />);

    expect(screen.getByPlaceholderText("신랑 이름")).toHaveValue("");
    expect(screen.getByPlaceholderText("신부 이름")).toHaveValue("");
  });

  it("신랑 이름을 수정하면 입력값이 반영된다", async () => {
    const user = userEvent.setup();
    render(<CoupleInfoSection data={data} banks={banks} />);

    const [groomName] = screen.getAllByLabelText("이름");
    await user.clear(groomName);
    await user.type(groomName, "박민수");

    expect(groomName).toHaveValue("박민수");
  });
});
