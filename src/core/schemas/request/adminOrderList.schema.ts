import * as z from "zod";
import { ADMIN_ORDER_SORT_KEYS, ORDER_STATUSES } from "@/core/domain/order";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminOrderListRequestSchema = OffsetListRequestSchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(ORDER_STATUSES).optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_ORDER_SORT_KEYS).optional(),
  ),
});

type AdminOrderListRequest = z.infer<typeof AdminOrderListRequestSchema>;

export { AdminOrderListRequestSchema, type AdminOrderListRequest };
