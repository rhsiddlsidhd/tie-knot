export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getOrdersPageForUser } from "@/services/order";
import { orderListRequestSchema } from "@/core/schemas/request/orderList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { MyOrdersTemplate } from "./_components";

// 필터는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 유효하지 않은 값은
// "필터 없음"으로 떨어뜨린다(더보기 route handler는 같은 스키마로 400을 낸다).
const resolveFilters = (searchParams: Record<string, string | string[] | undefined>) => {
  const parsed = validateAndFlatten(orderListRequestSchema, {
    status: typeof searchParams.status === "string" ? searchParams.status : null,
    category:
      typeof searchParams.category === "string" ? searchParams.category : null,
    cursor: null,
  });

  return parsed.success ? parsed.data : {};
};

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const session = await verifySession();

  const { status, category } = resolveFilters(await searchParams);
  const firstPage = await getOrdersPageForUser({
    userId: session.userId,
    status,
    category,
  });

  return (
    <MyOrdersTemplate
      firstPage={firstPage}
      status={status}
      category={category}
    />
  );
};

export default Page;
