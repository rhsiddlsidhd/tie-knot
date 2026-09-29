import * as z from "zod";
import { ADMIN_USER_SORT_KEYS, USER_ROLES } from "@/core/domain/user";
import { emptyToUndefined, OffsetListRequestSchema } from "./offsetList.schema";

const AdminUserListRequestSchema = OffsetListRequestSchema.extend({
  role: z.preprocess(emptyToUndefined, z.enum(USER_ROLES).optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(ADMIN_USER_SORT_KEYS).optional()),
});

type AdminUserListRequest = z.infer<typeof AdminUserListRequestSchema>;

export { AdminUserListRequestSchema, type AdminUserListRequest };
