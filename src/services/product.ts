import "server-only";
import type { ProductDb, ProductDocument } from "@/models/product.model";
import type {
  EditableProductStatus,
  AdminProductSortKey,
  ProductJson,
  ProductStatus,
} from "@/core/domain/product";
import type {
  FeatureProductBindingPage,
  FeatureProductBindingSortKey,
} from "@/core/domain/premium-feature";
import { FEATURE_PRODUCT_BINDING_SORT_KEYS } from "@/core/domain/premium-feature";
import { FeatureModel } from "@/models/feature.model";
import {
  ProductModel,
  MobileInvitationProductModel,
} from "@/models/product.model";
import type { ProductDto } from "@/core/schemas/request/product.schema";
import { dbConnect } from "@/db/connect";
import { calculatePrice } from "@/core/utils/price";
import {
  decodeCursor,
  encodeCursor,
  isValidPageLimit,
} from "@/core/utils/cursor";
import { escapeRegExp } from "@/core/utils/escape-regexp";
import {
  findProductCategoriesByTerm,
  findSubCategoriesByTerm,
} from "@/core/utils/category";
import { AppError } from "@/core/domain/error";
import type {
  AdminProductListPage,
  PublicProductListPage,
} from "@/core/domain/product";
import type {
  AvailableSubCategory,
  ProductCategory,
} from "@/core/domain/product-category";
import type { MobileInvitationTheme } from "@/core/domain/theme";
import { DEFAULT_PAGE_SIZE } from "@/core/domain/cursor";
import {
  MOBILE_INVITATION_CATEGORY,
  PRODUCT_CATEGORIES,
  SUB_CATEGORY_MAP,
} from "@/core/domain/product-category";
import {
  ADMIN_PRODUCT_SORT_KEYS,
  POPULAR_PRODUCTS_LIMIT,
} from "@/core/domain/product";
import type { Model, Types } from "mongoose";
import mongoose from "mongoose";
import { requireAdmin, requireAuth } from "./auth";
import { deleteProductAsset } from "@/adapters/server/cloudinary/cleanup";
import { extractPublicId } from "@/adapters/server/cloudinary/publicId";

type ProductUploadInput = ProductDto & {
  previewUrl?: string;
  currentPreviewUrl?: string;
};

type LeanProduct = ProductDb & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  previewUrl?: string;
  theme?: MobileInvitationTheme;
  __v?: number;
};

// previewUrl은 mobile-invitation 카테고리 discriminator 전용 필드라 base ProductModel로
// 쓰면 strict 모드에 의해 조용히 버려진다 — 생성/수정 시 카테고리별로 모델을 골라야 한다.
// Model<ProductDocument>로 통일해서 리턴한다 — discriminator Model과 base Model의 union을
// 그대로 리턴하면 오버로드 시그니처가 갈라져 findOneAndUpdate 호출이 막힌다.
const getWritableProductModel = (category: string): Model<ProductDocument> =>
  category === MOBILE_INVITATION_CATEGORY
    ? (MobileInvitationProductModel as Model<ProductDocument>)
    : ProductModel;

const transformProduct = (
  product: LeanProduct,
  userId?: string,
): ProductJson => {
  const {
    deletedAt,
    _id,
    featureIds,
    likes,
    createdAt,
    updatedAt,
    // likesCount는 좋아요 토글이 likes 배열과 함께 원자적으로 갱신하는 내부 비정규화
    // 카운터다(src/models/product.model.ts) — ProductJson엔 없는 필드라 spread에
    // 섞여 나가지 않도록 여기서 제외한다.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    likesCount: _likesCount,
    ...rest
  } = product;

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
const getProductQuantityBoundsService = async (
  productId: string,
): Promise<{ minQuantity: number; maxQuantity: number } | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  })
    .select("minQuantity maxQuantity")
    .lean();

  if (!product) return null;

  return {
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
  };
};

// 상품생성
const createProductService = async (
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
const getProductService = async (
  productId: string,
  userId?: string,
): Promise<ProductJson | null> => {
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
// payment.service.ts(결제 검증용 조회)와 (public)/page.tsx(고정 미리보기)도
// getProductService를 호출하는데 그 두 호출까지 조회수로 잡히면 안 되기 때문.
const incrementProductViewsService = async (
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

type AdminProductListQuery = {
  view?: "active" | "trash";
  status?: EditableProductStatus;
  type?: "premium" | "featured";
  q?: string;
  page?: number;
  limit?: number;
  sort?: AdminProductSortKey;
  direction?: "asc" | "desc";
};

/**
 * 관리자 상품 목록 한 페이지. 공개 목록의 cursor 계약과 분리해 offset과 관리자
 * 테이블 정렬 키를 사용한다.
 */
const getAdminProductsPageService = async ({
  view = "active",
  status,
  type,
  q,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  sort,
  direction = "desc",
}: AdminProductListQuery): Promise<AdminProductListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit) || !Number.isInteger(page) || page < 1) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (sort && !ADMIN_PRODUCT_SORT_KEYS.includes(sort)) {
    throw new AppError("VALIDATION", "잘못된 정렬 기준입니다.");
  }
  if (direction !== "asc" && direction !== "desc") {
    throw new AppError("VALIDATION", "잘못된 정렬 방향입니다.");
  }

  const filter: Record<string, unknown> =
    view === "trash" ? { deletedAt: { $ne: null } } : { deletedAt: null };

  if (status) {
    filter.status = status;
  }
  if (type === "premium") {
    filter.isPremium = true;
  } else if (type === "featured") {
    filter.isFeatured = true;
  }

  const conditions: Record<string, unknown>[] = [];

  const term = q?.trim();
  if (term) {
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
    conditions.push({ $or: or });
  }

  if (conditions.length > 0) {
    filter.$and = conditions;
  }

  const sortKey = sort ?? (view === "trash" ? "deletedAt" : "createdAt");
  const sortDirection = direction === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ [sortKey]: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanProduct[]>(),
    ProductModel.countDocuments(filter),
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 목록 조회에 실패했습니다.",
    );
  });

  return {
    items: products.map((product) => transformProduct(product)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

type FeatureProductBindingsQuery = {
  featureId: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: FeatureProductBindingSortKey;
  direction?: "asc" | "desc";
};

type LeanBindableProduct = {
  _id: mongoose.Types.ObjectId;
  title: string;
  price: number;
  status: ProductStatus;
  featureIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
};

/**
 * 기능 하나를 붙일 상품 후보의 offset 페이지.
 *
 * `isPremium: true`, `deletedAt: null`만 후보다. 프리미엄이 아닌 상품은 create/update
 * 서비스가 featureIds를 강제로 비우므로 붙여도 조용히 사라지고, 휴지통 상품에 붙이는
 * 것은 복구 시점에 결정할 일이다.
 */
const getFeatureProductBindingsPageService = async ({
  featureId,
  q,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  sort = "createdAt",
  direction = "desc",
}: FeatureProductBindingsQuery): Promise<FeatureProductBindingPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit) || !Number.isInteger(page) || page < 1) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (!FEATURE_PRODUCT_BINDING_SORT_KEYS.includes(sort)) {
    throw new AppError("VALIDATION", "잘못된 정렬 기준입니다.");
  }
  if (direction !== "asc" && direction !== "desc") {
    throw new AppError("VALIDATION", "잘못된 정렬 방향입니다.");
  }

  const filter: mongoose.FilterQuery<ProductDocument> = {
    isPremium: true,
    deletedAt: null,
  };

  const term = q?.trim();
  if (term) {
    // 관리자가 입력한 문자열이 그대로 정규식이 되면 쿼리가 깨지거나 의도치 않게
    // 매칭된다 — 반드시 이스케이프한다(#309 규약).
    filter.title = { $regex: escapeRegExp(term), $options: "i" };
  }

  const sortDirection = direction === "asc" ? 1 : -1;
  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .select("title price status featureIds createdAt")
      .sort({ [sort]: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanBindableProduct[]>(),
    ProductModel.countDocuments(filter),
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 목록 조회에 실패했습니다.",
    );
  });

  return {
    items: products.map((product) => ({
      _id: product._id.toString(),
      title: product.title,
      price: product.price,
      status: product.status,
      attached: (product.featureIds ?? []).some(
        (id) => id.toString() === featureId,
      ),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// 연결/해제는 상품 문서 하나만 쓴다 — MongoDB가 문서 단위 원자성을 보장하므로
// 트랜잭션이 필요 없다(src/services/AGENTS.md 트랜잭션 절).
const findBindableProduct = async (productId: string) => {
  if (!mongoose.isObjectIdOrHexString(productId)) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).lean<LeanBindableProduct & { isPremium: boolean }>();

  if (!product) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }

  return product;
};

const attachPremiumFeatureToProductService = async (
  productId: string,
  featureId: string,
): Promise<void> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(featureId)) {
    throw new AppError("NOT_FOUND", "프리미엄 기능을 찾을 수 없습니다.");
  }
  if (!(await FeatureModel.exists({ _id: featureId }))) {
    throw new AppError("NOT_FOUND", "프리미엄 기능을 찾을 수 없습니다.");
  }

  const product = await findBindableProduct(productId);

  // 프리미엄이 아닌 상품은 create/update 서비스가 featureIds를 비운다 — 붙여도
  // 조용히 사라지므로 성공으로 처리하지 않는다.
  if (!product.isPremium) {
    throw new AppError(
      "VALIDATION",
      `"${product.title}"은(는) 프리미엄 상품이 아니라 기능을 붙일 수 없습니다.`,
    );
  }

  await ProductModel.updateOne(
    { _id: productId },
    { $addToSet: { featureIds: new mongoose.Types.ObjectId(featureId) } },
    { runValidators: true },
  );
};

const detachPremiumFeatureFromProductService = async (
  productId: string,
  featureId: string,
): Promise<void> => {
  await dbConnect();

  const product = await findBindableProduct(productId);
  const featureIds = (product.featureIds ?? []).map(String);

  if (!featureIds.includes(featureId)) return;

  // 마지막 기능을 빼면 isPremium인데 featureIds가 비어 product.schema의 refine을
  // 통과하지 못해 그 상품은 이후 수정 저장이 전부 막힌다.
  if (product.isPremium && featureIds.length === 1) {
    throw new AppError(
      "VALIDATION",
      `"${product.title}"의 마지막 프리미엄 기능이라 뗄 수 없습니다. 상품을 일반 상품으로 바꾸거나 다른 기능을 먼저 붙이세요.`,
    );
  }

  await ProductModel.updateOne(
    { _id: productId },
    { $pull: { featureIds: new mongoose.Types.ObjectId(featureId) } },
    { runValidators: true },
  );
};

const PUBLIC_PRODUCT_SORT_SPEC = {
  isFeatured: -1,
  priority: -1,
  createdAt: -1,
  _id: -1,
} as const;

type DecodedPublicProductCursor = {
  createdAt: Date;
  id: string;
  secondary?: number;
  tertiary?: number;
};

// 공개 목록은 (isFeatured, priority, createdAt, _id) 4단 정렬이라 admin/review보다
// 튜플이 한 단 더 길다 — secondary=isFeatured(0|1), tertiary=priority에 태워
// $or를 4갈래로 펼친다(admin의 2단, review RATING 정렬의 3단과 같은 방식의 확장).
const buildPublicProductCursorOr = (
  decoded: DecodedPublicProductCursor,
): Record<string, unknown>[] => {
  if (decoded.secondary === undefined || decoded.tertiary === undefined) {
    throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
  }

  const isFeatured = decoded.secondary === 1;
  const priority = decoded.tertiary;
  const idLt = { _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } };

  return [
    { isFeatured: { $lt: isFeatured } },
    { isFeatured, priority: { $lt: priority } },
    { isFeatured, priority, createdAt: { $lt: decoded.createdAt } },
    { isFeatured, priority, createdAt: decoded.createdAt, ...idLt },
  ];
};

type PublicProductListQuery = {
  category?: string;
  subCategory?: string;
  theme?: MobileInvitationTheme;
  cursor?: string;
  limit?: number;
  userId?: string;
};

// 공개 상품 목록 한 페이지 — 관리자용 getAdminProductsPageService와 달리 판매 가능한
// active 상품만 노출하고, isFeatured/priority 우선순위 정렬(공개 노출 우선순위 의미)을
// 유지한 채 cursor 페이징한다. limit+1 조회로 다음 페이지 존재 여부를 판정하는 계약은
// admin/review와 동일하다.
const getPublicProductsPageService = async ({
  category,
  subCategory,
  theme,
  cursor,
  limit = DEFAULT_PAGE_SIZE,
  userId,
}: PublicProductListQuery): Promise<PublicProductListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }

  const filter: Record<string, unknown> = { deletedAt: null, status: "active" };
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (theme) filter.theme = theme;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = buildPublicProductCursorOr(decoded);
  }

  const found = await ProductModel.find(filter)
    .sort(PUBLIC_PRODUCT_SORT_SPEC)
    .limit(limit + 1)
    .lean<LeanProduct[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "공개 상품 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const products = hasMore ? found.slice(0, limit) : found;
  const lastProduct = products.at(-1);

  return {
    items: products.map((product) => transformProduct(product, userId)),
    nextCursor:
      hasMore && lastProduct
        ? encodeCursor({
            createdAt: lastProduct.createdAt,
            id: lastProduct._id.toString(),
            secondary: lastProduct.isFeatured ? 1 : 0,
            tertiary: lastProduct.priority,
          })
        : null,
  };
};

// 공개 상품이 하나 이상 있는 유효 pair만 코드 taxonomy 순서로 반환한다.
const getAvailableSubCategoriesService = async (
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
const searchProductsService = async (
  q?: string,
  userId?: string,
): Promise<ProductJson[]> => {
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

// Home 인기 상품 섹션 — likesCount 내림차순 Top N 조회. likesCount는 좋아요 토글이
// likes 배열과 원자적으로 동기화하는 비정규화 카운터라(src/models/product.model.ts,
// updateProductLikeService) find().sort()로 바로 정렬할 수 있다 — 배열 길이(likes.length)
// 자체를 정렬 기준으로 쓰던 이전 버전만 aggregation이 필요했다.
const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJson[]> => {
  await dbConnect();

  // 0 이하를 받으면 빈 배열이 아니라 의미 없는 조회가 되므로 서비스가 방어한다.
  const take = Math.min(Math.max(Math.trunc(limit), 1), 50);

  const products = await ProductModel.find({
    deletedAt: null,
    status: "active",
    likesCount: { $gt: 0 },
  })
    // likesCount는 필터·정렬 전용 내부 카운터라 응답에는 노출하지 않는다
    // (기존 aggregate 버전의 $addFields+$unset과 동일한 효과).
    .select("-likesCount")
    .sort({
      likesCount: -1,
      isFeatured: -1,
      priority: -1,
      createdAt: -1,
      _id: -1,
    })
    .limit(take)
    .lean()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "인기 상품 조회에 실패했습니다.",
      );
    });

  return products.map((p) => transformProduct(p, userId));
};

// 상품 업데이트
const updateProductService = async (
  productId: string,
  data: Partial<Omit<ProductDto, "thumbnail" | "images">> & {
    thumbnail?: string;
    images?: string[];
    previewUrl?: string;
    isPremium?: boolean;
    featureIds?: string[];
  },
): Promise<ProductJson | null> => {
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
const deleteProductService = async (productId: string): Promise<boolean> => {
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
const restoreProductService = async (productId: string): Promise<boolean> => {
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
const permanentlyDeleteProductService = async (
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

  const publicIds = [
    ...new Set(
      [product.thumbnail, ...product.images]
        .map((url) => extractPublicId(url))
        .filter((id): id is string => !!id),
    ),
  ];

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
const updateProductLikeService = async (
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

  // 배열 변경과 카운터 증감을 한 update에서 원자적으로 묶는다. 필터에 멤버십
  // 조건(likes: userObjectId 있음/없음)을 넣어 findOne 이후 동시 요청으로 멤버십이
  // 바뀌었으면 이 update가 아무 문서도 매칭하지 않게 한다 — updated는 null이 되고
  // 아래에서 기존 "잘못된 id·존재하지 않는 상품" 케이스와 동일하게 false를 반환한다.
  const updated = await ProductModel.findOneAndUpdate(
    hasLiked
      ? { _id: productId, deletedAt: null, likes: userObjectId }
      : { _id: productId, deletedAt: null, likes: { $ne: userObjectId } },
    hasLiked
      ? { $pull: { likes: userObjectId }, $inc: { likesCount: -1 } }
      : { $push: { likes: userObjectId }, $inc: { likesCount: 1 } },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "좋아요 갱신에 실패했습니다.",
    );
  });

  return !!updated;
};

const createProductWorkflow = async (
  data: ProductUploadInput,
): Promise<void> => {
  const { userId } = await requireAdmin();
  await createProductService({ ...data, authorId: userId });
};

const updateProductWorkflow = async (
  productId: string,
  data: ProductUploadInput,
): Promise<ProductJson> => {
  await requireAdmin();
  const updated = await updateProductService(productId, {
    ...data,
    previewUrl: data.previewUrl ?? data.currentPreviewUrl,
  });
  if (!updated) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
  return updated;
};

const deleteProductAsAdminService = async (
  productId: string,
): Promise<void> => {
  await requireAdmin();
  if (!(await deleteProductService(productId))) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
};

const restoreProductAsAdminService = async (
  productId: string,
): Promise<void> => {
  await requireAdmin();
  if (!(await restoreProductService(productId))) {
    throw new AppError("NOT_FOUND", "삭제된 상품을 찾을 수 없습니다.");
  }
};

const permanentlyDeleteProductAsAdminService = async (
  productId: string,
): Promise<void> => {
  await requireAdmin();
  if (!(await permanentlyDeleteProductService(productId))) {
    throw new AppError("NOT_FOUND", "삭제된 상품을 찾을 수 없습니다.");
  }
};

const updateProductStatusAsAdminService = async (
  productId: string,
  status: EditableProductStatus,
): Promise<ProductJson> => {
  await requireAdmin();
  const updated = await updateProductService(productId, { status });
  if (!updated) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
  return updated;
};

const toggleProductLikeForCurrentUserService = async (
  productId: string,
): Promise<void> => {
  const { userId } = await requireAuth();
  if (!(await updateProductLikeService(productId, userId))) {
    throw new AppError(
      "NOT_FOUND",
      "상품을 찾을 수 없거나 좋아요 업데이트에 실패했습니다.",
    );
  }
};

export {
  getProductQuantityBoundsService,
  createProductService,
  getProductService,
  incrementProductViewsService,
  getAdminProductsPageService,
  getPublicProductsPageService,
  getAvailableSubCategoriesService,
  searchProductsService,
  getFeatureProductBindingsPageService,
  attachPremiumFeatureToProductService,
  detachPremiumFeatureFromProductService,
  getPopularProductsService,
  updateProductService,
  deleteProductService,
  restoreProductService,
  permanentlyDeleteProductService,
  updateProductLikeService,
  createProductWorkflow,
  updateProductWorkflow,
  deleteProductAsAdminService,
  restoreProductAsAdminService,
  permanentlyDeleteProductAsAdminService,
  updateProductStatusAsAdminService,
  toggleProductLikeForCurrentUserService,
};
