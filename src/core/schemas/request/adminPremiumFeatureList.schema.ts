import * as z from "zod";
import { ADMIN_PREMIUM_FEATURE_SORT_KEYS } from "@/core/domain/premium-feature";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminPremiumFeatureListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PREMIUM_FEATURE_SORT_KEYS).optional(),
  ),
});

type AdminPremiumFeatureListRequest = z.infer<
  typeof AdminPremiumFeatureListRequestSchema
>;

export {
  AdminPremiumFeatureListRequestSchema,
  type AdminPremiumFeatureListRequest,
};
