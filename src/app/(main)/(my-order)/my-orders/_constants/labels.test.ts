import { describe, it, expect } from "vitest";
import { ORDER_STATUS_TAB_LABELS, resolveOrderStatusLabel } from "./labels";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";

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

  it("탭 라벨은 카테고리가 섞이는 자리라 중립어를 쓴다", () => {
    expect(ORDER_STATUS_TAB_LABELS.COMPLETED).toBe("완료");
    expect(ORDER_STATUS_TAB_LABELS.CONFIRMED).toBe("결제완료");
  });
});
