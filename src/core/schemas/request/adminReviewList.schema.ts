import * as z from "zod";
import {
  ADMIN_REVIEW_SORT_KEYS,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from "@/core/domain/review";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminReviewListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_REVIEW_SORT_KEYS).optional(),
  ),
  rating: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int()
      .min(REVIEW_RATING_MIN)
      .max(REVIEW_RATING_MAX)
      .optional(),
  ),
});

type AdminReviewListRequest = z.infer<typeof AdminReviewListRequestSchema>;

export { AdminReviewListRequestSchema, type AdminReviewListRequest };
