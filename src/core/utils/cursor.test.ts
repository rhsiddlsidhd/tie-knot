import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, isValidPageLimit } from "./cursor";
import { MAX_PAGE_SIZE } from "@/core/domain";

// 디코딩 실패 분기를 검증하려면 encodeCursor가 만들지 않는 형태의 payload가 필요하다.
const encodeRawPayload = (payload: string): string =>
  btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("cursor", () => {
  const createdAt = new Date("2026-08-19T05:30:00.000Z");
  const id = "68a3f0c1c2d3e4f5a6b7c8d9";

  it("인코딩한 커서를 디코딩하면 원래 값으로 복원된다", () => {
    const decoded = decodeCursor(encodeCursor({ createdAt, id }));

    expect(decoded).toEqual({ createdAt, id });
  });

  it("인코딩 결과는 URL에 그대로 실을 수 있는 문자만 포함한다", () => {
    expect(encodeCursor({ createdAt, id })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("base64가 아닌 문자열은 null을 리턴한다", () => {
    expect(decodeCursor("!!not-base64!!")).toBe(null);
  });

  it("구분자가 없는 커서는 null을 리턴한다", () => {
    expect(decodeCursor(encodeRawPayload("2026-08-19T05:30:00.000Z"))).toBe(
      null,
    );
  });

  it("날짜 부분이 유효하지 않으면 null을 리턴한다", () => {
    expect(decodeCursor(encodeRawPayload(`not-a-date|${id}`))).toBe(null);
  });

  it("ID 부분이 비어 있으면 null을 리턴한다", () => {
    expect(decodeCursor(encodeRawPayload("2026-08-19T05:30:00.000Z|"))).toBe(
      null,
    );
  });

  it("ID가 24자리 hexadecimal이 아니면 null을 리턴한다", () => {
    expect(
      decodeCursor(encodeRawPayload("2026-08-19T05:30:00.000Z|not-an-object-id")),
    ).toBe(null);
  });

  it("ID가 24자리 hexadecimal이면 정상 디코딩된다", () => {
    expect(
      decodeCursor(encodeRawPayload(`2026-08-19T05:30:00.000Z|${id}`)),
    ).toEqual({ createdAt, id });
  });

  describe("isValidPageLimit", () => {
    it("1 이상 MAX_PAGE_SIZE 이하의 정수는 유효하다", () => {
      expect(isValidPageLimit(1)).toBe(true);
      expect(isValidPageLimit(MAX_PAGE_SIZE)).toBe(true);
    });

    it("0 이하는 무효하다", () => {
      expect(isValidPageLimit(0)).toBe(false);
      expect(isValidPageLimit(-1)).toBe(false);
    });

    it("소수는 무효하다", () => {
      expect(isValidPageLimit(1.5)).toBe(false);
    });

    it("MAX_PAGE_SIZE를 초과하면 무효하다", () => {
      expect(isValidPageLimit(MAX_PAGE_SIZE + 1)).toBe(false);
    });
  });
});
