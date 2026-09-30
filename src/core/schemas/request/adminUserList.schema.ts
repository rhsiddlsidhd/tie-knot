import * as z from "zod";
import {
  ADMIN_USER_SORT_KEYS,
  ADMIN_USER_STATUS_FILTERS,
  USER_ROLES,
} from "@/core/domain/user";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminUserListRequestSchema = OffsetListRequestSchema.extend({
  role: z.preprocess(emptyToUndefined, z.enum(USER_ROLES).optional()),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(ADMIN_USER_STATUS_FILTERS).optional(),
  ),
  sort: z.preprocess(emptyToUndefined, z.enum(ADMIN_USER_SORT_KEYS).optional()),
});

type AdminUserListRequest = z.infer<typeof AdminUserListRequestSchema>;

export { AdminUserListRequestSchema, type AdminUserListRequest };
