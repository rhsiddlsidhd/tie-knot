import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaginatedTable } from "./PaginatedTable";

describe("PaginatedTable", () => {
  it("headings와 children row를 함께 표시한다", () => {
    render(
      <PaginatedTable
        headings={["이름", "이메일"]}
        basePath="/admin/users"
        hasCursor={false}
        nextCursor={null}
      >
        <tr>
          <td>홍길동</td>
          <td>hong@example.com</td>
        </tr>
      </PaginatedTable>,
    );

    expect(
      screen.getByRole("columnheader", { name: "이름" }),
    ).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });

  it("hasCursor가 false면 첫 페이지 버튼을 비활성화한다", () => {
    render(
      <PaginatedTable
        headings={["이름"]}
        basePath="/admin/users"
        hasCursor={false}
        nextCursor={null}
      >
        <tr>
          <td>홍길동</td>
        </tr>
      </PaginatedTable>,
    );

    expect(screen.getByRole("button", { name: "첫 페이지" })).toBeDisabled();
  });

  it("nextCursor가 있으면 다음 페이지 링크를 활성화한다", () => {
    render(
      <PaginatedTable
        headings={["이름"]}
        basePath="/admin/users"
        hasCursor={false}
        nextCursor="cursor-2"
      >
        <tr>
          <td>홍길동</td>
        </tr>
      </PaginatedTable>,
    );

    expect(
      screen.getByRole("link", { name: "다음 페이지" }),
    ).toBeInTheDocument();
  });
});
