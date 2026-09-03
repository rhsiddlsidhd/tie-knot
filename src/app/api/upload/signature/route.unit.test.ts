// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";

vi.mock("@/services/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/adapters/server/cloudinary/sign", () => ({
  signUploadRequest: vi.fn().mockReturnValue({
    signature: "mock-signature",
    timestamp: 1234567890,
    folder: "products",
    allowed_formats: "jpg,png,webp,jpeg",
    cloudName: "cloud",
    apiKey: "key",
  }),
}));

import { requireAuth } from "@/services/auth";
import { signUploadRequest } from "@/adapters/server/cloudinary/sign";
import { POST } from "./route";

const buildRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/upload/signature", {
    method: "POST",
    body: JSON.stringify(body),
  });

const buildRawRequest = (rawBody: string) =>
  new NextRequest("http://localhost/api/upload/signature", {
    method: "POST",
    body: rawBody,
  });

describe("POST /api/upload/signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("깨진 JSON이면 인증 여부와 무관하게 400을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRawRequest("{ invalid json"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("본문이 JSON null이면 400을 리턴한다(500 아님)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRawRequest("null"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("파싱은 성공하고 인증되지 않으면 401을 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "로그인이 필요합니다."),
    );

    const res = await POST(buildRequest({ folder: "products" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("folder가 없으면 400을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("정상 요청이면 서명 정보를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRequest({ folder: "products" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: expect.objectContaining({
        signature: "mock-signature",
        folder: "products",
      }),
    });
    expect(requireAuth).toHaveBeenCalled();
    expect(signUploadRequest).toHaveBeenCalledWith("products", undefined);
  });

  it("위젯이 전달한 최종 파라미터를 그대로 서명한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });
    const paramsToSign = {
      folder: "products",
      timestamp: 1234567890,
      source: "uw",
      custom_coordinates: "1,2,3,4",
    };

    await POST(buildRequest({ paramsToSign }));

    expect(signUploadRequest).toHaveBeenCalledWith("products", paramsToSign);
  });
});
