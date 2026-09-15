import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextareaField } from "./TextareaField";

describe("TextareaField", () => {
  it("textarea 속성과 기본값을 렌더링한다", () => {
    render(
      <TextareaField
        id="description"
        name="description"
        label="상품 설명"
        rows={5}
        defaultValue="상세 설명"
        required
      />,
    );

    const textarea = screen.getByLabelText("상품 설명");
    expect(textarea).toHaveAttribute("name", "description");
    expect(textarea).toHaveAttribute("rows", "5");
    expect(textarea).toBeRequired();
    expect(textarea).toHaveValue("상세 설명");
  });

  it("uncontrolled textarea는 form.reset으로 기본값을 복원한다", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <TextareaField
          id="description"
          name="description"
          label="상품 설명"
          defaultValue="초기 설명"
        />
        <button type="reset">초기화</button>
      </form>,
    );

    const textarea = screen.getByLabelText("상품 설명");
    await user.clear(textarea);
    await user.type(textarea, "변경 설명");
    await user.click(screen.getByRole("button", { name: "초기화" }));

    expect(textarea).toHaveValue("초기 설명");
  });

  it("error가 있으면 오류 상태와 메시지를 렌더링한다", () => {
    render(
      <TextareaField
        id="description"
        name="description"
        label="상품 설명"
        error="상품 설명을 입력해주세요."
      />,
    );

    expect(screen.getByLabelText("상품 설명")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "상품 설명을 입력해주세요.",
    );
  });
});
