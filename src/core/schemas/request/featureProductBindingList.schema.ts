import * as z from "zod";
import { FEATURE_PRODUCT_BINDING_SORT_KEYS } from "@/core/domain/premium-feature";
import {
  emptyToUndefined,
  OffsetListRequestSchema,
} from "./offsetList.schema";

const FeatureProductBindingListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(FEATURE_PRODUCT_BINDING_SORT_KEYS).optional(),
  ),
});

type FeatureProductBindingListRequest = z.infer<
  typeof FeatureProductBindingListRequestSchema
>;

export {
  FeatureProductBindingListRequestSchema,
  type FeatureProductBindingListRequest,
};
