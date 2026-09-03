import * as z from "zod";
import { REVIEW_RATING_MAX, REVIEW_RATING_MIN } from "@/core/domain/review";

const ratingSchema = z
  .number()
  .int("평점은 정수로 입력해주세요.")
  .min(REVIEW_RATING_MIN, `평점은 ${REVIEW_RATING_MIN}점 이상이어야 합니다.`)
  .max(REVIEW_RATING_MAX, `평점은 ${REVIEW_RATING_MAX}점 이하여야 합니다.`);

const contentSchema = z
  .string()
  .min(10, "리뷰 내용은 최소 10자 이상 입력해주세요.")
  .max(1000, "리뷰 내용은 1000자 이내로 입력해주세요.");

const imagesSchema = z
  .array(z.string().url("유효한 이미지 URL이어야 합니다."))
  .max(5, "이미지는 최대 5장까지 첨부할 수 있습니다.");

export const createReviewSchema = z.object({
  orderId: z.string().min(1, "주문 정보가 필요합니다."),
  rating: ratingSchema,
  content: contentSchema,
  images: imagesSchema.default([]),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z
  .object({
    reviewId: z.string().min(1, "리뷰 정보가 필요합니다."),
    rating: ratingSchema.optional(),
    content: contentSchema.optional(),
    images: imagesSchema.optional(),
  })
  .refine(
    (data) =>
      data.rating !== undefined ||
      data.content !== undefined ||
      data.images !== undefined,
    { message: "변경할 내용이 없습니다.", path: ["content"] },
  );

export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
