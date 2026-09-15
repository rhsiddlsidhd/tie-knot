import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PremiumFeature } from "@/core/domain/premium-feature";

const openModalMock = vi.hoisted(() => vi.fn());

vi.mock("@/ui/stores/use-app-store", () => ({
  useAdminModalStore: (selector: (state: unknown) => unknown) =>
    selector({ openModal: openModalMock }),
}));

import { PremiumFeatureRowAction } from "./PremiumFeatureRowAction";

const feature: PremiumFeature = {
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "하객들이 남기는 방명록 기능을 추가합니다.",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

describe("PremiumFeatureRowAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("수정 버튼을 누르면 해당 기능으로 편집 모달을 연다", async () => {
    const user = userEvent.setup();
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 수정" }));

    expect(openModalMock).toHaveBeenCalledWith("EDIT-PREMIUMFEATURE", {
      premiumFeature: feature,
    });
  });

  it("렌더 시점에는 모달을 열지 않는다", () => {
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    expect(openModalMock).not.toHaveBeenCalled();
  });
});
