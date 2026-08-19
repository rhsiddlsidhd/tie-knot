// 커서 기반 페이징의 커서 인코딩 — (생성시각, 문서 ID) 복합 키를 URL에 실을 수 있는
// 단일 문자열로 바꾼다. base64url이라 쿼리스트링에 그대로 실어도 이스케이프가 필요 없다.
// btoa/atob를 쓰는 이유: 이 파일이 클라이언트 번들에도 실릴 수 있어 Node 전용 Buffer에 의존하지 않는다.
export type PageCursor = {
  createdAt: Date;
  id: string;
};

const toBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string): string =>
  atob(value.replace(/-/g, "+").replace(/_/g, "/"));

export const encodeCursor = ({ createdAt, id }: PageCursor): string =>
  toBase64Url(`${createdAt.toISOString()}|${id}`);

// 형식이 깨진 커서는 "조건 없음"이 아니라 명시적 실패로 다뤄야 하므로 null을 리턴하고,
// 호출자(서비스)가 VALIDATION 에러로 번역한다.
export const decodeCursor = (raw: string): PageCursor | null => {
  let decoded: string;
  try {
    decoded = fromBase64Url(raw);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf("|");
  if (separatorIndex === -1) return null;

  const createdAt = new Date(decoded.slice(0, separatorIndex));
  const id = decoded.slice(separatorIndex + 1);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) return null;

  return { createdAt, id };
};
