import "server-only";
import type { Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface ReviewDB {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  content: string;
  images: string[];
}

export interface IReview extends ReviewDB {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 실구매 인증 리뷰 — 주문 하나당 리뷰 하나로 제한한다(아래 unique 인덱스).
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

// 상품 상세의 리뷰 목록(최신순) 조회 전용.
reviewSchema.index({ productId: 1, createdAt: -1 });

// 주문 하나당 리뷰 1개만 허용 — 중복 작성 방지 + "이 주문 이미 리뷰 썼는지" 조회도 겸한다.
reviewSchema.index({ orderId: 1 }, { unique: true });

export const ReviewModel =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);
