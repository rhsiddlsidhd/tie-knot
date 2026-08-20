import "server-only";
import { AppError } from "@/core/domain";
import { parseSeoulOpenApiResponse } from "@/core/utils";

export async function fetchSeoulOpenApi<T>(
  serviceName: string,
  pathParams: (string | number)[],
): Promise<T[]> {
  const path = [serviceName, ...pathParams.map((p) => encodeURIComponent(p))].join("/");
  const url = `${process.env.SUBWAY_SEOUL_BASE_URL}/${process.env.SEOUL_PUBLIC_API_KEY}/json/${path}/`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `서울 열린데이터광장 API 요청 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `서울 열린데이터광장 API가 JSON이 아닌 응답을 반환함 (status=${res.status}): ${text.slice(0, 300)}`,
    );
  }

  const result = parseSeoulOpenApiResponse<T>(serviceName, json);
  if (result.kind === "failure") {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `서울 열린데이터광장 API 오류 (${result.code}): ${result.message}`,
    );
  }

  return result.rows;
}
