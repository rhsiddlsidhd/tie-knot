import "server-only";
import type { IFeature } from "@/server/models";
import { FeatureModel } from "@/server/models";
import type { PremiumFeatureDto } from "@/shared/schemas";
import type { PremiumFeature } from "@/shared/types";
import { dbConnect } from "@/server/lib/mongodb";

import mongoose from "mongoose";
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
