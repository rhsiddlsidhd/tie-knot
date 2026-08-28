import { PAY_METHOD, PRODUCT_CATEGORIES } from "@/core/domain";
import * as z from "zod";

export const ShippingInfoSchema = z.object({
  receiver: z.string().min(2, "받는 분 이름은 2자 이상 입력해주세요."),
  phone: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
    message: "연락처 형식이 올바르지 않습니다.",
  }),
  address: z.string().min(1, "주소를 입력해주세요."),
  addressDetail: z.string().min(1, "상세 주소를 입력해주세요."),
});

export const BuyerInfoSchema = z.object({
  buyerName: z.string().min(2, { message: "이름은 2자 이상 입력해주세요." }),
  buyerEmail: z.string().email({ message: "유효한 이메일을 입력해주세요." }),
  buyerPhone: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
    message: "연락처 형식이 올바르지 않습니다.",
  }),
  payMethod: z.enum(PAY_METHOD, {
    message: "결제 수단을 선택해주세요.",
  }),
});

const SelectedFeatureSchema = z.object({
  featureId: z.string().min(1, "옵션 ID가 필요합니다."),
  label: z.string().min(1, "옵션 이름이 필요합니다."),
  price: z.number().min(0, "가격은 0 이상이어야 합니다."),
  code: z.string().min(1, "옵션 코드가 필요합니다."),
});

const ProductSnapshotSchema = z.object({
  productId: z.string().min(1, "상품 ID가 필요합니다."),
  title: z.string().min(1, "상품명은 필수입니다."),
  thumbnail: z.string().url("유효한 이미지 경로가 필요합니다."),
  category: z.enum(PRODUCT_CATEGORIES),
  pricing: z.object({
    originalPrice: z.number().min(0),
    discountedPrice: z.number().min(0),
  }),
  quantity: z.number().min(1).default(1),
  selectedFeatures: z.array(SelectedFeatureSchema).default([]),
});

export const createOrderSchema = BuyerInfoSchema.extend({
  // 결제 이후 my-orders 흐름에서 채워지는 콘텐츠라 주문 생성 시점엔 없을 수 있다.
  buyerName: z.string().min(2, "이름은 2자 이상 입력해주세요."),
  buyerEmail: z.email("유효한 이메일을 입력해주세요."),
  buyerPhone: z
    .string()
    .regex(/^\d{3}-\d{3,4}-\d{4}$/, "연락처 형식이 올바르지 않습니다."),

  // 평면적인 필드들을 'product' 객체로 묶음
  product: ProductSnapshotSchema,

  payMethod: z.enum(PAY_METHOD, { message: "결제 수단을 선택해주세요." }),

  // 할인은 옵션일 수 있으므로 0을 기본값으로
  discountRate: z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).default(0),

  // 실물 카테고리만 필수 — 모바일초대장은 배송이 필요 없어 폼에 입력 자체가 없다.
  // "카테고리별 필수 여부"라는 교차 필드 규칙은 여기서 강제하지 않고 서비스
  // 레이어(createOrderService)가 맡는다(REQ-5 수량 검증과 같은 패턴).
  shipping: ShippingInfoSchema.optional(),
});

export type SelectFeatureDto = z.infer<typeof SelectedFeatureSchema>;
export type BuyerInfo = z.infer<typeof BuyerInfoSchema>;
export type ShippingInfo = z.infer<typeof ShippingInfoSchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
