export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminReviewsPageService } from "@/services/review";
import { adminReviewListRequestSchema } from "@/core/schemas/request/adminReviewList.schema";
import { decodeCursor } from "@/core/utils/cursor";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminReviewsTemplate } from "./_components";

// 커서는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 형식이 깨진 cursor는
// decodeCursor가 걸러 "커서 없음"으로 떨어뜨린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(adminReviewListRequestSchema, {
    cursor: typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) return {};
  return { cursor };
};

const ReviewsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const { cursor } = resolveFilters(await searchParams);
  const page = await getAdminReviewsPageService({ cursor });

  return <AdminReviewsTemplate page={page} cursor={cursor} />;
};

export default ReviewsPage;
