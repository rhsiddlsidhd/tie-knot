import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { BanksResponse } from "@/core/schemas";
import type * as HooksModule from "@/ui/hooks";

vi.mock("@/ui/hooks", async (importOriginal) => {
  const hooks = await importOriginal<typeof HooksModule>();

  return {
    ...hooks,
    useBanks: () => ({ banks: [] as BanksResponse, isLoading: false, isError: false }),
  };
});

import { AccountSection } from "./AccountSection";

describe("AccountSection", () => {
  it("복사한 계좌 카드에만 복사 완료 상태를 표시한다", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <AccountSection
        groomAccounts={[
          {
            relation: "신랑",
            name: "김철수",
            bankName: "bank-a",
            accountNumber: "111-111",
          },
          {
            relation: "신랑 아버지",
            name: "김영수",
            bankName: "bank-b",
            accountNumber: "222-222",
          },
        ]}
        brideAccounts={[]}
      />,
    );

    const copiedCard = screen.getByRole("article", {
      name: "신랑 김철수의 계좌 정보",
    });
    const untouchedCard = screen.getByRole("article", {
      name: "신랑 아버지 김영수의 계좌 정보",
    });

    await user.click(within(copiedCard).getByRole("button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("111-111");
      expect(copiedCard.querySelector(".text-success")).not.toBeNull();
    });
    expect(untouchedCard.querySelector(".text-success")).toBeNull();
  });
});
