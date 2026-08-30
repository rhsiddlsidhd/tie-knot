import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";
import type { CheckoutItem } from "@/core/domain";
import { OrderSummary } from "./OrderSummary";

const ORDER: CheckoutItem = {
  productId: "product-1",
  category: MOBILE_INVITATION_CATEGORY,
  title: "봄날의 청첩장",
  thumbnail: "https://res.cloudinary.com/demo/image/upload/invitation.jpg",
  originalPrice: 12000,
  discountedPrice: 10000,
  discountAmount: 2000,
  optionsTotalPrice: 5000,
  finalPrice: 15000,
  quantity: 1,
  selectedFeatures: [
    {
      featureId: "feature-1",
      code: "GUESTBOOK",
      label: "방명록",
      price: 5000,
    },
  ],
};

describe("OrderSummary", () => {
  it("loading 중이면 로딩 안내를 렌더링한다", () => {
    render(<OrderSummary data={null} loading />);

    expect(screen.getByText("주문 정보를 불러오는 중...")).toBeInTheDocument();
  });

  it("order가 없으면 상품 정보 없음을 안내한다", () => {
    render(<OrderSummary data={null} loading={false} />);

    expect(screen.getByText("상품 정보를 찾을 수 없습니다.")).toBeInTheDocument();
  });

  it("order props로 주문 내역과 총 결제금액을 렌더링한다", () => {
    render(<OrderSummary data={ORDER} loading={false} />);

    expect(screen.getByText("봄날의 청첩장")).toBeInTheDocument();
    expect(screen.getByText(/방명록/)).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
  });
});
