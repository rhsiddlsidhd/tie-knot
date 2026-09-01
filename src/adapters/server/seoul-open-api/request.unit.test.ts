import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSeoulOpenApi } from "./request";

const SERVICE_NAME = "SearchSTNBySubwayLineInfo";

type Row = { STATION_NM: string };

function mockResponse(status: number, ok: boolean, contentType: string, body: string): Response {
  return {
    ok,
    status,
    headers: new Headers({ "content-type": contentType }),
    text: async () => body,
  } as Response;
}

describe("fetchSeoulOpenApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("정상 JSON 응답을 rows 배열로 리턴한다", async () => {
    const body = JSON.stringify({
      [SERVICE_NAME]: {
        list_total_count: 1,
        RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" },
        row: [{ STATION_NM: "서울" }],
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, "application/json", body));

    const rows = await fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000]);

    expect(rows).toEqual([{ STATION_NM: "서울" }]);
  });

  it("ok:true이지만 XML 본문(인증키 오류 등)이면 EXTERNAL_SERVICE로 분류한다", async () => {
    const xml = "<RESULT><CODE>INFO-100</CODE><MESSAGE>인증키가 유효하지 않습니다.</MESSAGE></RESULT>";
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, "text/xml", xml));

    await expect(fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000])).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("ok:false(HTTP 5xx)면 EXTERNAL_SERVICE로 분류하고 message에 status를 남긴다", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(500, false, "text/html", "<html>error</html>"));

    await expect(fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000])).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
      message: expect.stringContaining("500"),
    });
  });

  it("content-type은 JSON인데 본문이 깨져 있으면 EXTERNAL_SERVICE로 분류한다", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, "application/json", ""));

    await expect(fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000])).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("fetch 자체가 reject되면 EXTERNAL_SERVICE로 정규화한다", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000])).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("JSON이지만 API 레벨 실패(RESULT.CODE 에러)면 message에 CODE를 남긴다", async () => {
    const body = JSON.stringify({
      RESULT: { CODE: "ERROR-336", MESSAGE: "일별 트래픽 제한을 초과했습니다." },
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, "application/json", body));

    await expect(fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 1000])).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
      message: expect.stringContaining("ERROR-336"),
    });
  });

  it("결과 0건(INFO-200)은 실패가 아니라 빈 배열이다", async () => {
    const body = JSON.stringify({ RESULT: { CODE: "INFO-200", MESSAGE: "해당 데이터가 없습니다." } });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, true, "application/json", body));

    const rows = await fetchSeoulOpenApi<Row>(SERVICE_NAME, [1, 50, "존재안함역"]);

    expect(rows).toEqual([]);
  });
});
