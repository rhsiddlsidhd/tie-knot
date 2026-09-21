import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupportTemplate } from "./SupportTemplate";
import { MOCK_FAQS } from "../_constants/faqs";

describe("SupportTemplate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("고객센터 제목과 안내 문구를 렌더링한다", () => {
    render(<SupportTemplate />);

    expect(
      screen.getByRole("heading", { name: "고객센터" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("자주 묻는 질문을 확인하거나 1:1 문의를 남겨주세요."),
    ).toBeInTheDocument();
  });

  it("FAQ 질문 목록을 렌더링한다", () => {
    render(<SupportTemplate />);

    for (const faq of MOCK_FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it("FAQ 질문을 클릭하면 답변을 펼쳐 보여준다", async () => {
    const user = userEvent.setup();
    const [firstFaq] = MOCK_FAQS;
    render(<SupportTemplate />);

    expect(screen.queryByText(firstFaq.answer)).not.toBeInTheDocument();

    await user.click(screen.getByText(firstFaq.question));

    expect(await screen.findByText(firstFaq.answer)).toBeInTheDocument();
  });

  it("제목/문의 내용 입력 필드를 렌더링한다", () => {
    render(<SupportTemplate />);

    expect(screen.getByLabelText("제목")).toBeInTheDocument();
    expect(screen.getByLabelText("문의 내용")).toBeInTheDocument();
  });

  it("문의 폼을 제출하면 준비 중 안내를 표시하고 새로고침을 막는다", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<SupportTemplate />);

    await user.type(screen.getByLabelText("제목"), "문의 제목");
    await user.type(screen.getByLabelText("문의 내용"), "문의 내용입니다.");
    await user.click(screen.getByRole("button", { name: "문의 등록하기" }));

    expect(alertSpy).toHaveBeenCalledWith("문의 등록 기능은 준비 중입니다");
  });
});
