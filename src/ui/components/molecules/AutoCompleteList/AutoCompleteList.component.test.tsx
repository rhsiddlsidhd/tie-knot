import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Command } from "@/ui/components/atoms/command";
import { AutoCompleteList } from "./AutoCompleteList";

describe("AutoCompleteList", () => {
  it("suggestions을 옵션으로 표시한다", () => {
    render(
      <Command>
        <AutoCompleteList
          suggestions={["김철수", "이영희"]}
          isOpen={true}
          onSelect={vi.fn()}
        />
      </Command>,
    );

    expect(screen.getByRole("option", { name: "김철수" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "이영희" })).toBeInTheDocument();
  });

  it("suggestions이 비어 있으면 옵션을 표시하지 않는다", () => {
    render(
      <Command>
        <AutoCompleteList suggestions={[]} isOpen={true} onSelect={vi.fn()} />
      </Command>,
    );

    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("옵션을 클릭하면 해당 이름으로 onSelect를 호출한다", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Command>
        <AutoCompleteList
          suggestions={["김철수", "이영희"]}
          isOpen={true}
          onSelect={onSelect}
        />
      </Command>,
    );

    await user.click(screen.getByRole("option", { name: "이영희" }));

    expect(onSelect).toHaveBeenCalledWith("이영희");
  });
});
