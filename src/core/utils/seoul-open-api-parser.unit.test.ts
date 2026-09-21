import { describe, expect, it } from "vitest";
import { parseSeoulOpenApiResponse } from "./seoul-open-api-parser";

const SERVICE_NAME = "SearchSTNBySubwayLineInfo";

type Row = { STATION_NM: string };

describe("parseSeoulOpenApiResponse", () => {
  it("서비스명 wrapper가 있으면 success로 totalCount와 rows를 반환한다", () => {
    const json = {
      [SERVICE_NAME]: {
        list_total_count: 2,
        RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" },
        row: [{ STATION_NM: "서울" }, { STATION_NM: "시청" }],
      },
    };

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "success",
      totalCount: 2,
      rows: [{ STATION_NM: "서울" }, { STATION_NM: "시청" }],
    });
  });

  it("서비스명 wrapper 안에 row가 없으면 빈 배열로 채운다", () => {
    const json = {
      [SERVICE_NAME]: {
        list_total_count: 0,
        RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" },
      },
    };

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "success",
      totalCount: 0,
      rows: [],
    });
  });

  it("wrapper 없이 bare RESULT.CODE가 INFO-200이면 결과 0건을 success로 취급한다", () => {
    const json = {
      RESULT: { CODE: "INFO-200", MESSAGE: "해당 데이터가 없습니다." },
    };

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "success",
      totalCount: 0,
      rows: [],
    });
  });

  it("wrapper 없이 bare RESULT.CODE가 에러면 failure로 code와 message를 반환한다", () => {
    const json = {
      RESULT: {
        CODE: "ERROR-336",
        MESSAGE: "일별 트래픽 제한을 초과했습니다.",
      },
    };

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "failure",
      code: "ERROR-336",
      message: "일별 트래픽 제한을 초과했습니다.",
    });
  });

  it("RESULT조차 없는 예상 밖 응답은 UNKNOWN 코드의 failure로 정규화한다", () => {
    const json = {};

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "failure",
      code: "UNKNOWN",
      message: "알 수 없는 오류",
    });
  });

  it("다른 서비스명 wrapper가 섞여 있어도 요청한 서비스명 기준으로 판정한다", () => {
    const json = {
      SomeOtherService: {
        list_total_count: 5,
        RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" },
        row: [{ STATION_NM: "무관한 응답" }],
      },
      RESULT: { CODE: "INFO-200", MESSAGE: "해당 데이터가 없습니다." },
    };

    expect(parseSeoulOpenApiResponse<Row>(SERVICE_NAME, json)).toEqual({
      kind: "success",
      totalCount: 0,
      rows: [],
    });
  });
});
