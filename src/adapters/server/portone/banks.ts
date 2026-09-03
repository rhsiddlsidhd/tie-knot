import "server-only";
import { AppError } from "@/core/domain/error";
import { banksResponseSchema } from "@/core/schemas/response/banks.schema";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

const BANKS_URL = "https://api.portone.io/banks";

/**
 * PortOne 은행 목록 조회 — 계좌 입력 폼의 은행 선택지를 채운다.
 *
 * 응답을 스키마로 검증한 뒤 통과시킨다. 이 엔드포인트는 인증이 없어 점검 페이지나
 * 프록시 오류가 200 HTML로 돌아올 수 있는데, 검증 없이 `items`만 꺼내면 그때
 * `undefined`가 성공 응답에 담겨 화면에서야 터진다.
 */
export async function fetchBanks(): Promise<BanksResponse> {
  let res: Response;
  try {
    res = await fetch(BANKS_URL);
  } catch (error) {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `PortOne 은행 목록 요청 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const text = await res.text();

  if (!res.ok) {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `PortOne 은행 목록 조회 오류 (status=${res.status}): ${text.slice(0, 300)}`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `PortOne이 JSON이 아닌 응답을 반환함 (status=${res.status}): ${text.slice(0, 300)}`,
    );
  }

  const parsed = banksResponseSchema.safeParse(
    (json as { items?: unknown })?.items,
  );

  if (!parsed.success) {
    throw new AppError(
      "EXTERNAL_SERVICE",
      "PortOne 은행 목록 응답 형태가 예상과 다릅니다.",
    );
  }

  return parsed.data;
}
