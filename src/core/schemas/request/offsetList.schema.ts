import * as z from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/core/domain/cursor";
import { SearchTermSchema } from "./productSearch.schema";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const OffsetListRequestSchema = z.object({
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).default(1),
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  ),
  q: z.preprocess(emptyToUndefined, SearchTermSchema),
  direction: z.preprocess(
    emptyToUndefined,
    z.enum(["asc", "desc"]).default("desc"),
  ),
});

type OffsetListRequest = z.infer<typeof OffsetListRequestSchema>;

export { emptyToUndefined, OffsetListRequestSchema, type OffsetListRequest };
