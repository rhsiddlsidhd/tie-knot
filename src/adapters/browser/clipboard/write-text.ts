import "client-only";

/**
 * Clipboard 쓰기 경계 — 권한 게이트가 있어 호출자가 성공을 가정할 수 없고,
 * 테스트에서는 전역 navigator를 건드리지 않고 이 모듈만 대체하면 된다.
 * 실패 사유는 그대로 던져 호출자가 UI 문구를 결정한다.
 */
export const writeText = (text: string): Promise<void> =>
  navigator.clipboard.writeText(text);
