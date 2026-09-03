import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dialog, DialogContent } from "@/ui/components/atoms/dialog";

import { ViewContact } from "./ViewContact";

describe("ViewContact", () => {
  it("복사한 연락처 카드에만 복사 완료 상태를 표시한다", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <Dialog open>
        <DialogContent>
          <ViewContact
            payload={[
              { relation: "신랑", name: "김철수", phone: "010-1111-1111" },
              { relation: "신부", name: "이영희", phone: "010-2222-2222" },
            ]}
          />
        </DialogContent>
      </Dialog>,
    );

    const copiedCard = screen.getByRole("article", {
      name: "신랑 김철수의 연락처",
    });
    const untouchedCard = screen.getByRole("article", {
      name: "신부 이영희의 연락처",
    });

    await user.click(within(copiedCard).getByRole("button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("010-1111-1111");
      expect(copiedCard.querySelector(".text-success")).not.toBeNull();
    });
    expect(untouchedCard.querySelector(".text-success")).toBeNull();
  });
});
