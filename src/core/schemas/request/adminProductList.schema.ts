import * as z from "zod";
import {
  ADMIN_PRODUCT_SORT_KEYS,
  ADMIN_PRODUCT_VIEWS,
} from "@/core/domain/product";
import {
  emptyToUndefined,
  OffsetListRequestSchema,
} from "./offsetList.schema";

const AdminProductListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PRODUCT_SORT_KEYS).optional(),
  ),
  view: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PRODUCT_VIEWS).default("active"),
  ),
});

type AdminProductListRequest = z.infer<typeof AdminProductListRequestSchema>;

export { AdminProductListRequestSchema, type AdminProductListRequest };
