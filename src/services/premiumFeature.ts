import "server-only";
import type { FeatureDocument } from "@/models/feature.model";
import { FeatureModel } from "@/models/feature.model";
import { ProductModel } from "@/models/product.model";
import type { PremiumFeatureDto } from "@/core/schemas/request/premiumFeature.schema";
import type {
  AdminPremiumFeatureListPage,
  AdminPremiumFeatureSortKey,
  AdminPremiumFeatureStatusFilter,
  PremiumFeature,
} from "@/core/domain/premium-feature";
import { ADMIN_PREMIUM_FEATURE_SORT_KEYS } from "@/core/domain/premium-feature";
import { AppError } from "@/core/domain/error";
import { DEFAULT_PAGE_SIZE } from "@/core/domain/cursor";
import { isValidPageLimit } from "@/core/utils/cursor";
import { escapeRegExp } from "@/core/utils/escape-regexp";
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

/**
 * 신규 상품에 붙일 수 있는 기능만 — `isActive: false`는 "더 이상 새로 붙이지 않는다"는
 * 뜻이다. 이 필터는 상품 등록 폼 경로에만 쓴다. `getAllPremiumFeatureService`와
 * `/api/premium-features`는 전체를 그대로 돌려줘야 한다 — 고객 "특별 옵션" 필터에서
 * 배지가 사라지면 등록 중단된 기능을 가진 상품(계속 팔리는 중)을 걸러낼 수 없고,
 * 관리자 상품 수정 다이얼로그에서 목록이 좁아지면 이미 붙어 있던 기능이 저장 시
 * 조용히 빠진다.
 */
const getSelectablePremiumFeatureService = async (): Promise<
  PremiumFeature[]
> => {
  await dbConnect();
  const features = await FeatureModel.find({ isActive: true }).lean<
    FeatureDocument[]
  >();
  return features.map(mapToPremiumFeature);
};

type AdminPremiumFeatureListQuery = {
  q?: string;
  status?: AdminPremiumFeatureStatusFilter;
  page?: number;
  limit?: number;
  sort?: AdminPremiumFeatureSortKey;
  direction?: "asc" | "desc";
};

/**
 * 관리자 프리미엄 기능 목록 한 페이지. 전체 목록이 필요한 소비처(상품 등록 폼,
 * `/api/premium-features`)는 페이징 없는 getAllPremiumFeatureService를 쓴다.
 */
const getAdminPremiumFeaturesPageService = async ({
  q,
  status,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  sort = "createdAt",
  direction = "desc",
}: AdminPremiumFeatureListQuery): Promise<AdminPremiumFeatureListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit) || !Number.isInteger(page) || page < 1) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (!ADMIN_PREMIUM_FEATURE_SORT_KEYS.includes(sort)) {
    throw new AppError("VALIDATION", "잘못된 정렬 기준입니다.");
  }
  if (direction !== "asc" && direction !== "desc") {
    throw new AppError("VALIDATION", "잘못된 정렬 방향입니다.");
  }

  const filter: mongoose.FilterQuery<FeatureDocument> = {};

  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  const conditions: mongoose.FilterQuery<FeatureDocument>[] = [];

  const term = q?.trim();
  if (term) {
    conditions.push({
      $or: [
        { code: { $regex: escapeRegExp(term), $options: "i" } },
        { label: { $regex: escapeRegExp(term), $options: "i" } },
      ],
    });
  }

  if (conditions.length > 0) {
    filter.$and = conditions;
  }

  const sortDirection = direction === "asc" ? 1 : -1;
  const [features, total] = await Promise.all([
    FeatureModel.find(filter)
      .sort({ [sort]: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<FeatureDocument[]>(),
    FeatureModel.countDocuments(filter),
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error
        ? err.message
        : "프리미엄 기능 목록 조회에 실패했습니다.",
    );
  });

  return {
    items: features.map(mapToPremiumFeature),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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

// 차단 메시지에 상품명을 몇 개까지 나열할지 — 나머지는 건수로 요약한다.
const REFERENCING_PRODUCT_PREVIEW_LIMIT = 3;

/**
 * 프리미엄 기능 하드 삭제. 주문은 `selectedFeatures`에 code/label/price를 스냅샷으로
 * 갖고 있어 과거 이력은 삭제에 영향받지 않는다.
 *
 * 참조하는 상품이 하나라도 있으면 지우지 않는다 — 어떤 상품의 마지막 기능을 지우면
 * 그 상품은 `isPremium`인데 `featureIds`가 비어 `product.schema`의 refine을 통과하지
 * 못해 이후 수정 저장이 전부 막힌다. 휴지통(deletedAt) 상품도 참조로 센다 — 복구하면
 * 같은 상태로 되살아나기 때문이다.
 */
const deletePremiumFeatureService = async (
  featureId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(featureId)) {
    return false;
  }

  const referencingCount = await ProductModel.countDocuments({
    featureIds: featureId,
  });

  if (referencingCount > 0) {
    const preview = await ProductModel.find({ featureIds: featureId })
      .select("title")
      .limit(REFERENCING_PRODUCT_PREVIEW_LIMIT)
      .lean<{ title: string }[]>();
    const titles = preview.map((product) => `"${product.title}"`).join(", ");
    const rest = referencingCount - preview.length;

    throw new AppError(
      "VALIDATION",
      `이 기능을 사용 중인 상품이 있어 삭제할 수 없습니다: ${titles}${
        rest > 0 ? ` 외 ${rest}건` : ""
      }`,
    );
  }

  const deletedFeature = await FeatureModel.findByIdAndDelete(featureId).catch(
    (err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error
          ? err.message
          : "프리미엄 기능 삭제에 실패했습니다.",
      );
    },
  );

  return !!deletedFeature;
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

const deletePremiumFeatureAsAdminService = async (
  featureId: string,
): Promise<void> => {
  await requireAdmin();
  if (!(await deletePremiumFeatureService(featureId))) {
    throw new AppError("NOT_FOUND", "프리미엄 기능을 찾을 수 없습니다.");
  }
};

export {
  createPremiumFeatureService,
  deletePremiumFeatureService,
  getAdminPremiumFeaturesPageService,
  getAllPremiumFeatureService,
  getPremiumFeatureService,
  getSelectablePremiumFeatureService,
  updatePremiumFeatureService,
  createPremiumFeatureAsAdminService,
  updatePremiumFeatureAsAdminService,
  deletePremiumFeatureAsAdminService,
};
