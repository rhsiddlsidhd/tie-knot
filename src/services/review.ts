import "server-only";
import mongoose from "mongoose";
import type { IReview } from "@/models/review.model";
import type { IOrder } from "@/models/order.model";
import { ReviewModel } from "@/models/review.model";
import { OrderModel } from "@/models/order.model";
import { ProductModel } from "@/models/product.model";
import { dbConnect } from "@/db/connect";
import {
  decodeCursor,
  encodeCursor,
  isValidPageLimit,
  maskName,
} from "@/core/utils";
import { AppError } from "@/core/domain";
import type {
  AdminReviewListPage,
  ReviewJSON,
  ReviewListPage,
  ReviewSortType,
} from "@/core/domain";
import { REVIEW_PAGE_SIZE } from "@/core/domain";
import { getUser, requireAdmin, requireAuth } from "./auth";

const REVIEW_SORT_SPEC: Record<ReviewSortType, Record<string, 1 | -1>> = {
  LATEST: { createdAt: -1, _id: -1 },
  RATING_HIGH: { rating: -1, createdAt: -1, _id: -1 },
  RATING_LOW: { rating: 1, createdAt: -1, _id: -1 },
};

type DecodedCursor = { createdAt: Date; id: string; secondary?: number };

// LATEST는 (createdAt, _id) 2단, RATING_HIGH/LOW는 (rating, createdAt, _id) 3단
// 튜플 비교를 $or로 펼친다 — 프로젝트 커서 페이징 관례(admin 목록들)와 동일한 형태.
const buildReviewCursorOr = (
  sort: ReviewSortType,
  decoded: DecodedCursor,
): Record<string, unknown>[] => {
  const idLt = { _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } };

  if (sort === "LATEST") {
    return [
      { createdAt: { $lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, ...idLt },
    ];
  }

  if (decoded.secondary === undefined) {
    throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
  }

  const ratingCmp =
    sort === "RATING_HIGH"
      ? { $lt: decoded.secondary }
      : { $gt: decoded.secondary };

  return [
    { rating: ratingCmp },
    { rating: decoded.secondary, createdAt: { $lt: decoded.createdAt } },
    { rating: decoded.secondary, createdAt: decoded.createdAt, ...idLt },
  ];
};

type ReviewCore = {
  _id: mongoose.Types.ObjectId | string;
  productId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  rating: number;
  content: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
};

// authorName은 이미 표시용으로 확정된 문자열을 받는다 — 마스킹 여부(사용자용 마스킹 vs
// 어드민용 실명)는 호출자가 맥락에 맞게 결정해서 넘긴다.
const toReviewJSON = (
  review: ReviewCore,
  authorName: string,
  viewerUserId?: string,
): ReviewJSON => ({
  _id: review._id.toString(),
  productId: review.productId.toString(),
  authorName,
  rating: review.rating,
  content: review.content,
  images: review.images,
  isOwner:
    viewerUserId !== undefined && review.userId.toString() === viewerUserId,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

// Review 컬렉션을 소스로 상품 평점 캐시(ratingAverage/ratingCount)를 통째로 재계산한다.
// 증분 계산 대신 전체 재계산을 쓰는 이유: 두 컬렉션 쓰기 순서가 어긋나거나 중간에
// 실패해도 다음 리뷰 write 때 자동으로 정합 상태로 복구된다(자가치유) — Product 문서
// 자체에 대한 백필 마이그레이션은 이 필드 도입 시점에 별도로 필요하다.
const recomputeProductRating = async (
  productId: mongoose.Types.ObjectId | string,
): Promise<void> => {
  const objectId = new mongoose.Types.ObjectId(productId.toString());

  const [result] = await ReviewModel.aggregate<{ avg: number; count: number }>([
    { $match: { productId: objectId } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await ProductModel.findByIdAndUpdate(objectId, {
    ratingAverage: result?.avg ?? 0,
    ratingCount: result?.count ?? 0,
  }).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 평점 갱신에 실패했습니다.",
    );
  });
};

type PopulatedAuthor = { _id: mongoose.Types.ObjectId; name: string } | null;

type LeanReviewWithAuthor = Omit<IReview, "userId"> & { userId: PopulatedAuthor };

type ProductReviewsQuery = {
  productId: string;
  sort?: ReviewSortType;
  cursor?: string;
  limit?: number;
  viewerUserId?: string;
};

export const getProductReviewsPageService = async ({
  productId,
  sort = "LATEST",
  cursor,
  limit = REVIEW_PAGE_SIZE,
  viewerUserId,
}: ProductReviewsQuery): Promise<ReviewListPage> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    throw new AppError("VALIDATION", "잘못된 상품입니다.");
  }
  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }

  const filter: Record<string, unknown> = {
    productId: new mongoose.Types.ObjectId(productId),
  };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = buildReviewCursorOr(sort, decoded);
  }

  const found = await ReviewModel.find(filter)
    .sort(REVIEW_SORT_SPEC[sort])
    .limit(limit + 1)
    .populate<{ userId: PopulatedAuthor }>("userId", "name")
    .lean<LeanReviewWithAuthor[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "리뷰 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const reviews = hasMore ? found.slice(0, limit) : found;
  const last = reviews.at(-1);

  return {
    items: reviews.map((review) =>
      toReviewJSON(
        { ...review, userId: review.userId?._id ?? "" },
        review.userId ? maskName(review.userId.name) : "탈퇴한 회원",
        viewerUserId,
      ),
    ),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            createdAt: last.createdAt,
            id: last._id.toString(),
            secondary: sort === "LATEST" ? undefined : last.rating,
          })
        : null,
  };
};

type CreateReviewInput = {
  orderId: string;
  userId: string;
  rating: number;
  content: string;
  images: string[];
};

export const createReviewService = async ({
  orderId,
  userId,
  rating,
  content,
  images,
}: CreateReviewInput): Promise<ReviewJSON> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(orderId)) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }

  const order = await OrderModel.findById(orderId).lean<IOrder>();
  if (!order) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }
  if (order.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인 주문에만 리뷰를 작성할 수 있습니다.");
  }
  if (order.orderStatus !== "COMPLETED") {
    throw new AppError(
      "VALIDATION",
      "발행이 완료된 주문만 리뷰를 작성할 수 있습니다.",
    );
  }

  const review = await ReviewModel.create({
    productId: order.product.productId,
    userId,
    orderId,
    rating,
    content,
    images,
  }).catch((err) => {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError(
        "VALIDATION",
        "이미 이 주문에 대한 리뷰를 작성했습니다.",
      );
    }
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "리뷰 작성에 실패했습니다.",
    );
  });

  await recomputeProductRating(review.productId);

  const author = await getUser({ id: userId });
  return toReviewJSON(review, maskName(author?.name ?? ""), userId);
};

export async function createReviewForCurrentUserService(
  data: Omit<CreateReviewInput, "userId">,
): Promise<ReviewJSON> {
  const { userId } = await requireAuth();
  return createReviewService({ ...data, userId });
}

type UpdateReviewInput = {
  reviewId: string;
  userId: string;
  rating?: number;
  content?: string;
  images?: string[];
};

export const updateReviewService = async ({
  reviewId,
  userId,
  rating,
  content,
  images,
}: UpdateReviewInput): Promise<ReviewJSON> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(reviewId)) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }

  const existing = await ReviewModel.findById(reviewId).lean<IReview>();
  if (!existing) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }
  if (existing.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인이 작성한 리뷰만 수정할 수 있습니다.");
  }

  const update: Partial<Pick<IReview, "rating" | "content" | "images">> = {};
  if (rating !== undefined) update.rating = rating;
  if (content !== undefined) update.content = content;
  if (images !== undefined) update.images = images;

  const updated = await ReviewModel.findByIdAndUpdate(reviewId, update, {
    new: true,
    runValidators: true,
  })
    .lean<IReview>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "리뷰 수정에 실패했습니다.",
      );
    });
  if (!updated) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }

  if (rating !== undefined && rating !== existing.rating) {
    await recomputeProductRating(updated.productId);
  }

  const author = await getUser({ id: userId });
  return toReviewJSON(updated, maskName(author?.name ?? ""), userId);
};

export async function updateReviewForCurrentUserService(
  data: Omit<UpdateReviewInput, "userId">,
): Promise<ReviewJSON> {
  const { userId } = await requireAuth();
  return updateReviewService({ ...data, userId });
}

export const deleteReviewService = async ({
  reviewId,
  userId,
}: {
  reviewId: string;
  userId: string;
}): Promise<void> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(reviewId)) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }

  const existing = await ReviewModel.findById(reviewId).lean<IReview>();
  if (!existing) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }
  if (existing.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인이 작성한 리뷰만 삭제할 수 있습니다.");
  }

  await ReviewModel.deleteOne({ _id: reviewId }).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "리뷰 삭제에 실패했습니다.",
    );
  });

  await recomputeProductRating(existing.productId);
};

export async function deleteReviewForCurrentUserService(
  reviewId: string,
): Promise<void> {
  const { userId } = await requireAuth();
  return deleteReviewService({ reviewId, userId });
}

// 어드민 모더레이션 삭제 — 소유권 검사 없이 어떤 리뷰든 삭제한다, 그래서 자체적으로
// requireAdmin()을 호출해 게이트한다(product.ts의 관리자 전용 함수들과 동일 패턴).
export const deleteReviewByAdminService = async (
  reviewId: string,
): Promise<void> => {
  await requireAdmin();
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(reviewId)) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }

  const existing = await ReviewModel.findById(reviewId).lean<IReview>();
  if (!existing) {
    throw new AppError("NOT_FOUND", "리뷰를 찾을 수 없습니다.");
  }

  await ReviewModel.deleteOne({ _id: reviewId }).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "리뷰 삭제에 실패했습니다.",
    );
  });

  await recomputeProductRating(existing.productId);
};

type LeanAdminReview = Omit<IReview, "userId" | "productId"> & {
  userId: { name: string } | null;
  productId: { title: string } | null;
};

type AdminReviewsQuery = { cursor?: string; limit?: number };

export const getAdminReviewsPageService = async ({
  cursor,
  limit,
}: AdminReviewsQuery): Promise<AdminReviewListPage> => {
  await dbConnect();

  const pageLimit = limit ?? REVIEW_PAGE_SIZE;
  if (!isValidPageLimit(pageLimit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }

  const filter: Record<string, unknown> = {};
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = buildReviewCursorOr("LATEST", decoded);
  }

  const found = await ReviewModel.find(filter)
    .sort(REVIEW_SORT_SPEC.LATEST)
    .limit(pageLimit + 1)
    .populate<{ userId: { name: string } | null }>("userId", "name")
    .populate<{ productId: { title: string } | null }>("productId", "title")
    .lean<LeanAdminReview[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "리뷰 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > pageLimit;
  const reviews = hasMore ? found.slice(0, pageLimit) : found;
  const last = reviews.at(-1);

  return {
    items: reviews.map((review) => ({
      id: review._id.toString(),
      productTitle: review.productId?.title ?? "삭제된 상품",
      authorName: review.userId?.name ?? "탈퇴한 회원",
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
    })),
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt, id: last._id.toString() })
        : null,
  };
};
