import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParentsInfoSection } from "./ParentsInfoSection";

const data = {
  groom: {
    name: "김철수",
    phone: "010-1111-2222",
    father: { name: "김아버지", phone: "010-1000-1000" },
    mother: { name: "김어머니", phone: "010-2000-2000" },
  },
  bride: {
    name: "이영희",
    phone: "010-3333-4444",
    father: { name: "이아버지", phone: "010-3000-3000" },
    mother: { name: "이어머니", phone: "010-4000-4000" },
  },
};

const banks = [
  { bank: "KB", name: { ko: "국민은행" } },
  { bank: "SH", name: { ko: "신한은행" } },
];

describe("ParentsInfoSection", () => {
  it("접혀 있는 신랑측/신부측 혼주 정보 트리거를 렌더링한다", () => {
    render(<ParentsInfoSection data={data} banks={banks} />);

    expect(screen.getByText("신랑측 혼주 정보")).toBeInTheDocument();
    expect(screen.getByText("신부측 혼주 정보")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("김아버지")).not.toBeInTheDocument();
  });

  it("신랑측 트리거를 클릭하면 아버님·어머님 정보를 기본값으로 보여준다", async () => {
    const user = userEvent.setup();
    render(<ParentsInfoSection data={data} banks={banks} />);

    await user.click(screen.getByText("신랑측 혼주 정보"));

    expect(screen.getByDisplayValue("김아버지")).toBeInTheDocument();
    expect(screen.getByDisplayValue("010-1000-1000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("김어머니")).toBeInTheDocument();
    expect(screen.getByDisplayValue("010-2000-2000")).toBeInTheDocument();
  });

  it("신부측 트리거를 클릭하면 아버님·어머님 정보를 기본값으로 보여준다", async () => {
    const user = userEvent.setup();
    render(<ParentsInfoSection data={data} banks={banks} />);

    await user.click(screen.getByText("신부측 혼주 정보"));

    expect(screen.getByDisplayValue("이아버지")).toBeInTheDocument();
    expect(screen.getByDisplayValue("이어머니")).toBeInTheDocument();
  });

  it("data가 없어도 트리거는 렌더되고 펼쳐도 값이 비어있다", async () => {
    const user = userEvent.setup();
    render(<ParentsInfoSection />);

    await user.click(screen.getByText("신랑측 혼주 정보"));

    const nameInputs = screen.getAllByPlaceholderText("이름");
    expect(nameInputs[0]).toHaveValue("");
  });
});
