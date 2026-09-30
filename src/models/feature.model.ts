import "server-only";
import type { Types, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

// toJSON() 반환 타입 정의

interface FeatureDocument {
  _id: Types.ObjectId;
  code: string;
  label: string; // 관리자/프론트용 이름
  description?: string; // 기능 설명
  additionalPrice: number; // 추가 요금
  isActive: boolean; // 활성화 여부
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema<FeatureDocument>(
  {
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: String,
    additionalPrice: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// 관리자 프리미엄 기능 목록의 활성 여부(status) 필터 전용 — 컬렉션이 작아 필수는
// 아니지만, 이 저장소 admin 목록 index 컨벤션(equality → 정렬) 일관성을 위해 둔다.
FeatureSchema.index({ isActive: 1, createdAt: -1, _id: -1 });

const FeatureModel =
  (mongoose.models.Feature as Model<FeatureDocument>) ||
  mongoose.model<FeatureDocument>("Feature", FeatureSchema);

export { FeatureModel, type FeatureDocument };
