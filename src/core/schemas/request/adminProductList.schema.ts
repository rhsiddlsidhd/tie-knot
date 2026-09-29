import * as z from "zod";
import {
  ADMIN_PRODUCT_SORT_KEYS,
  ADMIN_PRODUCT_TYPE_FILTERS,
  ADMIN_PRODUCT_VIEWS,
  EDITABLE_PRODUCT_STATUSES,
} from "@/core/domain/product";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminProductListRequestSchema = OffsetListRequestSchema.extend({
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PRODUCT_SORT_KEYS).optional(),
  ),
  view: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PRODUCT_VIEWS).default("active"),
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(EDITABLE_PRODUCT_STATUSES).optional(),
  ),
  type: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_PRODUCT_TYPE_FILTERS).optional(),
  ),
});

type AdminProductListRequest = z.infer<typeof AdminProductListRequestSchema>;

export { AdminProductListRequestSchema, type AdminProductListRequest };
