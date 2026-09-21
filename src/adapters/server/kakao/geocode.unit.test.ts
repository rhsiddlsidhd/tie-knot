import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { geocodeAddress } from "./geocode";
import { AppError } from "@/core/domain/error";

const mockResponse = (status: number, ok: boolean, body: string): Response => {
  return {
    ok,
    status,
    text: async () => body,
  } as Response;
};

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("정상 응답이면 documents를 포함한 응답을 그대로 반환한다", async () => {
    const body = JSON.stringify({
      meta: { total_count: 1 },
      documents: [{ address_name: "서울 강남구" }],
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, body));

    await expect(geocodeAddress("서울 강남구")).resolves.toEqual({
      meta: { total_count: 1 },
      documents: [{ address_name: "서울 강남구" }],
    });
  });

  it("요청 URL에 query를 encodeURIComponent로 인코딩해 담는다", async () => {
    const body = JSON.stringify({ meta: { total_count: 0 }, documents: [] });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, body));

    await geocodeAddress("서울 강남구 1번지");

    expect(fetch).toHaveBeenCalledWith(
      `https://dapi.kakao.com/v2/local/search/address?query=${encodeURIComponent("서울 강남구 1번지")}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("KakaoAK"),
        }),
      }),
    );
  });

  it("network 요청 자체가 실패하면 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("failed to fetch"));

    await expect(geocodeAddress("서울 강남구")).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(geocodeAddress("서울 강남구")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("JSON이 아닌 응답을 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, true, "<html>maintenance</html>"),
    );

    await expect(geocodeAddress("서울 강남구")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("HTTP status가 실패(ok:false)면 EXTERNAL_SERVICE로 분류하고 응답 message를 사용한다", async () => {
    const body = JSON.stringify({
      message: "요청 파라미터가 올바르지 않습니다.",
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse(400, false, body));

    await expect(geocodeAddress("")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
      message: "요청 파라미터가 올바르지 않습니다.",
    });
  });

  it("status 200이어도 본문에 errorType이 있으면 EXTERNAL_SERVICE로 분류한다", async () => {
    const body = JSON.stringify({
      errorType: "InvalidApiKeyError",
      message: "인증키가 유효하지 않습니다.",
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, true, body));

    await expect(geocodeAddress("서울 강남구")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
      message: "인증키가 유효하지 않습니다.",
    });
  });

  it("실패 응답에 message가 없으면 기본 메시지를 사용한다", async () => {
    const body = JSON.stringify({ errorType: "SomeError" });
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, true, body));

    await expect(geocodeAddress("서울 강남구")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
      message: "주소 검색에 실패했습니다.",
    });
  });
});
