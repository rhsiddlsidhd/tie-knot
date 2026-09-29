import * as z from "zod";
import { ADMIN_PRODUCT_SORT_KEYS } from "@/core/domain/product";
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
    z.enum(["active", "trash"]).default("active"),
  ),
});

type AdminProductListRequest = z.infer<typeof AdminProductListRequestSchema>;

export { AdminProductListRequestSchema, type AdminProductListRequest };
