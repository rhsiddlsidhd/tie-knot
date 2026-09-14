import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/createPremiumFeature", () => ({
  createPremiumFeature: vi.fn(),
}));

import { createPremiumFeature } from "@/actions/createPremiumFeature";
import { PremiumFeatureRegistrationForm } from "./PremiumFeatureRegistrationForm";

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  render(<PremiumFeatureRegistrationForm />);

  await user.type(screen.getByLabelText(/기능 코드/), "ANIMATION");
  await user.type(screen.getByLabelText(/기능 이름/), "애니메이션 효과");
  await user.type(
    screen.getByLabelText(/기능 설명/),
    "기능에 대한 자세한 설명을 입력합니다.",
  );
  await user.type(screen.getByLabelText(/추가 비용/), "5000");
  await user.click(screen.getByRole("button", { name: "등록하기" }));
};

describe("PremiumFeatureRegistrationForm (컨테이너)", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("등록에 성공하면 성공 메시지를 alert로 표시한다", async () => {
    vi.mocked(createPremiumFeature).mockResolvedValue({
      success: true,
      data: { message: "프리미엄 기능을 등록하였습니다." },
    });

    await fillAndSubmit();

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("프리미엄 기능을 등록하였습니다."),
    );
  });

  it("등록에 실패하면 alert를 호출하지 않는다", async () => {
    vi.mocked(createPremiumFeature).mockResolvedValue({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요" },
    });

    await fillAndSubmit();

    await waitFor(() => expect(createPremiumFeature).toHaveBeenCalled());
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
