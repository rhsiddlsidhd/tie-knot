import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuyerInfoCard } from "./BuyerInfoCard";

describe("BuyerInfoCard", () => {
  it("step 번호와 이름/연락처/이메일 입력 필드를 렌더링한다", () => {
    render(<BuyerInfoCard step={1} errors={{}} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("구매자 정보")).toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("연락처")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
  });

  it("각 필드의 error를 전달하면 해당 필드 아래 에러 메시지를 보여준다", () => {
    render(
      <BuyerInfoCard
        step={1}
        errors={{
          buyerName: ["이름은 2자 이상 입력해주세요."],
          buyerPhone: ["휴대폰 번호 형식이 올바르지 않습니다."],
          buyerEmail: ["유효한 이메일을 입력해주세요."],
        }}
      />,
    );

    expect(screen.getByText("이름은 2자 이상 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText("휴대폰 번호 형식이 올바르지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("유효한 이메일을 입력해주세요.")).toBeInTheDocument();
  });
});
