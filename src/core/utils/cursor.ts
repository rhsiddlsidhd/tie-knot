// 커서 기반 페이징의 커서 인코딩 — (생성시각, 문서 ID) 복합 키를 URL에 실을 수 있는
// 단일 문자열로 바꾼다. base64url이라 쿼리스트링에 그대로 실어도 이스케이프가 필요 없다.
// btoa/atob를 쓰는 이유: 이 파일이 클라이언트 번들에도 실릴 수 있어 Node 전용 Buffer에 의존하지 않는다.
import { MAX_PAGE_SIZE } from "@/core/domain/cursor";

export type PageCursor = {
  createdAt: Date;
  id: string;
  // createdAt 외 보조 정렬 키가 필요한 목록(예: 리뷰 평점순)에서만 채운다 — 없으면
  // 기존 (createdAt, id) 2단 커서와 동일하게 인코딩/디코딩된다.
  secondary?: number;
};

// mongoose 없이 순수 정규식으로만 ObjectId 형식을 검증한다(이 파일은 클라이언트
// 번들에도 실릴 수 있어 mongoose를 import하지 않는다).
const OBJECT_ID_HEX_PATTERN = /^[0-9a-fA-F]{24}$/;

const toBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string): string =>
  atob(value.replace(/-/g, "+").replace(/_/g, "/"));

export const encodeCursor = ({ createdAt, id, secondary }: PageCursor): string =>
  toBase64Url(
    secondary === undefined
      ? `${createdAt.toISOString()}|${id}`
      : `${createdAt.toISOString()}|${id}|${secondary}`,
  );

// 형식이 깨진 커서는 "조건 없음"이 아니라 명시적 실패로 다뤄야 하므로 null을 리턴하고,
// 호출자(서비스)가 VALIDATION 에러로 번역한다.
export const decodeCursor = (raw: string): PageCursor | null => {
  let decoded: string;
  try {
    decoded = fromBase64Url(raw);
  } catch {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length < 2 || parts.length > 3) return null;

  const [createdAtRaw, id, secondaryRaw] = parts;
  const createdAt = new Date(createdAtRaw);
  if (!id || Number.isNaN(createdAt.getTime()) || !OBJECT_ID_HEX_PATTERN.test(id)) {
    return null;
  }

  if (secondaryRaw === undefined) return { createdAt, id };

  const secondary = Number(secondaryRaw);
  if (Number.isNaN(secondary)) return null;

  return { createdAt, id, secondary };
};

/** limit이 1 이상 MAX_PAGE_SIZE 이하의 정수인지 검증한다 — 범위 밖이면 서비스가
 * VALIDATION AppError로 번역한다(이 유틸 자체는 boolean만 리턴, throw하지 않는다). */
export const isValidPageLimit = (limit: number): boolean =>
  Number.isInteger(limit) && limit >= 1 && limit <= MAX_PAGE_SIZE;
