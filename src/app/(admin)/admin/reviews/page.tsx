export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminReviewsPageService } from "@/services/review";
import { AdminReviewListRequestSchema } from "@/core/schemas/request/adminReviewList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminReviewsTemplate } from "@/app/(admin)/admin/reviews/_components/AdminReviewsTemplate";

// 목록 파라미터는 URL이 소유하므로 유효하지 않은 입력은 기본 목록 조건으로 되돌린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminReviewListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction: typeof searchParams.direction === "string" ? searchParams.direction : null,
  });

  return parsed.success ? parsed.data : AdminReviewListRequestSchema.parse({});
};

const ReviewsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const filters = resolveFilters(await searchParams);
  const page = await getAdminReviewsPageService(filters);

  return <AdminReviewsTemplate page={page} q={filters.q} />;
};

export default ReviewsPage;
