import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { PremiumFeatureDialog } from "./PremiumFeatureDialog";

const buildFeature = (overrides?: Partial<PremiumFeature>): PremiumFeature => ({
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
  ...overrides,
});

describe("PremiumFeatureDialog", () => {
  it("기존 프리미엄 기능 값을 각 필드의 기본값으로 렌더링한다", () => {
    render(
      <PremiumFeatureDialog
        premiumFeature={buildFeature()}
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(screen.getByLabelText(/기능 코드/)).toHaveValue("GUESTBOOK");
    expect(screen.getByLabelText(/기능 이름/)).toHaveValue("방명록");
    expect(screen.getByLabelText(/기능 설명/)).toHaveValue("방명록 기능");
    expect(screen.getByLabelText(/추가 비용/)).toHaveValue(3000);
  });

  it("필드 에러가 있으면 각 필드 아래에 에러 메시지를 렌더링한다", () => {
    render(
      <PremiumFeatureDialog
        premiumFeature={buildFeature()}
        action={vi.fn()}
        pending={false}
        state={{
          success: false,
          error: {
            category: "VALIDATION",
            message: "입력값을 확인해주세요",
            fieldErrors: {
              code: ["코드 형식이 올바르지 않습니다."],
              label: ["기능 이름을 입력해주세요."],
              description: ["설명은 최소 10자 이상이어야 합니다."],
              additionalPrice: ["추가 비용은 0 이상이어야 합니다."],
            },
          },
        }}
      />,
    );

    expect(
      screen.getByText("코드 형식이 올바르지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("기능 이름을 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText("설명은 최소 10자 이상이어야 합니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("추가 비용은 0 이상이어야 합니다."),
    ).toBeInTheDocument();
  });

  it("에러가 없으면 에러 메시지를 렌더링하지 않는다", () => {
    render(
      <PremiumFeatureDialog
        premiumFeature={buildFeature()}
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(
      screen.queryByText("기능 이름을 입력해주세요."),
    ).not.toBeInTheDocument();
  });

  it("pending이면 수정 버튼이 비활성화되고 문구가 바뀐다", () => {
    render(
      <PremiumFeatureDialog
        premiumFeature={buildFeature()}
        action={vi.fn()}
        pending={true}
        state={null}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "수정 중..." });
    expect(submitButton).toBeDisabled();
  });

  it("제출하면 전달받은 action이 FormData와 함께 호출된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(
      <PremiumFeatureDialog
        premiumFeature={buildFeature()}
        action={action}
        pending={false}
        state={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "수정" }));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
