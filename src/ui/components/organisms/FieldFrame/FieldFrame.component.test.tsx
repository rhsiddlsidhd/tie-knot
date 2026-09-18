import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldFrame } from "./FieldFrame";

describe("FieldFrame", () => {
  it("label을 입력 요소와 연결한다", () => {
    render(
      <FieldFrame id="name" label="이름">
        <input id="name" />
      </FieldFrame>,
    );

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
  });

  it("error가 있으면 오류 메시지를 보여준다", () => {
    render(
      <FieldFrame label="이름" error="필수 항목입니다.">
        <input />
      </FieldFrame>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("필수 항목입니다.");
  });
});
