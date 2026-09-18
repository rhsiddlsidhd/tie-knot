import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";

vi.mock("@/services/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/services/order", () => ({
  createOrderForCurrentUserService: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { getAuth } from "@/services/auth";
import { createOrderForCurrentUserService } from "@/services/order";
import { redirect } from "next/navigation";
import { ROUTES } from "@/core/domain/routes";
import { createOrder } from "./createOrder";

const buildFormData = (overrides: Record<string, string> = {}): FormData => {
  const defaults: Record<string, string> = {
    buyerName: "홍길동",
    buyerEmail: "hong@example.com",
    buyerPhone: "010-1234-5678",
    payMethod: "CARD",
    productCategory: "mobile-invitation",
    productId: "507f1f77bcf86cd799439011",
    productTitle: "모바일 청첩장",
    productThumbnail: "https://example.com/thumb.jpg",
    originalPrice: "10000",
    discountedPrice: "9000",
    productQuantity: "1",
    selectedFeatures: "[]",
  };
  const formData = new FormData();
  Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
};

const buildOrder = () => ({
  merchantUid: "ORDER-1",
  finalPrice: 9000,
  payMethod: "CARD",
  buyerName: "홍길동",
  buyerEmail: "hong@example.com",
  buyerPhone: "010-1234-5678",
  product: { title: "모바일 청첩장", productId: "507f1f77bcf86cd799439011" },
  userId: "507f1f77bcf86cd799439099",
});

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuth).mockResolvedValue({
      userId: "user-1",
      email: "hong@example.com",
      role: "USER",
    });
  });

  it("로그인하지 않았으면 로그인 페이지로 redirect하고 주문을 생성하지 않는다", async () => {
    vi.mocked(getAuth).mockResolvedValue(null);

    await expect(createOrder(null, buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirect).toHaveBeenCalledWith(ROUTES.login);
    expect(createOrderForCurrentUserService).not.toHaveBeenCalled();
  });

  it("입력값이 유효하지 않으면 VALIDATION 오류를 반환하고 서비스를 호출하지 않는다", async () => {
    const result = await createOrder(
      null,
      buildFormData({ buyerEmail: "invalid-email" }),
    );

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값이 올바르지 않습니다.",
        fieldErrors: expect.objectContaining({
          buyerEmail: expect.any(Array),
        }),
      },
    });
    expect(createOrderForCurrentUserService).not.toHaveBeenCalled();
  });

  it("실물 카테고리인데 배송 정보가 없으면 VALIDATION 오류를 반환하고 서비스를 호출하지 않는다", async () => {
    const result = await createOrder(
      null,
      buildFormData({ productCategory: "favor" }),
    );

    expect(result).toMatchObject({
      success: false,
      error: { category: "VALIDATION" },
    });
    expect(createOrderForCurrentUserService).not.toHaveBeenCalled();
  });

  it("모바일초대장 카테고리는 배송 정보 없이도 통과해 정규화한 입력을 서비스에 전달한다", async () => {
    vi.mocked(createOrderForCurrentUserService).mockResolvedValue(
      buildOrder() as never,
    );

    await createOrder(null, buildFormData());

    expect(createOrderForCurrentUserService).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerName: "홍길동",
        buyerEmail: "hong@example.com",
        buyerPhone: "010-1234-5678",
        payMethod: "CARD",
        shipping: undefined,
        product: expect.objectContaining({
          productId: "507f1f77bcf86cd799439011",
          category: "mobile-invitation",
          quantity: 1,
          selectedFeatures: [],
        }),
      }),
    );
  });

  it("실물 카테고리에 배송 정보를 채우면 shipping을 그대로 서비스에 전달한다", async () => {
    vi.mocked(createOrderForCurrentUserService).mockResolvedValue(
      buildOrder() as never,
    );

    await createOrder(
      null,
      buildFormData({
        productCategory: "favor",
        shippingReceiver: "홍길동",
        shippingPhone: "010-1234-5678",
        ship_address: "서울시 강남구",
        ship_address_detail: "101동 101호",
      }),
    );

    expect(createOrderForCurrentUserService).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping: {
          receiver: "홍길동",
          phone: "010-1234-5678",
          address: "서울시 강남구",
          addressDetail: "101동 101호",
        },
      }),
    );
  });

  it("정상 입력이면 서비스 결과를 반환 계약으로 변환한다", async () => {
    vi.mocked(createOrderForCurrentUserService).mockResolvedValue(
      buildOrder() as never,
    );

    const result = await createOrder(null, buildFormData());

    expect(result).toEqual({
      success: true,
      data: {
        merchantUid: "ORDER-1",
        finalPrice: 9000,
        payMethod: "CARD",
        buyerName: "홍길동",
        buyerEmail: "hong@example.com",
        buyerPhone: "010-1234-5678",
        title: "모바일 청첩장",
        userId: "507f1f77bcf86cd799439099",
        productId: "507f1f77bcf86cd799439011",
        message: "주문이 성공적으로 생성되었습니다. 결제를 진행해주세요.",
      },
    });
  });

  it("서비스가 AppError를 던지면 실패 응답으로 변환한다", async () => {
    vi.mocked(createOrderForCurrentUserService).mockRejectedValue(
      new AppError("NOT_FOUND", "상품을 찾을 수 없습니다."),
    );

    const result = await createOrder(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "상품을 찾을 수 없습니다.",
        fieldErrors: undefined,
      },
    });
  });
});
