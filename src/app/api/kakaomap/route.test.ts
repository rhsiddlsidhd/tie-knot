// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function mockResponse(status: number, ok: boolean, body: string): Response {
  return {
    ok,
    status,
    text: async () => body,
  } as Response;
}

const buildRequest = (address: string) =>
  new NextRequest(`http://localhost/api/kakaomap?address=${encodeURIComponent(address)}`);

describe("GET /api/kakaomap", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("정상 JSON 응답이면 200과 데이터를 리턴한다", async () => {
    const body = JSON.stringify({ documents: [{ address_name: "서울시 강남구" }] });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, body));

    const res = await GET(buildRequest("강남구"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: { documents: [{ address_name: "서울시 강남구" }] },
    });
  });

  it("ok:false이고 JSON 에러 본문이면 502 EXTERNAL_SERVICE를 리턴한다", async () => {
    const body = JSON.stringify({ errorType: "InvalidArgumentError", message: "query is required" });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(400, false, body));

    const res = await GET(buildRequest(""));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error.category).toBe("EXTERNAL_SERVICE");
  });

  it("ok:true이지만 비-JSON(HTML 에러 페이지) 본문이면 502 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(200, true, "<html><body>Bad Gateway</body></html>"),
    );

    const res = await GET(buildRequest("강남구"));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error.category).toBe("EXTERNAL_SERVICE");
  });

  it("ok:false이고 비-JSON 본문이면 SyntaxError로 죽지 않고 502 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(502, false, "<html>Bad Gateway</html>"));

    const res = await GET(buildRequest("강남구"));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error.category).toBe("EXTERNAL_SERVICE");
  });

  it("fetch 자체가 reject되면 502 EXTERNAL_SERVICE로 정규화한다", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

    const res = await GET(buildRequest("강남구"));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.error.category).toBe("EXTERNAL_SERVICE");
  });
});
