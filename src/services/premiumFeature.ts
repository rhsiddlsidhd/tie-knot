import "server-only";
import type { IFeature } from "@/models/feature.model";
import { FeatureModel } from "@/models/feature.model";
import type { PremiumFeatureDto } from "@/core/schemas/request/premiumFeature.schema";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { AppError } from "@/core/domain/error";
export type { PremiumFeature } from "@/core/domain/premium-feature";
import { dbConnect } from "@/db/connect";

import mongoose from "mongoose";
import { requireAdmin } from "./auth";
// FeatureJSON을 재사용
// Mapper 함수: DB 결과를 PremiumFeature로 변환
const mapToPremiumFeature = (doc: IFeature): PremiumFeature => ({
  _id: String(doc._id),
  code: doc.code,
  label: doc.label,
  description: doc.description ?? "",
  additionalPrice: doc.additionalPrice,
  isActive: doc.isActive,
  createdAt: doc.createdAt.toISOString(),
});

export const createPremiumFeatureService = async (
  data: PremiumFeatureDto,
) => {
  await dbConnect();
  const newFeatureModel = await new FeatureModel(data).save();
  return newFeatureModel;
};

export const getAllPremiumFeatureService = async (): Promise<
  PremiumFeature[]
> => {
  await dbConnect();
  const features = await FeatureModel.find().lean<IFeature[]>();
  return features.map(mapToPremiumFeature);
};

export const getPremiumFeatureService = async (ids: string[] | []) => {
  if (ids.length === 0) return [];
  await dbConnect();
  const _ids = ids
    .filter((id) => mongoose.isObjectIdOrHexString(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const features = await FeatureModel.find({ _id: { $in: _ids } }).lean<
    IFeature[]
  >();
  return features.map(mapToPremiumFeature);
};

export const updatePremiumFeatureService = async (
  id: string,
  data: PremiumFeatureDto,
) => {
  await dbConnect();

  const updatedFeature = await FeatureModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

  return updatedFeature;
};

export async function createPremiumFeatureAsAdminService(
  data: PremiumFeatureDto,
): Promise<void> {
  await requireAdmin();
  await createPremiumFeatureService(data);
}

export async function updatePremiumFeatureAsAdminService(
  id: string,
  data: PremiumFeatureDto,
): Promise<void> {
  await requireAdmin();
  if (!(await updatePremiumFeatureService(id, data))) {
    throw new AppError(
      "NOT_FOUND",
      "프리미엄 기능을 찾을 수 없습니다.",
    );
  }
}
