import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PremiumFeatureRegistrationForm } from "./PremiumFeatureRegistrationForm";

describe("PremiumFeatureRegistrationForm", () => {
  it("기본 입력 필드를 렌더링한다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: /기능 코드/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/기능 이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/기능 설명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/추가 비용/)).toBeInTheDocument();
  });

  it("필드 에러가 있으면 각 필드 아래에 에러 메시지를 렌더링한다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={{
          success: false,
          error: {
            category: "VALIDATION",
            message: "입력값을 확인해주세요",
            fieldErrors: {
              code: ["지원하지 않는 기능 코드입니다."],
              label: ["기능 이름을 입력해주세요."],
              description: ["설명은 최소 20자 이상이어야 합니다."],
              additionalPrice: ["추가 비용은 0 이상이어야 합니다."],
            },
          },
        }}
      />,
    );

    expect(
      screen.getByText("지원하지 않는 기능 코드입니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("기능 이름을 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText("설명은 최소 20자 이상이어야 합니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("추가 비용은 0 이상이어야 합니다."),
    ).toBeInTheDocument();
  });

  it("에러가 없으면 에러 메시지를 렌더링하지 않는다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(
      screen.queryByText("기능 이름을 입력해주세요."),
    ).not.toBeInTheDocument();
  });

  it("pending이 아니면 '등록하기' 버튼을 렌더링한다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: "등록하기" }),
    ).toBeInTheDocument();
  });

  it("pending이면 버튼 문구가 '등록중'으로 바뀐다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={true}
        state={null}
      />,
    );

    expect(screen.getByRole("button", { name: "등록중" })).toBeInTheDocument();
  });

  it("제출하면 전달받은 action이 호출된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(
      <PremiumFeatureRegistrationForm
        action={action}
        pending={false}
        state={null}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /기능 코드/ }));
    await user.click(
      await screen.findByRole("option", { name: "GALLERY_LIGHTBOX" }),
    );
    await user.type(screen.getByLabelText(/기능 이름/), "애니메이션 효과");
    await user.type(
      screen.getByLabelText(/기능 설명/),
      "기능에 대한 자세한 설명을 입력합니다.",
    );
    await user.type(screen.getByLabelText(/추가 비용/), "5000");
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(action).toHaveBeenCalledTimes(1);
  });
  it("기능 코드는 구현된 코드 목록에서만 고를 수 있다", async () => {
    const user = userEvent.setup();
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /기능 코드/ }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "GALLERY_LIGHTBOX",
    ]);
  });
  it("등록 가능 토글을 기본으로 켜서 렌더링한다", () => {
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    expect(screen.getByRole("switch", { name: /등록 가능/ })).toBeChecked();
  });

  it("등록 가능 토글을 끄면 체크가 해제된다", async () => {
    const user = userEvent.setup();
    render(
      <PremiumFeatureRegistrationForm
        action={vi.fn()}
        pending={false}
        state={null}
      />,
    );

    await user.click(screen.getByRole("switch", { name: /등록 가능/ }));

    expect(screen.getByRole("switch", { name: /등록 가능/ })).not.toBeChecked();
  });
});
