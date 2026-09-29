import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListPage } from "./ListPage";

describe("ListPage", () => {
  it("제목·설명·actions·본문을 함께 배치한다", () => {
    render(
      <ListPage
        title="상품 목록"
        description="등록된 템플릿 상품을 관리합니다."
        actions={<button type="button">상품 등록</button>}
      >
        <p>목록 본문</p>
      </ListPage>,
    );

    expect(
      screen.getByRole("heading", { name: "상품 목록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("등록된 템플릿 상품을 관리합니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "상품 등록" }),
    ).toBeInTheDocument();
    expect(screen.getByText("목록 본문")).toBeInTheDocument();
  });

  it("설명과 actions가 없으면 제목과 본문만 렌더링한다", () => {
    render(
      <ListPage title="리뷰 관리">
        <p>목록 본문</p>
      </ListPage>,
    );

    expect(
      screen.getByRole("heading", { name: "리뷰 관리" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("목록 본문")).toBeInTheDocument();
  });
});
