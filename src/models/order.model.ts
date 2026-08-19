import "server-only";
import type { Types, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";
import type { PayMethod } from "@/core/domain";
import { PAY_METHOD } from "@/core/domain";
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
  pricing: ProductPricing;
  quantity: number;
  selectedFeatures: SelectedFeatureSnapShot[];
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

export const OrderModel =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);
