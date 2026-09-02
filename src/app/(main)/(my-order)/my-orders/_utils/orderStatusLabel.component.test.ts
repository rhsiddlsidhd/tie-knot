import { describe, it, expect } from "vitest";
import { resolveOrderStatusLabel } from "./orderStatusLabel";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

describe("resolveOrderStatusLabel", () => {
  it("청첩장은 발행 기준 라벨을 쓴다", () => {
    expect(resolveOrderStatusLabel("COMPLETED", MOBILE_INVITATION_CATEGORY)).toBe("발행완료");
    expect(resolveOrderStatusLabel("CONFIRMED", MOBILE_INVITATION_CATEGORY)).toBe(
      "정보입력 대기",
    );
  });

  it("물리 상품은 배송 기준 라벨로 폴백한다", () => {
    expect(resolveOrderStatusLabel("COMPLETED", "favor")).toBe("배송완료");
    expect(resolveOrderStatusLabel("CONFIRMED", "guestbook")).toBe("배송준비중");
  });

  it("카테고리를 모르면 기본 라벨을 쓴다", () => {
    expect(resolveOrderStatusLabel("COMPLETED")).toBe("배송완료");
  });

  it("카테고리별 예외가 없는 상태는 기본 라벨을 그대로 쓴다", () => {
    expect(resolveOrderStatusLabel("PENDING", MOBILE_INVITATION_CATEGORY)).toBe("주문대기");
    expect(resolveOrderStatusLabel("CANCELLED", MOBILE_INVITATION_CATEGORY)).toBe("취소");
  });
});
