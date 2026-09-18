// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";

vi.mock("@/services/guestbook", () => ({ getGuestbookService: vi.fn() }));
vi.mock("@/services/auth", () => ({ getAuth: vi.fn() }));

import { getGuestbookService } from "@/services/guestbook";
import { getAuth } from "@/services/auth";
import { GET } from "./route";

const buildRequest = (query: Record<string, string> = {}): NextRequest => {
  const url = new URL("http://localhost/api/guestbook");
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url);
};

describe("GET /api/guestbook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuth).mockResolvedValue(null);
  });

  it("publicKey가 없으면 400 VALIDATION을 반환하고 서비스를 호출하지 않는다", async () => {
    const res = await GET(buildRequest());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "publicKey가 필요합니다.",
        fieldErrors: undefined,
      },
    });
    expect(getGuestbookService).not.toHaveBeenCalled();
  });

  it("비로그인 상태에서는 viewerUserId 없이 서비스를 호출하고 createdAt을 ISO 문자열로 변환해 응답한다", async () => {
    vi.mocked(getGuestbookService).mockResolvedValue({
      items: [
        {
          id: "gb-1",
          author: "홍길동",
          message: "축하합니다",
          isPrivate: false,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    });

    const res = await GET(buildRequest({ publicKey: "pub-1" }));
    const json = await res.json();

    expect(getGuestbookService).toHaveBeenCalledWith("pub-1", {
      cursor: undefined,
      viewerUserId: undefined,
    });
    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        items: [
          {
            _id: "gb-1",
            author: "홍길동",
            message: "축하합니다",
            isPrivate: false,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        nextCursor: null,
      },
    });
  });

  it("로그인 상태면 viewerUserId로 세션의 userId를 전달한다", async () => {
    vi.mocked(getAuth).mockResolvedValue({
      userId: "user-1",
      email: "hong@example.com",
      role: "USER",
    });
    vi.mocked(getGuestbookService).mockResolvedValue({ items: [], nextCursor: null });

    await GET(buildRequest({ publicKey: "pub-1" }));

    expect(getGuestbookService).toHaveBeenCalledWith("pub-1", {
      cursor: undefined,
      viewerUserId: "user-1",
    });
  });

  it("cursor 쿼리 파라미터를 그대로 서비스에 전달한다", async () => {
    vi.mocked(getGuestbookService).mockResolvedValue({ items: [], nextCursor: null });

    await GET(buildRequest({ publicKey: "pub-1", cursor: "cursor-abc" }));

    expect(getGuestbookService).toHaveBeenCalledWith("pub-1", {
      cursor: "cursor-abc",
      viewerUserId: undefined,
    });
  });

  it("서비스가 AppError를 던지면 매핑된 HTTP status로 변환한다", async () => {
    vi.mocked(getGuestbookService).mockRejectedValue(
      new AppError("VALIDATION", "잘못된 페이지 커서입니다."),
    );

    const res = await GET(buildRequest({ publicKey: "pub-1", cursor: "bad-cursor" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "잘못된 페이지 커서입니다.",
        fieldErrors: undefined,
      },
    });
  });

  it("알 수 없는 오류는 500 INTERNAL로 정규화한다", async () => {
    vi.mocked(getGuestbookService).mockRejectedValue(new Error("boom"));

    const res = await GET(buildRequest({ publicKey: "pub-1" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.category).toBe("INTERNAL");
  });
});
