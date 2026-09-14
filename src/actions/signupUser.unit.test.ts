import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";

vi.mock("@/services/user", () => ({ signupUserService: vi.fn() }));

import { signupUserService } from "@/services/user";
import { signupUser } from "./signupUser";

const buildFormData = (overrides: Record<string, string> = {}): FormData => {
  const defaults: Record<string, string> = {
    email: "hong@example.com",
    name: "홍길동",
    phone: "010-1234-5678",
    password: "abc123!",
    confirmPassword: "abc123!",
  };
  const formData = new FormData();
  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
};

describe("signupUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("이메일 형식이 올바르지 않으면 VALIDATION 오류를 반환하고 서비스를 호출하지 않는다", async () => {
    const result = await signupUser(null, buildFormData({ email: "invalid-email" }));

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: expect.objectContaining({
          email: expect.any(Array),
        }),
      },
    });
    expect(signupUserService).not.toHaveBeenCalled();
  });

  it("비밀번호와 확인 비밀번호가 다르면 VALIDATION 오류를 반환하고 서비스를 호출하지 않는다", async () => {
    const result = await signupUser(
      null,
      buildFormData({ confirmPassword: "different1!" }),
    );

    expect(result).toMatchObject({
      success: false,
      error: {
        category: "VALIDATION",
        fieldErrors: expect.objectContaining({
          confirmPassword: expect.any(Array),
        }),
      },
    });
    expect(signupUserService).not.toHaveBeenCalled();
  });

  it("정규화한 입력을 서비스에 전달하고 성공 메시지를 반환한다", async () => {
    vi.mocked(signupUserService).mockResolvedValue(undefined);

    const result = await signupUser(null, buildFormData());

    expect(signupUserService).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "hong@example.com",
        name: "홍길동",
        phone: "010-1234-5678",
        password: "abc123!",
      }),
    );
    expect(result).toEqual({
      success: true,
      data: { message: "hong@example.com님 회원가입을 축하드립니다." },
    });
  });

  it("서비스가 이미 존재하는 이메일이라며 실패하면 실패 응답으로 변환한다", async () => {
    vi.mocked(signupUserService).mockRejectedValue(
      new AppError("VALIDATION", "이미 존재하는 이메일 입니다."),
    );

    const result = await signupUser(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "이미 존재하는 이메일 입니다.",
        fieldErrors: undefined,
      },
    });
  });
});
