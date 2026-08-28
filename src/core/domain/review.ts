import type { CursorPage } from "./cursor";
import { DEFAULT_PAGE_SIZE } from "./cursor";

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

export const REVIEW_SORT_KEYS = ["LATEST", "RATING_HIGH", "RATING_LOW"] as const;

export type ReviewSortType = (typeof REVIEW_SORT_KEYS)[number];

export const REVIEW_SORT_OPTIONS: Record<ReviewSortType, string> = {
  LATEST: "최신순",
  RATING_HIGH: "평점 높은순",
  RATING_LOW: "평점 낮은순",
};

// 상품 상세의 리뷰 목록 한 페이지 크기 — RSC 첫 페이지와 더보기(searchParams)가 같은 값을 쓴다.
export const REVIEW_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export interface ReviewJSON {
  _id: string;
  productId: string;
  // 실명이 아니라 마스킹된 표시용 이름("김*준") — services/review.ts가 채운다.
  authorName: string;
  rating: number;
  content: string;
  images: string[];
  // 현재 로그인 유저가 작성자인지 — ProductJSON.isLiked와 같은 패턴(요청자 기준으로 서비스가 계산).
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewListPage = CursorPage<ReviewJSON>;

// 어드민 리뷰 관리 목록 한 행 — 모더레이션 목적이라 작성자명은 마스킹하지 않는다.
export type AdminReviewListItem = {
  id: string;
  productTitle: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: Date;
};

export type AdminReviewListPage = CursorPage<AdminReviewListItem>;
