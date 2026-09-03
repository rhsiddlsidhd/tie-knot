import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBanks } from "./banks";
import { AppError } from "@/core/domain/error";

function mockResponse(status: number, ok: boolean, body: string): Response {
  return {
    ok,
    status,
    text: async () => body,
  } as Response;
}

describe("fetchBanks", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("items 배열을 꺼내 리턴한다", async () => {
    const body = JSON.stringify({
      items: [
        { bank: "KOOKMIN", name: { ko: "국민은행" } },
        { bank: "SHINHAN", name: { ko: "신한은행" } },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, body));

    await expect(fetchBanks()).resolves.toEqual([
      { bank: "KOOKMIN", name: { ko: "국민은행" } },
      { bank: "SHINHAN", name: { ko: "신한은행" } },
    ]);
  });

  it("네트워크 실패를 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(fetchBanks()).rejects.toBeInstanceOf(AppError);
    await expect(fetchBanks()).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("에러 상태코드를 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(503, false, JSON.stringify({ message: "unavailable" })),
    );

    await expect(fetchBanks()).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("JSON이 아닌 응답을 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, true, "<html>maintenance</html>"),
    );

    await expect(fetchBanks()).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("응답 형태가 계약과 다르면 200이어도 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, true, JSON.stringify({ items: [{ bank: "KOOKMIN" }] })),
    );

    await expect(fetchBanks()).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });
});
