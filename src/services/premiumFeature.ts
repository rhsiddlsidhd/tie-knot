import "server-only";
import type { FeatureDocument } from "@/models/feature.model";
import { FeatureModel } from "@/models/feature.model";
import type { PremiumFeatureDto } from "@/core/schemas/request/premiumFeature.schema";
import type {
  AdminPremiumFeatureListPage,
  PremiumFeature,
} from "@/core/domain/premium-feature";
import { AppError } from "@/core/domain/error";
import { DEFAULT_PAGE_SIZE } from "@/core/domain/cursor";
import {
  decodeCursor,
  encodeCursor,
  isValidPageLimit,
} from "@/core/utils/cursor";
import { dbConnect } from "@/db/connect";

import mongoose from "mongoose";
import { requireAdmin } from "./auth";
// FeatureJSON을 재사용
// Mapper 함수: DB 결과를 PremiumFeature로 변환
const mapToPremiumFeature = (doc: FeatureDocument): PremiumFeature => ({
  _id: String(doc._id),
  code: doc.code,
  label: doc.label,
  description: doc.description ?? "",
  additionalPrice: doc.additionalPrice,
  isActive: doc.isActive,
  createdAt: doc.createdAt.toISOString(),
});

const createPremiumFeatureService = async (data: PremiumFeatureDto) => {
  await dbConnect();
  const newFeatureModel = await new FeatureModel(data).save();
  return newFeatureModel;
};

const getAllPremiumFeatureService = async (): Promise<PremiumFeature[]> => {
  await dbConnect();
  const features = await FeatureModel.find().lean<FeatureDocument[]>();
  return features.map(mapToPremiumFeature);
};

type AdminPremiumFeatureListQuery = {
  cursor?: string;
  limit?: number;
};

/**
 * 관리자 프리미엄 기능 목록 한 페이지 — 정렬·커서 계약(createdAt desc, _id tie-break,
 * limit+1 조회로 다음 페이지 판정)은 다른 admin 목록과 동일하다. 전체 목록이 필요한
 * 소비처(상품 등록 폼, `/api/premium-features`)는 페이징 없는 getAllPremiumFeatureService를 쓴다.
 */
const getAdminPremiumFeaturesPageService = async ({
  cursor,
  limit = DEFAULT_PAGE_SIZE,
}: AdminPremiumFeatureListQuery): Promise<AdminPremiumFeatureListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }

  const filter: mongoose.FilterQuery<FeatureDocument> = {};

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
      },
    ];
  }

  const found = await FeatureModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<FeatureDocument[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error
          ? err.message
          : "프리미엄 기능 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const features = hasMore ? found.slice(0, limit) : found;
  const lastFeature = features.at(-1);

  return {
    items: features.map(mapToPremiumFeature),
    nextCursor:
      hasMore && lastFeature
        ? encodeCursor({
            createdAt: lastFeature.createdAt,
            id: lastFeature._id.toString(),
          })
        : null,
  };
};

const getPremiumFeatureService = async (ids: string[] | []) => {
  if (ids.length === 0) return [];
  await dbConnect();
  const _ids = ids
    .filter((id) => mongoose.isObjectIdOrHexString(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const features = await FeatureModel.find({ _id: { $in: _ids } }).lean<
    FeatureDocument[]
  >();
  return features.map(mapToPremiumFeature);
};

const updatePremiumFeatureService = async (
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

const createPremiumFeatureAsAdminService = async (
  data: PremiumFeatureDto,
): Promise<void> => {
  await requireAdmin();
  await createPremiumFeatureService(data);
};

const updatePremiumFeatureAsAdminService = async (
  id: string,
  data: PremiumFeatureDto,
): Promise<void> => {
  await requireAdmin();
  if (!(await updatePremiumFeatureService(id, data))) {
    throw new AppError("NOT_FOUND", "프리미엄 기능을 찾을 수 없습니다.");
  }
};

export {
  createPremiumFeatureService,
  getAdminPremiumFeaturesPageService,
  getAllPremiumFeatureService,
  getPremiumFeatureService,
  updatePremiumFeatureService,
  createPremiumFeatureAsAdminService,
  updatePremiumFeatureAsAdminService,
};
