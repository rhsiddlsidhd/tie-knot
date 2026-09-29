import * as z from "zod";
import { ADMIN_REVIEW_SORT_KEYS } from "@/core/domain/review";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminReviewListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_REVIEW_SORT_KEYS).optional(),
  ),
});

type AdminReviewListRequest = z.infer<typeof AdminReviewListRequestSchema>;

export { AdminReviewListRequestSchema, type AdminReviewListRequest };
