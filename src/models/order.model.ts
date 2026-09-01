import "server-only";
import type { Types, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";
import type { PayMethod, ProductCategory } from "@/core/domain";
import { PAY_METHOD, PRODUCT_CATEGORIES } from "@/core/domain";
import { categoryRequiresShipping } from "@/core/utils";
export type { OrderJSON } from "@/core/domain";
interface ProductPricing {
  originalPrice: number;
  discountedPrice: number;
}
interface SelectedFeatureSnapShot {
  featureId: Types.ObjectId | string;
  code: string;
  label: string;
  price: number;
}

interface ProductSnapShot {
  productId: Types.ObjectId | string;
  title: string;
  thumbnail: string;
  category: ProductCategory;
  pricing: ProductPricing;
  quantity: number;
  selectedFeatures: SelectedFeatureSnapShot[];
}

export interface ShippingInfo {
  receiver: string;
  phone: string;
  address: string;
  addressDetail: string;
}

const selectedFeatureSnapShotSchema = new Schema<SelectedFeatureSnapShot>(
  {
    featureId: {
      type: Schema.Types.ObjectId,
      ref: "Feature",
      required: true,
    },
    code: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  {
    _id: false,
  },
);

const ProductSnapShotSchema = new Schema<ProductSnapShot>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    thumbnail: { type: String, required: true },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    pricing: {
      originalPrice: { type: Number, required: true },
      discountedPrice: {
        type: Number,
        required: true,
      },
    },
    quantity: { type: Number, required: true, default: 1 },
    selectedFeatures: {
      type: [selectedFeatureSnapShotSchema],
      default: [],
    },
  },
  { _id: false },
);

const ShippingInfoSchema = new Schema<ShippingInfo>(
  {
    receiver: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    addressDetail: { type: String, required: true },
  },
  { _id: false },
);

const ORDER_STATUS = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatusType = (typeof ORDER_STATUS)[number];

export interface IOrder {
  _id: Types.ObjectId;
  merchantUid: string;
  userId: Types.ObjectId | string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  product: ProductSnapShot;
  // 모바일초대장 카테고리는 배송이 필요 없어 없을 수 있다 — required 여부는
  // orderSchema.shipping의 conditional required(형제 필드 product.category 참조)가 정한다.
  shipping?: ShippingInfo;
  finalPrice: number;
  discountRate: number;
  discountAmount: number;
  payMethod: PayMethod;
  orderStatus: OrderStatusType;
  paymentId?: Types.ObjectId | string;
  // 결제 완료(CONFIRMED 전이) 시각 — coupleInfo 미입력 주문 자동취소 기한 계산용.
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    // 식별자
    merchantUid: { type: String, required: true, unique: true },
    // 구매자
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // getOrdersByUserId가 이 필드로 조회한다
    },

    // 공통 Dto
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },

    // 상품정보
    product: { type: ProductSnapShotSchema, required: true },
    // 실물 카테고리 주문의 최후 방어선 — createOrderService가 1차로 사용자에게
    // 보이는 VALIDATION 에러를 던지고, 여기는 그 체크를 우회하는 미래의 다른
    // 코드 경로까지 막는 안전망이다(도달하면 버그이므로 mongoose 에러 그대로
    // AppError(INTERNAL)로 감싸지는 게 맞다 — services/AGENTS.md 컨벤션).
    //
    // discriminator로 안 뺀 이유(AGENTS.md 하위타입 전용 필드 규칙 검토 결과):
    // (1) 판별 필드(product.category)가 base 스키마의 root path가 아니라 product
    // 서브도큐먼트 안에 있어 mongoose discriminatorKey로 재사용할 수 없다.
    // (2) 5개 카테고리 중 4개가 이 필드를 요구해 "하위 타입 전용 필드"라기보다
    // "한 카테고리만 예외인 필드"에 가깝다 — discriminator로 쪼개도 예외 카테고리
    // (mobile-invitation) 하나만 shipping 없는 서브타입이 되어 얻는 이득이 적다.
    shipping: {
      type: ShippingInfoSchema,
      required: function (this: IOrder) {
        return categoryRequiresShipping(this.product.category);
      },
    },
    finalPrice: { type: Number, required: true },
    discountRate: { type: Number, default: 0, min: 0, max: 1 },
    discountAmount: { type: Number, default: 0 },

    // 결제 수단
    payMethod: {
      type: String,
      enum: PAY_METHOD,
      required: true,
    },

    // 주문 상태
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
      default: "PENDING",
    },

    // 결제 참조
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    // 이력
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
    },
  },
);

// my-orders 목록은 (유저 + 상태 필터) 조건에 createdAt 내림차순 커서 페이징을 얹는다 —
// 상태 필터가 걸린 조회가 정렬까지 인덱스로 처리되도록 복합 인덱스를 둔다.
orderSchema.index({ userId: 1, orderStatus: 1, createdAt: -1 });

// 스케줄러 배치(/api/cron/expired-orders) 전용 — 배치 쿼리는 userId 필터가 없어
// 위 인덱스의 선두 필드를 못 쓴다(안 붙이면 COLLSCAN). sparse는 붙이지 않는다 —
// paymentId: null 쿼리가 필드 누락 문서와도 매칭돼야 하는데 sparse면 그 문서들이
// 인덱스에서 빠진다.
orderSchema.index({ orderStatus: 1, paymentId: 1, createdAt: 1 }); // findExpiredPendingOrdersForAllUsers
orderSchema.index({ orderStatus: 1, confirmedAt: 1 }); // findExpiredAwaitingInvitationOrdersForAllUsers

// 관리자 대시보드 "최근 주문" + 관리자 전역 주문 목록(상태 필터 없음) 전용 — 둘 다
// 위 복합 인덱스(선두 필드가 userId/orderStatus)를 못 쓴다. _id를 tie-break로
// 포함해 getAdminOrdersPageService의 (createdAt desc, _id desc) 정렬을 전부
// 인덱스로 커버한다 — createdAt만 있으면 같은 createdAt인 문서들의 _id 정렬은
// blocking in-memory SORT로 떨어진다(32MB 상한에 걸리면 쿼리 자체가 실패한다).
orderSchema.index({ createdAt: -1, _id: -1 });

// 관리자 전역 주문 목록의 상태 필터 조회 전용 — 위 { userId, orderStatus, createdAt }
// 인덱스는 선두가 userId라 소유자 스코프 없는 전역 상태 필터 조회엔 못 쓴다.
orderSchema.index({ orderStatus: 1, createdAt: -1, _id: -1 });

export const OrderModel =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);
