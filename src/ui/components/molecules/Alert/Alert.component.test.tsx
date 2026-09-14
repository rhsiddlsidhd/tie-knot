import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("type을 지정하지 않으면 children을 표시한다", () => {
    render(<Alert>기본 안내 메시지</Alert>);

    expect(screen.getByText("기본 안내 메시지")).toBeInTheDocument();
  });

  it("type을 지정해도 children을 표시한다", () => {
    render(<Alert type="error">오류가 발생했습니다.</Alert>);

    expect(screen.getByText("오류가 발생했습니다.")).toBeInTheDocument();
  });
});
