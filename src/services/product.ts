import "server-only";
import type { ProductJSON, ProductDB, IProduct } from "@/models";
import { ProductModel, MobileInvitationProductModel } from "@/models";
import type { ProductDto } from "@/core/schemas";
import { dbConnect } from "@/db";
import {
  calculatePrice,
  decodeCursor,
  encodeCursor,
  escapeRegExp,
  findProductCategoriesByTerm,
  findSubCategoriesByTerm,
  isValidPageLimit,
} from "@/core/utils";
import { AppError } from "@/core/domain";
import type {
  AdminProductListPage,
  AvailableSubCategory,
  InvitationTheme,
  ProductCategory,
} from "@/core/domain";
import {
  DEFAULT_PAGE_SIZE,
  MOBILE_INVITATION_CATEGORY,
  POPULAR_PRODUCTS_LIMIT,
  PRODUCT_CATEGORIES,
  SUB_CATEGORY_MAP,
} from "@/core/domain";
import type { Model, Types } from "mongoose";
import mongoose from "mongoose";
import { requireAdmin, requireAuth } from "./auth";
import { deleteProductAsset } from "@/adapters/server/cloudinary/cleanup";
import { extractPublicId } from "@/adapters/server/cloudinary/publicId";

// Product 타입을 export (다른 파일에서 사용)
export type Product = ProductJSON;

type ProductUploadInput = ProductDto & {
  previewUrl?: string;
  currentPreviewUrl?: string;
};

type LeanProduct = ProductDB & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  previewUrl?: string;
  theme?: InvitationTheme;
  __v?: number;
};

// previewUrl은 mobile-invitation 카테고리 discriminator 전용 필드라 base ProductModel로
// 쓰면 strict 모드에 의해 조용히 버려진다 — 생성/수정 시 카테고리별로 모델을 골라야 한다.
// Model<IProduct>로 통일해서 리턴한다 — discriminator Model과 base Model의 union을
// 그대로 리턴하면 오버로드 시그니처가 갈라져 findOneAndUpdate 호출이 막힌다.
const getWritableProductModel = (category: string): Model<IProduct> =>
  category === MOBILE_INVITATION_CATEGORY
    ? (MobileInvitationProductModel as Model<IProduct>)
    : ProductModel;

const transformProduct = (product: LeanProduct, userId?: string): ProductJSON => {
  const { deletedAt, _id, featureIds, likes, createdAt, updatedAt, ...rest } = product;

  return {
    ...rest,
    _id: _id.toString(),
    likes: likes?.map((id) => id.toString()) || [],
    featureIds: featureIds?.map((id) => id.toString()) || [],
    isLiked: userId
      ? (likes || []).some((id) => id.toString() === userId)
      : false,
    discountedPrice: calculatePrice(product.price, product.discount),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: deletedAt ? deletedAt.toISOString() : null,
  };
};

// REQ-5(주문 수량 검증) 전용 — 클라이언트가 보낸 minQuantity/maxQuantity를 신뢰하지 않고
// order.service가 이 함수로 DB를 재조회한다.
export const getProductQuantityBoundsService = async (
  productId: string,
): Promise<{ minQuantity: number; maxQuantity: number } | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const product = await ProductModel.findOne({ _id: productId, deletedAt: null })
    .select("minQuantity maxQuantity")
    .lean();

  if (!product) return null;

  return {
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
  };
};

// 상품생성
export const createProductService = async (
  data: Omit<ProductDto, "thumbnail" | "images"> & {
    thumbnail: string;
    images: string[];
    authorId: string;
    previewUrl?: string;
  },
): Promise<boolean> => {
  await dbConnect();

  const WritableProductModel = getWritableProductModel(data.category);

  const newProduct = await new WritableProductModel({
    ...data,
    status: data.status || "active",
    featureIds:
      data.isPremium && data.featureIds
        ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
        : [],
  })
    .save()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "상품 등록에 실패했습니다.",
      );
    });

  return !!newProduct;
};

// 단일 상품 조회
export const getProductService = async (
  productId: string,
  userId?: string,
): Promise<ProductJSON | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).lean();

  return product ? transformProduct(product, userId) : null;
};

// 상품 상세페이지 방문 시 조회수 증가 — getProductService에는 안 넣는다.
// payment.service.ts(결제 검증용 조회)와 (main)/page.tsx(고정 미리보기)도
// getProductService를 호출하는데 그 두 호출까지 조회수로 잡히면 안 되기 때문.
export const incrementProductViewsService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const updated = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    { $inc: { views: 1 } },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "조회수 갱신에 실패했습니다.",
    );
  });

  return !!updated;
};

// 모든 상품 조회 — view="trash"는 admin 휴지통 전용, 소프트 삭제된(deletedAt 존재) 상품만 리턴한다.
export const getAllProductsService = async (
  category?: string,
  userId?: string,
  view: "active" | "trash" = "active",
): Promise<ProductJSON[]> => {
  await dbConnect();

  const query: Record<string, unknown> =
    view === "trash" ? { deletedAt: { $ne: null } } : { deletedAt: null };
  if (category) {
    query.category = category;
  }

  const products = await ProductModel.find(query)
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};

type AdminProductListQuery = {
  view?: "active" | "trash";
  cursor?: string;
  limit?: number;
};

/**
 * 관리자 상품 목록 한 페이지 — orders/users(getAdminOrdersPageService,
 * getAdminUsersPageService)와 동일한 cursor 계약(createdAt desc, _id tie-break,
 * limit+1)을 쓴다. getAllProductsService와 달리 isFeatured/priority 정렬을 쓰지
 * 않는다 — 그 정렬은 공개 노출 우선순위 의미라 관리자 목록의 커서 안정성과 맞지 않는다.
 */
export const getAdminProductsPageService = async ({
  view = "active",
  cursor,
  limit = DEFAULT_PAGE_SIZE,
}: AdminProductListQuery): Promise<AdminProductListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }

  const filter: Record<string, unknown> =
    view === "trash" ? { deletedAt: { $ne: null } } : { deletedAt: null };

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

  const found = await ProductModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<LeanProduct[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "상품 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const products = hasMore ? found.slice(0, limit) : found;
  const lastProduct = products.at(-1);

  return {
    items: products.map((product) => transformProduct(product)),
    nextCursor:
      hasMore && lastProduct
        ? encodeCursor({
            createdAt: lastProduct.createdAt,
            id: lastProduct._id.toString(),
          })
        : null,
  };
};

// 공개 상품 목록 — 관리자용 getAllProductsService와 달리 판매 가능한 active 상품만 노출한다.
export const getPublicProductsService = async (
  category?: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  const query: Record<string, unknown> = { deletedAt: null, status: "active" };
  if (category) query.category = category;

  const products = await ProductModel.find(query)
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "공개 상품 조회에 실패했습니다.",
      );
    });

  return products.map((product) => transformProduct(product, userId));
};

// 공개 상품이 하나 이상 있는 유효 pair만 코드 taxonomy 순서로 반환한다.
export const getAvailableSubCategoriesService = async (
  category?: ProductCategory,
): Promise<AvailableSubCategory[]> => {
  await dbConnect();

  const match: Record<string, unknown> = { deletedAt: null, status: "active" };
  if (category) match.category = category;

  const pairs = await ProductModel.aggregate<{
    _id: { category: string; subCategory: string };
  }>([
    { $match: match },
    { $group: { _id: { category: "$category", subCategory: "$subCategory" } } },
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error
        ? err.message
        : "사용 가능한 서브카테고리 조회에 실패했습니다.",
    );
  });

  const availablePairs = new Set(
    pairs.map(({ _id }) => `${_id.category}:${_id.subCategory}`),
  );
  const categories: readonly ProductCategory[] = category
    ? [category]
    : PRODUCT_CATEGORIES;

  return categories.flatMap((currentCategory) =>
    SUB_CATEGORY_MAP[currentCategory]
      .filter((subCategory) =>
        availablePairs.has(`${currentCategory}:${subCategory}`),
      )
      .map((subCategory) => ({ category: currentCategory, subCategory })),
  );
};

// 상품 검색 — title 부분일치(대소문자 무시) OR 카테고리/서브카테고리 라벨 부분일치(역조회 후 $in).
// q가 없거나 공백뿐이면 DB를 치지 않고 즉시 빈 배열을 리턴한다 — 빈 $or는 MongoDB가 reject한다.
export const searchProductsService = async (
  q?: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  const term = q?.trim();

  if (!term) return [];

  const or: Record<string, unknown>[] = [
    { title: { $regex: escapeRegExp(term), $options: "i" } },
  ];

  const categoryKeys = findProductCategoriesByTerm(term);
  if (categoryKeys.length > 0) {
    or.push({ category: { $in: categoryKeys } });
  }

  const subCategoryKeys = findSubCategoriesByTerm(term);
  if (subCategoryKeys.length > 0) {
    or.push({ subCategory: { $in: subCategoryKeys } });
  }

  await dbConnect();

  const products = await ProductModel.find({
    deletedAt: null,
    status: "active",
    $or: or,
  })
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};

/**
 * 특정 카테고리에서 우선순위(priority)가 1 이상인 추천 템플릿들을 조회합니다.
 */
export const getFeaturedTemplatesService = async (
  category: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  const products = await ProductModel.find({
    category,
    priority: { $gte: 1 },
    status: "active",
    deletedAt: null,
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};

// Home 인기 상품 섹션 — 좋아요 수(likes.length) 내림차순 Top N 조회.
// 배열 길이 정렬은 find().sort()로 불가능해 aggregation을 쓴다(01_db_schema.md §2-1).
export const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  // $limit은 0 이하를 받으면 빈 배열이 아니라 MongoServerError를 던진다 — 서비스가 방어한다.
  const take = Math.min(Math.max(Math.trunc(limit), 1), 50);

  // 파이프라인은 함수 안에서 매번 새 배열 리터럴로 만든다(모듈 상수로 빼지 않는다) —
  // mongoose가 discriminator 모델 aggregate 시 첫 $match를 직접 mutate하므로,
  // 상수로 빼면 discriminator 호출 한 번에 이후 모든 호출이 오염된다.
  const products = await ProductModel.aggregate<LeanProduct>([
    {
      $match: {
        deletedAt: null,
        status: "active",
        "likes.0": { $exists: true },
      },
    },
    // $ifNull은 방어적 중복이지만 유지한다 — $size는 인자가 missing이면 null이 아니라 에러(Location17124)를 던진다.
    { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
    { $sort: { likesCount: -1, isFeatured: -1, priority: -1, createdAt: -1, _id: -1 } },
    { $limit: take },
    { $unset: "likesCount" },
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "인기 상품 조회에 실패했습니다.",
    );
  });

  return products.map((p) => transformProduct(p, userId));
};

// 상품 업데이트
export const updateProductService = async (
  productId: string,
  data: Partial<Omit<ProductDto, "thumbnail" | "images">> & {
    thumbnail?: string;
    images?: string[];
    previewUrl?: string;
    isPremium?: boolean;
    featureIds?: string[];
  },
): Promise<ProductJSON | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const updateData = {
    ...data,
    featureIds:
      data.isPremium && data.featureIds
        ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
        : [],
  };

  const WritableProductModel = data.category
    ? getWritableProductModel(data.category)
    : ProductModel;

  const updatedProduct = await WritableProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    updateData,
    { new: true, lean: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 수정에 실패했습니다.",
    );
  });

  return updatedProduct ? transformProduct(updatedProduct) : null;
};

// 상품 삭제
export const deleteProductService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const deletedProduct = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    { status: "deleted", deletedAt: new Date() },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 삭제에 실패했습니다.",
    );
  });

  return !!deletedProduct;
};

// 상품 복구(휴지통 → 복원) — 항상 status를 "active"로 되돌린다. 삭제 전 상태
// (inactive/soldOut)는 보존하지 않는다 — 삭제와 복구를 대칭적인 명시 상태 전이로
// 고정해 "복구했더니 무슨 상태인지" 추측할 필요가 없게 한다(관계 정의 참고).
export const restoreProductService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const restoredProduct = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: { $ne: null } },
    { status: "active", deletedAt: null },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 복구에 실패했습니다.",
    );
  });

  return !!restoredProduct;
};

// 상품 영구 삭제(휴지통 전용) — 소프트 삭제(deletedAt 존재)된 상품만 대상이다.
// 복구 가능한 활성 상품의 이미지를 실수로 지우면 안 되므로, 소프트 삭제 시점이
// 아니라 이 시점에 Cloudinary 이미지 정리를 건다(#135, #136 관계 정의 참고).
// Cloudinary 정리가 실패하면 DB 문서를 지우지 않는다 — 고아 에셋보다 고아 문서(다시
// 삭제를 시도할 수 있음)가 낫다.
export const permanentlyDeleteProductService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: { $ne: null },
  })
    .select("thumbnail images")
    .lean();

  if (!product) return false;

  const publicIds = [...new Set(
    [product.thumbnail, ...product.images]
      .map((url) => extractPublicId(url))
      .filter((id): id is string => !!id),
  )];

  await Promise.all(publicIds.map((id) => deleteProductAsset(id)));

  const { deletedCount } = await ProductModel.deleteOne({
    _id: productId,
    deletedAt: { $ne: null },
  }).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 영구 삭제에 실패했습니다.",
    );
  });

  return deletedCount === 1;
};

// 상품 좋아요 토글
export const updateProductLikeService = async (
  productId: string,
  userId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).select("likes");

  if (!product) return false;

  const hasLiked = product.likes.some((id) => id.equals(userObjectId));

  const updated = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    hasLiked
      ? { $pull: { likes: userObjectId } }
      : { $addToSet: { likes: userObjectId } },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "좋아요 갱신에 실패했습니다.",
    );
  });

  return !!updated;
};

export async function createProductWorkflow(data: ProductUploadInput): Promise<void> {
  const { userId } = await requireAdmin();
  await createProductService({ ...data, authorId: userId });
}

export async function updateProductWorkflow(
  productId: string,
  data: ProductUploadInput,
): Promise<ProductJSON> {
  await requireAdmin();
  const updated = await updateProductService(productId, {
    ...data,
    previewUrl: data.previewUrl ?? data.currentPreviewUrl,
  });
  if (!updated) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
  return updated;
}

export async function deleteProductAsAdminService(productId: string): Promise<void> {
  await requireAdmin();
  if (!(await deleteProductService(productId))) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
}

export async function restoreProductAsAdminService(productId: string): Promise<void> {
  await requireAdmin();
  if (!(await restoreProductService(productId))) {
    throw new AppError("NOT_FOUND", "삭제된 상품을 찾을 수 없습니다.");
  }
}

export async function permanentlyDeleteProductAsAdminService(
  productId: string,
): Promise<void> {
  await requireAdmin();
  if (!(await permanentlyDeleteProductService(productId))) {
    throw new AppError("NOT_FOUND", "삭제된 상품을 찾을 수 없습니다.");
  }
}

export async function updateProductStatusAsAdminService(
  productId: string,
  status: ProductDto["status"],
): Promise<ProductJSON> {
  await requireAdmin();
  const updated = await updateProductService(productId, { status });
  if (!updated) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
  return updated;
}

export async function toggleProductLikeForCurrentUserService(
  productId: string,
): Promise<void> {
  const { userId } = await requireAuth();
  if (!(await updateProductLikeService(productId, userId))) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없거나 좋아요 업데이트에 실패했습니다.");
  }
}
