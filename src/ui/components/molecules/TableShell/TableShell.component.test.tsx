import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TableShell } from "./TableShell";

describe("TableShell", () => {
  it("headings를 순서대로 표시한다", () => {
    render(
      <TableShell headings={["이름", "이메일"]}>
        <tr>
          <td>홍길동</td>
          <td>hong@example.com</td>
        </tr>
      </TableShell>,
    );

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "이름",
      "이메일",
    ]);
  });

  it("children으로 받은 row를 표시한다", () => {
    render(
      <TableShell headings={["이름"]}>
        <tr>
          <td>홍길동</td>
        </tr>
      </TableShell>,
    );

    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });
});
